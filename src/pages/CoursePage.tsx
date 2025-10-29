import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Calculator, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateCourseGrade, Assignment, Category } from '../lib/gradeCalculator';
import { AddAssignmentModal } from '../components/Course/AddAssignmentModal';
import { EditAssignmentModal } from '../components/Course/EditAssignmentModal';
import { AssignmentList } from '../components/Course/AssignmentList';
import { WhatIfModal } from '../components/Course/WhatIfModal';

interface Course {
  id: string;
  title: string;
  teacher: string | null;
  term: string | null;
  grading_model: string;
  categories: any;
}

export function CoursePage({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    fetchAssignments();
  }, [courseId]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (data) {
      setCourse(data);
    }
  };

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('date', { ascending: false });

    if (data) {
      setAssignments(data);
    }
    setLoading(false);
  };

  const handleAddAssignment = async (assignmentData: any) => {
    if (!user || !course) {
      alert('You must be logged in to add assignments');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            ...assignmentData,
            course_id: courseId,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding assignment:', error);
        alert(`Failed to add assignment: ${error.message}`);
        return;
      }

      if (data) {
        setAssignments([data, ...assignments]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Unexpected error adding assignment:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowEditModal(true);
  };

  const handleUpdateAssignment = async (assignmentId: string, data: any) => {
    if (!user) {
      alert('You must be logged in to update assignments');
      return;
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .update(data)
        .eq('id', assignmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating assignment:', error);
        alert(`Failed to update assignment: ${error.message}`);
        return;
      }

      setAssignments(
        assignments.map((a) => (a.id === assignmentId ? { ...a, ...data } : a))
      );
      setShowEditModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error('Unexpected error updating assignment:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!user) {
      alert('You must be logged in to delete assignments');
      return;
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting assignment:', error);
        alert(`Failed to delete assignment: ${error.message}`);
        return;
      }

      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error('Unexpected error deleting assignment:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleSaveHypothetical = async (assignmentData: {
    title: string;
    category_id: string;
    earned_points: number;
    total_points: number;
  }) => {
    if (!user || !course) {
      alert('You must be logged in to save hypothetical assignments');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            ...assignmentData,
            course_id: courseId,
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            extra_credit: false,
            is_hypothetical: true,
            status: 'graded',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving hypothetical assignment:', error);
        alert(`Failed to save hypothetical assignment: ${error.message}`);
        return;
      }

      if (data) {
        setAssignments([data, ...assignments]);
      }
    } catch (err) {
      console.error('Unexpected error saving hypothetical assignment:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories: Category[] = Array.isArray(course.categories) ? course.categories : [];
  const gradeResult = calculateCourseGrade(
    assignments,
    categories,
    course.grading_model as 'weighted' | 'points',
    true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a
              href="#/"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </a>
            <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {gradeResult.finalPercentage.toFixed(2)}%
              </h2>
              <p className="text-lg text-gray-600">
                Current Grade: <span className="font-semibold">{gradeResult.letterGrade}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWhatIfModal(true)}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
              >
                <Calculator className="w-4 h-4 mr-2" />
                What-If
              </button>
              <button className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition">
                <TrendingUp className="w-4 h-4 mr-2" />
                Insights
              </button>
            </div>
          </div>

          {course.grading_model === 'weighted' && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {gradeResult.categories.map((cat) => (
                <div key={cat.categoryId} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">{cat.categoryName}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {cat.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {cat.assignmentCount} assignment{cat.assignmentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Assignments</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </button>
          </div>

          <AssignmentList
            assignments={assignments}
            categories={categories}
            onEdit={handleEditAssignment}
            onDelete={handleDeleteAssignment}
          />
        </div>
      </main>

      {showAddModal && (
        <AddAssignmentModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAssignment}
        />
      )}

      {showEditModal && selectedAssignment && (
        <EditAssignmentModal
          assignment={selectedAssignment}
          categories={categories}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAssignment(null);
          }}
          onUpdate={handleUpdateAssignment}
        />
      )}

      {showWhatIfModal && (
        <WhatIfModal
          currentAssignments={assignments}
          categories={categories}
          gradingModel={course.grading_model as 'weighted' | 'points'}
          onClose={() => setShowWhatIfModal(false)}
          onSaveHypothetical={handleSaveHypothetical}
        />
      )}
    </div>
  );
}
