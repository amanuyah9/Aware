import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ScanPreview } from '../components/Scan/ScanPreview';

interface ScanData {
  courseTitle?: string;
  teacher?: string;
  term?: string;
  gradingModel?: 'weighted' | 'points';
  categories?: Array<{ id?: string; name: string; weight: number; dropLowest?: number; confidence?: number }>;
  assignments?: Array<{
    title: string;
    earnedPoints: number;
    totalPoints: number;
    category?: string;
    date?: string;
    confidence?: number;
  }>;
}

export function ScanPreviewPage() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const scanId = urlParams.get('scanId') || undefined;

  const handleConfirm = async (scanId: string, scanData: ScanData) => {
    if (!user) {
      setError('You must be logged in to create a course');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const courseData = {
        user_id: user.id,
        title: scanData.courseTitle || 'Untitled Course',
        teacher: scanData.teacher || null,
        term: scanData.term || null,
        grading_model: scanData.gradingModel || 'weighted',
        categories: (scanData.categories || []).map((cat) => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '_'),
          name: cat.name,
          weight: cat.weight,
          dropLowest: 0,
        })),
      };

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (courseError) {
        throw new Error(`Failed to create course: ${courseError.message}`);
      }

      if (!course) {
        throw new Error('Course creation returned no data');
      }

      if (scanData.assignments && scanData.assignments.length > 0) {
        const assignmentsData = scanData.assignments.map((assignment) => ({
          course_id: course.id,
          user_id: user.id,
          title: assignment.title,
          category_id:
            assignment.category ||
            (scanData.categories && scanData.categories[0]?.id) ||
            (scanData.categories && scanData.categories[0]?.name.toLowerCase().replace(/\s+/g, '_')) ||
            'general',
          date: assignment.date || new Date().toISOString().split('T')[0],
          earned_points: assignment.earnedPoints,
          total_points: assignment.totalPoints,
          extra_credit: false,
          is_hypothetical: false,
          status: 'graded',
          source_scan_id: scanId,
        }));

        const { error: assignmentsError } = await supabase
          .from('assignments')
          .insert(assignmentsData);

        if (assignmentsError) {
          console.error('Error creating assignments:', assignmentsError);
        }
      }

      const { error: linkError } = await supabase
        .from('scans')
        .update({ merged_course_id: course.id })
        .eq('id', scanId);

      if (linkError) {
        console.error('Error linking scan to course:', linkError);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.hash = `#/course/${course.id}`;
      }, 2000);
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </a>
            <h1 className="text-lg font-semibold text-gray-900">Review Scan Results</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-green-900">Course Created Successfully!</h3>
              <p className="text-sm text-green-700">Redirecting to your new course...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-medium text-red-900 mb-2">Error Creating Course</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {creating && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-900 font-medium">Creating your course...</p>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review AI Extracted Data</h1>
          <p className="text-gray-600">
            Review the information extracted from your scan. Edit any fields as needed before
            confirming.
          </p>
        </div>

        <ScanPreview scanId={scanId} onConfirm={handleConfirm} />
      </main>
    </div>
  );
}
