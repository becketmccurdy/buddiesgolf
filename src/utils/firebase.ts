import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

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

// Round types
export interface Round {
  id?: string;
  course: string;
  date: string;
  location?: {
    lat: number;
    lng: number;
  };
  players: string[];
  scores: {
    uid: string;
    holes: number[];
  }[];
  winner?: string;
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
