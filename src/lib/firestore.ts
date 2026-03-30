import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const profileService = {
  async getProfile(uid: string) {
    const path = `profiles/${uid}`;
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async updateProfile(uid: string, data: any) {
    const path = `profiles/${uid}`;
    try {
      await setDoc(doc(db, path), { ...data, updatedAt: Timestamp.now() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const resumeService = {
  async saveResume(uid: string, resumeData: any) {
    const path = `profiles/${uid}/resumes`;
    try {
      const colRef = collection(db, path);
      return await addDoc(colRef, { ...resumeData, createdAt: Timestamp.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  getResumes(uid: string, callback: (resumes: any[]) => void) {
    const path = `profiles/${uid}/resumes`;
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const resumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(resumes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};

export const applicationService = {
  async addApplication(uid: string, appData: any) {
    const path = `profiles/${uid}/applications`;
    try {
      const colRef = collection(db, path);
      return await addDoc(colRef, { ...appData, appliedDate: Timestamp.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  getApplications(uid: string, callback: (apps: any[]) => void) {
    const path = `profiles/${uid}/applications`;
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
