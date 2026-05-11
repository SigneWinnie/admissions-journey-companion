import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type SavedMeme = { id: string; dataUrl: string; createdAt: string };

export function useGallery() {
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser({ id: data.session.user.id });
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id });
      } else {
        setUser(null);
        setMemes([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMemes();
  }, [user]);

  const fetchMemes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("memes")
        .select("id, data_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemes(
        (data || []).map((m) => ({
          id: m.id,
          dataUrl: m.data_url,
          createdAt: m.created_at,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch memes:", err);
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  const save = useCallback(
    async (dataUrl: string) => {
      if (!user) {
        console.error("Must be logged in to save memes");
        return null;
      }

      try {
        const { data, error } = await supabase.from("memes").insert({
          user_id: user.id,
          data_url: dataUrl,
          layers: [],
          template_id: null,
        }).select();

        if (error) throw error;

        const newMeme = {
          id: data[0].id,
          dataUrl: data[0].data_url,
          createdAt: data[0].created_at,
        };

        setMemes((prev) => [newMeme, ...prev]);
        return newMeme;
      } catch (err) {
        console.error("Failed to save meme:", err);
        return null;
      }
    },
    [user]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("memes").delete().eq("id", id);
        if (error) throw error;
        setMemes((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        console.error("Failed to delete meme:", err);
      }
    },
    [user]
  );

  const clear = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("memes")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setMemes([]);
    } catch (err) {
      console.error("Failed to clear memes:", err);
    }
  }, [user]);

  return { memes, save, remove, clear, loading, user };
}