import { useEffect, useState } from 'react';
import { Plus, GraduationCap, Camera, History, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CourseCard } from '../components/Dashboard/CourseCard';
import { CreateCourseModal } from '../components/Dashboard/CreateCourseModal';

interface Course {
  id: string;
  title: string;
  teacher: string | null;
  term: string | null;
  grading_model: string;
  categories: any;
}

interface Subscription {
  plan: string;
  courses_limit: number;
  scans_used_this_month: number;
  scans_limit: number;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchSubscription();
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
      } else if (data) {
        setCourses(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      } else if (data) {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching subscription:', err);
    }
  };

  const handleCreateCourse = async (courseData: any) => {
    if (!user) {
      alert('You must be logged in to create a course');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating course:', error);
        alert(`Failed to create course: ${error.message}`);
        return;
      }

      if (data) {
        setCourses([data, ...courses]);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const canCreateCourse = subscription ? courses.length < subscription.courses_limit : false;

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
          <div className="flex justify-between items-center h-16">
            <a href="#/" className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Aware</span>
            </a>

            <div className="flex items-center space-x-4">
              <a href="#/scan" className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition" title="Scan Syllabus">
                <Camera className="w-5 h-5" />
              </a>
              <a href="#/history" className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition" title="History">
                <History className="w-5 h-5" />
              </a>
              <a href="#/settings" className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition" title="Settings">
                <SettingsIcon className="w-5 h-5" />
              </a>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">
            {subscription?.plan === 'free' && (
              <span>
                {courses.length} / {subscription.courses_limit} courses used
              </span>
            )}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">Create your first course to start tracking grades</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Course
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {canCreateCourse && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-600 hover:bg-blue-50 transition group"
              >
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
                <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                  Add Another Course
                </span>
              </button>
            )}

            {!canCreateCourse && subscription?.plan === 'free' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                <p className="text-blue-900 font-medium mb-2">
                  Course limit reached
                </p>
                <p className="text-blue-700 text-sm mb-4">
                  Upgrade to premium to add unlimited courses
                </p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                  Upgrade Now
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCourse}
        />
      )}
    </div>
  );
}
