import { 
    auth, db, doc, setDoc, createUserWithEmailAndPassword, sendEmailVerification 
} from "../../auth-handler.js";

import { 
    db2, doc as doc2, setDoc as setDoc2 
} from "../../auth-check.js";
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();

            // 1. Capture All Data from log-in.html IDs
            const email = document.getElementById('s-email').value.trim();
            const formData = {
                firstName: document.getElementById('s-fname').value.trim(),
                lastName: document.getElementById('s-lname').value.trim(),
                username: document.getElementById('s-username').value.trim(),
                email: email,
                phone: document.getElementById('s-phone').value.trim(),
                password: document.getElementById('s-pw').value
            };

            try {
                // 2. Create Auth Account and Send Verification Mail
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await sendEmailVerification(userCredential.user);

                // 3. STORE EMAIL ID ONLY TO FIRESTORE (As you requested)
                // This creates a document with the user's ID containing ONLY their email
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email
                });

                // 4. STORE OTHER DATA IN LOCALSTORAGE
                // This keeps names, username, and phone out of the database for now
                localStorage.setItem('pending_reg_data', JSON.stringify(formData));

                // 5. Open Dialogue Box
                showVerificationDialogue(email, false);

            } catch (error) {
                alert("Error: " + error.message);
            }
        };
    }
});

function showVerificationDialogue(email, isRetry) {
    const existing = document.getElementById('v-modal'); //
    if (existing) existing.remove(); //

    const modal = document.createElement('div'); //
    modal.id = 'v-modal'; //
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 99999; color: #333; font-family: sans-serif;`; //
    
    const message = isRetry 
        ? `You are not verified. Sent mail on your Gmail ${email}, please click the link.` 
        : `Verification link was sent to ${email}. Check inbox or spam.`; //

    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; width: 320px;">
            <div style="font-size: 50px; color: ${isRetry ? '#dc3545' : '#007bff'}; margin-bottom: 20px;">
                <i class="fa-solid ${isRetry ? 'fa-circle-xmark' : 'fa-envelope-circle-check'}"></i>
            </div>
            <p style="margin-bottom: 25px; line-height: 1.5;">${message}</p>
            <button id="v-continue" style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Continue</button>
        </div>`; //
    
    document.body.appendChild(modal); //

    document.getElementById('v-continue').onclick = async () => {
        const btn = document.getElementById('v-continue'); //
        btn.disabled = true; //
        btn.textContent = "Checking..."; //

        try {
            await auth.currentUser.reload(); //
            
            if (auth.currentUser.emailVerified) { //
                const data = JSON.parse(localStorage.getItem('pending_reg_data')); //
                
                // --- UPDATE APP 2 REGISTRY FIRST ---
                await verifyInRegistry(data.username);
                // FINAL SUCCESS: Save all data to Firestore
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    email: data.email,
                    phone: data.phone,
                    status: "verified"
                }); //

                localStorage.removeItem('pending_reg_data'); //
                modal.remove(); //
                
                // REDIRECT: Use document.referrer to go back to the original page
                // If there is no referrer, it defaults to index.html
                window.location.href = document.referrer || "index.html"; //
            } else {
                showVerificationDialogue(email, true); //
            }
        } catch (err) {
            btn.disabled = false; //
            btn.textContent = "Continue"; //
        }
    };
}

async function verifyInRegistry(username) {
    // Use doc2 and db2 here
    const userRef = doc2(db2, "public_registry", "usernames", "entries", username.toLowerCase().trim());
   
    try {
        // Use setDoc2 here
        await setDoc2(userRef, { 
            status: "verified",
            updatedAt: new Date().toISOString() 
        }, { merge: true });
    } catch (e) {
        console.error("App 2 Update Failed:", e);
    }
}