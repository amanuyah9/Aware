import { useState, useRef, useEffect } from 'react';
import { BookOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    teacher: string | null;
    term: string | null;
  };
  onEdit: (course: CourseCardProps['course']) => void;
  onDelete: (courseId: string) => void;
}

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onEdit(course);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onDelete(course.id);
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-200 hover:border-blue-300">
      <a
        href={`#/course/${course.id}`}
        className="block p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div ref={menuRef} className="relative">
            <button
              onClick={handleMenuClick}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Course
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
        {course.teacher && (
          <p className="text-sm text-gray-600 mb-1">{course.teacher}</p>
        )}
        {course.term && (
          <p className="text-xs text-gray-500">{course.term}</p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Grade</span>
            <span className="text-lg font-bold text-gray-900">--</span>
          </div>
        </div>
      </a>
    </div>
  );
}
