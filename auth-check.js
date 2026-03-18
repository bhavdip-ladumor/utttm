// auth-check.js (The Anonymous Lookout - App 2)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, setDoc 
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

const app2 = initializeApp(firebaseConfigApp2, "lookoutApp"); 
const db2 = getFirestore(app2);

/**
 * CHECK IF TAKEN
 * Logic: Returns true if available OR if a pending entry is > 3 days old.
 */
export async function isAvailable(type, value) {
    if (!value) return true;
    const cleanValue = value.toLowerCase().trim();
    const docRef = doc(db2, "public_registry", type, "entries", cleanValue);
    
    try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) return true;

        const data = snap.data();
        if (data.status === "verified") return false;

        // 3-Day Expiry Check (259,200,000 milliseconds)
        const timestamp = new Date(data.timestamp).getTime();
        const now = Date.now();
        if (data.status === "pending" && (now - timestamp) > 259200000) {
            return true; 
        }
        return false; 
    } catch (e) {
        console.error("Lookup error:", e);
        return true; 
    }
}

/**
 * LOCK IDENTITY
 * status: "pending" (on register) or "verified" (after link click)
 */
export async function lockIdentity(username, email, status = "pending") {
    const userRef = doc(db2, "public_registry", "usernames", "entries", username.toLowerCase().trim());
    const emailRef = doc(db2, "public_registry", "emails", "entries", email.toLowerCase().trim());
    
    const entry = { 
        taken: true, 
        status: status, 
        timestamp: new Date().toISOString() 
    };

    await Promise.all([
        setDoc(userRef, entry),
        setDoc(emailRef, entry)
    ]);
}