import { ArrowLeft, TrendingUp } from 'lucide-react';

export function InsightsPage({ courseId }: { courseId: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a
              href={`#/course/${courseId}`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Course
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-green-100 p-6 rounded-2xl mb-6">
            <TrendingUp className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Insights</h1>
          <p className="text-lg text-gray-600 mb-8">
            Get AI-powered predictions and personalized suggestions for your grades
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features Coming Soon:</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">📊</span>
                <span>Grade predictions based on current performance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💡</span>
                <span>Personalized study suggestions from AI</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📈</span>
                <span>Performance trends and momentum analysis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎯</span>
                <span>Target scores needed for desired final grade</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>To enable:</strong> Deploy the generate-insights Edge Function and set OPENAI_API_KEY in your Supabase secrets.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <a
              href={`#/course/${courseId}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Back to Course
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
