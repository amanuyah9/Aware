import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Category {
  name: string;
  weight: number;
  confidence?: number;
}

interface Assignment {
  name: string;
  score: number;
  total: number;
  category?: string;
  confidence?: number;
}

interface ScanData {
  courseTitle?: string;
  teacher?: string;
  term?: string;
  gradingModel?: 'weighted' | 'points';
  categories?: Category[];
  assignments?: Assignment[];
  confidence?: number;
}

interface Scan {
  id: string;
  merged: ScanData | null;
  ocr_texts: any;
  status: string;
  created_at: string;
}

interface ScanPreviewProps {
  scanId?: string;
  onConfirm: (scanId: string, scanData: ScanData) => void;
}

export function ScanPreview({ scanId, onConfirm }: ScanPreviewProps) {
  const { user } = useAuth();
  const [scan, setScan] = useState<Scan | null>(null);
  const [editedData, setEditedData] = useState<ScanData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    fetchScan();
  }, [scanId, user]);

  const fetchScan = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false });

      if (scanId) {
        query = query.eq('id', scanId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('No completed scans found');
        setLoading(false);
        return;
      }

      setScan(data);
      setEditedData(data.merged || {});
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch scan data');
      setLoading(false);
    }
  };

  const handleFieldEdit = (field: string, value: any) => {
    setEditedData({ ...editedData, [field]: value });
    setEditingField(null);
  };

  const handleCategoryEdit = (index: number, field: string, value: any) => {
    const categories = [...(editedData.categories || [])];
    categories[index] = { ...categories[index], [field]: value };
    setEditedData({ ...editedData, categories });
  };

  const handleAssignmentEdit = (index: number, field: string, value: any) => {
    const assignments = [...(editedData.assignments || [])];
    assignments[index] = { ...assignments[index], [field]: value };
    setEditedData({ ...editedData, assignments });
  };

  const isLowConfidence = (confidence?: number) => {
    return confidence !== undefined && confidence < 0.8;
  };

  const handleConfirm = () => {
    if (scan) {
      onConfirm(scan.id, editedData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Scan</h3>
        <p className="text-red-700">{error || 'No scan data available'}</p>
      </div>
    );
  }

  const overallConfidence = editedData.confidence || 0;
  const hasLowConfidence = overallConfidence < 0.8;

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 ${hasLowConfidence ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
        <div className="flex items-center">
          {hasLowConfidence ? (
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">
              AI Extraction Confidence: {Math.round(overallConfidence * 100)}%
            </h3>
            <p className="text-sm text-gray-600">
              {hasLowConfidence
                ? 'Some fields have low confidence. Please review and edit as needed.'
                : 'All data extracted with high confidence.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Course Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            {editingField === 'courseTitle' ? (
              <input
                type="text"
                value={editedData.courseTitle || ''}
                onChange={(e) => handleFieldEdit('courseTitle', e.target.value)}
                onBlur={() => setEditingField(null)}
                autoFocus
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-900">{editedData.courseTitle || 'Not provided'}</span>
                <button
                  onClick={() => setEditingField('courseTitle')}
                  className="p-1 text-gray-500 hover:text-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
              </label>
              {editingField === 'teacher' ? (
                <input
                  type="text"
                  value={editedData.teacher || ''}
                  onChange={(e) => handleFieldEdit('teacher', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{editedData.teacher || 'Not provided'}</span>
                  <button
                    onClick={() => setEditingField('teacher')}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              {editingField === 'term' ? (
                <input
                  type="text"
                  value={editedData.term || ''}
                  onChange={(e) => handleFieldEdit('term', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{editedData.term || 'Not provided'}</span>
                  <button
                    onClick={() => setEditingField('term')}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grading Model
            </label>
            <select
              value={editedData.gradingModel || 'weighted'}
              onChange={(e) => handleFieldEdit('gradingModel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="weighted">Weighted Categories</option>
              <option value="points">Total Points</option>
            </select>
          </div>
        </div>
      </div>

      {editedData.categories && editedData.categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
          <div className="space-y-3">
            {editedData.categories.map((category, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  isLowConfidence(category.confidence)
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleCategoryEdit(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Category name"
                  />
                  <input
                    type="number"
                    value={category.weight}
                    onChange={(e) => handleCategoryEdit(index, 'weight', Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-gray-600">%</span>
                  {category.confidence !== undefined && (
                    <span className="text-xs text-gray-500">
                      {Math.round(category.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500">
              Total: {editedData.categories.reduce((sum, cat) => sum + cat.weight, 0)}%
            </p>
          </div>
        </div>
      )}

      {editedData.assignments && editedData.assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assignments</h2>
          <div className="space-y-3">
            {editedData.assignments.map((assignment, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  isLowConfidence(assignment.confidence)
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  <input
                    type="text"
                    value={assignment.name}
                    onChange={(e) => handleAssignmentEdit(index, 'name', e.target.value)}
                    className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Assignment name"
                  />
                  <input
                    type="number"
                    value={assignment.score}
                    onChange={(e) => handleAssignmentEdit(index, 'score', Number(e.target.value))}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Score"
                  />
                  <span className="col-span-1 text-center text-gray-600">/</span>
                  <input
                    type="number"
                    value={assignment.total}
                    onChange={(e) => handleAssignmentEdit(index, 'total', Number(e.target.value))}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Total"
                  />
                  <span className="col-span-2 text-sm text-gray-600 text-right">
                    {assignment.confidence !== undefined && `${Math.round(assignment.confidence * 100)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleConfirm}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Confirm & Create Course
        </button>
      </div>
    </div>
  );
}
