import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { products as staticProducts } from '../data/products';

const API_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:4000';

export function useProducts(enabledOnly: boolean = true) {
  const [data, setData] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/products?enabled=${enabledOnly ? 'true' : 'false'}` , {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json: Product[] = await res.json();
        if (!cancelled) setData(json);
      } catch (_e) {
        // Fallback to local static data
        if (!cancelled) {
          const local = enabledOnly ? staticProducts.filter(p => p.enabled !== false) : staticProducts;
          setData(local);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; controller.abort(); };
  }, [enabledOnly]);

  const products = useMemo(() => data ?? staticProducts, [data]);
  return { products, loading, error };
}

