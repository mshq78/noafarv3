import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { liveDb } from './db';

const DB_DOC_ID = 'noafar_main_db';

export async function initFirebaseSync() {
  const docRef = doc(db, 'system', DB_DOC_ID);
  
  // Try to load from Firebase
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    liveDb.data = data as any;
    liveDb.save(); // save to localstorage
  } else {
    // If it doesn't exist, upload initial mockDb state to Firebase
    await setDoc(docRef, liveDb.data);
  }

  // Listen for remote changes (e.g. from other users or admin panel)
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Update local memory and localstorage
      liveDb.data = data as any;
      localStorage.setItem('noafar_live_db_v2', JSON.stringify(data));
      // Dispatch event to trigger re-renders
      window.dispatchEvent(new CustomEvent('noafar:db:update'));
    }
  });

  // Override the liveDb save method to also push to Firebase
  const originalSave = liveDb.save.bind(liveDb);
  liveDb.save = () => {
    originalSave(); // Save to localstorage
    // Async push to Firebase
    setDoc(docRef, liveDb.data).catch(err => {
      console.error("Failed to sync to Firebase", err);
    });
  };
}
