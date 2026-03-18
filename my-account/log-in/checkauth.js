import { isAvailable, lockIdentity } from "../../auth-check.js";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const usernameInput = document.getElementById('s-username');
    const emailInput = document.getElementById('s-email');
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    // Track state to manage button blocking
    let isUserValid = false;
    let isEmailValid = false;

    /**
     * Helper to show small status message under inputs
     */
    const setStatus = (input, message, isError, isLoading = false) => {
        let statusEl = input.nextElementSibling;
        if (!statusEl || !statusEl.classList.contains('status-msg')) {
            statusEl = document.createElement('div');
            statusEl.className = 'status-msg';
            input.parentNode.insertBefore(statusEl, input.nextSibling);
        }

        statusEl.style.fontSize = "12px";
        statusEl.style.marginTop = "5px";
        statusEl.style.textAlign = "left";
        
        if (isLoading) {
            statusEl.style.color = "#007bff";
            statusEl.innerHTML = '<i class="fa-solid fa-person-surfing fa-bounce"></i> Checking...';
        } else {
            statusEl.style.color = isError ? "red" : "green";
            statusEl.textContent = message;
        }
        
        checkFormValidity();
    };

    const checkFormValidity = () => {
        submitBtn.disabled = !(isUserValid && isEmailValid);
        submitBtn.style.opacity = submitBtn.disabled ? "0.5" : "1";
    };

    // --- LIVE USERNAME CHECK ---
    usernameInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (val.length < 3) {
            isUserValid = false;
            setStatus(usernameInput, "Min 3 characters", true);
            return;
        }

        setStatus(usernameInput, "", false, true); // Show Surfing

        const available = await isAvailable("usernames", val);
        isUserValid = available;
        setStatus(usernameInput, available ? "Username is available" : "Username is taken", !available);
    });

    // --- LIVE EMAIL CHECK ---
    emailInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (!val.endsWith('@gmail.com')) {
            isEmailValid = false;
            setStatus(emailInput, "Must end with @gmail.com", true);
            return;
        }


                

        setStatus(emailInput, "", false, true); // Show Surfing

        const available = await isAvailable("emails", val);
        isEmailValid = available;
        setStatus(emailInput, available ? "Email is available" : "Email is taken", !available);
    });

    // --- FINAL REGISTRATION WRITE ---
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        
        // Show Global Surfing Modal
        const surfingModal = showGlobalSurfing("Creating Account...");
        
        try {
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();

            // Store in auth-check.js database (App 2) to prevent duplicates
            await lockIdentity(username, email, "verified");

            surfingModal.remove();
            alert("Account Registered in Registry!");
            
        
        } catch (error) {
            surfingModal.remove();
            console.error("Write error:", error);
            alert("Registration failed.");
        }
    };
});

function showGlobalSurfing(text) {
    const modal = document.createElement('div');
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; color: white; flex-direction: column; font-family: sans-serif;`;
    modal.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px;"><i class="fa-solid fa-person-surfing fa-bounce"></i></div>
        <h3>${text}</h3>`;
    document.body.appendChild(modal);
    return modal;
}