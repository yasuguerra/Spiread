import React from 'react';

interface SummaryStats {
  score: number;
  correct: number;
  incorrect: number;
  missed: number;
  accuracy: number;
  medianRT: number;
  total: number;
  selected: number;
  targets: number;
}

interface SummaryDialogProps {
  stats: SummaryStats;
  onClose: () => void;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({ stats, onClose }) => {
  const formatTime = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Session Complete!
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.score}
                </div>
                <div className="text-sm text-blue-800">Final Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-semibold text-green-600">
                  {stats.correct}
                </div>
                <div className="text-xs text-green-800">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xl font-semibold text-red-600">
                  {stats.incorrect}
                </div>
                <div className="text-xs text-red-800">Incorrect</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-semibold">{formatPercent(stats.accuracy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Median RT:</span>
                <span className="font-semibold">{formatTime(stats.medianRT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missed:</span>
                <span className="font-semibold">{stats.missed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected:</span>
                <span className="font-semibold">{stats.selected} / {stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Targets:</span>
                <span className="font-semibold">{stats.targets}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDialog;
