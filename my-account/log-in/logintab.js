import { 
    auth, db, provider, signInWithPopup, signInWithEmailAndPassword, 
    collection, query, where, getDocs, sendPasswordResetEmail
} from "../../auth-handler.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotPwLink = document.getElementById('forgot-pw');

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
    // --- 2. FORGOT PASSWORD HANDLER ---
    if (forgotPwLink) {
        forgotPwLink.onclick = () => {
            showResetDialogue();
        };
    }
});

/**
 * Creates the Password Reset Dialogue
 */
function showResetDialogue() {
    const modal = document.createElement('div');
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 20002; backdrop-filter: blur(8px);`;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 20px; text-align: center; font-family: sans-serif; width: 320px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
            <div style="font-size: 45px; color: #007bff; margin-bottom: 15px;"><i class="fa-solid fa-key"></i></div>
            <h3 style="margin: 0 0 10px; color: #1a1a1a;">Reset Password</h3>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">Enter your username or Gmail address.</p>
            
            <input type="text" id="reset-identifier" placeholder="Username or Email" 
                style="width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
            
            <button id="confirm-reset" style="background: #007bff; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; cursor: pointer; font-weight: bold; margin-bottom: 10px;">Send Reset Link</button>
            <button id="cancel-reset" style="background: none; color: #666; border: none; width: 100%; cursor: pointer; font-size: 0.9rem;">Cancel</button>
        </div>`;
    
    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('#confirm-reset');
    const cancelBtn = modal.querySelector('#cancel-reset');
    const inputField = modal.querySelector('#reset-identifier');

    cancelBtn.onclick = () => modal.remove();

    confirmBtn.onclick = async () => {
        const id = inputField.value.trim();
        if (!id) return;

        confirmBtn.disabled = true;
        confirmBtn.innerText = "Searching...";

        try {
            let emailToSend = id;

            // If it's a username, find the email first
            if (!id.includes('@')) {
                const userQuery = query(collection(db, "users"), where("username", "==", id));
                const querySnapshot = await getDocs(userQuery);

                if (querySnapshot.empty) {
                    throw new Error("Account not found.");
                }
                emailToSend = querySnapshot.docs[0].data().email;
            }

            // Send Firebase Reset Email
            await sendPasswordResetEmail(auth, emailToSend);

            // Show Success UI
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 20px; text-align: center; font-family: sans-serif; width: 300px;">
                    <div style="font-size: 50px; color: #28a745; margin-bottom: 15px;"><i class="fa-solid fa-circle-check"></i></div>
                    <h3 style="margin: 0 0 10px;">Link Sent!</h3>
                    <p style="font-size: 0.9rem; color: #666;">Reset link sent to your mail. Check inbox or spam.</p>
                    <p style="font-size: 0.8rem; color: #007bff; margin-top: 15px;">refresh to go login page</p>
                </div>`;

            // Auto-close and switch to login after 3 seconds
            setTimeout(() => {
                modal.remove();
                if (typeof window.switchTab === 'function') window.switchTab(1);
            }, 15000);

        } catch (error) {
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Send Reset Link";
            alert(error.message);
        }
    };
}



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