import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { firestore } from "./firebase-settings";

const COLLECTION_NAME = 'assignments';

// Add a new assignment
export const addAssignment = async (assignmentData) => {
  try {
    if (!assignmentData) {
      throw new Error('Assignment data is required');
    }

    // Remove status field if it exists
    const { status, ...dataToSave } = assignmentData;
    
    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error("Error adding assignment:", error);
    throw error;
  }
};

// List all assignments
export const listAssignments = async () => {
  try {
    const assignmentsCollection = collection(firestore, COLLECTION_NAME);
    const querySnapshot = await getDocs(assignmentsCollection);
    
    if (querySnapshot.empty) {
      console.log('No assignments found in the collection');
      return [];
    }

    const assignments = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data.assignmentId) {
          console.warn('Assignment missing assignmentId:', data);
          return null;
        }
        return {
          id: doc.id,
          assignmentId: data.assignmentId,
          assignmentName: data.assignmentName || data.name,
          courseId: data.courseId,
          weight: data.weight || 0,
          ...data
        };
      })
      .filter(Boolean);

    console.log('Fetched assignments:', assignments);
    return assignments;
  } catch (error) {
    console.error("Error listing assignments:", error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }
};

// Update an assignment
export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    // Remove status field if it exists
    const { status, ...dataToSave } = assignmentData;

    // Find the document with the matching assignmentId
    const assignmentsQuery = query(collection(firestore, COLLECTION_NAME), where("assignmentId", "==", assignmentId));
    const querySnapshot = await getDocs(assignmentsQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Assignment not found');
    }

    // Get the document reference using the first matching document's ID
    const assignmentRef = doc(firestore, COLLECTION_NAME, querySnapshot.docs[0].id);
    await updateDoc(assignmentRef, dataToSave);
    return { id: assignmentId, ...dataToSave };
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw new Error(`Failed to update assignment: ${error.message}`);
  }
};

// Delete an assignment
export const deleteAssignment = async (assignmentId) => {
  try {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    const assignmentRef = doc(firestore, COLLECTION_NAME, assignmentId);
    await deleteDoc(assignmentRef);
    return assignmentId;
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw new Error(`Failed to delete assignment: ${error.message}`);
  }
};

// Delete multiple assignments
export const deleteAssignments = async (assignmentIds) => {
  try {
    const deletePromises = assignmentIds.map(id => deleteAssignment(id));
    await Promise.all(deletePromises);
    return assignmentIds;
  } catch (error) {
    console.error("Error deleting multiple assignments:", error);
    throw error;
  }
};

// Get assignments by course ID
export const getAssignmentsByCourse = async (courseId) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const q = query(collection(firestore, COLLECTION_NAME), where("courseId", "==", courseId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting assignments by course:", error);
    throw new Error(`Failed to fetch assignments by course: ${error.message}`);
  }
};

// Get assignments by student ID
export const getAssignmentsByStudent = async (studentId) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const q = query(collection(firestore, COLLECTION_NAME), where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting assignments by student:", error);
    throw new Error(`Failed to fetch assignments by student: ${error.message}`);
  }
}; 