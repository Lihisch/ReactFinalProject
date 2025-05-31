import { addDoc, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "./firebase-settings"

export async function addStudent(student) {
  try {
    const docRef = await addDoc(collection(firestore, "students"), student);
    return { id: docRef.id, ...student }; // Return the new document's ID along with the student data
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

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
