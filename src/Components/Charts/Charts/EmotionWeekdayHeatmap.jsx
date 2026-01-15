import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import BaseChart from '../Common/BaseChart';
import emotionParentMap from './emotionParentMap';

function getDate(marker) {
  // NOTE on timezone:
  // - `new Date(isoString)` converts the instant into the VIEWER's local timezone.
  // - If you want a globally consistent weekday, use getUTCDay instead.
  // - "Creator local weekday" requires storing creator timezone/offset at insert time.
  const d =
    marker?.userTimestamp instanceof Date
      ? marker.userTimestamp
      : marker?.user_timestamp
        ? new Date(marker.user_timestamp)
        : marker?.timestamp
          ? new Date(marker.timestamp)
          : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EmotionWeekdayHeatmap = ({ markers }) => {
  const [focused, setFocused] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { parents, matrix, maxCount, totalsByDay } = useMemo(() => {
    const parentSet = new Set();
    const matrix = {}; // matrix[parent][dayIdx] = count
    const totalsByDay = Array(7).fill(0);
    let maxCount = 0;

    for (const m of markers || []) {
      const leaf = m?.emotion;
      if (!leaf) continue;

      const d = getDate(m);
      if (!d) continue;

      // Viewer-local weekday: JS getDay() is 0=Sun..6=Sat. Convert to Mon=0..Sun=6.
      const day = d.getDay();
      const dayIdx = (day + 6) % 7;

      const parent = emotionParentMap[leaf] || leaf;
      parentSet.add(parent);
      if (!matrix[parent]) matrix[parent] = Array(7).fill(0);
      matrix[parent][dayIdx] += 1;
      totalsByDay[dayIdx] += 1;
      if (matrix[parent][dayIdx] > maxCount) maxCount = matrix[parent][dayIdx];
    }

    const parents = Array.from(parentSet).sort();

    return { parents, matrix, maxCount, totalsByDay };
  }, [markers]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries?.[0]?.contentRect?.width ?? 0;
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.on('mouseleave', () => setFocused(null));

    const width = Math.max(0, containerWidth || 0);
    if (width < 50) return;

    const margin = { top: 10, right: 10, bottom: 10, left: 100 };
    const headerH = 26;
    const plotW = Math.max(10, width - margin.left - margin.right);
    const colGap = 6;
    const rowGap = 8;
    // Square cells: choose size based on available width.
    const square = Math.max(10, Math.min(28, Math.floor((plotW - colGap * 6) / 7)));
    const rowsH = parents.length * (square + rowGap) - rowGap;
    const height = margin.top + headerH + 12 + rowsH + margin.bottom;

    svg.attr('width', width).attr('height', height);

    const xPos = (xi) => xi * (square + colGap);
    const yPos = (yi) => yi * (square + rowGap);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Header: weekday + totals
    const header = g.append('g').attr('transform', `translate(0,0)`);
    header
      .selectAll('text.weekday')
      .data(d3.range(7))
      .join('text')
      .attr('class', 'weekday')
      .attr('x', (d) => xPos(d) + square / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.9)')
      .attr('font-size', 12)
      .text((d) => WEEKDAYS[d]);

    header
      .selectAll('text.total')
      .data(d3.range(7))
      .join('text')
      .attr('class', 'total')
      .attr('x', (d) => xPos(d) + square / 2)
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.60)')
      .attr('font-size', 11)
      .text((d) => totalsByDay[d] ?? 0);

    const rows = g.append('g').attr('transform', `translate(0,${headerH + 12})`);

    // Row labels
    svg
      .append('g')
      .attr('transform', `translate(${margin.left - 10},${margin.top + headerH + 12})`)
      .selectAll('text.rowlabel')
      .data(parents.map((p, i) => ({ p, i })))
      .join('text')
      .attr('class', 'rowlabel')
      .attr('x', -6)
      .attr('y', (d) => yPos(d.i) + square / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (focused && focused.parent !== d.p ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.95)'))
      .attr('font-size', 12)
      .text((d) => d.p);

    // Cells data
    const cells = [];
    parents.forEach((p, yi) => {
      const row = matrix[p] || Array(7).fill(0);
      row.forEach((count, xi) => {
        cells.push({ parent: p, yi, xi, count });
      });
    });

    const max = Math.max(1, maxCount || 0);
    // D3-style sequential colormap (yellow <-> purple) driven by frequency.
    // Use sqrt so low counts are still visible.
    // `interpolatePlasma` naturally goes purple -> yellow, so invert it to get yellow -> purple.
    const colorScale = d3.scaleSequential((t) => d3.interpolatePlasma(1 - t)).domain([0, max]);

    rows
      .selectAll('rect.cell')
      .data(cells, (d) => `${d.parent}-${d.xi}`)
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d) => xPos(d.xi))
      .attr('y', (d) => yPos(d.yi))
      .attr('width', square)
      .attr('height', square)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => {
        return colorScale(d.count || 0);
      })
      .attr('stroke', 'rgba(255,255,255,0.10)')
      .attr('stroke-width', 1)
      .style('cursor', 'default')
      .style('transition', 'opacity 220ms ease')
      .attr('opacity', (d) => {
        const dim = focused && (focused.parent !== d.parent || focused.dayIdx !== d.xi);
        return dim ? 0.18 : 1;
      })
      .on('mouseenter', (_event, d) => setFocused({ parent: d.parent, dayIdx: d.xi, count: d.count }))
      .on('mouseleave', () => setFocused(null));
  }, [containerWidth, parents, matrix, maxCount, totalsByDay, focused]);

  return (
    <BaseChart title="Emotion heatmap by weekday (viewer-local)">
      <div style={{ width: '100%' }}>
        {focused ? (
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
            Focused: <span style={{ opacity: 0.95 }}>{focused.parent}</span> on{' '}
            <span style={{ opacity: 0.95 }}>{WEEKDAYS[focused.dayIdx]}</span> — {focused.count}
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8 }}>Hover a cell to focus</div>
        )}
        <div ref={containerRef} style={{ width: '100%' }} onMouseLeave={() => setFocused(null)}>
          <svg ref={svgRef} />
        </div>
      </div>
    </BaseChart>
  );
};

export default EmotionWeekdayHeatmap;


