// auth-handler.js (Root)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import { 
    getFirestore, doc, getDoc, setDoc, 
    collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyATowufURQqQcuvCP-7pYrhB_d8lKChNvE",
    authDomain: "uttamhub-23381.firebaseapp.com",
    projectId: "uttamhub-23381",
    storageBucket: "uttamhub-23381.firebasestorage.app",
    messagingSenderId: "981288222336",
    appId: "1:981288222336:web:580f8d983f4fb0a6bab065"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export { 
    signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, setDoc,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential,
    collection, query, where, getDocs, sendEmailVerification
};
