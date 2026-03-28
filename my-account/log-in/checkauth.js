// checkauth.js
import { db2, doc, getDoc, setDoc, deleteDoc } from "../../auth-check.js";



/**
 * Checks if a username or email is available in the Registry
 */
export async function isAvailable(type, value) {
    if (!value) return true;
    const cleanValue = value.toLowerCase().trim();
    const docRef = doc(db2, "public_registry", type, "entries", cleanValue);
    
    try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) return true; // Brand new, available!

        const data = snap.data();

        // 1. If it's verified, it is PERMANENTLY taken
        if (data.status === "verified") return false;

        // 2. If it's pending, check if it's EXPIRED (Option 3)
        const createdAt = new Date(data.createdAt).getTime();
        const now = Date.now();
        const expiryTime = 720 * 60 * 1000; // 3 Minutes (or 8000 for your 8s test)

        if (data.status === "pending" && (now - createdAt) > expiryTime) {
            console.log("Found an expired pending name. Treating as AVAILABLE.");
            return true; // The 3 minutes passed, so someone else can take it!
        }

        // 3. Otherwise, it's still a fresh "pending" name
        return false; 

    } catch (e) {
        console.error("Lookup error:", e);
        return true; 
    }
}

async function storeRegistryData(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('s-email');
    const usernameInput = document.getElementById('s-username');
    if (!emailInput || !usernameInput) return;

    const emailValue = emailInput.value.trim().toLowerCase();
    const usernameValue = usernameInput.value.trim().toLowerCase();

    // References for App 2
    const emailRef = doc(db2, "public_registry", "emails", "entries", emailValue);
    const userRef = doc(db2, "public_registry", "usernames", "entries", usernameValue);

    try {
        await Promise.all([
            // Save Email
            setDoc(emailRef, {
                email: emailValue,
                status: "verified",
                createdAt: new Date().toISOString()
            }),
            // Save Username as PENDING
            setDoc(userRef, {
                username: usernameValue,
                status: "pending",
                createdAt: new Date().toISOString()
            })
        ]);
    } catch (e) {
        // Quiet failure
    }
}

async function startCleanupTimer(usernameValue) {
    const userRef = doc(db2, "public_registry", "usernames", "entries", usernameValue.toLowerCase().trim());

    setTimeout(async () => {
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().status === "pending") {
            await deleteDoc(userRef); 
            console.log("Cleanup Success");
        }
    }, 3600000); 
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', storeRegistryData);
}

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
        
        if (signupForm.contains(input)) checkFormValidity();
    };

    const checkFormValidity = () => {
        if (submitBtn) {
            submitBtn.disabled = !(isUserValid && isEmailValid);
            submitBtn.style.opacity = submitBtn.disabled ? "0.5" : "1";
        }
    };

    // --- LIVE USERNAME CHECK (Signup) ---
    if (usernameInput) {
        usernameInput.addEventListener('input', async (e) => {
            const val = e.target.value.trim();
            if (val.length < 3) {
                isUserValid = false;
                setStatus(usernameInput, "Min 3 characters", true);
                return;
            }
            setStatus(usernameInput, "", false, true);
            const available = await isAvailable("usernames", val);
            isUserValid = available;
            setStatus(usernameInput, available ? "Username is available" : "Username is taken", !available);
        });
    }

    // --- LIVE EMAIL CHECK (Signup) ---
    if (emailInput) {
        emailInput.addEventListener('input', async (e) => {
            const val = e.target.value.trim();
            if (!val.endsWith('@gmail.com')) {
                isEmailValid = false;
                setStatus(emailInput, "Must end with @gmail.com", true);
                return;
            }
            setStatus(emailInput, "", false, true);
            const available = await isAvailable("emails", val);
            isEmailValid = available;
            setStatus(emailInput, available ? "Email is available" : "Email is taken", !available);
        });
    }

    // --- 4. LIVE FORGOT PASSWORD CHECK (Dynamic) ---
    // Uses Event Delegation because the Reset Modal is added later by logintab.js
    document.addEventListener('input', async (e) => {
        if (e.target && e.target.id === 'reset-identifier') {
            const input = e.target;
            const val = input.value.trim();
            const confirmBtn = document.getElementById('confirm-reset');
            
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = "0.5";
            }

            if (val.length < 3) {
                setStatus(input, "Enter at least 3 chars", true);
                return;
            }

            setStatus(input, "", false, true); // Small Surfing

            // Check if it's an email or username for App 2 Registry
            const type = val.includes('@') ? "emails" : "usernames";
            const available = await isAvailable(type, val);

            // Logic: For Reset, "Not Available" means "Account Exists" (Found)
            if (!available) {
                setStatus(input, "Account Found", false);
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = "1";
                }
            } else {
                setStatus(input, "Account does not exist", true);
            }
        }
    });

    // --- REGISTRATION LOGIC ---
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const surfingModal = showGlobalSurfing("Creating Account...");
            try {
                const username = usernameInput.value.trim();
                const email = emailInput.value.trim();
                await storeRegistryData(e);
                startCleanupTimer(username);
                surfingModal.remove();
                alert("Account Registered in Registry!");
            } catch (error) {
                surfingModal.remove();
                console.error("Write error:", error);
                alert("Registration failed.");
            }
        };
    }
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