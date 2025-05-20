import { addDoc, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "./firebase-settings"

export async function addStudent(student) {
  return addDoc(collection(firestore, "students"), student);
}

export async function listStudents() {
  const snapshot = await getDocs(collection(firestore, "students"));

  return snapshot.docs.map((doc) =>
    ({ ...doc.data(), id: doc.id }));
}

export async function getStudent(studentId) {
  const studentDocRef = doc(firestore, "students", studentId);
  const studentDocSnap = await getDoc(studentDocRef);

  if (studentDocSnap.exists()) {
    return { ...studentDocSnap.data(), id: studentDocSnap.id };
  } else {
    return null;
  }
}
export async function updateStudent(student) {
  const { id, ...studentData } = student;
  const studentRef = doc(firestore, "students", id);
  return setDoc(studentRef, studentData);
}