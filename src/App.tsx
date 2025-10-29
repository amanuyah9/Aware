import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
import { ForgotPasswordForm } from './components/Auth/ForgotPasswordForm';
import { Dashboard } from './pages/Dashboard';
import { CoursePage } from './pages/CoursePage';
import { ScanPage } from './pages/ScanPage';
import { ScanPreviewPage } from './pages/ScanPreviewPage';
import { InsightsPage } from './pages/InsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { BillingPage } from './pages/BillingPage';
import { AdminPage } from './pages/AdminPage';
import { GraduationCap } from 'lucide-react';

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl shadow-md mb-4">
            <GraduationCap className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Aware</h1>
          <p className="text-gray-600">Smart Grade Calculator</p>
        </div>

        {mode === 'login' && (
          <LoginForm
            onToggleMode={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        )}
        {mode === 'signup' && <SignUpForm onToggleMode={() => setMode('login')} />}
        {mode === 'forgot' && <ForgotPasswordForm onBack={() => setMode('login')} />}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const courseMatch = route.match(/#\/course\/([^/]+)$/);
  if (courseMatch) {
    return <CoursePage courseId={courseMatch[1]} />;
  }

  const insightsMatch = route.match(/#\/insights\/(.+)/);
  if (insightsMatch) {
    return <InsightsPage courseId={insightsMatch[1]} />;
  }

  if (route === '#/scan') {
    return <ScanPage />;
  }

  if (route.startsWith('#/scan-preview')) {
    return <ScanPreviewPage />;
  }

  if (route === '#/history') {
    return <HistoryPage />;
  }

  if (route === '#/settings') {
    return <SettingsPage />;
  }

  if (route === '#/billing') {
    return <BillingPage />;
  }

  if (route === '#/admin') {
    return <AdminPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
