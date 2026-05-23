import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getMapsUrl,
  getResultIcon,
  nominatimSearch,
  type NominatimResult,
} from '../services/nominatim';

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest('#edit-bar')
      ) {
        onClose();
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open, onClose]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await nominatimSearch(q.trim());
      setResults(data);
    } catch {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  const onInput = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => runSearch(value), 400);
  };

  const openMaps = (item: NominatimResult) => {
    window.open(getMapsUrl(item.lat, item.lon), '_blank');
  };

  return (
    <div
      ref={panelRef}
      id="search-panel"
      className={open ? 'open' : ''}
    >
      <div className="search-header">
        <span className="search-header__icon">🔍</span>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="חפש מלון, כתובת, מסעדה..."
          value={query}
          onChange={(e) => onInput(e.target.value)}
        />
        <button type="button" className="search-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div
        id="search-status"
        style={{ display: loading ? 'block' : 'none' }}
      >
        מחפש...
      </div>
      <div id="search-results">
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="search-empty">לא נמצאו תוצאות</div>
        )}
        {results.map((item, i) => {
          const name = item.display_name.split(',')[0];
          const mapsUrl = getMapsUrl(item.lat, item.lon);
          const ico = getResultIcon(item);
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className="search-result"
              onClick={() => openMaps(item)}
              onKeyDown={(e) => e.key === 'Enter' && openMaps(item)}
            >
              <div className="search-result__icon">{ico}</div>
              <div className="search-result__body">
                <div className="search-result__name">{name}</div>
                <div className="search-result__addr">{item.display_name}</div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="search-result__maps"
                onClick={(e) => e.stopPropagation()}
              >
                📍 Maps
              </a>
            </div>
          );
        })}
      </div>
      <div className="search-footer">
        תוצאות מ-OpenStreetMap · לחץ לפתיחה ב-Google Maps
      </div>
    </div>
  );
}
