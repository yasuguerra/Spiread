import React, { useState, useEffect, useRef } from 'react';
import { generateNumberGrid } from '@/lib/parimpar/generateNumberGrid';
import useCountdown from '@/hooks/useCountdown';
import HeaderBar from './common/HeaderBar';
import SummaryDialog from './common/SummaryDialog';

const EXPOSURE_MS = 1000;
const GRID_SIZE = 16;
const PARITY = 'even';
const RATIO_TARGETS = 0.45;
const MIN = 1;
const MAX = 99;

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeStats(grid, selectedIds, reactionTimes) {
  let correct = 0, incorrect = 0, missed = 0;
  const targets = grid.filter((g) => g.isTarget).map((g) => g.id);
  const selected = Array.from(selectedIds);
  for (const id of selected) {
    if (targets.includes(id)) correct++;
    else incorrect++;
  }
  missed = targets.filter((id) => !selectedIds.has(id)).length;
  const accuracy = targets.length ? correct / targets.length : 0;
  return {
    score: correct - incorrect,
    correct,
    incorrect,
    missed,
    accuracy,
    medianRT: median(reactionTimes),
    total: grid.length,
    selected: selected.length,
    targets: targets.length,
  };
}

function SkeletonGrid({ cells }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(clamp(56px,10vw,72px),1fr))] mt-6 mb-8">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded" />
      ))}
    </div>
  );
}

function InstructionBanner({ text }) {
  return (
    <div className="w-full text-center py-2 mb-2 bg-blue-50 rounded text-blue-900 font-medium text-base">
      {text}
    </div>
  );
}

function NumberGrid({ grid, masked, selectedIds = new Set(), onCell }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(clamp(56px,10vw,72px),1fr))] mt-6 mb-8">
      {grid.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={masked}
          tabIndex={masked ? -1 : 0}
          className={`aspect-square flex items-center justify-center select-none touch-manipulation rounded text-[clamp(24px,7vw,40px)] font-bold border transition-all duration-100
            ${masked ? 'bg-gray-200 text-gray-200 border-gray-200' :
              selectedIds.has(item.id)
                ? (item.isTarget ? 'bg-green-200 border-green-500 text-green-900' : 'bg-red-200 border-red-500 text-red-900')
                : 'bg-white border-gray-300 text-gray-900 hover:bg-blue-50'}
          `}
          onClick={() => !masked && onCell(item.id)}
        >
          {masked ? '' : item.value}
        </button>
      ))}
    </div>
  );
}

function FooterCTA({ onConfirm, phase, canFinish }) {
  return (
    <div className="w-full pb-[calc(8px+env(safe-area-inset-bottom))]">
      <button
        className="w-full py-3 rounded bg-blue-600 text-white font-semibold text-lg shadow mt-2 disabled:opacity-60"
        onClick={onConfirm}
        disabled={!canFinish}
      >
        {phase === 'READY' ? 'Start' : phase === 'SUMMARY' ? 'Restart' : 'Finish'}
      </button>
    </div>
  );
}

const ParImpar = () => {
  const [phase, setPhase] = useState('READY');
  const [ready, setReady] = useState(false);
  const [grid, setGrid] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reactionTimes, setReactionTimes] = useState([]);
  const selectStart = useRef(null);

  const timer = useCountdown({
    durationSec: 60,
    autostart: false,
    onEnd: () => setPhase('SUMMARY'),
    syncVisibility: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = generateNumberGrid({
      gridSize: GRID_SIZE,
      targetParity: PARITY,
      ratioTargets: RATIO_TARGETS,
      min: MIN,
      max: MAX,
    });
    setGrid(items);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && phase === 'SELECTING') timer.start();
  }, [ready, phase, timer]);

  const start = () => {
    if (!ready) return;
    setPhase('SHOWING');
    setTimeout(() => {
      setPhase('SELECTING');
      selectStart.current = performance.now();
    }, EXPOSURE_MS);
  };

  const toggleSelect = (id) => {
    if (phase !== 'SELECTING') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (selectStart.current) {
      setReactionTimes((prev) => [...prev, performance.now() - selectStart.current]);
      selectStart.current = performance.now();
    }
  };

  const resetGame = () => {
    setReady(false);
    setPhase('READY');
    setSelectedIds(new Set());
    setReactionTimes([]);
    const items = generateNumberGrid({
      gridSize: GRID_SIZE,
      targetParity: PARITY,
      ratioTargets: RATIO_TARGETS,
      min: MIN,
      max: MAX,
    });
    setGrid(items);
    setReady(true);
    timer.reset();
  };

  if (!ready) {
    return (
      <section className="mx-auto max-w-[480px] px-3 overflow-x-hidden">
        <HeaderBar fixedHeight />
        <InstructionBanner text="Loading..." />
        <SkeletonGrid cells={GRID_SIZE} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[480px] px-3 overflow-x-hidden">
      <HeaderBar fixedHeight />
      <InstructionBanner text="Select all EVEN numbers" />
      
      {phase === 'READY' && (
        <FooterCTA onConfirm={start} phase={phase} canFinish={true} />
      )}
      
      {phase === 'SHOWING' && (
        <NumberGrid grid={grid} masked={false} />
      )}
      
      {phase === 'SELECTING' && (
        <NumberGrid
          grid={grid}
          masked={false}
          selectedIds={selectedIds}
          onCell={toggleSelect}
        />
      )}
      
      {(phase === 'SELECTING' || phase === 'SHOWING') && (
        <FooterCTA 
          onConfirm={() => setPhase('SUMMARY')} 
          phase={phase} 
          canFinish={phase === 'SELECTING'} 
        />
      )}
      
      {phase === 'SUMMARY' && (
        <SummaryDialog
          stats={computeStats(grid, selectedIds, reactionTimes)}
          onClose={resetGame}
        />
      )}
    </section>
  );
};

export default ParImpar;
