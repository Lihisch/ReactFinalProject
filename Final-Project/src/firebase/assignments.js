import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { firestore } from "./firebase-settings";

const COLLECTION_NAME = 'assignments';

// Add a new assignment
export const addAssignment = async (assignmentData) => {
  try {
    if (!assignmentData) {
      throw new Error('Assignment data is required');
    }

    // Remove status field if it exists, as status is typically derived or managed elsewhere
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
      return [];
    }

    const assignments = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Ensure assignmentId (logical ID) exists, otherwise skip
        if (!data.assignmentId) {
          console.warn('Assignment data missing assignmentId field:', data, 'Document ID:', doc.id);
          return null;
        }
        return {
          id: doc.id, // Firestore document ID
          assignmentId: data.assignmentId, // Logical/user-defined ID
          assignmentName: data.assignmentName || data.name, // Handle potential naming variations
          courseId: data.courseId,
          weight: data.weight || 0,
          dueDate: data.dueDate, // Ensure dueDate is included
          ...data // Spread the rest of the data
        };
      })
      .filter(Boolean); // Remove any null entries from map

    return assignments;
  } catch (error) {
    console.error("Error listing assignments:", error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }
};

// Update an assignment using its logical assignmentId
export const updateAssignment = async (logicalAssignmentId, assignmentData) => {
  try {
    if (!logicalAssignmentId) {
      throw new Error('Logical Assignment ID is required for update');
    }

    // Remove status field if it exists, and Firestore ID if accidentally passed
    const { id: firestoreDocIdToExclude, status, ...dataToSave } = assignmentData;

    // Find the document with the matching logical assignmentId
    const assignmentsQuery = query(collection(firestore, COLLECTION_NAME), where("assignmentId", "==", logicalAssignmentId));
    const querySnapshot = await getDocs(assignmentsQuery);

    if (querySnapshot.empty) {
      throw new Error(`Assignment with logical ID ${logicalAssignmentId} not found for update.`);
    }
    
    // Get the document reference using the first matching document's Firestore ID
    const docRef = doc(firestore, COLLECTION_NAME, querySnapshot.docs[0].id);
    await updateDoc(docRef, dataToSave);
    // Return the logical ID and the saved data, plus the Firestore doc ID
    return { firestoreId: querySnapshot.docs[0].id, assignmentId: logicalAssignmentId, ...dataToSave };
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw new Error(`Failed to update assignment with logical ID ${logicalAssignmentId}: ${error.message}`);
  }
};

// Delete an assignment using its logical assignmentId
export const deleteAssignment = async (logicalAssignmentId) => { // Renamed param for clarity
  try {
    if (!logicalAssignmentId) {
      throw new Error('Logical Assignment ID is required for deletion');
    }

    const assignmentsQuery = query(collection(firestore, COLLECTION_NAME), where("assignmentId", "==", logicalAssignmentId));
    const querySnapshot = await getDocs(assignmentsQuery);

    if (querySnapshot.empty) {
      console.warn(`No assignment found with logical ID: ${logicalAssignmentId} to delete.`);
      // Depending on desired behavior, could throw an error or just return
      // throw new Error('Assignment not found for deletion');
      return null; 
    }

    // Assuming assignmentId is unique, so we take the first doc.
    const firestoreDocId = querySnapshot.docs[0].id;
    const assignmentRef = doc(firestore, COLLECTION_NAME, firestoreDocId);
    await deleteDoc(assignmentRef);
    // console.log(`Assignment with logical ID ${logicalAssignmentId} (Firestore ID: ${firestoreDocId}) deleted.`);
    return logicalAssignmentId; // Return the logical ID that was passed
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw new Error(`Failed to delete assignment with logical ID ${logicalAssignmentId}: ${error.message}`);
  }
};

// Delete multiple assignments by their logical IDs
export const deleteAssignments = async (logicalAssignmentIds) => {
  try {
    if (!Array.isArray(logicalAssignmentIds) || logicalAssignmentIds.length === 0) {
      throw new Error('An array of logical assignment IDs is required.');
    }
    const deletePromises = logicalAssignmentIds.map(id => deleteAssignment(id));
    await Promise.all(deletePromises);
    return logicalAssignmentIds.filter(id => id !== null); // Return IDs that were attempted (excluding nulls if deleteAssignment returns null for not found)
  } catch (error)
 {
    console.error("Error deleting multiple assignments:", error);
    // It might be better to throw a custom error that aggregates individual failures if needed
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
      id: doc.id, // Firestore document ID
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting assignments by course:", error);
    throw new Error(`Failed to fetch assignments by course: ${error.message}`);
  }
};

// Get assignments by student ID (Note: Assignments are not typically directly linked to students in this way)
// This function might be intended for a different data model or might not be used.
// If assignments are linked to students via submissions, query submissions instead.
export const getAssignmentsByStudent = async (studentId) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    // This query assumes there's a 'studentId' field directly on assignment documents.
    // This is unusual; typically assignments are for courses, and students submit to them.
    const q = query(collection(firestore, COLLECTION_NAME), where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id, // Firestore document ID
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting assignments by student:", error);
    throw new Error(`Failed to fetch assignments by student: ${error.message}`);
  }
};
