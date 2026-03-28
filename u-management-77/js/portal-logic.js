import { db } from '../../auth-handler.js';
import { 
    doc, collection, query, onSnapshot, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const orderGrid = document.getElementById('orderGrid');
const storeTitle = document.getElementById('storeTitle');

// --- 1. DASHBOARD INITIALIZATION ---
window.addEventListener('initDashboard', (e) => {
    const storeData = e.detail;
    storeTitle.innerText = storeData.name;
    
    // Using the Store ID for filtering (e.g., "Resin-cosmos-store")
    const storeIdForLookup = storeData.id || "Resin-cosmos-store"; 
    startOrderListener(storeIdForLookup);
});

// --- 2. LIVE ORDER LISTENER ---
function startOrderListener(targetStoreId) {
    const q = query(collection(db, "orders"));

    onSnapshot(q, (snapshot) => {
        orderGrid.innerHTML = '';
        let foundAny = false;

        snapshot.forEach((orderDoc) => {
            const order = orderDoc.data();
            const docId = orderDoc.id;
            
            // Check if this store has a status entry in this order
            if (order.status && order.status[targetStoreId]) {
                foundAny = true;
                const myStatus = order.status[targetStoreId];
                
                // Filter items to only show products belonging to THIS store
                const myItems = order.items.filter(item => item.storeId === targetStoreId);
                
                const card = document.createElement('div');
                card.className = `order-card status-${myStatus.toLowerCase()}`;
                
                card.innerHTML = `
                    <div class="order-details">
                        <span class="order-id">Global ID: #${order.orderId || docId.slice(-6)}</span>
                        <h3>Customer: ${order.customer?.fname || 'Guest'}</h3>
                        
                        <div class="item-list">
                            ${myItems.map(i => `
                                <div class="item-row">
                                    <i class="fa fa-check-circle" style="color: var(--accent-gold)"></i> 
                                    <span>${i.name} (x${i.quantity})</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="note-section">
                            <label>Owner Note:</label>
                            <textarea id="note-${docId}" placeholder="e.g. '2 items ready, 1 delayed by 2 days'">${order.ownerNotes?.[targetStoreId] || ''}</textarea>
                        </div>
                        
                        <div class="current-status-badge">${myStatus}</div>
                    </div>

                    <div class="order-actions">
                        ${myStatus === 'pending' ? `
                            <button class="btn-accept" onclick="processOrder('${docId}', '${targetStoreId}', 'Accepted')">Accept Order</button>
                            <button class="btn-reject" onclick="processOrder('${docId}', '${targetStoreId}', 'Rejected')">Reject</button>
                        ` : ''}
                        
                        ${myStatus === 'Accepted' ? `
                            <button class="btn-done" onclick="processOrder('${docId}', '${targetStoreId}', 'Completed')">Mark Delivered</button>
                            <button class="btn-update-note" onclick="processOrder('${docId}', '${targetStoreId}', 'Accepted')">Update Note</button>
                        ` : ''}
                    </div>
                `;
                orderGrid.appendChild(card);
            }
        });

        if (!foundAny) {
            orderGrid.innerHTML = `<div class="placeholder-text">No active orders for this store.</div>`;
        }
    });
}

// --- 3. THE SMART UPDATE FUNCTION ---
window.processOrder = async (orderId, storeId, nextStatus) => {
    const orderRef = doc(db, "orders", orderId);
    const noteContent = document.getElementById(`note-${orderId}`).value;

    try {
        // We update the Status Map AND the Owner Notes Map simultaneously
        await updateDoc(orderRef, {
            [`status.${storeId}`]: nextStatus,
            [`ownerNotes.${storeId}`]: noteContent
        });
        
        console.log(`Order ${orderId} updated by ${storeId}`);
    } catch (err) {
        console.error("Firebase Update Error:", err);
        alert("Action failed. Ensure you are logged in correctly.");
    }
};