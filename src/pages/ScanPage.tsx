import { useState } from 'react';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const MOCK_MODE = true;

export function ScanPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMockScan = async () => {
    if (!user) {
      alert('You must be logged in to create a scan');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const mockScanData = {
        user_id: user.id,
        image_urls: [],
        ocr_texts: {},
        parsed_parts: {},
        merged: {
          courseTitle: 'Introduction to Biology',
          teacher: 'Dr. Smith',
          term: 'Fall 2025',
          gradingModel: 'weighted',
          categories: [
            { name: 'Homework', weight: 40, confidence: 0.95 },
            { name: 'Exams', weight: 60, confidence: 0.92 },
          ],
          assignments: [
            { name: 'Homework 1', score: 85, total: 100, category: 'homework', confidence: 0.88 },
            { name: 'Homework 2', score: 92, total: 100, category: 'homework', confidence: 0.91 },
            { name: 'Midterm Exam', score: 78, total: 100, category: 'exams', confidence: 0.75 },
            { name: 'Final Exam', score: 88, total: 100, category: 'exams', confidence: 0.89 },
          ],
          confidence: 0.88,
        },
        status: 'complete',
      };

      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert([mockScanData])
        .select()
        .single();

      if (scanError) {
        throw new Error(`Failed to create scan: ${scanError.message}`);
      }

      window.location.hash = `#/scan-preview?scanId=${scan.id}`;
    } catch (err) {
      console.error('Error creating mock scan:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      alert('You must be logged in to upload files');
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (MOCK_MODE) {
      handleMockScan();
      return;
    }

    alert('AI scanning requires OpenAI API key. Using mock mode for now.');
    handleMockScan();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a href="#/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-100 p-6 rounded-2xl mb-6">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Scanning</h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload photos of your syllabus and gradebook to automatically create courses
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {MOCK_MODE && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Mock Mode Active:</strong> Click upload to generate sample scan data for testing.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
            <p className="text-gray-600 mb-6">
              Take photos of your syllabus and gradebook, then upload them here
            </p>

            <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Choose Files
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works:</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2 text-blue-600">1.</span>
                <span>Upload photos of your syllabus showing grading categories and weights</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2 text-blue-600">2.</span>
                <span>Upload photos of your gradebook showing assignment scores</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2 text-blue-600">3.</span>
                <span>AI extracts course info, categories, and assignments automatically</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2 text-blue-600">4.</span>
                <span>Review extracted data and make any needed corrections</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2 text-blue-600">5.</span>
                <span>Confirm to create your course with all grades pre-filled</span>
              </li>
            </ol>
          </div>

          {!MOCK_MODE && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> AI scanning requires an OpenAI API key configured in your
                Supabase Edge Function. Contact your administrator to enable this feature.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
