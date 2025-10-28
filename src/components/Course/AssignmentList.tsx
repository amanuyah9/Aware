import { Trash2 } from 'lucide-react';
import { Assignment, Category } from '../../lib/gradeCalculator';

interface AssignmentListProps {
  assignments: Assignment[];
  categories: Category[];
  onDelete: (id: string) => void;
}

export function AssignmentList({ assignments, categories, onDelete }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No assignments yet. Add your first assignment to get started.</p>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => {
            const percentage =
              assignment.total_points > 0
                ? (assignment.earned_points / assignment.total_points) * 100
                : 0;
            const gradeColor =
              percentage >= 90
                ? 'text-green-600'
                : percentage >= 80
                ? 'text-blue-600'
                : percentage >= 70
                ? 'text-yellow-600'
                : 'text-red-600';

            return (
              <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{assignment.title}</div>
                  {assignment.extra_credit && (
                    <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Extra Credit
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {getCategoryName(assignment.category_id)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(assignment.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-900">
                  {assignment.earned_points} / {assignment.total_points}
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${gradeColor}`}>
                  {percentage.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onDelete(assignment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
