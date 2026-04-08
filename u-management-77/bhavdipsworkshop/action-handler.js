import { db } from '../../auth-handler.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

window.updateBucketStatus = async (docId, storeId, newStatus) => {
    const ref = doc(db, "orders", docId);
    try {
        await updateDoc(ref, {
            [`status.${storeId}`]: newStatus
        });
    } catch (e) { console.error(e); }
};

window.updateBucketNote = async (docId, storeId, note) => {
    const ref = doc(db, "orders", docId);
    try {
        await updateDoc(ref, {
            [`ownerNotes.${storeId}`]: note
        });
    } catch (e) { console.error(e); }
};