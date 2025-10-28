import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Assignment, Category, calculateWhatIf } from '../../lib/gradeCalculator';

interface WhatIfModalProps {
  currentAssignments: Assignment[];
  categories: Category[];
  gradingModel: 'weighted' | 'points';
  onClose: () => void;
}

interface HypotheticalAssignment {
  category_id: string;
  earned_points: number;
  total_points: number;
}

export function WhatIfModal({
  currentAssignments,
  categories,
  gradingModel,
  onClose,
}: WhatIfModalProps) {
  const [hypotheticals, setHypotheticals] = useState<HypotheticalAssignment[]>([
    { category_id: categories[0]?.id || '', earned_points: 0, total_points: 0 },
  ]);

  const result = calculateWhatIf(
    currentAssignments,
    hypotheticals,
    categories,
    gradingModel,
    true
  );

  const addHypothetical = () => {
    setHypotheticals([
      ...hypotheticals,
      { category_id: categories[0]?.id || '', earned_points: 0, total_points: 0 },
    ]);
  };

  const updateHypothetical = (index: number, field: keyof HypotheticalAssignment, value: any) => {
    const updated = [...hypotheticals];
    updated[index] = { ...updated[index], [field]: value };
    setHypotheticals(updated);
  };

  const removeHypothetical = (index: number) => {
    setHypotheticals(hypotheticals.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">What-If Calculator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Projected Grade</p>
                <p className="text-3xl font-bold text-blue-900">
                  {result.finalPercentage.toFixed(2)}%
                </p>
                <p className="text-lg text-blue-700 mt-1">
                  Letter Grade: <span className="font-semibold">{result.letterGrade}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Hypothetical Assignments</h3>
              <button
                onClick={addHypothetical}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Assignment
              </button>
            </div>

            <div className="space-y-3">
              {hypotheticals.map((hypo, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                >
                  <select
                    value={hypo.category_id}
                    onChange={(e) => updateHypothetical(index, 'category_id', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    value={hypo.earned_points}
                    onChange={(e) =>
                      updateHypothetical(index, 'earned_points', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Earned"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />

                  <span className="text-gray-600">/</span>

                  <input
                    type="number"
                    step="0.01"
                    value={hypo.total_points}
                    onChange={(e) =>
                      updateHypothetical(index, 'total_points', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Total"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />

                  {hypotheticals.length > 1 && (
                    <button
                      onClick={() => removeHypothetical(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {gradingModel === 'weighted' && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Category Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {result.categories.map((cat) => (
                  <div key={cat.categoryId} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">{cat.categoryName}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {cat.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
