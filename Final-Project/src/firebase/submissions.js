import { firestore } from './firebase-settings';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';

const SUBMISSIONS_COLLECTION = 'submissions';

// Get all submissions
export const getAllSubmissions = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, SUBMISSIONS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions:", error);
    throw error;
  }
};

// Get submissions by student
export const getSubmissionsByStudent = async (studentId) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('studentId', '==', studentId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by student:", error);
    throw error;
  }
};

// Get submissions by assignment
export const getSubmissionsByAssignment = async (assignmentId) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('assignmentId', '==', assignmentId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by assignment:", error);
    throw error;
  }
};

// Get submission by ID
export const getSubmissionById = async (submissionId) => {
  try {
    const submissionRef = doc(firestore, SUBMISSIONS_COLLECTION, submissionId);
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) return null;
    return {
      id: submissionDoc.id,
      ...submissionDoc.data()
    };
  } catch (error) {
    console.error("Error getting submission by ID:", error);
    throw error;
  }
};

// Create new submission
export const createSubmission = async (submissionData) => {
  try {
    // Optionally, create a logical submissionId field for your own use
    const { studentId, assignmentId, courseId } = submissionData;
    const logicalSubmissionId = `${studentId}_${courseId}_${assignmentId}`;
    const submissionWithTimestamp = {
      ...submissionData,
      submissionId: logicalSubmissionId,
      status: 'Pending',
      submitted: true,
      submissionDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    const docRef = doc(firestore, SUBMISSIONS_COLLECTION, logicalSubmissionId);
    await setDoc(docRef, submissionWithTimestamp, { merge: true });
    return logicalSubmissionId;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw error;
  }
};

// Update submission
export const updateSubmission = async (submissionId, updateData) => {
  try {
    const submissionRef = doc(firestore, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    throw error;
  }
};

// Delete submission
export const deleteSubmission = async (submissionId) => {
  try {
    await deleteDoc(doc(firestore, SUBMISSIONS_COLLECTION, submissionId));
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw error;
  }
};

// Get latest submissions
export const getLatestSubmissions = async (limit = 10) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      orderBy('submissionDate', 'desc'),
      limit(limit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting latest submissions:", error);
    throw error;
  }
};

// Get submissions by status
export const getSubmissionsByStatus = async (status) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('status', '==', status),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by status:", error);
    throw error;
  }
};

// Get submissions by date range
export const getSubmissionsByDateRange = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(new Date(startDate));
    const endTimestamp = Timestamp.fromDate(new Date(endDate));
    
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('submissionDate', '>=', startTimestamp),
      where('submissionDate', '<=', endTimestamp),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by date range:", error);
    throw error;
  }
};

// Get submissions by course and student
export const getSubmissionsByCourseAndStudent = async (courseId, studentId) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('courseId', '==', courseId),
      where('studentId', '==', studentId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by course and student:", error);
    throw error;
  }
};

// Get submissions by course and assignment
export const getSubmissionsByCourseAndAssignment = async (courseId, assignmentId) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('courseId', '==', courseId),
      where('assignmentId', '==', assignmentId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by course and assignment:", error);
    throw error;
  }
};
