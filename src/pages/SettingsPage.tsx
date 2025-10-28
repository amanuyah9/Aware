import { useEffect, useState } from 'react';
import { ArrowLeft, Save, CreditCard, User, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Profile {
  display_name: string;
  email: string;
  settings: any;
}

interface Subscription {
  plan: string;
  status: string;
  courses_limit: number;
  scans_limit: number;
  scans_used_this_month: number;
}

export function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setDisplayName(profileData.display_name || '');
    }

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subData) {
      setSubscription(subData);
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
      await fetchData();
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpgrade = () => {
    window.location.hash = '/billing';
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            </div>

            {subscription && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {subscription.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {subscription.status}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.plan === 'premium'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subscription.plan.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Courses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subscription.plan === 'premium' ? '∞' : `${subscription.courses_limit}`}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Scans This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subscription.scans_used_this_month}
                      {subscription.plan === 'free' && ` / ${subscription.scans_limit}`}
                    </p>
                  </div>
                </div>

                {subscription.plan === 'free' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900 font-medium mb-2">Upgrade to Premium</p>
                    <ul className="text-sm text-blue-800 mb-4 space-y-1">
                      <li>• Unlimited courses</li>
                      <li>• Unlimited AI scans</li>
                      <li>• Advanced insights</li>
                      <li>• Priority support</li>
                    </ul>
                    <button
                      onClick={handleUpgrade}
                      className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Bell className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Grade Updates</p>
                  <p className="text-sm text-gray-600">
                    Get notified when grades are added or changed
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">AI Insights</p>
                  <p className="text-sm text-gray-600">
                    Receive weekly AI-powered grade insights
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
