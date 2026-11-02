import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../lib/geocode.js';

export default function SearchBar({ near, onSelect, onSettings, value, onClear }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nearRef = useRef(near);
  nearRef.current = near;

  useEffect(() => {
    setQ(value || '');
  }, [value]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3 || term === value) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      setErr('');
      try {
        setResults(await searchPlaces(term, nearRef.current, ctrl.signal));
        setOpen(true);
      } catch (e) {
        if (e.name !== 'AbortError') setErr("Search isn't answering. Try again.");
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, value]);

  return (
    <div className="search">
      <div className="search-row">
        <span className="search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Where to, genius?"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Search destination"
        />
        {busy && <span className="spinner" aria-label="Searching" />}
        {q && (
          <button className="icon-btn ghost" aria-label="Clear" onClick={() => { setQ(''); setResults([]); onClear?.(); }}>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        )}
        <button className="icon-btn ghost" aria-label="Settings" onClick={onSettings}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
        </button>
      </div>
      {err && <div className="search-err">{err}</div>}
      {open && results.length > 0 && (
        <ul className="results">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => {
                  setOpen(false);
                  setResults([]);
                  setQ(r.name);
                  onSelect(r);
                }}
              >
                <strong>{r.name}</strong>
                {r.label && <span>{r.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
