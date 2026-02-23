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