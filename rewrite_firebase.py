import os

code = """
import { request } from './api';
import {
  SectionSlug, ContentBase, Course, Tool, Book, Experience, Idea, Event, BlogPost,
  Comment, Submission, SavedCanvas, PointEntry, PointTransaction, User, Category,
  SectionMeta, Paginated, ContactMessage, EventRegistration
} from '../types';
import { mockDb, paginateArray, SECTION_LIST } from '../mocks';
import { ACADEMY_CATEGORIES, TOOLBOX_STAGES, JOURNEY_FIELDS } from '../config/categories';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';

export async function requestOtp(phone: string): Promise<{ expiresInSeconds: number }> {
  return { expiresInSeconds: 120 };
}

export async function verifyOtp(phone: string, code: string): Promise<{ token: string; user: User }> {
  const email = `${phone}@noafar.local`;
  const defaultPassword = 'noafar-secure-pass';
  
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, defaultPassword);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      userCredential = await createUserWithEmailAndPassword(auth, email, defaultPassword);
    } else {
      throw error;
    }
  }

  const userDocRef = doc(db, 'users', userCredential.user.uid);
  let userDoc = await getDoc(userDocRef);
  let userData: User;

  if (!userDoc.exists()) {
    userData = {
      id: userCredential.user.uid,
      displayName: 'کاربر نوآفر',
      phone,
      role: 'user',
      joinedAt: new Date().toISOString(),
      membershipDays: 0,
      points: 0,
      profileComplete: false
    };
    await setDoc(userDocRef, userData);
  } else {
    userData = userDoc.data() as User;
  }

  const token = await userCredential.user.getIdToken();
  return { token, user: userData };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getMe(): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!userDoc.exists()) throw new Error('User not found');
  
  return userDoc.data() as User;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  
  const userDocRef = doc(db, 'users', currentUser.uid);
  await updateDoc(userDocRef, data);
  
  const updatedDoc = await getDoc(userDocRef);
  return updatedDoc.data() as User;
}

// Fallback to mockDb for complex queries in this prototype, BUT sync user ID
// Since mockDb uses `u-1`, we will override mockDb.user with Firebase user!
export function syncMockUserWithFirebase(firebaseUser: User) {
  mockDb.data.user = firebaseUser;
  // replace inside users list
  const idx = mockDb.data.users.findIndex(u => u.id === firebaseUser.id);
  if(idx > -1) mockDb.data.users[idx] = firebaseUser;
  else mockDb.data.users.push(firebaseUser);
  mockDb.save();
}

"""

# Let's read the rest of endpoints.ts from the original, and replace the top part!
with open("src/services/endpoints.ts", "r") as f:
    original = f.read()

# find where "// ==========================================" for section 2 starts
split_marker = "// 2. TAXONOMY & METADATA"
parts = original.split(split_marker)
if len(parts) > 1:
    rest_of_code = split_marker + parts[1]
    with open("src/services/endpoints.ts", "w") as f:
        f.write(code + "\n" + rest_of_code)
