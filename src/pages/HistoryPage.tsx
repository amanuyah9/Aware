import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, BookOpen, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

interface Scan {
  id: string;
  status: string;
  image_urls: string[];
  merged: any;
  created_at: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'scans'>('all');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data: auditData } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (auditData) {
      setAuditLog(auditData);
    }

    const { data: scanData } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (scanData) {
      setScans(scanData);
    }

    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scan_confirmed':
        return <Camera className="w-5 h-5 text-blue-600" />;
      case 'course_created':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'grade_added':
      case 'grade_updated':
        return <Edit className="w-5 h-5 text-yellow-600" />;
      case 'grade_deleted':
        return <Trash2 className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Activity History</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => setActiveTab('scans')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'scans'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Scans ({scans.length})
              </button>
            </nav>
          </div>

          {activeTab === 'all' ? (
            <div className="divide-y divide-gray-200">
              {auditLog.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No activity yet. Start by creating a course or scanning a syllabus.
                </div>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">{getActionIcon(entry.action)}</div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {getActionLabel(entry.action)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.entity_type}: {entry.entity_id || 'N/A'}
                        </p>
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(entry.metadata).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scans.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No scans yet. Try scanning a syllabus to get started.
                </div>
              ) : (
                scans.map((scan) => (
                  <div key={scan.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            Scan {scan.id.slice(0, 8)}
                          </h3>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                scan.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : scan.status === 'preview'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : scan.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {scan.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(scan.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {scan.image_urls.length} image{scan.image_urls.length !== 1 ? 's' : ''}
                        </p>
                        {scan.merged && (
                          <div className="mt-2 text-xs text-gray-500">
                            Course: {scan.merged.courseName || 'Unknown'}
                            {scan.merged.assignments && (
                              <span className="ml-4">
                                Assignments: {scan.merged.assignments.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
