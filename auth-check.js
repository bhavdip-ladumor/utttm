// auth-check.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, setDoc, deleteDoc // <--- ADDED THIS
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfigApp2 = {
    apiKey: "AIzaSyDmrRPEiY_VA-ODcGWAJBGjl2DszHbGaCk",
    authDomain: "checkavaliblity.firebaseapp.com",
    projectId: "checkavaliblity",
    storageBucket: "checkavaliblity.firebasestorage.app",
    messagingSenderId: "213302779644",
    appId: "1:213302779644:web:b231b468a556b16f7f0179",
    measurementId: "G-V56WBBJXZ9"
};

// Initialize App 2
const app2 = initializeApp(firebaseConfigApp2, "lookoutApp"); 
export const db2 = getFirestore(app2);

// Export tools for checkauth.js
export { doc, getDoc, setDoc, deleteDoc }; // <--- ADDED THIS
