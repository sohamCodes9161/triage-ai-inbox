import { useCallback, useEffect, useRef, useState } from "react";
import { errMsg } from "../api/client.js";

// Small data hook: loading/error state, optional silent polling, stale-response protection.
export function useFetch(fn, deps = [], { poll = 0 } = {}) {
  const [state, set] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const load = useCallback(async (silent) => {
    const my = ++seq.current;
    if (!silent) set((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (my === seq.current) set({ data, loading: false, error: null });
    } catch (e) {
      if (my === seq.current) set((s) => ({ ...s, loading: false, error: silent ? s.error : errMsg(e) }));
    }
  }, []);

  useEffect(() => { load(false); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => { if (!document.hidden) load(true); }, poll);
    return () => clearInterval(id);
  }, [poll, load]);

  return { ...state, reload: () => load(true), refetch: () => load(false) };
}
