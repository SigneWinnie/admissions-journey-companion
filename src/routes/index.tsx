import { createFileRoute } from "@tanstack/react-router";
import { MemeEditor } from "@/components/MemeEditor";
import { Gallery } from "@/components/Gallery";
import { Sparkles, Flame } from "lucide-react";
import { useGallery } from "@/hooks/useGallery";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "MemeForge — Create & share memes in seconds" },
      {
        name: "description",
        content: "A fast, beautiful meme generator. Upload an image, drag text anywhere, share instantly.",
      },
      { property: "og:title", content: "MemeForge — Meme Generator" },
      {
        property: "og:description",
        content: "Create, save and share memes with a polished real-time editor.",
      },
    ],
  }),
});

function Index() {
  const gallery = useGallery();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-30 bg-background/70">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg grid place-items-center bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-glow)]">
              <Flame className="size-4" />
            </div>
            <span className="font-bold tracking-tight text-lg">MemeForge</span>
          </div>
          <a href="#gallery" className="text-sm text-muted-foreground hover:text-foreground transition">
            Gallery
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <section className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs text-muted-foreground mb-5">
            <Sparkles className="size-3 text-primary" />
            Real-time meme editor
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Forge memes that{" "}
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              actually slap
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Upload an image, drag text anywhere on the canvas, and share your masterpiece in seconds.
          </p>
        </section>

        <MemeEditor gallery={gallery} />
        <Gallery gallery={gallery} />

        <footer className="mt-20 pt-8 border-t border-border/60 text-center text-xs text-muted-foreground">
          Built with React, Canvas, and a lot of caffeine ☕
        </footer>
      </main>
    </div>
  );
}