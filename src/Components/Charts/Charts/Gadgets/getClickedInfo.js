/**
 * Extracts information about a clicked pie chart segment
 * @param {Object} clicked - Click event params with seriesId and dataIndex
 * @param {Array} parentData - Array of parent emotion data
 * @param {Array} midData - Array of mid emotion data
 * @param {Array} leafData - Array of leaf emotion data
 * @param {number} total - Total count of all markers
 * @returns {Object|null} Clicked info object or null
 */
export const getClickedInfo = (clicked, parentData, midData, leafData, total) => {
  if (!clicked) return null;

  const { seriesId, dataIndex } = clicked;
  let item = null;
  let midTotal = 0;
  let parentTotal = 0;

  if (seriesId === 'inner') {
    // Parent level clicked
    item = parentData[dataIndex];
    if (!item) return null;
    parentTotal = item.value;
    // Calculate mid total for this parent
    midTotal = midData
      .filter(m => m.parent === item.id)
      .reduce((sum, m) => sum + m.value, 0);
    
    return {
      path: item.label,
      count: item.value,
      pctOfTotal: total ? Math.round((item.value / total) * 100) : 0,
      pctOfMid: 0, // No mid level above parent
      hasMid: false,
    };
  } else if (seriesId === 'mid') {
    // Mid level clicked
    item = midData[dataIndex];
    if (!item) return null;
    parentTotal = parentData.find(p => p.id === item.parent)?.value || 0;
    midTotal = item.value;
    
    return {
      path: `${item.parent} > ${item.label}`,
      count: item.value,
      pctOfTotal: total ? Math.round((item.value / total) * 100) : 0,
      pctOfMid: parentTotal ? Math.round((item.value / parentTotal) * 100) : 0,
      hasMid: true,
      parentName: item.parent,
    };
  } else if (seriesId === 'leaf') {
    // Leaf level clicked - show all layer percentages
    item = leafData[dataIndex];
    if (!item) return null;
    // Get parent total
    parentTotal = parentData.find(p => p.id === item.parent)?.value || 0;
    // Get mid total (sum of all leaves under this mid category)
    midTotal = leafData
      .filter(l => l.parent === item.parent && l.mid === item.mid)
      .reduce((sum, l) => sum + l.value, 0);
    
    return {
      path: `${item.parent} > ${item.mid} > ${item.label}`,
      count: item.value,
      pctOfTotal: total ? Math.round((item.value / total) * 100) : 0,
      pctOfMid: midTotal ? Math.round((item.value / midTotal) * 100) : 0,
      pctOfParent: parentTotal ? Math.round((item.value / parentTotal) * 100) : 0,
      hasMid: true,
      isLeaf: true,
      midName: item.mid,
      parentName: item.parent,
    };
  }

  return null;
};

