import React, { useMemo, useState } from 'react';
import { PieChart, pieArcClasses, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import BaseChart from '../Common/BaseChart';
import emotions from '../../Candle/emotions.json';
import emotionParentMap from './emotionParentMap';
import { getClickedInfo } from './Gadgets/getClickedInfo';

function buildLeafToMidMap(tree) {
  const leafToMid = {};
  for (const [parent, mids] of Object.entries(tree)) {
    for (const [mid, leaves] of Object.entries(mids)) {
      for (const leaf of leaves) {
        leafToMid[leaf] = { parent, mid };
      }
    }
  }
  return leafToMid;
}

function cssVar(name, fallback = '#999') {
  if (typeof window === 'undefined') return fallback;
  const v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Converts "rgb(r, g, b)" to "rgba(r,g,b,a)".
function rgbToRgba(color, alpha) {
  const m = color.match(/rgb\s*\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/i);
  if (!m) return color;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}

const EmotionMuiDonutChart = ({ markers, skipAnimation = false }) => {
  const leafToMid = useMemo(() => buildLeafToMidMap(emotions), []);
  const [clicked, setClicked] = useState(null);

  const { total, parentData, midData, leafData } = useMemo(() => {
    const parentCounts = {};
    const midCountsByParent = {};
    const leafCountsByParentMid = {};
    let total = 0;

    for (const marker of markers || []) {
      const leaf = marker?.emotion;
      if (!leaf) continue;

      const parent = emotionParentMap[leaf] || leaf;
      parentCounts[parent] = (parentCounts[parent] || 0) + 1;
      total += 1;

      const midInfo = leafToMid[leaf];
      const midParent = midInfo?.parent || parent;
      const mid = midInfo?.mid || 'other';
      if (!midCountsByParent[midParent]) midCountsByParent[midParent] = {};
      midCountsByParent[midParent][mid] = (midCountsByParent[midParent][mid] || 0) + 1;

      if (!leafCountsByParentMid[midParent]) leafCountsByParentMid[midParent] = {};
      if (!leafCountsByParentMid[midParent][mid]) leafCountsByParentMid[midParent][mid] = {};
      leafCountsByParentMid[midParent][mid][leaf] = (leafCountsByParentMid[midParent][mid][leaf] || 0) + 1;
    }

    const parentData = Object.entries(parentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => ({
        id,
        label: id,
        value,
        color: cssVar(`--emotion-${id}`, '#999'),
      }));

    // IMPORTANT: Build outer-ring data in the SAME parent order as the inner ring,
    // so subcategories (mid layer) align with their parent segment.
    const midData = [];
    const leafData = [];
    for (const parentSeg of parentData) {
      const parent = parentSeg.id;
      const mids = midCountsByParent[parent] || {};
      const sortedMids = Object.entries(mids).sort((a, b) => b[1] - a[1]);
      const base = cssVar(`--emotion-${parent}`, '#999');

      for (const [mid, value] of sortedMids) {
        midData.push({
          id: `${parent}::${mid}`,
          parent,
          label: mid,
          value,
          color: rgbToRgba(base, 0.55),
        });
      }

      // Leaf ring: keep leaves grouped under the same parent, and in the same mid-order as above.
      for (const [mid] of sortedMids) {
        const leaves = leafCountsByParentMid[parent]?.[mid] || {};
        const sortedLeaves = Object.entries(leaves).sort((a, b) => b[1] - a[1]);
        for (const [leaf, value] of sortedLeaves) {
          leafData.push({
            id: `${parent}::${mid}::${leaf}`,
            parent,
            mid,
            label: leaf,
            value,
            color: rgbToRgba(base, 0.35),
          });
        }
      }
    }

    return { total, parentData, midData, leafData };
  }, [markers, leafToMid]);

  const clickedInfo = getClickedInfo(clicked, parentData, midData, leafData, total);

  return (
    <BaseChart title="Emotion Breakdown (3 levels)">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PieChart
          series={[
            {
              id: 'inner',
              startAngle: 0,
              endAngle: 360,
              innerRadius: 60,
              outerRadius: 135,
              paddingAngle: 1.2,
              cornerRadius: 3,
              data: parentData,
              highlightScope: { fade: 'global', highlight: 'item' },
              arcLabel: (item) => (item.value && total ? `${Math.round((item.value / total) * 100)}%` : ''),
              arcLabelMinAngle: 35,
            },
            {
              id: 'mid',
              startAngle: 0,
              endAngle: 360,
              innerRadius: 147,
              outerRadius: 165,
              paddingAngle: 1.2,
              cornerRadius: 3,
              data: midData,
              highlightScope: { fade: 'global', highlight: 'item' },
            },
            {
              id: 'leaf',
              startAngle: 0,
              endAngle: 360,
              innerRadius: 177,
              outerRadius: 186,
              paddingAngle: 1.2,
              cornerRadius: 3,
              data: leafData,
              highlightScope: { fade: 'global', highlight: 'item' },
            },
          ]}
          width={400}
          height={400}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          skipAnimation={skipAnimation}
          onItemClick={(event, params) => {
            // params = { seriesId, dataIndex, ... }
            setClicked(params);
          }}
          sx={{
            [`& .${pieArcClasses.root}`]: {
              stroke: 'none',
              strokeWidth: 0,
            },
            [`& .${pieArcLabelClasses.root}`]: {
              fill: 'white',
              fontSize: 15,
              fontWeight:"bold",
            },
          }}
          hideLegend
        />
      </div>

      {clickedInfo && (
        <div style={{ marginTop: 8, fontSize: 15, opacity: 0.9 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>{clickedInfo.path}</strong>
          </div>
          <div>Number of people: <strong>{clickedInfo.count}</strong></div>
          <div>Percentage out of all emotions: <strong>{clickedInfo.pctOfTotal}%</strong></div>
          {clickedInfo.hasMid && !clickedInfo.isLeaf && (
            <div>Percentage out of <strong>{clickedInfo.parentName}</strong>: <strong>{clickedInfo.pctOfMid}%</strong></div>
          )}
          {clickedInfo.isLeaf && (
            <>
              
              <div>Percentage out of <strong>{clickedInfo.parentName}</strong>: <strong>{clickedInfo.pctOfParent}%</strong></div>
              <div>Percentage out of <strong>{clickedInfo.midName}</strong>: <strong>{clickedInfo.pctOfMid}%</strong></div>
            </>
          )}
        </div>
      )}
    </BaseChart>
  );
};

export default EmotionMuiDonutChart;


