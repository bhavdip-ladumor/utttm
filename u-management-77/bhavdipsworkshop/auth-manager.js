import { db } from '../../auth-handler.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const loginOverlay = document.getElementById('loginOverlay');
const mainDashboard = document.getElementById('mainDashboard');
const loginForm = document.getElementById('masterLoginForm');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    
    // Disable button to prevent double-clicks
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
                loginOverlay.classList.add('dashboard-hidden');
                mainDashboard.classList.remove('dashboard-hidden');
                
                // Save a temporary session flag (optional)
                sessionStorage.setItem('is_admin_auth', 'true');
                
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

function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = 'block';
}

document.getElementById('logoutBtn').onclick = () => {
    sessionStorage.removeItem('is_admin_auth');
    location.reload();
};