import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  projectId: "powerful-simplicity-ptpfc",
  appId: "1:267912140695:web:0df8bb86d043cda8db96d2",
  apiKey: "AIzaSyDUswX51OeLc9q6Qi_mVA9BHwRLCqQQiog",
  authDomain: "powerful-simplicity-ptpfc.firebaseapp.com",
  storageBucket: "powerful-simplicity-ptpfc.firebasestorage.app",
  messagingSenderId: "267912140695"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-noafar-08ae0eb9-281c-4e0a-b6ae-e3cbdd67d167");
export const auth = getAuth(app);
