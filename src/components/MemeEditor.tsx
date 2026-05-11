import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  drawMeme,
  loadImage,
  DEFAULT_LAYER,
  TEMPLATES,
  type TextLayer,
} from "@/lib/memeRenderer";
import { useGallery } from "@/hooks/useGallery";
import { toast } from "sonner";
import { Upload, Download, Plus, Trash2, Twitter, Facebook, Share2, Save, Bold, Image as ImageIcon } from "lucide-react";

const CANVAS_W = 800;

export function MemeEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [canvasH, setCanvasH] = useState(600);
  const [layers, setLayers] = useState<TextLayer[]>([
    { ...DEFAULT_LAYER, id: crypto.randomUUID(), text: "TOP TEXT", y: 0.1 },
    { ...DEFAULT_LAYER, id: crypto.randomUUID(), text: "BOTTOM TEXT", y: 0.9 },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const { save } = useGallery();

  const selected = useMemo(
    () => layers.find((l) => l.id === selectedId) ?? null,
    [layers, selectedId],
  );

  // Load image whenever src changes
  useEffect(() => {
    let cancelled = false;
    if (!imageSrc) {
      imgRef.current = null;
      setCanvasH(600);
      return;
    }
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        imgRef.current = img;
        const ratio = img.height / img.width;
        setCanvasH(Math.round(CANVAS_W * ratio));
      })
      .catch(() => {
        imgRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // Render
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = CANVAS_W;
    c.height = canvasH;
    drawMeme(c, imgRef.current, layers);
  }, [layers, canvasH, imageSrc]);

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
  };

  const updateLayer = (id: string, patch: Partial<TextLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLayer = () => {
    const newLayer: TextLayer = {
      ...DEFAULT_LAYER,
      id: crypto.randomUUID(),
      text: "NEW TEXT",
      y: 0.5,
    };
    setLayers((p) => [...p, newLayer]);
    setSelectedId(newLayer.id);
  };

  const removeLayer = (id: string) => {
    setLayers((p) => p.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Drag handling
  const getCoords = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width),
      y: ((e.clientY - rect.top) / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const { x, y } = getCoords(e);
    // pick the closest layer within 8% radius
    let bestId: string | null = null;
    let bestDist = 0.12;
    for (const l of layers) {
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestId = l.id;
      }
    }
    if (bestId) {
      setSelectedId(bestId);
      setDragging(bestId);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = getCoords(e);
    updateLayer(dragging, {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    });
  };

  const onPointerUp = () => setDragging(null);

  const downloadMeme = () => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `meme-${Date.now()}.png`;
    a.click();
  };

  const saveToGallery = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const result = await save(c.toDataURL("image/png"));
    if (result) {
      toast.success("Meme saved to gallery!");
    } else {
      toast.error("Failed to save meme. Please log in.");
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const shareTo = (network: "twitter" | "facebook" | "native") => {
    const c = canvasRef.current;
    if (!c) return;
    const text = "Check out my meme made with MemeForge 🔥";
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    if (network === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`,
        "_blank",
      );
    } else if (network === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
        "_blank",
      );
    } else if (navigator.share) {
      c.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "meme.png", { type: "image/png" });
        try {
          await navigator.share({ files: [file], text });
        } catch {
          /* user cancelled */
        }
      });
    } else {
      downloadMeme();
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      {/* Canvas area */}
      <div className="rounded-2xl bg-card/60 backdrop-blur border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">
            {imageSrc ? "Drag the text directly on the meme" : "Start by uploading an image or picking a template"}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="relative w-full overflow-hidden rounded-xl bg-black/40 grid place-items-center">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="max-w-full h-auto touch-none cursor-move"
            style={{ aspectRatio: `${CANVAS_W} / ${canvasH}` }}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={downloadMeme} className="flex-1 min-w-[140px]">
            <Download className="size-4" /> Download PNG
          </Button>
          <Button onClick={saveToGallery} variant="secondary" className="flex-1 min-w-[140px]">
            <Save className="size-4" /> {savedFlash ? "Saved!" : "Save to gallery"}
          </Button>
          <Button onClick={() => shareTo("twitter")} variant="outline" size="icon" aria-label="Share on Twitter">
            <Twitter className="size-4" />
          </Button>
          <Button onClick={() => shareTo("facebook")} variant="outline" size="icon" aria-label="Share on Facebook">
            <Facebook className="size-4" />
          </Button>
          <Button onClick={() => shareTo("native")} variant="outline" size="icon" aria-label="Share">
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Side panel */}
      <aside className="rounded-2xl bg-card/60 backdrop-blur border border-border p-4 shadow-[var(--shadow-card)]">
        <Tabs defaultValue="text">
          <TabsList className="w-full">
            <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button onClick={addLayer} size="sm" className="flex-1">
                <Plus className="size-4" /> Add text
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-auto pr-1">
              {layers.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm border transition ${
                    selectedId === l.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/40 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>
                      {l.text || "(empty)"}
                    </span>
                    <Trash2
                      className="size-4 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(l.id);
                      }}
                    />
                  </div>
                </button>
              ))}
              {layers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No text layers yet
                </p>
              )}
            </div>

            {selected ? (
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={selected.text}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs flex justify-between">
                    <span>Font size</span>
                    <span className="text-muted-foreground">{selected.fontSize}px</span>
                  </Label>
                  <Slider
                    min={16}
                    max={120}
                    step={1}
                    value={[selected.fontSize]}
                    onValueChange={([v]) => updateLayer(selected.id, { fontSize: v })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-xs flex justify-between">
                    <span>Outline</span>
                    <span className="text-muted-foreground">{selected.strokeWidth}px</span>
                  </Label>
                  <Slider
                    min={0}
                    max={16}
                    step={1}
                    value={[selected.strokeWidth]}
                    onValueChange={([v]) => updateLayer(selected.id, { strokeWidth: v })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Color</Label>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md bg-transparent border border-border cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Outline color</Label>
                    <input
                      type="color"
                      value={selected.strokeColor}
                      onChange={(e) => updateLayer(selected.id, { strokeColor: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md bg-transparent border border-border cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Font</Label>
                  <select
                    value={selected.fontFamily}
                    onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value })}
                    className="mt-1 w-full h-9 rounded-md bg-input/50 border border-border px-2 text-sm"
                  >
                    <option value="Impact, Anton, Oswald, Arial Black, sans-serif">Impact</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Comic Sans MS, cursive">Comic Sans</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Courier New, monospace">Courier</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={selected.bold ? "default" : "outline"}
                    onClick={() => updateLayer(selected.id, { bold: !selected.bold })}
                  >
                    <Bold className="size-4" />
                  </Button>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => updateLayer(selected.id, { align: a })}
                        className={`px-3 py-1.5 text-xs ${
                          selected.align === a
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Select a text layer to edit it
              </p>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => {
                const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(t.url)}`;
                return (
                  <button
                    key={t.url}
                    onClick={() => setImageSrc(proxyUrl)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition"
                  >
                    <img
                      src={proxyUrl}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <span className="text-[10px] font-medium text-white">{t.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
              <ImageIcon className="size-3 mt-0.5 shrink-0" />
              Or upload your own image with the button on the canvas.
            </p>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}