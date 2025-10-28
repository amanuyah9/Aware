import { describe, it, expect } from 'vitest';
import { calculateCourseGrade, Assignment, Category } from './gradeCalculator';

describe('Grade Calculator', () => {
  describe('Test Case 1: Weighted with rescale (HW only)', () => {
    it('should calculate 85.0% when HW is 85% with rescaling', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 30 },
        { id: 'exams', name: 'Exams', weight: 70 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 18,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'HW2',
          category_id: 'hw',
          earned_points: 16,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      expect(result.finalPercentage).toBeCloseTo(85.0, 1);
      expect(result.isRescaled).toBe(true);
    });

    it('should calculate 25.5% contribution without rescaling', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 30 },
        { id: 'exams', name: 'Exams', weight: 70 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 18,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'HW2',
          category_id: 'hw',
          earned_points: 16,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', false);

      expect(result.finalPercentage).toBeCloseTo(25.5, 1);
      expect(result.isRescaled).toBe(false);
    });
  });

  describe('Test Case 2: Weighted with both categories', () => {
    it('should calculate 88.5% when HW is 85% and Exams are 90%', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 30 },
        { id: 'exams', name: 'Exams', weight: 70 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 18,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'HW2',
          category_id: 'hw',
          earned_points: 16,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '3',
          title: 'Exam 1',
          category_id: 'exams',
          earned_points: 45,
          total_points: 50,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      const hwCategory = result.categories.find((c) => c.categoryId === 'hw');
      const examCategory = result.categories.find((c) => c.categoryId === 'exams');

      expect(hwCategory?.percentage).toBeCloseTo(85.0, 1);
      expect(examCategory?.percentage).toBeCloseTo(90.0, 1);
      expect(result.finalPercentage).toBeCloseTo(88.5, 1);
    });
  });

  describe('Test Case 3: Points-based grading', () => {
    it('should calculate 90.0% for 45/50 points', () => {
      const categories: Category[] = [];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'Assignment 1',
          category_id: 'any',
          earned_points: 45,
          total_points: 50,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'points', true);

      expect(result.finalPercentage).toBeCloseTo(90.0, 1);
    });
  });

  describe('Extra Credit Handling', () => {
    it('should add extra credit to earned but not total points', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 20,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'Extra Credit',
          category_id: 'hw',
          earned_points: 5,
          total_points: 5,
          extra_credit: true,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      const hwCategory = result.categories.find((c) => c.categoryId === 'hw');
      expect(hwCategory?.earned).toBe(25);
      expect(hwCategory?.possible).toBe(20);
      expect(hwCategory?.percentage).toBeCloseTo(100, 0);
    });
  });

  describe('Drop Lowest', () => {
    it('should drop the lowest assignment when configured', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100, dropLowest: 1 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 20,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'HW2',
          category_id: 'hw',
          earned_points: 15,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '3',
          title: 'HW3',
          category_id: 'hw',
          earned_points: 10,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      const hwCategory = result.categories.find((c) => c.categoryId === 'hw');
      expect(hwCategory?.earned).toBe(35);
      expect(hwCategory?.possible).toBe(40);
      expect(hwCategory?.percentage).toBeCloseTo(87.5, 1);
    });
  });

  describe('Letter Grade Assignment', () => {
    it('should assign correct letter grades', () => {
      const categories: Category[] = [{ id: 'test', name: 'Test', weight: 100 }];

      const testGrade = (earned: number, expected: string) => {
        const assignments: Assignment[] = [
          {
            id: '1',
            title: 'Test',
            category_id: 'test',
            earned_points: earned,
            total_points: 100,
            extra_credit: false,
            status: 'graded',
          },
        ];

        const result = calculateCourseGrade(assignments, categories, 'weighted', true);
        expect(result.letterGrade).toBe(expected);
      };

      testGrade(95, 'A');
      testGrade(85, 'B');
      testGrade(75, 'C');
      testGrade(65, 'D');
      testGrade(55, 'F');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty assignments', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100 },
      ];

      const result = calculateCourseGrade([], categories, 'weighted', true);

      expect(result.finalPercentage).toBe(0);
      expect(result.letterGrade).toBe('F');
    });

    it('should handle only pending assignments', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 0,
          total_points: 20,
          extra_credit: false,
          status: 'pending',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      expect(result.finalPercentage).toBe(0);
    });

    it('should handle perfect scores', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 20,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      expect(result.finalPercentage).toBe(100);
      expect(result.letterGrade).toBe('A');
    });

    it('should cap percentage at 100% even with extra credit', () => {
      const categories: Category[] = [
        { id: 'hw', name: 'Homework', weight: 100 },
      ];

      const assignments: Assignment[] = [
        {
          id: '1',
          title: 'HW1',
          category_id: 'hw',
          earned_points: 20,
          total_points: 20,
          extra_credit: false,
          status: 'graded',
        },
        {
          id: '2',
          title: 'Extra',
          category_id: 'hw',
          earned_points: 10,
          total_points: 10,
          extra_credit: true,
          status: 'graded',
        },
      ];

      const result = calculateCourseGrade(assignments, categories, 'weighted', true);

      const hwCategory = result.categories.find((c) => c.categoryId === 'hw');
      expect(hwCategory?.percentage).toBe(100);
    });
  });
});
