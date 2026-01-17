import emotions from './emotions.json';

// Build a mapping of every non-leaf emotion label to its top-level parent emotion.
// - Parent emotions map to themselves (e.g. "happy" -> "happy")
// - Mid-level categories map to their parent (e.g. "optimistic" -> "happy")
// - Leaf emotions map to their parent (e.g. "inspired" -> "happy")
const emotionParentMap = {};

for (const [parent, midLevels] of Object.entries(emotions)) {
  emotionParentMap[parent] = parent;

  for (const [mid, leaves] of Object.entries(midLevels)) {
    emotionParentMap[mid] = parent;

    for (const leaf of leaves) {
      emotionParentMap[leaf] = parent;
    }
  }
}

export default emotionParentMap;


