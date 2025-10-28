import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Category } from '../../lib/gradeCalculator';

interface AddAssignmentModalProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (data: any) => void;
}

export function AddAssignmentModal({ categories, onClose, onAdd }: AddAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [earnedPoints, setEarnedPoints] = useState('');
  const [totalPoints, setTotalPoints] = useState('');
  const [extraCredit, setExtraCredit] = useState(false);
  const [status, setStatus] = useState<'graded' | 'pending' | 'missing'>('graded');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onAdd({
      title,
      category_id: categoryId,
      date,
      earned_points: parseFloat(earnedPoints) || 0,
      total_points: parseFloat(totalPoints) || 0,
      extra_credit: extraCredit,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="extraCredit"
              checked={extraCredit}
              onChange={(e) => setExtraCredit(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="extraCredit" className="text-sm text-gray-700">
              Extra Credit
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Add Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
