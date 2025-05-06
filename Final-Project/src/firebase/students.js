import { addDoc, collection } from "firebase/firestore"
import { firestore } from "./firebase-settings"
export async function addStudent(student) {
return addDoc(collection(firestore, "students"), student);
}