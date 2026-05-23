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
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid #f0ede6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="חפש מלון, כתובת, מסעדה..."
          value={query}
          onChange={(e) => onInput(e.target.value)}
        />
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#888780',
            fontSize: '1.1rem',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>
      <div
        id="search-status"
        style={{
          fontSize: '0.8rem',
          color: '#888780',
          padding: '8px 16px',
          display: loading ? 'block' : 'none',
        }}
      >
        מחפש...
      </div>
      <div id="search-results" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              color: '#888780',
              fontSize: '0.85rem',
            }}
          >
            לא נמצאו תוצאות
          </div>
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
              onClick={() => openMaps(item)}
              onKeyDown={(e) => e.key === 'Enter' && openMaps(item)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 16px',
                borderBottom: '1px solid #f5f3ee',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f9f8f5';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>
                {ico}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#1a1a18',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#888780',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.display_name}
                </div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#EEEDFE',
                  color: '#3C3489',
                  border: '1px solid #AFA9EC',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                📍 Maps
              </a>
            </div>
          );
        })}
      </div>
      <div
        style={{
          padding: '8px 16px',
          fontSize: '0.72rem',
          color: '#aaa',
          borderTop: '1px solid #f5f3ee',
          textAlign: 'center',
        }}
      >
        תוצאות מ-OpenStreetMap · לחץ לפתיחה ב-Google Maps
      </div>
    </div>
  );
}
