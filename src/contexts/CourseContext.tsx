import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, createCourse, getCourse, getCourses, updateCourse, deleteCourse } from '../utils/firebase';
import { useAuth } from './AuthContext';

interface CourseContextType {
  courses: Course[];
  currentCourse: Course | null;
  loading: boolean;
  error: string | null;
  createNewCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isPublic'>) => Promise<string>;
  fetchCourse: (courseId: string) => Promise<Course | null>;
  fetchUserCourses: (userId: string) => Promise<void>;
  updateExistingCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  removeCourse: (courseId: string) => Promise<void>;
  searchCourses: (searchTerm: string) => Promise<Course[]>;
  clearError: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const clearError = () => setError(null);

  const createNewCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isPublic'>) => {
    if (!currentUser) {
      throw new Error('User must be logged in to create a course');
    }

    try {
      setLoading(true);
      const courseWithUserData = {
        ...courseData,
        createdBy: currentUser.uid,
        isPublic: false,
      };
      const courseId = await createCourse(courseWithUserData, currentUser.uid);
      
      // Refresh the courses list
      if (currentUser) {
        await fetchUserCourses(currentUser.uid);
      }
      
      return courseId;
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const course = await getCourse(courseId);
      setCurrentCourse(course);
      return course;
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCourses = async (userId: string) => {
    try {
      setLoading(true);
      const userCourses = await getCourses({ userId });
      setCourses(userCourses);
    } catch (err) {
      console.error('Error fetching user courses:', err);
      setError('Failed to load your courses. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExistingCourse = async (courseId: string, updates: Partial<Course>) => {
    try {
      setLoading(true);
      await updateCourse(courseId, updates);
      
      // Update the current course if it's the one being updated
      if (currentCourse?.id === courseId) {
        setCurrentCourse({
          ...currentCourse,
          ...updates,
          updatedAt: new Date(),
        });
      }
      
      // Update the courses list
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId
            ? { ...course, ...updates, updatedAt: new Date() }
            : course
        )
      );
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeCourse = async (courseId: string) => {
    try {
      setLoading(true);
      await deleteCourse(courseId);
      
      // Update the courses list
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      // Clear current course if it's the one being deleted
      if (currentCourse?.id === courseId) {
        setCurrentCourse(null);
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchCourses = async (searchTerm: string) => {
    try {
      setLoading(true);
      const userId = currentUser?.uid;
      const results = await getCourses({
        searchTerm,
        userId,
      });
      return results;
    } catch (err) {
      console.error('Error searching courses:', err);
      setError('Failed to search courses. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load user's courses when the provider mounts
  useEffect(() => {
    if (currentUser) {
      fetchUserCourses(currentUser.uid).catch(console.error);
    }
  }, [currentUser]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        currentCourse,
        loading,
        error,
        createNewCourse,
        fetchCourse,
        fetchUserCourses,
        updateExistingCourse,
        removeCourse,
        searchCourses,
        clearError,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};

export default CourseContext;
