import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, signOut } from "../../auth-handler.js";

/**
 * Fetches user data from Firestore and updates the Top Header Card
 */
async function updateHeaderUI(user) {
    const fullNameElement = document.getElementById('full-name');
    const usernameDisplay = document.getElementById('username-display');
    const userAvatar = document.getElementById('user-avatar');

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();

            // 1. Update Full Name (Combining First and Last)
            const firstName = data.firstName || "User";
            const lastName = data.lastName || "";
            fullNameElement.innerText = `${firstName} ${lastName}`.trim();

            // 2. Update Username
            if (data.username) {
                usernameDisplay.innerText = `@${data.username}`;
            }

            // 3. Update Profile Picture
            // If they have a custom photoURL in DB, use it; otherwise, use Firebase Auth photo or default
            const photoSrc = data.profilePic || user.photoURL || "../../assets/default-user.png";
            userAvatar.src = photoSrc;
            
        } else {
            // Fallback for new users who haven't set a name in Firestore yet
            fullNameElement.innerText = user.displayName || "New Member";
            userAvatar.src = user.photoURL || "../../assets/default-user.png";
        }
    } catch (error) {
        console.error("Error fetching header data:", error);
    }
}

// --- INITIALIZE AUTH LISTENER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, update the header
        updateHeaderUI(user);
    } else {
        // No user is signed in, redirect to login if necessary
        console.log("No user detected. Redirecting...");
        // window.location.href = "../../login.html"; 
    }
});


// for First section==============================================================================
// --- 1. UI ELEMENTS ---
const elements = {
    firstName: document.getElementById('display-firstname'),
    lastName: document.getElementById('display-lastname'),
    username: document.getElementById('display-username'),
    email: document.getElementById('display-email'),
    mobile: document.getElementById('display-mobile'),
    editBtn: document.getElementById('btn-edit-account'),
    resetPwdBtn: document.getElementById('btn-reset-password')
};

let isEditMode = false;

// --- 2. FETCH & FILL FORM ---
async function fetchAccountData(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Fill inputs
            elements.firstName.value = data.firstName || "";
            elements.lastName.value = data.lastName || "";
            elements.username.value = data.username || "Not Set";
            elements.email.value = user.email || data.email || "";
            elements.mobile.value = data.mobile || "";
        } else {
            // New user fallback: Use email from Auth if DB is empty
            elements.email.value = user.email;
        }
    } catch (error) {
        console.error("Error loading account data:", error);
    }
}

// --- 3. TOGGLE EDIT / SAVE LOGIC ---
async function handleAccountAction() {
    const user = auth.currentUser;
    if (!user) return;

    if (!isEditMode) {
        // Switch to EDIT MODE
        isEditMode = true;
        elements.editBtn.innerText = "Save Changes";
        elements.editBtn.style.background = "#27ae60"; // Success Green
        
        // Enable only allowed fields
        elements.firstName.removeAttribute('readonly');
        elements.lastName.removeAttribute('readonly');
        elements.mobile.removeAttribute('readonly');
        
        elements.firstName.focus();
    } else {
        // Switch to SAVE MODE
        try {
            const userRef = doc(db, "users", user.uid);
            
            // Update Firestore (merging ensures we don't delete username/email)
            await setDoc(userRef, {
                firstName: elements.firstName.value.trim(),
                lastName: elements.lastName.value.trim(),
                mobile: elements.mobile.value.trim()
            }, { merge: true });

            alert("Profile updated successfully!");
            
            // Re-lock fields
            lockFields();
            
            // Force update the Header UI (from the previous task)
            if (typeof updateHeaderUI === 'function') updateHeaderUI(user);

        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save changes.");
        }
    }
}

function lockFields() {
    isEditMode = false;
    elements.editBtn.innerText = "Edit Account Details";
    elements.editBtn.style.background = "#1e3c72"; // Back to Blue
    
    elements.firstName.setAttribute('readonly', true);
    elements.lastName.setAttribute('readonly', true);
    elements.mobile.setAttribute('readonly', true);
}

// --- 4. INITIALIZE ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchAccountData(user);
        
        // Attach Event Listeners
        elements.editBtn.addEventListener('click', handleAccountAction);
        
        // Reset Password logic
        elements.resetPwdBtn.addEventListener('click', () => {
            alert("Password reset email sent to: " + user.email);
            // import { sendPasswordResetEmail } from "../../auth-handler.js";
            // sendPasswordResetEmail(auth, user.email);
        });
    }
});


// --- 1. SHIPPING UI ELEMENTS ---==========================================================
const shipElements = {
    form: document.getElementById('shipping-address-form'),
    fname: document.getElementById('ship-fname'),
    lname: document.getElementById('ship-lname'),
    mobile: document.getElementById('ship-mobile'),
    email: document.getElementById('ship-email'),
    address1: document.getElementById('ship-address1'),
    society: document.getElementById('ship-society'),
    street: document.getElementById('ship-street'),
    area: document.getElementById('ship-area'),
    landmark: document.getElementById('ship-landmark'),
    pincode: document.getElementById('ship-pincode'),
    city: document.getElementById('ship-city'),
    state: document.getElementById('ship-state'),
    other1: document.getElementById('ship-other1'),
    artistNote: document.getElementById('ship-artist-note')
};

// --- 2. AUTO-FILL SHIPPING FORM ---
async function fetchShippingData(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            
            // USE THE CORRECT KEY FROM YOUR DATABASE
            const s = data.shippingAddress; 

            if (s) {
                // Section 1: Personal
                shipElements.fname.value = s.fname || "";
                shipElements.lname.value = s.lname || "";
                shipElements.mobile.value = s.mobile || "";
                shipElements.email.value = s.email || "";

                // Section 2: Address (Matching your DB exactly)
                shipElements.address1.value = s.address1 || "";
                shipElements.society.value = s.society || "";
                shipElements.street.value = s.street || "";
                shipElements.area.value = s.area || "";
                shipElements.landmark.value = s.landmark || "";
                shipElements.pincode.value = s.pincode || "";
                shipElements.city.value = s.city || "";
                shipElements.state.value = s.state || "";
                
                // Section 3: Special Note
                // In your DB you use 'discovery', mapping it to 'other1' or artistNote
                shipElements.other1.value = s.discovery || ""; 
            }
        }
    } catch (error) {
        console.error("Error loading shipping data:", error);
    }
}

// --- 3. SAVE SHIPPING DATA ---
async function saveShippingData(e) {
    e.preventDefault(); // Prevent page refresh
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.getElementById('btn-save-shipping');
    btn.innerText = "Updating...";
    btn.disabled = true;

    try {
        const userRef = doc(db, "users", user.uid);
        
        const shippingDetails = {
            fname: shipElements.fname.value.trim(),
            lname: shipElements.lname.value.trim(),
            mobile: shipElements.mobile.value.trim(),
            email: shipElements.email.value.trim(),
            address1: shipElements.address1.value.trim(),
            society: shipElements.society.value.trim(),
            street: shipElements.street.value.trim(),
            area: shipElements.area.value.trim(),
            landmark: shipElements.landmark.value.trim(),
            pincode: shipElements.pincode.value.trim(),
            city: shipElements.city.value.trim(),
            state: shipElements.state.value.trim(),
            other1: shipElements.other1.value.trim(),
            artistNote: shipElements.artistNote.value.trim(),
            lastUpdated: new Date().toISOString()
        };

        await setDoc(userRef, { 
        shippingAddress: shippingDetails // Change this from 'shippingDetails' to 'shippingAddress'
        }, { merge: true });

        localStorage.setItem('user_checkout_details', JSON.stringify(shippingDetails));
        alert("Shipping address updated successfully!");
        
    } catch (error) {
        console.error("Error saving shipping:", error);
        alert("Failed to save shipping details.");
    } finally {
        btn.innerText = "Update Shipping Details";
        btn.disabled = false;
    }
}

// --- 4. INITIALIZE ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchShippingData(user);
        shipElements.form.addEventListener('submit', saveShippingData);
    }
});

// ============================================================================
//  sing out
const logoutBtn = document.getElementById('btn-logout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            // 1. Sign out from Firebase
            await signOut(auth);

            // 2. Erase everything from Local Storage
            localStorage.clear();

            // 3. Optional: Clear Session Storage just in case
            sessionStorage.clear();

            console.log("User signed out and local data erased.");

            // 4. Redirect to login page or home
            // Adjust the path based on your folder structure
            window.location.href = '../log-in/log-in.html'; 

        } catch (error) {
            console.error("Error during sign out:", error);
            alert("Failed to sign out. Please try again.");
        }
    });
}
