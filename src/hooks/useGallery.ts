import { useEffect, useState, useCallback } from "react";

export type SavedMeme = { id: string; dataUrl: string; createdAt: number };
const KEY = "meme-gallery-v1";

function read(): SavedMeme[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useGallery() {
  const [memes, setMemes] = useState<SavedMeme[]>([]);

  useEffect(() => {
    setMemes(read());
    const onStorage = () => setMemes(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((dataUrl: string) => {
    const meme: SavedMeme = { id: crypto.randomUUID(), dataUrl, createdAt: Date.now() };
    const next = [meme, ...read()].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next));
    setMemes(next);
    return meme;
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((m) => m.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setMemes(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setMemes([]);
  }, []);

  return { memes, save, remove, clear };
}