import { db } from '../../auth-handler.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const loginOverlay = document.getElementById('loginOverlay');
const mainDashboard = document.getElementById('mainDashboard');
const loginForm = document.getElementById('masterLoginForm');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');

/**
 * 1. AUTO-LOGIN CHECK (Runs immediately on page load)
 * This checks LocalStorage to see if you previously logged in.
 */
window.addEventListener('DOMContentLoaded', () => {
    const isAuth = localStorage.getItem('is_admin_auth');
    
    if (isAuth === 'true') {
        console.log("Admin session detected. Access granted.");
        // Hide login box and show the dashboard
        if (loginOverlay) loginOverlay.classList.add('dashboard-hidden');
        if (mainDashboard) mainDashboard.classList.remove('dashboard-hidden');
        
        // Tell other scripts (like order-monitor.js) that it's safe to load data
        window.dispatchEvent(new CustomEvent('authSuccess'));
    }
});

/**
 * 2. LOGIN FORM SUBMISSION
 */
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    
    loginBtn.disabled = true;
    loginBtn.innerText = "Verifying...";
    errorMsg.style.display = 'none';

    const inputId = document.getElementById('adminId').value;
    const inputPw = document.getElementById('adminPw').value;

    try {
        // Fetch credentials from the private Firestore collection
        const adminDoc = await getDoc(doc(db, "admins", "master_access"));

        if (adminDoc.exists()) {
            const data = adminDoc.data();
            
            // Compare input with Firestore data
            if (inputId === data.adminId && inputPw === data.password) {
                // Success: Hide login, show dashboard
                loginOverlay.classList.add('dashboard-hidden');
                mainDashboard.classList.remove('dashboard-hidden');
                
                // SAVE TO LOCAL STORAGE (Stay logged in forever until Logout is clicked)
                localStorage.setItem('is_admin_auth', 'true');
                
                // Trigger data loading
                window.dispatchEvent(new CustomEvent('authSuccess'));
            } else {
                showError("Invalid ID or Password.");
            }
        } else {
            showError("Security Error: Admin configuration not found.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        showError("Connection failed. Check your internet.");
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerText = "Initialize Workshop";
    }
};

/**
 * 3. ERROR HELPER
 */
function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = 'block';
}

/**
 * 4. LOGOUT LOGIC
 */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        // Remove the permanent flag
        localStorage.removeItem('is_admin_auth');
        // Reload to show the login screen again
        location.reload();
    };
}
