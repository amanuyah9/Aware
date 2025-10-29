import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Category } from '../../lib/gradeCalculator';

interface Assignment {
  id: string;
  title: string;
  category_id: string;
  date: string;
  earned_points: number;
  total_points: number;
  extra_credit: boolean;
  status: 'graded' | 'pending' | 'missing';
  is_hypothetical: boolean;
}

interface EditAssignmentModalProps {
  assignment: Assignment;
  categories: Category[];
  onClose: () => void;
  onUpdate: (assignmentId: string, data: any) => void;
}

export function EditAssignmentModal({
  assignment,
  categories,
  onClose,
  onUpdate,
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState(assignment.title);
  const [categoryId, setCategoryId] = useState(assignment.category_id);
  const [date, setDate] = useState(assignment.date);
  const [earnedPoints, setEarnedPoints] = useState(assignment.earned_points.toString());
  const [totalPoints, setTotalPoints] = useState(assignment.total_points.toString());
  const [extraCredit, setExtraCredit] = useState(assignment.extra_credit);
  const [status, setStatus] = useState<'graded' | 'pending' | 'missing'>(assignment.status);
  const [isHypothetical, setIsHypothetical] = useState(assignment.is_hypothetical);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(assignment.title);
    setCategoryId(assignment.category_id);
    setDate(assignment.date);
    setEarnedPoints(assignment.earned_points.toString());
    setTotalPoints(assignment.total_points.toString());
    setExtraCredit(assignment.extra_credit);
    setStatus(assignment.status);
    setIsHypothetical(assignment.is_hypothetical);
  }, [assignment]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await onUpdate(assignment.id, {
        title,
        category_id: categoryId,
        date,
        earned_points: parseFloat(earnedPoints) || 0,
        total_points: parseFloat(totalPoints) || 0,
        extra_credit: extraCredit,
        status,
        is_hypothetical: isHypothetical,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Assignment</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Homework 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Earned Points *
              </label>
              <input
                type="number"
                step="0.01"
                value={earnedPoints}
                onChange={(e) => setEarnedPoints(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="18"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Points *
              </label>
              <input
                type="number"
                step="0.01"
                value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="graded">Graded</option>
              <option value="pending">Pending</option>
              <option value="missing">Missing</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="extraCredit"
                checked={extraCredit}
                onChange={(e) => setExtraCredit(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="extraCredit" className="text-sm text-gray-700">
                Extra Credit
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHypothetical"
                checked={isHypothetical}
                onChange={(e) => setIsHypothetical(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isHypothetical" className="text-sm text-gray-700">
                Mark as Hypothetical
              </label>
            </div>
          </div>

          {isHypothetical && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                Hypothetical assignments appear in your list but don't affect your grade calculations.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
