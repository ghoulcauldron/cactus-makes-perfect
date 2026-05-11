export const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(40);
  }
};

export function shuffleArray(array: any[], seed: number) {
  const shuffled = [...array];
  let m = shuffled.length, t, i;
  while (m) {
    const random = Math.abs(Math.sin(seed + m)); 
    i = Math.floor(random * m--);
    t = shuffled[m];
    shuffled[m] = shuffled[i];
    shuffled[i] = t;
  }
  return shuffled;
}

const RING_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Maps a ring's current display position (activeIndex in the shuffled array)
 * back to the original source index (0–11), which corresponds to the
 * filename r{ring}_{sourceIndex:02d}.png stored on the backend.
 */
export function getSourceIndex(activeIndex: number, ringIndex: number): number {
  return shuffleArray([...RING_INDICES], ringIndex * 1234)[activeIndex];
}