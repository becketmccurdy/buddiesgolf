import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const phoneProvider = new PhoneAuthProvider(auth);

// Export RecaptchaVerifier for phone auth
export { RecaptchaVerifier };

// User types
export interface User {
  uid: string;
  name: string;
  photoURL?: string;
  homeCourse?: string;
  handicap?: number;
  stats: {
    wins: number;
    birdies: number;
    bestScore: number;
    averageScore: number;
    roundsPlayed: number;
  };
}

// Course types
export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Course {
  id?: string;
  name: string;
  location: Location;
  holes: number;
  par: number;
  rating?: number;
  slope?: number;
  amenities?: string[];
  phone?: string;
  website?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
}

// Round types
export interface Round {
  id?: string;
  courseId: string;
  courseName: string;
  course: Course | string; // Full course data or just the name for backward compatibility
  date: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  players: string[];
  scores: {
    uid: string;
    holes: number[];
  }[];
  winner?: string;
  holeCount: number;
  par: number;
  createdAt: Date;
}

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Phone sign-in error:', error);
    throw error;
  }
};

// User functions
export const createUser = async (userData: Omit<User, 'uid'>) => {
  const userRef = doc(db, 'users', auth.currentUser!.uid);
  await setDoc(userRef, {
    ...userData,
    handicap: userData.handicap || null, // Fix undefined handicap issue
    stats: {
      wins: 0,
      birdies: 0,
      bestScore: 999,
      averageScore: 0,
      roundsPlayed: 0
    }
  });
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as User;
  }
  return null;
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  
  return usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
};

// Course functions
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> => {
  try {
    console.log('1. Starting createCourse with data:', JSON.stringify(courseData, null, 2));
    console.log('2. User ID:', userId);
    
    if (!userId) {
      throw new Error('User ID is required to create a course');
    }
    
    // Ensure required fields are present
    const requiredFields = ['name', 'location', 'holes', 'par'];
    const missingFields = requiredFields.filter(field => !(field in courseData));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Prepare course data with timestamps
    const courseWithTimestamps = {
      ...courseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      // Ensure these fields have default values if not provided
      isPublic: courseData.isPublic || false,
      amenities: courseData.amenities || [],
      rating: courseData.rating || 0,
      slope: courseData.slope || 0
    };
    
    console.log('3. Course data with timestamps:', JSON.stringify(courseWithTimestamps, null, 2));
    
    // Add the course to Firestore
    const courseRef = await addDoc(collection(db, 'courses'), courseWithTimestamps);
    
    if (!courseRef.id) {
      throw new Error('Failed to get course ID after creation');
    }
    
    console.log('4. Course created successfully with ID:', courseRef.id);
    return courseRef.id;
  } catch (error) {
    console.error('Error in createCourse:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      courseData: JSON.stringify(courseData, null, 2),
      userId
    });
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  
  if (courseSnap.exists()) {
    return { id: courseId, ...courseSnap.data() } as Course;
  }
  return null;
};

export const getCourses = async (options: {
  limit?: number;
  userId?: string;
  searchTerm?: string;
} = {}): Promise<Course[]> => {
  let q = query(collection(db, 'courses'));
  
  if (options.userId) {
    q = query(q, where('createdBy', '==', options.userId));
  } else {
    q = query(q, where('isPublic', '==', true));
  }
  
  if (options.searchTerm) {
    // Note: This is a simple contains query. For production, consider using Algolia or similar
    // for better search capabilities
    q = query(q, where('name', '>=', options.searchTerm));
    q = query(q, where('name', '<=', options.searchTerm + '\uf8ff'));
  }
  
  q = query(q, orderBy('name'));
  
  if (options.limit) {
    q = query(q, limit(options.limit));
  }
  
  const coursesSnap = await getDocs(q);
  return coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

export const updateCourse = async (courseId: string, updates: Partial<Course>) => {
  console.log('Firebase: Updating course:', courseId, 'with data:', updates);
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    console.log('Firebase: Update data with timestamp:', updateData);
    
    const courseRef = doc(db, 'courses', courseId);
    console.log('Firebase: Course reference:', courseRef.path);
    
    await updateDoc(courseRef, updateData);
    console.log('Firebase: Course updated successfully');
  } catch (error) {
    console.error('Firebase: Error updating course:', error);
    throw new Error(`Failed to update course: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteCourse = async (courseId: string) => {
  const courseRef = doc(db, 'courses', courseId);
  await deleteDoc(courseRef);
};

// Round functions
export const createRound = async (roundData: Omit<Round, 'id' | 'createdAt'>) => {
  const roundRef = await addDoc(collection(db, 'rounds'), {
    ...roundData,
    createdAt: new Date()
  });
  return roundRef.id;
};

export const getRound = async (roundId: string): Promise<Round | null> => {
  const roundRef = doc(db, 'rounds', roundId);
  const roundSnap = await getDoc(roundRef);
  
  if (roundSnap.exists()) {
    return { id: roundId, ...roundSnap.data() } as Round;
  }
  return null;
};

export const getRounds = async (limitCount: number = 10): Promise<Round[]> => {
  const roundsRef = collection(db, 'rounds');
  const q = query(roundsRef, orderBy('date', 'desc'), limit(limitCount));
  const roundsSnap = await getDocs(q);
  
  return roundsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Round);
};

export const getUserRounds = async (uid: string): Promise<Round[]> => {
  const roundsRef = collection(db, 'rounds');
  const q = query(roundsRef, where('players', 'array-contains', uid), orderBy('date', 'desc'));
  const roundsSnap = await getDocs(q);
  
  return roundsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Round);
};

export const updateRound = async (roundId: string, updates: Partial<Round>) => {
  const roundRef = doc(db, 'rounds', roundId);
  await updateDoc(roundRef, updates);
};

export const deleteRound = async (roundId: string) => {
  const roundRef = doc(db, 'rounds', roundId);
  await deleteDoc(roundRef);
};
