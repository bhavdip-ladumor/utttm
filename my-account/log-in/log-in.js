import { auth, provider, signInWithPopup, doc, setDoc, getDoc, db } from "../../auth-handler.js";

const loginBtn = document.getElementById('google-login-btn');
const backLink = document.getElementById('back-link');

// 1. Handle the "Go Back" functionality
backLink.addEventListener('click', () => {
    // If there is a history, go back; otherwise, go to home
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = "../../../index.html";
    }
});

// 2. Handle Google Login
loginBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save or update user data in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                role: 'customer'
            });
        }

// REDIRECT LOGIC: 
        // If they came from a specific page (like a product), send them back there.
        // Otherwise, send them to the main index.
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            window.location.href = document.referrer;
        } else {
            window.location.href = "../../../index.html";
        }

    } catch (error) {
        console.error("Login Error:", error.message);
        alert("Failed to sign in. Please try again.");
    }
});