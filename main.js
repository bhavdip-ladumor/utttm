// root/main.js
import { 
    auth, db, onAuthStateChanged, doc, getDoc, setDoc, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, signOut,
    provider, signInWithPopup 
} from './auth-handler.js';

/** --- 1. UI ELEMENT REFERENCES --- **/
const authModal = document.getElementById('auth-modal');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const profilePage = document.getElementById('profile-page');
const homeContent = document.getElementById('home-content'); 

/** --- NEW: TRIGGER FOR SIGN IN BUTTON --- **/
document.getElementById('login-btn')?.addEventListener('click', () => {
    authModal.classList.remove('hidden');
    // Ensure the login tab is active by default
    tabLogin.click(); 
});

/** --- 2. AUTH STATE OBSERVER --- **/
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('login-btn')?.classList.add('hidden');
        document.getElementById('profile-btn')?.classList.remove('hidden');
        
        const photo = user.photoURL || 'assets/default-user.png';
        document.getElementById('user-photo').src = photo;
        document.getElementById('p-sidebar-pic').src = photo;
        document.getElementById('drop-email').textContent = user.email;

        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            updateUINames(data);
            fillProfileForm(data);
        }
    } else {
        document.getElementById('login-btn')?.classList.remove('hidden');
        document.getElementById('profile-btn')?.classList.add('hidden');
        profilePage?.classList.add('hidden');
        homeContent?.classList.remove('hidden');
    }
});

/** --- 3. AUTH TAB SWITCHING --- **/
tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

tabSignup?.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

/** --- 4. SIGNUP & LOGIN LOGIC --- **/
signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('s-email').value;
    const password = document.getElementById('s-pw').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const userData = {
            firstName: document.getElementById('s-fname').value,
            lastName: document.getElementById('s-lname').value,
            phone: document.getElementById('s-phone').value,
            address: { house: document.getElementById('s-address').value },
            email: email,
            uid: res.user.uid,
            joinedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", res.user.uid), userData);
        authModal.classList.add('hidden');
        alert("Account Created Successfully!");
    } catch (err) { alert(err.message); }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pw').value);
        authModal.classList.add('hidden');
    } catch (err) { alert("Invalid Credentials"); }
});

/** --- 5. PROFILE UPDATES (RE-AUTH) --- **/
document.getElementById('btn-update-profile')?.addEventListener('click', () => {
    document.getElementById('reauth-modal').classList.remove('hidden');
});

document.getElementById('btn-confirm-reauth')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const pw = document.getElementById('reauth-password').value;
    if(!pw) return alert("Password required");

    try {
        const credential = EmailAuthProvider.credential(user.email, pw);
        await reauthenticateWithCredential(user, credential);
        
        const updatedData = {
            firstName: document.getElementById('p-fname').value,
            lastName: document.getElementById('p-lname').value,
            phone: document.getElementById('p-phone').value,
            address: {
                house: document.getElementById('addr-house').value,
                street: document.getElementById('addr-street').value,
                area: document.getElementById('addr-area').value,
                city: document.getElementById('addr-city').value,
                pin: document.getElementById('addr-pin').value
            }
        };

        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
        alert("Profile Updated!");
        document.getElementById('reauth-modal').classList.add('hidden');
        updateUINames(updatedData);
    } catch (err) { alert("Error: " + err.message); }
});

/** --- 6. HELPERS --- **/
function updateUINames(data) {
    const fullName = `${data.firstName} ${data.lastName}`;
    document.getElementById('user-display-name').textContent = data.firstName;
    document.getElementById('drop-name').textContent = fullName;
    document.getElementById('p-sidebar-name').textContent = fullName;
}

function fillProfileForm(data) {
    document.getElementById('p-fname').value = data.firstName || "";
    document.getElementById('p-lname').value = data.lastName || "";
    document.getElementById('p-phone').value = data.phone || "";
    document.getElementById('addr-house').value = data.address?.house || "";
    document.getElementById('addr-street').value = data.address?.street || "";
    document.getElementById('addr-city').value = data.address?.city || "";
}

/* --- EXPOSE GLOBALS --- */
window.closeAuth = () => authModal.classList.add('hidden');

window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        await setDoc(doc(db, "users", result.user.uid), {
            firstName: result.user.displayName.split(' ')[0],
            email: result.user.email
        }, { merge: true });
        authModal.classList.add('hidden');
    } catch (e) { alert(e.message); }
};

document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth).then(() => location.reload()));
document.getElementById('p-logout')?.addEventListener('click', () => signOut(auth).then(() => location.reload()));

document.querySelector('a[href="#profile"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    homeContent?.classList.add('hidden');
    profilePage?.classList.remove('hidden');
});

/** --- PROFILE NAVIGATION LOGIC --- **/

// Function to close the profile full screen
window.closeProfile = () => {
    const profilePage = document.getElementById('profile-page');
    const homeContent = document.getElementById('home-content');

    profilePage.classList.add('hidden');
    homeContent?.classList.remove('hidden'); // Show home content again
    
    // Restore scrolling on the main body
    document.body.style.overflow = 'auto';
};

// Update your Profile Link trigger to stop background scrolling
document.querySelector('a[href="#profile"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('profile-page').classList.remove('hidden');
    document.getElementById('home-content')?.classList.add('hidden');
    
    // Prevent the background home page from scrolling
    document.body.style.overflow = 'hidden';
});