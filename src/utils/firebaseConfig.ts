import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "react-zoom-62a0f.firebaseapp.com",
  projectId: "react-zoom-62a0f",
  storageBucket: "react-zoom-62a0f.appspot.com",
  messagingSenderId: "134977736213",
  appId: "1:134977736213:web:a9d356f3e0b67da4b8c81c",
  measurementId: "G-2S753XD64W",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firebaseDB = getFirestore(app);

export const usersRef = collection(firebaseDB, "users");
export const meetingsRef = collection(firebaseDB, "meetings");
