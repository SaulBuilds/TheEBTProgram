import { useState, useEffect, useCallback } from 'react';

export interface MemeItem {
  id: number;
  imageUrl: string;
  generatedAt: string;
  isNew?: boolean;
}

interface GalleryResponse {
  memes: MemeItem[];
  total: number;
  hasMore: boolean;
}

interface UseGalleryOptions {
  initialLimit?: number;
  random?: boolean;
}

interface UseGalleryReturn {
  memes: MemeItem[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
  prependMeme: (meme: MemeItem) => void;
}

export function useGallery(options: UseGalleryOptions = {}): UseGalleryReturn {
  const { initialLimit = 20, random = true } = options;

  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchMemes = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: initialLimit.toString(),
        offset: currentOffset.toString(),
        random: random.toString(),
      });

      const response = await fetch(`/api/memes/gallery?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }

      const data: GalleryResponse = await response.json();

      setMemes(prev => append ? [...prev, ...data.memes] : data.memes);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [initialLimit, random]);

  // Initial fetch
  useEffect(() => {
    fetchMemes(0);
  }, [fetchMemes]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + initialLimit;
      setOffset(newOffset);
      fetchMemes(newOffset, true);
    }
  }, [loading, hasMore, offset, initialLimit, fetchMemes]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchMemes(0);
  }, [fetchMemes]);

  const prependMeme = useCallback((newMeme: MemeItem) => {
    setMemes(prev => [{ ...newMeme, isNew: true }, ...prev]);
    setTotal(prev => prev + 1);
  }, []);

  return {
    memes,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    prependMeme,
  };
}
