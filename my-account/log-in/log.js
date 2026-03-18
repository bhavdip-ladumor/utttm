import { 
    auth, db, doc, setDoc, 
    createUserWithEmailAndPassword 
} from "../../auth-handler.js";
import { isAvailable, lockIdentity } from "../../auth-check.js";

/**
 * SIGNUP FORM HANDLER (Direct Registration)
 */
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();

            // 1. Capture All Form Data
            const formData = {
                firstName: document.getElementById('s-fname').value.trim(),
                lastName: document.getElementById('s-lname').value.trim(),
                username: document.getElementById('s-username').value.trim(),
                email: document.getElementById('s-email').value.trim(),
                phone: document.getElementById('s-phone').value.trim(),
                password: document.getElementById('s-pw').value
            };

            // 2. Show the "Surfing" Loading Dialogue
            const surfingModal = showSurfingDialogue("Creating Account...");

            try {
                // A. Check availability in App 2 (Registry)
                const userOk = await isAvailable("usernames", formData.username);
                const emailOk = await isAvailable("emails", formData.email);

                if (!userOk || !emailOk) {
                    surfingModal.remove();
                    alert("Username or Email is already taken.");
                    return;
                }

                // B. Create Auth Account in App 1 (Uttam Hub)
                // This will log the user in immediately upon success
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                // C. Write Profile Data to App 1 Firestore
                await setDoc(doc(db, "users", user.uid), {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    status: "verified", // Setting to verified immediately as per request
                    createdAt: new Date().toISOString()
                });

                // D. Permanent Lock in App 2
                await lockIdentity(formData.username, formData.email, "verified");

                // E. Success: Remove Modal and Redirect
                surfingModal.remove();
                redirectUser();

            } catch (error) {
                surfingModal.remove();
                alert("Registration Error: " + error.message);
                console.error("Signup failed:", error);
            }
        };
    }
});

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
            <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">Catching the wave...</p>
        </div>`;
    document.body.appendChild(modal);
    return modal;
}

/**
 * Handles Redirection to the Previous Page
 */
function redirectUser() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = "../../index.html";
    }
}