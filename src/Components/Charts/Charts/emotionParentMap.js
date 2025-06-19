// Maps all sub-emotions to their main emotion group for color and grouping purposes
const emotionParentMap = {
  // Happy group
  amused: 'happy',
  delighted: 'happy',
  jovial: 'happy',
  blissful: 'happy',
  // Sad group
  depressed: 'sad',
  sorrow: 'sad',
  grief: 'sad',
  lonely: 'sad',
  // Angry group
  frustrated: 'angry',
  annoyed: 'angry',
  irritated: 'angry',
  enraged: 'angry',
  // Surprised group
  amazed: 'surprised',
  astonished: 'surprised',
  shocked: 'surprised',
  confused: 'surprised',
  // Disgusted group
  revolted: 'disgusted',
  contempt: 'disgusted',
  aversion: 'disgusted',
  repulsed: 'disgusted',
  // Fearful group
  anxious: 'fearful',
  scared: 'fearful',
  terrified: 'fearful',
  nervous: 'fearful',
  // Tired group
  exhausted: 'tired',
  drained: 'tired',
  weary: 'tired',
  fatigued: 'tired',
  // Main groups map to themselves
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  surprised: 'surprised',
  disgusted: 'disgusted',
  fearful: 'fearful',
  tired: 'tired'
};

export default emotionParentMap; 