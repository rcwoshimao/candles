import React, { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import BaseChart from '../Common/BaseChart';
import emotionParentMap from './emotionParentMap';

function cssVar(name, fallback = '#999') {
  if (typeof window === 'undefined') return fallback;
  const v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function getParentColor(parent) {
  // Optional mapping for legacy "bad" bucket → reuse tired color if present.
  if (parent === 'bad') return cssVar('--emotion-tired', '#999');
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
  const { dataset, series, totals } = useMemo(() => {
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

    const dataset = DAYPARTS.map((dp) => {
      // Keep bucket label clean (just the daypart).
      // We'll render totals below the chart for readability.
      const row = { bucket: dp, total: totals[dp] };
      for (const parent of parents) {
        row[parent] = counts[dp][parent] || 0;
      }
      return row;
    });

    const series = parents.map((parent, idx) => ({
      dataKey: parent,
      label: parent,
      stack: 'total',
      // Set expand on the first series only (applies to the whole stack group).
      ...(idx === 0 ? { stackOffset: 'expand' } : {}),
      color: getParentColor(parent),
    }));

    return { dataset, series, totals };
  }, [markers]);

  return (
    <BaseChart title="Emotion by time of day (100% stacked)">
      <div style={{ width: '100%' }}>
        <BarChart
          dataset={dataset}
          xAxis={[
            {
              dataKey: 'bucket',
              scaleType: 'band',
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: 1,
              tickNumber: 6,
              valueFormatter: (v) => `${Math.round(v * 100)}%`,
            },
          ]}
          series={series}
          height={260}
          margin={{ top: 10, right: 10, bottom: 28, left: 10 }}
        />

        {/* Totals row under the x-axis labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${DAYPARTS.length}, 1fr)`,
            marginTop: 6,
            fontSize: 11,
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          {DAYPARTS.map((dp) => (
            <div key={dp}>{totals?.[dp] ?? 0} candles</div>
          ))}
        </div>
      </div>
    </BaseChart>
  );
};

export default EmotionTimeOfDayStackedChart;


