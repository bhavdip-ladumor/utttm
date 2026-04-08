import { auth, provider, signInWithPopup, doc, setDoc, getDoc, db } from "../../auth-handler.js";

const loginBtn = document.getElementById('google-login-btn');
const backLink = document.getElementById('back-link');

// 1. Handle the "Go Back" link (Standard navigation)
backLink.addEventListener('click', () => {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = "../../../index.html";
    }
});

// 2. Handle Google Login with History Replacement
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

        // Determine destination
        const destination = (document.referrer && document.referrer.includes(window.location.hostname)) 
            ? document.referrer 
            : "../../../index.html";

        /**
         * THE FIX: window.location.replace() 
         * This removes the login page from the browser history.
         * If the user clicks 'back' from the destination, they won't see this login page.
         */
        window.location.replace(destination);

    } catch (error) {
        console.error("Login Error:", error.message);
        alert("Failed to sign in. Please try again.");
    }
});
