import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;

export type Meme = {
  id: number;
  dataUrl: string;
  createdAt: string;
};

export function useGallery() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/memes`);
      const data = await res.json();
      setMemes(
        data.map((m: any) => ({
          id: m.id,
          dataUrl: m.image_data,
          createdAt: m.created_at,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch memes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  const save = useCallback(async (dataUrl: string) => {
    try {
      const res = await fetch(`${API}/api/memes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `meme-${Date.now()}`,
          image_data: dataUrl,
        }),
      });
      const newMeme = await res.json();
      const mapped: Meme = {
        id: newMeme.id,
        dataUrl: newMeme.image_data,
        createdAt: new Date().toISOString(),
      };
      setMemes((prev) => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      console.error("Failed to save meme:", err);
      return null;
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await fetch(`${API}/api/memes/${id}`, { method: "DELETE" });
      setMemes((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete meme:", err);
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      const all = await fetch(`${API}/api/memes`).then((r) => r.json());
      await Promise.all(
        all.map((m: any) =>
          fetch(`${API}/api/memes/${m.id}`, { method: "DELETE" })
        )
      );
      setMemes([]);
    } catch (err) {
      console.error("Failed to clear memes:", err);
    }
  }, []);

  return { memes, save, remove, clear, loading };
}