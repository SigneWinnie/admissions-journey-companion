import { useGallery } from "@/hooks/useGallery";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ImageOff } from "lucide-react";

type GalleryHook = ReturnType<typeof useGallery>;

export function Gallery({ gallery }: { gallery: GalleryHook }) {
  const { memes, remove, clear, loading } = gallery;

  const download = (dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `meme-${Date.now()}.png`;
    a.click();
  };

  return (
    <section id="gallery" className="mt-16 scroll-mt-20">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Your gallery
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Memes you saved — stored in your database.
          </p>
        </div>
        {memes.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            Clear all
          </Button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/30">
          <p className="text-sm text-muted-foreground">Loading your memes...</p>
        </div>
      ) : memes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/30">
          <ImageOff className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No memes saved yet — create one above and hit "Save to gallery".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {memes.map((m) => (
            <div
              key={m.id}
              className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <img src={m.dataUrl} alt="Saved meme" className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => download(m.dataUrl)}
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}