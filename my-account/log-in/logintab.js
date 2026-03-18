import { 
    auth, db, provider, signInWithPopup, signInWithEmailAndPassword, 
    collection, query, where, getDocs 
} from "../../auth-handler.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // --- 1. EMAIL / USERNAME LOGIN ---
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();

            const identifier = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-pw').value;

            // Start "Surfing" Loading State
            const surfingModal = showSurfingDialogue("Logging in...");

            try {
                let emailToAuth = identifier;

                // Check if the input is a Username (no '@')
                if (!identifier.includes('@')) {
                    const userQuery = query(collection(db, "users"), where("username", "==", identifier));
                    const querySnapshot = await getDocs(userQuery);

                    if (querySnapshot.empty) {
                        throw new Error("Username not found.");
                    }
                    emailToAuth = querySnapshot.docs[0].data().email;
                }

                // Attempt Auth in App 1
                await signInWithEmailAndPassword(auth, emailToAuth, password);

                surfingModal.remove();
                redirectUser();

            } catch (error) {
                surfingModal.remove();
                showErrorDialogue("Wrong username/gmail or password.");
                console.error("Login failed:", error.message);
            }
        };
    }
});

// --- 2. CONTINUE WITH GOOGLE ---
window.loginWithGoogle = async () => {
    const surfingModal = showSurfingDialogue("Connecting Google...");
    try {
        await signInWithPopup(auth, provider);
        surfingModal.remove();
        redirectUser();
    } catch (error) {
        surfingModal.remove();
        console.error("Google Login Failed:", error.message);
        showErrorDialogue("Google login was interrupted. Please try again.");
    }
};

/**
 * Creates the "Surfing" Loading Dialogue
 */
function showSurfingDialogue(text) {
    const modal = document.createElement('div');
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 20000; backdrop-filter: blur(8px);`;
    modal.innerHTML = `
        <div style="background: white; padding: 35px; border-radius: 20px; text-align: center; font-family: sans-serif; width: 280px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
            <div style="font-size: 55px; color: #007bff; margin-bottom: 20px;">
                <i class="fa-solid fa-person-surfing fa-bounce"></i>
            </div>
            <h3 style="margin: 0; color: #1a1a1a; font-size: 1.4rem;">${text}</h3>
            <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">Please wait a moment...</p>
        </div>`;
    document.body.appendChild(modal);
    return modal;
}

/**
 * Creates the Error Dialogue
 */
function showErrorDialogue(message) {
    const modal = document.createElement('div');
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 20001;`;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 320px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: sans-serif;">
            <div style="font-size: 40px; color: #d9534f; margin-bottom: 15px;"><i class="fa-solid fa-circle-exclamation"></i></div>
            <h3 style="margin: 0 0 10px;">Login Error</h3>
            <p style="color: #666; margin-bottom: 20px;">${message}</p>
            <button id="close-err" style="background: #000; color: #fff; border: none; padding: 12px; border-radius: 8px; width: 100%; cursor: pointer; font-weight: bold;">Try Again</button>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('close-err').onclick = () => modal.remove();
}

/**
 * Handles Redirection
 */
function redirectUser() {
    // Return to previous page or index
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = "../../index.html";
    }
}