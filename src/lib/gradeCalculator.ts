export interface Category {
  id: string;
  name: string;
  weight: number;
  dropLowest?: number;
}

export interface Assignment {
  id: string;
  title: string;
  category_id: string;
  earned_points: number;
  total_points: number;
  extra_credit: boolean;
  status: string;
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  weight: number;
  earned: number;
  possible: number;
  percentage: number;
  contribution: number;
  assignmentCount: number;
}

export interface GradeResult {
  finalPercentage: number;
  letterGrade: string;
  categories: CategoryResult[];
  totalEarned: number;
  totalPossible: number;
  isRescaled: boolean;
}

export interface GradeScale {
  label: string;
  min: number;
}

const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { label: 'A', min: 90 },
  { label: 'B', min: 80 },
  { label: 'C', min: 70 },
  { label: 'D', min: 60 },
  { label: 'F', min: 0 },
];

export function calculateCategoryGrade(
  assignments: Assignment[],
  category: Category
): { earned: number; possible: number; percentage: number } {
  const gradedAssignments = assignments.filter(
    (a) => a.category_id === category.id && a.status === 'graded'
  );

  if (gradedAssignments.length === 0) {
    return { earned: 0, possible: 0, percentage: 0 };
  }

  let sortedAssignments = [...gradedAssignments];

  if (category.dropLowest && category.dropLowest > 0) {
    sortedAssignments = sortedAssignments
      .filter((a) => !a.extra_credit)
      .sort((a, b) => {
        const percentA = a.total_points > 0 ? (a.earned_points / a.total_points) : 0;
        const percentB = b.total_points > 0 ? (b.earned_points / b.total_points) : 0;
        return percentA - percentB;
      });

    const dropCount = Math.min(category.dropLowest, sortedAssignments.length - 1);
    sortedAssignments = sortedAssignments.slice(dropCount);

    const extraCreditAssignments = gradedAssignments.filter((a) => a.extra_credit);
    sortedAssignments = [...sortedAssignments, ...extraCreditAssignments];
  }

  let totalEarned = 0;
  let totalPossible = 0;

  sortedAssignments.forEach((assignment) => {
    if (assignment.extra_credit) {
      totalEarned += assignment.earned_points;
    } else {
      totalEarned += assignment.earned_points;
      totalPossible += assignment.total_points;
    }
  });

  const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

  return {
    earned: totalEarned,
    possible: totalPossible,
    percentage: Math.min(percentage, 100),
  };
}

export function calculateCourseGrade(
  assignments: Assignment[],
  categories: Category[],
  gradingModel: 'weighted' | 'points' = 'weighted',
  rescaleMode: boolean = true
): GradeResult {
  if (gradingModel === 'points') {
    const totalEarned = assignments
      .filter((a) => a.status === 'graded')
      .reduce((sum, a) => sum + a.earned_points, 0);
    const totalPossible = assignments
      .filter((a) => a.status === 'graded' && !a.extra_credit)
      .reduce((sum, a) => sum + a.total_points, 0);

    const finalPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

    return {
      finalPercentage: Math.min(finalPercentage, 100),
      letterGrade: getLetterGrade(finalPercentage),
      categories: [],
      totalEarned,
      totalPossible,
      isRescaled: false,
    };
  }

  const categoryResults: CategoryResult[] = [];
  let totalWeight = 0;
  let finalPercentage = 0;

  categories.forEach((category) => {
    const { earned, possible, percentage } = calculateCategoryGrade(assignments, category);
    const hasGradedAssignments = assignments.some(
      (a) => a.category_id === category.id && a.status === 'graded'
    );

    if (rescaleMode && !hasGradedAssignments) {
      return;
    }

    const contribution = (percentage * category.weight) / 100;

    categoryResults.push({
      categoryId: category.id,
      categoryName: category.name,
      weight: category.weight,
      earned,
      possible,
      percentage,
      contribution,
      assignmentCount: assignments.filter(
        (a) => a.category_id === category.id && a.status === 'graded'
      ).length,
    });

    totalWeight += category.weight;
    finalPercentage += contribution;
  });

  if (rescaleMode && totalWeight < 100 && totalWeight > 0) {
    const scaleFactor = 100 / totalWeight;
    finalPercentage = finalPercentage * scaleFactor;
    categoryResults.forEach((result) => {
      result.weight = result.weight * scaleFactor;
      result.contribution = result.contribution * scaleFactor;
    });
  }

  return {
    finalPercentage: Math.min(finalPercentage, 100),
    letterGrade: getLetterGrade(finalPercentage),
    categories: categoryResults,
    totalEarned: categoryResults.reduce((sum, c) => sum + c.earned, 0),
    totalPossible: categoryResults.reduce((sum, c) => sum + c.possible, 0),
    isRescaled: rescaleMode && totalWeight < 100,
  };
}

export function getLetterGrade(percentage: number, gradeScale: GradeScale[] = DEFAULT_GRADE_SCALE): string {
  const sortedScale = [...gradeScale].sort((a, b) => b.min - a.min);
  for (const grade of sortedScale) {
    if (percentage >= grade.min) {
      return grade.label;
    }
  }
  return gradeScale[gradeScale.length - 1]?.label || 'F';
}

export function calculateWhatIf(
  currentAssignments: Assignment[],
  hypotheticalAssignments: Partial<Assignment>[],
  categories: Category[],
  gradingModel: 'weighted' | 'points' = 'weighted',
  rescaleMode: boolean = true
): GradeResult {
  const whatIfAssignments: Assignment[] = [
    ...currentAssignments,
    ...hypotheticalAssignments.map((h, index) => ({
      id: `whatif-${index}`,
      title: h.title || 'What-If Assignment',
      category_id: h.category_id || '',
      earned_points: h.earned_points || 0,
      total_points: h.total_points || 0,
      extra_credit: h.extra_credit || false,
      status: 'graded',
    })),
  ];

  return calculateCourseGrade(whatIfAssignments, categories, gradingModel, rescaleMode);
}
