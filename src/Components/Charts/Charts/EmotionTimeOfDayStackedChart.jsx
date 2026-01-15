import React, { useMemo, useState } from 'react';
import BaseChart from '../Common/BaseChart';
import emotionParentMap from './emotionParentMap';

function cssVar(name, fallback = '#999') {
  if (typeof window === 'undefined') return fallback;
  const v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function getParentColor(parent) {
  // Optional mapping for legacy "bad" bucket
  if (parent === 'bad') return cssVar('--emotion-bad', cssVar('--emotion-tired', '#999'));
  return cssVar(`--emotion-${parent}`, '#999');
}

function getLocalHour(marker) {
  const d =
    marker?.userTimestamp instanceof Date
      ? marker.userTimestamp
      : marker?.user_timestamp
        ? new Date(marker.user_timestamp)
        : marker?.timestamp
          ? new Date(marker.timestamp)
          : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.getHours();
}

function getDaypart(hour) {
  // 4 buckets:
  // - Late night: 00:00–04:59
  // - Morning: 05:00–11:59
  // - Afternoon: 12:00–16:59
  // - Evening: 17:00–23:59
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

const DAYPARTS = ['Late night', 'Morning', 'Afternoon', 'Evening'];

const EmotionTimeOfDayStackedChart = ({ markers }) => {
  const [focused, setFocused] = useState(null);
  // focused shape:
  // { parent: string, daypart: string, value: number, pct: number }

  const { bars, parents } = useMemo(() => {
    const counts = {};
    const totals = {};

    for (const dp of DAYPARTS) {
      counts[dp] = {};
      totals[dp] = 0;
    }

    const parentSet = new Set();

    for (const marker of markers || []) {
      const leaf = marker?.emotion;
      if (!leaf) continue;

      const hour = getLocalHour(marker);
      if (hour === null) continue;

      const daypart = getDaypart(hour);
      const parent = emotionParentMap[leaf] || leaf;

      parentSet.add(parent);
      counts[daypart][parent] = (counts[daypart][parent] || 0) + 1;
      totals[daypart] += 1;
    }

    // Stable ordering by overall total desc.
    const parentTotals = {};
    for (const dp of DAYPARTS) {
      for (const [parent, n] of Object.entries(counts[dp])) {
        parentTotals[parent] = (parentTotals[parent] || 0) + n;
      }
    }

    const parents = Array.from(parentSet).sort(
      (a, b) => (parentTotals[b] || 0) - (parentTotals[a] || 0)
    );

    const bars = DAYPARTS.map((dp) => {
      const total = totals[dp] || 0;
      const segments = parents
        .map((p) => {
          const value = counts[dp][p] || 0;
          const pct = total ? value / total : 0;
          return {
            key: p,
            value,
            pct,
            color: getParentColor(p),
          };
        })
        .filter((s) => s.value > 0);

      return { daypart: dp, total, segments };
    });

    return { bars, parents };
  }, [markers]);

  return (
    <BaseChart title="How do us feel at each part of the day?">
      <div style={{ width: '100%' }}>
        {/* Legend + current focus label */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {parents.map((p) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: focused && focused.parent !== p ? 0.35 : 1,
                  transition: 'opacity 1s ease',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: getParentColor(p),
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 12, opacity: 0.9 }}>{p}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.9,
              whiteSpace: 'nowrap',
            }}
          >
            {focused ? (
              <>
                Focused: <strong>{focused.parent}</strong> in <strong>{focused.daypart}</strong> —{' '}
                {focused.value} ({Math.round(focused.pct * 100)}%)
              </>
            ) : (
              <>Hover a color to focus</>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${DAYPARTS.length}, 1fr)`,
            gap: 25,
            alignItems: 'end',
          }}
        >
          {bars.map((bar, idx) => (
            <div key={bar.daypart} style={{ display: 'flex', flexDirection: 'column', gap: 10}}>
              {/* Container for the bar */}
              <div
                style={{
                  height: 240,
                  borderRadius: 25,
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column-reverse', // stack from bottom
                }}
                onMouseLeave={() => setFocused(null)}
              >
                {bar.total === 0 ? (
                  <div style={{ height: '100%', opacity: 0.2 }} />
                ) : (
                  bar.segments.map((seg) => (
                    <div
                      key={`${bar.daypart}-${seg.key}`}
                      title={`${seg.key}: ${seg.value} (${Math.round(seg.pct * 100)}%)`}
                      style={{
                        height: `${seg.pct * 100}%`,
                        background: seg.color,
                        opacity: focused && focused.parent !== seg.key ? 0.18 : 1,
                        transition: 'opacity 0.5s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={() =>
                        setFocused({
                          parent: seg.key,
                          daypart: bar.daypart,
                          value: seg.value,
                          pct: seg.pct,
                        })
                      }
                    />
                  ))
                )}
              </div>

              {/* Pinned 2-line label box */}
              <div
                style={{
                  borderRadius: 12,
                  padding: '8px 6px',
                  textAlign: 'center',
                  opacity: 0.9,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.95 }}>{bar.daypart}</div>
                <div style={{ marginTop: 2, fontSize: 11 }}>{bar.total} candles</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseChart>
  );
};

export default EmotionTimeOfDayStackedChart;


