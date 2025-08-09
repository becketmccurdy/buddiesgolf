import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, createCourse, getCourse, getCourses, updateCourse, deleteCourse } from '../utils/firebase';
import { Timestamp } from 'firebase/firestore';
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
    console.log('1. Starting createNewCourse with data:', JSON.stringify(courseData, null, 2));
    
    if (!currentUser) {
      const errorMsg = 'User must be logged in to create a course';
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('2. Setting up course data with user info');
      const courseWithUserData = {
        ...courseData,
        // Ensure all required fields have values
        name: courseData.name?.trim() || '',
        location: {
          address: courseData.location?.address || '',
          lat: Number(courseData.location?.lat) || 0,
          lng: Number(courseData.location?.lng) || 0,
        },
        holes: Number(courseData.holes) || 18,
        par: Number(courseData.par) || 72,
        // Set default values for optional fields
        rating: courseData.rating ? Number(courseData.rating) : 0,
        slope: courseData.slope ? Number(courseData.slope) : 0,
        amenities: Array.isArray(courseData.amenities) ? courseData.amenities : [],
        // Add user and metadata
        createdBy: currentUser.uid,
        isPublic: false,
      };
      
      console.log('3. Prepared course data for creation:', JSON.stringify(courseWithUserData, null, 2));
      
      try {
        console.log('4. Calling createCourse with user ID:', currentUser.uid);
        const courseId = await createCourse(courseWithUserData, currentUser.uid);
        console.log('5. Course created with ID:', courseId);
        
        if (!courseId) {
          throw new Error('Failed to get course ID after creation');
        }
        
        // Fetch the newly created course to add to the list
        console.log('6. Fetching newly created course...');
        const newCourse = await getCourse(courseId);
        
        if (newCourse) {
          console.log('7. Adding new course to local state');
          setCourses(prev => [newCourse, ...prev]);
        } else {
          console.warn('8. New course was created but could not be fetched');
        }
        
        return courseId;
      } catch (createError) {
        console.error('Error in createCourse call:', {
          error: createError,
          errorMessage: createError instanceof Error ? createError.message : 'Unknown error',
          courseData: courseWithUserData,
          userId: currentUser.uid
        });
        throw createError;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create course';
      console.error('Error in createNewCourse:', {
        error,
        errorMessage: errorMsg,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setError(errorMsg);
      throw new Error(errorMsg);
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
    console.log('1. Starting updateExistingCourse for course:', courseId, 'with updates:', updates);
    try {
      setLoading(true);
      setError(null);
      
      console.log('2. Calling updateCourse with ID:', courseId, 'and updates:', updates);
      await updateCourse(courseId, updates);
      console.log('3. Course updated in database');
      
      // Update the current course if it's the one being updated
      if (currentCourse?.id === courseId) {
        console.log('4. Updating currentCourse in state');
        setCurrentCourse({
          ...currentCourse,
          ...updates,
          updatedAt: Timestamp.now(),
        });
      }
      
      // Update the courses list
      console.log('5. Updating courses list in state');
      setCourses(prevCourses => {
        const updatedCourses = prevCourses.map(course =>
          course.id === courseId
            ? { ...course, ...updates, updatedAt: Timestamp.now() }
            : course
        );
        console.log('6. Updated courses list:', updatedCourses);
        return updatedCourses;
      });
      
      console.log('7. Course update completed successfully');
    } catch (err) {
      const errorMsg = `Error updating course: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMsg);
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
