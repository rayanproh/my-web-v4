// Import the necessary functions from the Firebase SDKs
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration from your Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAKSXogzNdgQ-p5nR5XFQuEf9lHfud4I4g",
  authDomain: "nokatis.firebaseapp.com",
  projectId: "nokatis",
  storageBucket: "nokatis.firebasestorage.app",
  messagingSenderId: "1058580062566",
  appId: "1:1058580062566:web:820df0a97fb703a51fa8a7",
  measurementId: "G-1HY1PNRKLP"
};

// Initialize Firebase App safely to avoid duplicate app errors
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the existing app if it already exists
}

// Initialize and export the services for use in other parts of the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Note: File uploads will not work until Storage is fully enabled with a billing account.
export const googleProvider = new GoogleAuthProvider();
