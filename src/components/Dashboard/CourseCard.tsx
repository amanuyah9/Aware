import { BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    teacher: string | null;
    term: string | null;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <a
      href={`#/course/${course.id}`}
      className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <BookOpen className="w-6 h-6 text-blue-600" />
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
  );
}
