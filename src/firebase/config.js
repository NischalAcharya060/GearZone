import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDzg0VUjB9diTO8oQRqaj768iyICxpUavI",
    authDomain: "gearzone-24332.firebaseapp.com",
    projectId: "gearzone-24332",
    storageBucket: "gearzone-24332.appspot.com",
    messagingSenderId: "296897109984",
    appId: "1:296897109984:web:bcc699291c892d61be9585",
};

// Initialize Firebase app (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth (only once)
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (err) {
    auth = getAuth(app);
}

// Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
export default app;