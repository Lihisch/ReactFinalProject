import { addDoc, collection, getDocs } from "firebase/firestore"
import { firestore } from "./firebase-settings"

export async function addStudent(student) {
return addDoc(collection(firestore, "students"), student);
}

export async function listStudents() {
    const snapshot = await getDocs(collection(firestore, "students"));
   
    return snapshot.docs.map((doc) =>
        ({ ...doc.data(), id: doc.id }));
        }