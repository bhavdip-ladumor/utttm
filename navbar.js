import { auth, onAuthStateChanged, signOut, db, doc, getDoc } from './auth-handler.js';

onAuthStateChanged(auth, async (user) => {
    const nameText = document.getElementById('nav-user-name');
    const userPic = document.getElementById('nav-user-pic');
    const dropdown = document.getElementById('nav-dropdown');
    const profileLink = document.getElementById('nav-profile-link');

    if (user) {
        // --- DATA RETRIEVAL LOGIC ---
        let displayName = "Customer";
        let displayPhoto = "assets/default-user.png";

        // 1. Try to get from LocalStorage Cache first (fastest)
        const cachedProfile = localStorage.getItem(`user_profile_${user.uid}`);
        
        if (cachedProfile) {
            const data = JSON.parse(cachedProfile);
            // Use registered name, otherwise fallback to Google name
            displayName = data.firstName || data.lastName || user.displayName?.split(' ')[0] || "User";
            displayPhoto = data.photoURL || user.photoURL || "assets/default-user.png";
        } else {
            // 2. If no cache, try to fetch from App 1 Firestore (Uttam Hub)
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    displayName = data.firstName || data.lastName || user.displayName?.split(' ')[0] || "User";
                    displayPhoto = data.photoURL || user.photoURL || "assets/default-user.png";
                    // Update cache for next time
                    localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(data));
                } else {
                    // 3. Fallback for pure Google users with no Firestore record yet
                    displayName = user.displayName?.split(' ')[0] || "User";
                    displayPhoto = user.photoURL || "assets/default-user.png";
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                displayName = user.displayName?.split(' ')[0] || "User";
                displayPhoto = user.photoURL || "assets/default-user.png";
            }
        }

        // --- UPDATE UI ---
        if (nameText) nameText.textContent = ` ${displayName}`;
        if (userPic) userPic.src = displayPhoto;

        // Toggle Dropdown Logic
        if (profileLink) {
            profileLink.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown?.classList.toggle('hidden');
            };
        }

    } else {
        // --- LOGGED OUT STATE ---
        if (nameText) nameText.textContent = "Sign In";
        if (userPic) userPic.src = "assets/default-user.png";
        if (profileLink) profileLink.onclick = null; 
    }
});

// Click outside to close dropdown
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('nav-dropdown');
    const profileContainer = document.querySelector('.profile-nav-container');
    if (profileContainer && !profileContainer.contains(e.target)) {
        dropdown?.classList.add('hidden');
    }
});

/** --- GLOBAL LOGOUT --- **/
document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        localStorage.clear();
        window.location.reload(); 
    });
});

// --- TAB AUTO-SELECTOR FROM URL ---
// --- TAB AUTO-SELECTOR FROM URL ---
/** --- URL TAB HANDLER --- **/
/** --- URL TAB HANDLER (Inside navbar.js) --- **/
function initTabFromUrl() {
    // 1. Check if we are actually on the profile page
    // This prevents errors on index.html or other pages
    if (!window.location.pathname.includes('profile.html')) {
        return; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tabToOpen = urlParams.get('tab');

    if (tabToOpen) {
        console.log("Profile Page detected. Opening tab:", tabToOpen);

        // 2. Find the button in the profile's sidebar/nav
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabToOpen}"]`);

        if (targetBtn) {
            // 3. Wait 300ms to make sure profile-manage.js has loaded its tabs
            setTimeout(() => {
                // Remove 'active' from all buttons to be safe
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                
                // Click the button and make it blue/active
                targetBtn.click();
                targetBtn.classList.add('active');
                
                // Scroll to the content for mobile users
                targetBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }
}

// Keep this at the bottom of navbar.js
document.addEventListener('DOMContentLoaded', initTabFromUrl);
