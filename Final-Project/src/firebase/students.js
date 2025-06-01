import { addDoc, collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore"; // Added deleteDoc, query, where, writeBatch
import { firestore } from "./firebase-settings";

export async function addStudent(student) {
  try {
    const docRef = await addDoc(collection(firestore, "students"), student);
    return { id: docRef.id, ...student }; // Return the new document's ID along with the student data
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

export const deleteStudentAndAssociatedData = async (studentFirestoreId, studentBusinessId) => {
  if (!studentFirestoreId) {
    console.error("deleteStudentAndAssociatedData Error: Student Firestore ID is required.");
    throw new Error("Student Firestore ID is required to delete a student.");
  }
  if (!studentBusinessId) {
    // It's good practice to also require the business ID if you're deleting associated data by it.
    console.error("deleteStudentAndAssociatedData Error: Student Business ID is required for deleting associated submissions.");
    throw new Error("Student Business ID is required to delete associated submissions.");
  }

  const batch = writeBatch(firestore);

  // 1. Delete the student document
  const studentRef = doc(firestore, 'students', studentFirestoreId);
  batch.delete(studentRef);

  // 2. Find and delete all submissions associated with the student (using studentBusinessId)
  const submissionsQuery = query(
    collection(firestore, 'submissions'), // Assuming 'submissions' is your submissions collection name
    where('studentId', '==', studentBusinessId) // Assuming 'studentId' in submissions matches studentBusinessId
  );

  const submissionsSnapshot = await getDocs(submissionsQuery);
  submissionsSnapshot.forEach((submissionDoc) => {
    batch.delete(submissionDoc.ref);
  });

  await batch.commit();
};

export async function listStudents() {
  try {
    const snapshot = await getDocs(collection(firestore, "students"));
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error listing students:", error);
    throw error;
  }
}

export async function getStudent(studentId) { // studentId here is the Firestore document ID
  try {
    const studentDocRef = doc(firestore, "students", studentId);
    const studentDocSnap = await getDoc(studentDocRef);

    if (studentDocSnap.exists()) {
      return { ...studentDocSnap.data(), id: studentDocSnap.id };
    } else {
      console.log("No such student document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting student:", error);
    throw error;
  }
}

export async function updateStudent(student) {
  try {
    const { id, ...studentData } = student; // 'id' is the Firestore document ID
    if (!id) {
      throw new Error("Student ID (Firestore document ID) is required for an update.");
    }
    const studentRef = doc(firestore, "students", id);
    await setDoc(studentRef, studentData); // Using setDoc to overwrite, or use updateDoc for partial updates
    return { id, ...studentData }; // Return the updated student data with its ID
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}
