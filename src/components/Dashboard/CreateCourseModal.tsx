import { useState, FormEvent } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  weight: number;
  dropLowest?: number;
}

interface CreateCourseModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

export function CreateCourseModal({ onClose, onCreate }: CreateCourseModalProps) {
  const [title, setTitle] = useState('');
  const [teacher, setTeacher] = useState('');
  const [term, setTerm] = useState('');
  const [gradingModel, setGradingModel] = useState<'weighted' | 'points'>('weighted');
  const [categories, setCategories] = useState<Category[]>([
    { id: 'homework', name: 'Homework', weight: 30 },
    { id: 'exams', name: 'Exams', weight: 70 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    if (gradingModel === 'weighted' && totalWeight !== 100) {
      alert('Category weights must total 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        title,
        teacher: teacher || null,
        term: term || null,
        grading_model: gradingModel,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: cat.weight,
          dropLowest: cat.dropLowest || 0,
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      { id: `cat_${Date.now()}`, name: '', weight: 0 },
    ]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Calculus I"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
              </label>
              <input
                type="text"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Mrs. Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Fall 2025"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grading Model *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="weighted"
                  checked={gradingModel === 'weighted'}
                  onChange={(e) => setGradingModel(e.target.value as 'weighted')}
                  className="mr-2"
                />
                <span>Weighted Categories</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="points"
                  checked={gradingModel === 'points'}
                  onChange={(e) => setGradingModel(e.target.value as 'points')}
                  className="mr-2"
                />
                <span>Total Points</span>
              </label>
            </div>
          </div>

          {gradingModel === 'weighted' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Categories *
                </label>
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Category
                </button>
              </div>

              <div className="space-y-3">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(index, 'name', e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Category name"
                    />
                    <input
                      type="number"
                      value={category.weight}
                      onChange={(e) => updateCategory(index, 'weight', Number(e.target.value))}
                      required
                      min="0"
                      max="100"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="%"
                    />
                    <span className="text-gray-600">%</span>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Total: {categories.reduce((sum, cat) => sum + cat.weight, 0)}%
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
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
