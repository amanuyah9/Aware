import { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';

export function ScanPage() {
  const [message] = useState('AI Scanning feature - Coming soon with full multi-photo upload');

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
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-blue-100 p-6 rounded-2xl mb-6">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Scanning</h1>
          <p className="text-lg text-gray-600 mb-8">{message}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How it will work:</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Upload multiple photos of your syllabus and gradebook</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>AI will extract grading categories, weights, and assignments</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Review the extracted data and make corrections</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Confirm to automatically create your course and grades</span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>To enable:</strong> Set OPENAI_API_KEY in your Supabase Edge Function secrets and deploy the process-scan function.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <a href="#/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
              Back to Dashboard
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
