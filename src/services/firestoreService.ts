import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Resume, JobApplication, User, CoverLetter } from '../types';

export const firestoreService = {
  // User
  async saveUser(user: Partial<User>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(docRef, { ...user, updatedAt: Timestamp.now() }, { merge: true });
  },

  async getUser(uid: string): Promise<User | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  },

  // User Profile
  async saveProfile(profile: UserProfile) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'userProfiles', auth.currentUser.uid);
    await setDoc(docRef, { ...profile, updatedAt: Timestamp.now() }, { merge: true });
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'userProfiles', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  },

  // Resumes
  async saveResume(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const colRef = collection(db, 'resumes');
    const now = new Date().toISOString();

    // If this is a base resume, check if one already exists to overwrite it
    if (resume.isBase) {
      const q = query(colRef, where('uid', '==', auth.currentUser.uid), where('isBase', '==', true));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { 
          ...resume, 
          updatedAt: now 
        });
        return docRef.id;
      }
    }

    const docRef = await addDoc(colRef, { 
      ...resume, 
      createdAt: now,
      updatedAt: now 
    });
    return docRef.id;
  },

  async deleteResume(id: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'resumes', id);
    await deleteDoc(docRef);
  },

  async updateResume(id: string, updates: Partial<Resume>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'resumes', id);
    const now = new Date().toISOString();

    // If setting as base, unmark any existing base resumes for this user
    if (updates.isBase) {
      const colRef = collection(db, 'resumes');
      const q = query(colRef, where('uid', '==', auth.currentUser.uid), where('isBase', '==', true));
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs
        .filter(doc => doc.id !== id)
        .map(doc => updateDoc(doc.ref, { isBase: false, updatedAt: now }));
      await Promise.all(updatePromises);
    }

    await updateDoc(docRef, { 
      ...updates, 
      updatedAt: now 
    });
  },

  async getResumes(uid: string): Promise<Resume[]> {
    const colRef = collection(db, 'resumes');
    const q = query(colRef, where('uid', '==', uid), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
  },

  // Job Applications
  async saveApplication(application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const colRef = collection(db, 'jobApplications');
    const now = new Date().toISOString();
    const docRef = await addDoc(colRef, { 
      ...application, 
      createdAt: now,
      updatedAt: now 
    });
    return docRef.id;
  },

  async getApplications(uid: string): Promise<JobApplication[]> {
    const colRef = collection(db, 'jobApplications');
    const q = query(colRef, where('uid', '==', uid), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));
  },

  async updateApplicationStatus(id: string, status: JobApplication['status']) {
    const docRef = doc(db, 'jobApplications', id);
    await updateDoc(docRef, { 
      status, 
      updatedAt: Timestamp.now().toDate().toISOString() 
    });
  },

  // Cover Letters
  async saveCoverLetter(coverLetter: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const colRef = collection(db, 'coverLetters');
    const now = new Date().toISOString();
    const docRef = await addDoc(colRef, { 
      ...coverLetter, 
      createdAt: now,
      updatedAt: now 
    });
    return docRef.id;
  }
};
