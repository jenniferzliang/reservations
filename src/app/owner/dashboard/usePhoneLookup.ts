import { useState, useRef, useCallback } from "react";

export interface GuestSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  instagram: string | null;
  allergies: string | null;
  visitCount: number;
}

export function usePhoneLookup() {
  const [suggestion, setSuggestion] = useState<GuestSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookup = useCallback((value: string) => {
    setSuggestion(null);
    if (timer.current) clearTimeout(timer.current);

    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return;

    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/guests/lookup?phone=${encodeURIComponent(value)}`);
        if (res.ok) {
          const { guest } = await res.json();
          if (guest) setSuggestion(guest);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setSuggestion(null);
    setLoading(false);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { suggestion, loading, lookup, clear };
}
