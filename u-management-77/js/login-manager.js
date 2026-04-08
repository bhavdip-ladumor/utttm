import { db } from '../../auth-handler.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const loginForm = document.getElementById('ownerLoginForm');
const errorMsg = document.getElementById('errorMsg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const inputId = document.getElementById('ownerId').value.trim();
    const inputCode = document.getElementById('ownerCode').value.trim();

    try {
        const storeRef = doc(db, "stores", inputId);
        const storeSnap = await getDoc(storeRef);

        if (storeSnap.exists()) {
            const storeData = storeSnap.data();

            if (storeData.access_code === inputCode) {
                // Save to session so the dashboard knows who is logged in
                sessionStorage.setItem('ownerLoggedIn', 'true');
                sessionStorage.setItem('targetStore', storeData.name);
                
                // Hide login and show dashboard
                document.getElementById('loginOverlay').style.display = 'none';
                document.getElementById('mainDashboard').classList.remove('dashboard-hidden');
                
                // SEND SIGNAL TO portal-logic.js
                window.dispatchEvent(new CustomEvent('initDashboard', { detail: storeData }));
            } else {
                throw new Error("Invalid Code");
            }
        } else {
            throw new Error("Owner ID not found");
        }
    } catch (error) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = error.message;
    }
});