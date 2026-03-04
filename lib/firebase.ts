// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
  
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3BCOO1Vp1iJpscopo--qNCSniVkYkUgU",
  authDomain: "moviesvaultdb.firebaseapp.com",
  projectId: "moviesvaultdb",
  storageBucket: "moviesvaultdb.firebasestorage.app",
  messagingSenderId: "841402281609",
  appId: "1:841402281609:web:07f3404e04628ce78ce058",
  measurementId: "G-L4XE039SZF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const storage = getStorage(app)
export const GAP = new GoogleAuthProvider() 