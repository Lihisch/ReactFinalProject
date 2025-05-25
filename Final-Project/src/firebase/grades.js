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
  addDoc
} from 'firebase/firestore';

const SUBMISSIONS_COLLECTION = 'submissions';

// Get all submission
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

// Get submissions by course
export const getSubmissionsByCourse = async (courseId) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions by course:", error);
    throw error;
  }
};

// Get submissions by course and assignment
export const getSubmissionsByCourseAndAssignment = async (courseId, assignmentCode) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('courseId', '==', courseId),
      where('assignmentCode', '==', assignmentCode),
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

// Get submission by student and assignment
export const getSubmissionByStudentAndAssignment = async (studentId, assignmentCode) => {
  try {
    const q = query(
      collection(firestore, SUBMISSIONS_COLLECTION),
      where('studentId', '==', studentId),
      where('assignmentCode', '==', assignmentCode)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error getting submission by student and assignment:", error);
    throw error;
  }
};

// Save submission
export const saveSubmission = async (submissionData) => {
  try {
    const { studentId, assignmentId, courseId } = submissionData;
    const logicalSubmissionId = `${studentId}_${courseId}_${assignmentId}`;
    const submissionWithTimestamp = {
      ...submissionData,
      submissionId: logicalSubmissionId,
      lastUpdated: serverTimestamp()
    };
    await addDoc(collection(firestore, SUBMISSIONS_COLLECTION), submissionWithTimestamp);
    return logicalSubmissionId;
  } catch (error) {
    console.error("Error saving submission:", error);
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

// Update submission status
export const updateSubmissionStatus = async (submissionId, status) => {
  try {
    const submissionRef = doc(firestore, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      status,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    throw error;
  }
};

// Update submission grade
export const updateSubmissionGrade = async (submissionId, grade) => {
  try {
    const submissionRef = doc(firestore, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      grade,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating submission grade:", error);
    throw error;
  }
};
// Update submission comments
export const updateSubmissionComment = async (submissionId, comments) => {
  try {
    const submissionRef = doc(firestore, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      comments,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating submission comments:", error);
    throw error;
  }
};
