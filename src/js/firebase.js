// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATBHPNAiedzsTo4qWv0abPyaw4rPptMjs",
  authDomain: "yoga-institute-wdd330.firebaseapp.com",
  projectId: "yoga-institute-wdd330",
  storageBucket: "yoga-institute-wdd330.firebasestorage.app",
  messagingSenderId: "393026083423",
  appId: "1:393026083423:web:feefc82d3a67f391d819ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//Exporting auth and provider for use in auth.js
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);