// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBi4VV_TSpnNwKoS6keFeoH0OTyPgkLjBs",
  authDomain: "ono-website-d6afa.firebaseapp.com",
  projectId: "ono-website-d6afa",
  storageBucket: "ono-website-d6afa.firebasestorage.app",
  messagingSenderId: "800387104622",
  appId: "1:800387104622:web:0a97b160cd3d27c39a0b7f",
  measurementId: "G-K6B4R7M6PL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
