export type GridItem = { id: string; value: number; isTarget: boolean };

export function generateNumberGrid(opts: {
  gridSize: number;
  targetParity: 'even' | 'odd';
  ratioTargets: number;
  min: number;
  max: number;
}): GridItem[] {
  const { gridSize, targetParity, ratioTargets, min, max } = opts;
  const isTarget = (n: number) =>
    targetParity === 'even' ? n % 2 === 0 : n % 2 !== 0;
  const totalTargets = Math.round(gridSize * ratioTargets);
  const totalDistractors = gridSize - totalTargets;
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const targets = range.filter(isTarget);
  const distractors = range.filter((n) => !isTarget(n));
  function pickRandom(arr: number[], count: number): number[] {
    const copy = [...arr];
    const out: number[] = [];
    while (out.length < count && copy.length) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }
  const chosenTargets = pickRandom(targets, totalTargets);
  const chosenDistractors = pickRandom(distractors, totalDistractors);
  const all = [...chosenTargets.map((v) => ({ value: v, isTarget: true })),
    ...chosenDistractors.map((v) => ({ value: v, isTarget: false }))];
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map((item, idx) => ({ ...item, id: String(idx) }));
}
