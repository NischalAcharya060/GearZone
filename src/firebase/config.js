import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzg0VUjB9diTO8oQRqaj768iyICxpUavI",
    authDomain: "gearzone-24332.firebaseapp.com",
    projectId: "gearzone-24332",
    storageBucket: "gearzone-24332.firebasestorage.app",
    messagingSenderId: "296897109984",
    appId: "1:296897109984:web:bcc699291c892d61be9585",
    measurementId: "G-JENZX07S1H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;