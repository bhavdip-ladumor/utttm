import { 
    auth, db, provider, signInWithPopup, onAuthStateChanged, signOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    sendPasswordResetEmail, doc, setDoc, getDoc, EmailAuthProvider, 
    reauthenticateWithCredential 
} from './auth-handler.js';

/* --- 1. SESSION & NAVIGATION LOGIC --- */
const referrer = document.referrer;
if (referrer && referrer.includes(window.location.hostname) && !referrer.includes('prf.html')) {
    localStorage.setItem("returnTo", referrer);
}

const redirectBack = () => {
    const destination = localStorage.getItem("returnTo") || "index.html";
    localStorage.removeItem("returnTo"); 
    window.location.href = destination;
};

/* --- 2. AUTH STATE OBSERVER & VIEW TOGGLE --- */
const authWrapper = document.querySelector('.prf-wrapper');
const dashboardView = document.getElementById('dashboard-view');
const loadingOverlay = document.getElementById('loading-overlay');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (authWrapper) authWrapper.classList.add('hidden');
        if (dashboardView) dashboardView.classList.remove('hidden');
        
        await loadUserProfile(user.uid);
        handleUrlTabs(); 
    } else {
        if (dashboardView) dashboardView.classList.add('hidden');
        if (authWrapper) authWrapper.classList.remove('hidden');
    }
    if (loadingOverlay) {
        loadingOverlay.classList.add('loader-hidden');
    }
});

/* --- 3. DASHBOARD LOGIC --- */

/* --- 3. DASHBOARD LOGIC (With Cache to Save Free Tier Reads) --- */

async function loadUserProfile(uid) {
    // 1. Try to get data from Local Storage first
    const cachedData = localStorage.getItem(`user_profile_${uid}`);
    
    if (cachedData) {
        console.log("Loading profile from Cache (Saved 1 Read)");
        applyDataToUI(JSON.parse(cachedData));
        // We don't stop here; we can still fetch from Firestore to ensure it's up to date
    }

    try {
        // 2. Fetch from Firestore (The actual "Read")
        const userDoc = await getDoc(doc(db, "users", uid));
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            
            // 3. Store in Local Storage for next time
            localStorage.setItem(`user_profile_${uid}`, JSON.stringify(data));
            
            // 4. Update the UI with fresh data
            applyDataToUI(data);
        }
    } catch (err) { 
        console.error("Load Error:", err); 
    }
}

// Helper function to keep code clean
function applyDataToUI(data) {
    const sidebarName = document.getElementById('p-sidebar-name');
    if (sidebarName) sidebarName.textContent = data.firstName || 'User';

    // Update Profile Pic
    const sidebarPic = document.getElementById('p-sidebar-pic');
    if (sidebarPic) {
        sidebarPic.src = data.photoURL || 'assets/default-user.png';
    }

    // Fill Profile Fields
    document.getElementById('p-fname').value = data.firstName || "";
    document.getElementById('p-lname').value = data.lastName || "";
    document.getElementById('p-username').value = data.username || "";
    document.getElementById('p-phone').value = data.phone || "";
    document.getElementById('p-dob').value = data.dob || "";
    document.getElementById('p-gender').value = data.gender || "";
    document.getElementById('p-study').value = data.study || "";
    document.getElementById('p-job').value = data.job || "";
    document.getElementById('p-job-status').value = data.jobStatus || "";
    document.getElementById('p-category').value = data.category || "";
    
    if (Array.isArray(data.interest)) {
        document.getElementById('p-interest').value = data.interest.join(', ');
    } else {
        document.getElementById('p-interest').value = data.interest || "";
    }

    // Fill Address Fields
    if (data.address) {
        document.getElementById('addr-house').value = data.address.house || "";
        document.getElementById('addr-society').value = data.address.society || "";
        document.getElementById('addr-street1').value = data.address.street1 || "";
        document.getElementById('addr-street2').value = data.address.street2 || "";
        document.getElementById('addr-area').value = data.address.area || "";
        document.getElementById('addr-landmark').value = data.address.landmark || "";
        document.getElementById('addr-city').value = data.address.city || "";
        document.getElementById('addr-state').value = data.address.state || "";
        document.getElementById('addr-pin').value = data.address.pincode || "";
    }
}

const handleUrlTabs = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile' || !tab) showTab('overview');
    else if (tab === 'orders') showTab('orders');
    else if (tab === 'shipping') showTab('shipping');
};

window.showTab = (tabId) => {
    document.querySelectorAll('.profile-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`${tabId}-section`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${tabId}'`)) {
            btn.classList.add('active');
        }
    });
};

/* --- 4. UI ACTIONS --- */

// SAVE PROFESSIONAL DETAILS (The one you asked about)

// SAVE PROFESSIONAL DETAILS
const updateProfileBtn = document.getElementById('btn-update-profile');
if (updateProfileBtn) {
    updateProfileBtn.onclick = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const passwordInput = document.getElementById('p-confirm-password');
        const isEmailUser = user.providerData.some(p => p.providerId === 'password');

        if (isEmailUser && (!passwordInput || !passwordInput.value)) {
            alert("Please enter your password to confirm changes.");
            return;
        }

        const originalText = updateProfileBtn.textContent;
        updateProfileBtn.textContent = "Processing...";
        updateProfileBtn.disabled = true;

        try {
            if (isEmailUser) {
                const credential = EmailAuthProvider.credential(user.email, passwordInput.value);
                await reauthenticateWithCredential(user, credential);
            }

            const interestRaw = document.getElementById('p-interest').value;
            const interestArray = interestRaw ? interestRaw.split(',').map(s => s.trim().toLowerCase()) : [];

            const updatedProfile = {
                firstName: document.getElementById('p-fname').value.trim(),
                lastName: document.getElementById('p-lname').value.trim(),
                phone: document.getElementById('p-phone').value.trim(),
                dob: document.getElementById('p-dob').value,
                gender: document.getElementById('p-gender').value,
                study: document.getElementById('p-study').value.trim(),
                job: document.getElementById('p-job').value.trim(),
                jobStatus: document.getElementById('p-job-status').value,
                category: document.getElementById('p-category').value,
                interest: interestArray
            };

            await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });

            // UPDATE CACHE
            const existingCache = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`)) || {};
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify({ ...existingCache, ...updatedProfile }));

            alert("Profile updated!");
            if (passwordInput) passwordInput.value = "";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            updateProfileBtn.textContent = originalText;
            updateProfileBtn.disabled = false;
        }
    };
}

// SAVE SHIPPING ADDRESS
const saveAddressBtn = document.getElementById('btn-save-address');
if (saveAddressBtn) {
    saveAddressBtn.onclick = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const passwordInput = document.getElementById('addr-confirm-password');
        const isEmailUser = user.providerData.some(p => p.providerId === 'password');

        if (isEmailUser && (!passwordInput || !passwordInput.value)) {
            alert("Please enter your password to save address.");
            return;
        }

        const originalText = saveAddressBtn.textContent;
        saveAddressBtn.textContent = "Verifying...";
        saveAddressBtn.disabled = true;

        try {
            if (isEmailUser) {
                const credential = EmailAuthProvider.credential(user.email, passwordInput.value);
                await reauthenticateWithCredential(user, credential);
            }

            const updatedAddress = {
                address: {
                    house: document.getElementById('addr-house').value.trim(),
                    society: document.getElementById('addr-society').value.trim(),
                    street1: document.getElementById('addr-street1').value.trim(),
                    street2: document.getElementById('addr-street2').value.trim(),
                    area: document.getElementById('addr-area').value.trim(),
                    landmark: document.getElementById('addr-landmark').value.trim(),
                    city: document.getElementById('addr-city').value.trim(),
                    state: document.getElementById('addr-state').value.trim(),
                    pincode: document.getElementById('addr-pin').value.trim()
                }
            };

            await setDoc(doc(db, "users", user.uid), updatedAddress, { merge: true });

            // UPDATE CACHE
            const existingCache = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`)) || {};
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify({ ...existingCache, ...updatedAddress }));

            alert("Shipping address updated!");
            if (passwordInput) passwordInput.value = "";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            saveAddressBtn.textContent = originalText;
            saveAddressBtn.disabled = false;
        }
    };
}

// Toggles & Forms
document.getElementById('go-to-signup').onclick = () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.remove('hidden');
};

document.getElementById('go-to-login').onclick = () => {
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
};

document.getElementById('btn-back').onclick = () => window.history.back();

const backDynamic = document.getElementById('btn-back-dynamic');
if (backDynamic) backDynamic.onclick = () => redirectBack();

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('l-identifier').value.trim();
    const pass = document.getElementById('l-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        redirectBack();
    } catch (err) { alert("Login Error: " + err.message); }
};

document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('s-email').value.trim();
    const pass = document.getElementById('s-password').value;
    if (loadingOverlay) loadingOverlay.classList.remove('loader-hidden');

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        const interestRaw = document.getElementById('s-interest').value.trim();
        const interestArray = interestRaw ? interestRaw.split(',').map(s => s.trim().toLowerCase()) : [];

        await setDoc(doc(db, "users", res.user.uid), {
            firstName: document.getElementById('s-fname').value.trim(),
            lastName: document.getElementById('s-lname').value.trim(),
            username: document.getElementById('s-username').value.trim(),
            email: email,
            phone: document.getElementById('s-phone').value.trim(),
            dob: document.getElementById('s-dob').value,
            gender: document.getElementById('s-gender').value,
            study: document.getElementById('s-study').value.trim(),
            job: document.getElementById('s-job').value.trim(),
            jobStatus: document.getElementById('s-job-status').value,
            category: document.getElementById('s-category').value,
            interest: interestArray,
            uid: res.user.uid,
            createdAt: new Date().toISOString(),
            isProfileComplete: true
        });

        redirectBack();
    } catch (err) {
        if (loadingOverlay) loadingOverlay.classList.add('loader-hidden');
        alert("Registration Failed: " + err.message);
    }
};

// GOOGLE AUTH
document.getElementById('btn-google').onclick = async () => {
    if (loadingOverlay) loadingOverlay.classList.remove('loader-hidden');
    try {
        const res = await signInWithPopup(auth, provider);
        const userRef = doc(db, "users", res.user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                firstName: res.user.displayName?.split(' ')[0] || "User",
                lastName: res.user.displayName?.split(' ').slice(1).join(' ') || "",
                email: res.user.email,
                photoURL: res.user.photoURL, // SAVE THE GOOGLE PHOTO URL HERE
                uid: res.user.uid,
                isProfileComplete: false,
                createdAt: new Date().toISOString()
            });
            alert("Google login successful! Please complete your profile.");
        } else {
            redirectBack();
        }
    } catch (err) {
        if (loadingOverlay) loadingOverlay.classList.add('loader-hidden');
        if (err.code !== 'auth/popup-closed-by-user') alert("Google Error: " + err.message);
    }
};

const logoutBtn = document.getElementById('p-logout');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await signOut(auth);
        localStorage.clear();
        window.location.href = "index.html";
    };
}