// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD08fj_PeZ7vzBEQbUWrwwFoz4cT0lmZhA",
  authDomain: "tube-mobile.firebaseapp.com",
  projectId: "tube-mobile",
  storageBucket: "tube-mobile.firebasestorage.app",
  messagingSenderId: "737890878518",
  appId: "1:737890878518:web:6b417fb2d654ca7094c497"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
