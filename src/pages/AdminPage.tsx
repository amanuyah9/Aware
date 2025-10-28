import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserRecord {
  id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  subscription: {
    plan: string;
    status: string;
  } | null;
}

interface ScanStats {
  total: number;
  confirmed: number;
  failed: number;
  avgConfidence: number;
}

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    const adminEmails = ['admin@aware.com', user.email];

    if (adminEmails.includes(user.email || '')) {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesData) {
      const usersWithSubs = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', profile.id)
            .single();

          return {
            ...profile,
            subscription: subData || null,
          };
        })
      );

      setUsers(usersWithSubs);
    }

    const { data: scansData } = await supabase
      .from('scans')
      .select('status, merged');

    if (scansData) {
      const confirmed = scansData.filter((s) => s.status === 'confirmed').length;
      const failed = scansData.filter((s) => s.status === 'failed').length;
      const confidences = scansData
        .filter((s) => s.merged?.overallConfidence)
        .map((s) => s.merged.overallConfidence);

      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
          : 0;

      setScanStats({
        total: scansData.length,
        confirmed,
        failed,
        avgConfidence,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin console.
          </p>
          <a
            href="#/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </a>
        </div>
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
            <div className="ml-auto">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Console</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>

          {scanStats && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">{scanStats.total}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Confirmed Scans</p>
                <p className="text-3xl font-bold text-gray-900">{scanStats.confirmed}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(scanStats.avgConfidence * 100).toFixed(0)}%
                </p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Plan
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Joined
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((userRecord) => (
                  <tr key={userRecord.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900">
                        {userRecord.display_name || 'No name'}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">{userRecord.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userRecord.subscription?.plan === 'premium'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {userRecord.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userRecord.subscription?.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {userRecord.subscription?.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">
                        {new Date(userRecord.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
