import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from '../../auth-handler.js';

const personalForm = document.getElementById('personal-info-form');
const statusSelect = document.getElementById('p-status');

// 1. DYNAMIC UI TOGGLE
statusSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    document.querySelectorAll('.dynamic-fields').forEach(div => div.classList.add('hidden'));
    
    if(value === 'student') document.getElementById('fields-student').classList.remove('hidden');
    if(value === 'professional') document.getElementById('fields-professional').classList.remove('hidden');
    if(value === 'searching') document.getElementById('fields-searching').classList.remove('hidden');
});

// 2. LOAD DATA
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // First, check LocalStorage for quick load
        const cached = localStorage.getItem(`user_profile_${user.uid}`);
        if (cached) fillForm(JSON.parse(cached));

        // Then fetch fresh from Firestore
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            fillForm(data);
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(data));
        }
    }
});

function fillForm(data) {
    document.getElementById('p-fname').value = data.firstName || '';
    document.getElementById('p-lname').value = data.lastName || '';
    document.getElementById('p-email').value = data.email || '';
    document.getElementById('p-phone-primary').value = data.mobile || '';
    
    document.getElementById('p-phone-secondary').value = data.secondaryPhone || '';
    document.getElementById('p-gender').value = data.gender || '';
    document.getElementById('p-dob').value = data.dob || '';
    document.getElementById('p-status').value = data.status || '';
    
    // Trigger the change event to show the correct sub-fields
    statusSelect.dispatchEvent(new Event('change'));

    // Fill sub-fields
    if(data.status === 'student') {
        document.getElementById('p-study-course').value = data.course || '';
        document.getElementById('p-study-problem').value = data.studyProblem || '';
        document.getElementById('p-study-future').value = data.futureGoal || '';
    } else if (data.status === 'professional') {
        document.getElementById('p-job-role').value = data.jobRole || '';
        document.getElementById('p-job-problem').value = data.jobProblem || '';
        document.getElementById('p-is-hiring').checked = data.isHiring || false;
    } else if (data.status === 'searching') {
        document.getElementById('p-search-target').value = data.targetRole || '';
        document.getElementById('p-resume-link').value = data.resumeLink || '';
        document.getElementById('p-search-problem').value = data.searchProblem || '';
    }
}

// 3. SECURE SAVE
personalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Please sign in.");

    // Simple Sanitization Function
    const clean = (str) => str.replace(/<[^>]*>?/gm, '').trim();

    const updatedData = {
        secondaryPhone: clean(document.getElementById('p-phone-secondary').value),
        gender: document.getElementById('p-gender').value,
        dob: document.getElementById('p-dob').value,
        status: document.getElementById('p-status').value,
        lastUpdated: new Date().toISOString()
    };

    // Add dynamic fields based on status
    if (updatedData.status === 'student') {
        updatedData.course = clean(document.getElementById('p-study-course').value);
        updatedData.studyProblem = clean(document.getElementById('p-study-problem').value);
        updatedData.futureGoal = clean(document.getElementById('p-study-future').value);
    } else if (updatedData.status === 'professional') {
        updatedData.jobRole = clean(document.getElementById('p-job-role').value);
        updatedData.jobProblem = clean(document.getElementById('p-job-problem').value);
        updatedData.isHiring = document.getElementById('p-is-hiring').checked;
    } else if (updatedData.status === 'searching') {
        updatedData.targetRole = clean(document.getElementById('p-search-target').value);
        updatedData.resumeLink = clean(document.getElementById('p-resume-link').value);
        updatedData.searchProblem = clean(document.getElementById('p-search-problem').value);
    }

    try {
        // Save to Firestore (Merge: true ensures we don't delete their name/email)
        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
        
        // Save to LocalStorage
        const fullCache = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || '{}');
        localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify({...fullCache, ...updatedData}));

        alert("Profile Updated Successfully!");
    } catch (err) {
        console.error(err);
        alert("Error updating profile.");
    }
});