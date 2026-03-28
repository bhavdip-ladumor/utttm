import { db } from '../../auth-handler.js';
import { collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/**
 * Live Order Monitor
 * Listens for the 'loadOrders' event triggered by ui-controller.js
 */
window.addEventListener('loadOrders', () => {
    // 1. Find the elements only AFTER the event fires (because they are dynamic)
    const orderGrid = document.getElementById('orderGrid');
    const template = document.getElementById('orderTemplate');

    if (!orderGrid || !template) {
        console.error("Order System Error: Grid or Template not found in DOM.");
        return;
    }

    // 2. Setup Firestore Real-time Query
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    // 3. Start Listener
    onSnapshot(q, (snapshot) => {
        // Clear the "Loading..." message or previous orders
        orderGrid.innerHTML = '';

        if (snapshot.empty) {
            orderGrid.innerHTML = '<div class="no-orders">No orders found in the system.</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Clone the HTML structure from the <template> tag
            const clone = template.content.cloneNode(true);

            // Fill Header & Customer Info
            clone.querySelector('.order-id-label').innerText = `#${data.orderId || 'N/A'}`;
            
            const cust = data.customer || {};
            clone.querySelector('.cust-name').innerText = `${cust.fname || ''} ${cust.lname || ''}`;
            clone.querySelector('.cust-phone').innerText = cust.mobile || 'No Phone';
            clone.querySelector('.cust-addr').innerText = `${cust.address1 || ''}, ${cust.city || ''}`;
            
            const total = data.totalAmount || 0;
            clone.querySelector('.grand-total').innerText = `Total: ₹${total}`;

            // Handle Store-Specific Buckets (Resin, Wooden, etc.)
            const bucketContainer = clone.querySelector('.store-buckets-container');
            
            // Check if status exists to avoid errors
            if (data.status) {
                const storesInOrder = Object.keys(data.status);

                storesInOrder.forEach(storeId => {
                    const bucket = document.createElement('div');
                    const currentStatus = data.status[storeId] || 'pending';
                    
                    // Add class for styling (e.g., status-pending, status-accepted)
                    bucket.className = `store-bucket status-${currentStatus.toLowerCase()}`;
                    
                    // Filter items belonging to this specific store
                    const storeItems = (data.items || []).filter(item => item.storeId === storeId);
                    const itemsHtml = storeItems.map(i => `
                        <div class="item-row">
                            <span>${i.name}</span> 
                            <span>x${i.quantity}</span>
                        </div>
                    `).join('');

                    bucket.innerHTML = `
                        <div class="bucket-header">
                            <h4>${storeId.replace(/-/g, ' ')}</h4>
                            <span class="badge">${currentStatus}</span>
                        </div>
                        <div class="items-list">${itemsHtml}</div>
                        <div class="bucket-actions">
                            <label>Update Status:</label>
                            <select onchange="updateBucketStatus('${doc.id}', '${storeId}', this.value)">
                                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="Accepted" ${currentStatus === 'Accepted' ? 'selected' : ''}>Accepted</option>
                                <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                            
                            <label>Internal Note:</label>
                            <textarea 
                                placeholder="Add production note..." 
                                onblur="updateBucketNote('${doc.id}', '${storeId}', this.value)"
                            >${data.ownerNotes?.[storeId] || ''}</textarea>
                        </div>
                    `;
                    bucketContainer.appendChild(bucket);
                });
            }

            // Inject the completed card into the grid
            orderGrid.appendChild(clone);
        });
    }, (error) => {
        console.error("Firestore Subscription Error:", error);
        orderGrid.innerHTML = `<div class="error">Access Denied: Check Firebase Rules.</div>`;
    });
});