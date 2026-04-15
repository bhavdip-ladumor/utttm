import { db } from '../../auth-handler.js';
import { collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/**
 * Live Order Monitor with Notifications
 * Listens for the 'loadOrders' event triggered by ui-controller.js
 */

// 1. Request Notification Permission when the script loads
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

window.addEventListener('loadOrders', () => {
    const orderGrid = document.getElementById('orderGrid');
    const template = document.getElementById('orderTemplate');

    if (!orderGrid || !template) {
        console.error("Order System Error: Grid or Template not found in DOM.");
        return;
    }

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    // Variable to skip notifications for existing orders on first load
    let initialLoadComplete = false;

    onSnapshot(q, (snapshot) => {
        // --- NOTIFICATION LOGIC ---
        if (initialLoadComplete) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    triggerNotification(change.doc.data());
                }
            });
        }

        // --- EXISTING GRID RENDERING LOGIC ---
        orderGrid.innerHTML = '';

        if (snapshot.empty) {
            orderGrid.innerHTML = '<div class="no-orders">No orders found in the system.</div>';
            initialLoadComplete = true; // Still set true so future orders ping
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const clone = template.content.cloneNode(true);

            // Fill Header & Customer Info
            clone.querySelector('.order-id-label').innerText = `#${data.orderId || 'N/A'}`;
            
            const cust = data.customer || {};
            clone.querySelector('.cust-name').innerText = `${cust.fname || ''} ${cust.lname || ''}`;
            clone.querySelector('.cust-phone').innerText = cust.mobile || 'No Phone';
            clone.querySelector('.cust-addr').innerText = `${cust.address1 || ''}, ${cust.city || ''}`;
            
            const total = data.totalAmount || 0;
            clone.querySelector('.grand-total').innerText = `Total: ₹${total}`;

            // Handle Store-Specific Buckets
            const bucketContainer = clone.querySelector('.store-buckets-container');
            
            if (data.status) {
                const storesInOrder = Object.keys(data.status);

                storesInOrder.forEach(storeId => {
                    const bucket = document.createElement('div');
                    const currentStatus = data.status[storeId] || 'pending';
                    
                    bucket.className = `store-bucket status-${currentStatus.toLowerCase()}`;
                    
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

            orderGrid.appendChild(clone);
        });

        // After the first loop is done, we enable notifications for any new additions
        initialLoadComplete = true;

    }, (error) => {
        console.error("Firestore Subscription Error:", error);
        orderGrid.innerHTML = `<div class="error">Access Denied: Check Firebase Rules.</div>`;
    });
});

/**
 * Trigger Sound and Browser Notification
 */
function triggerNotification(orderData) {
    // 1. Sound Alert
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Sound blocked by browser until user interacts with page."));

    // 2. Visual Alert
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Order Received!", {
            body: `${orderData.customer?.fname || 'Customer'} placed an order for ₹${orderData.totalAmount}`,
            icon: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjJXGG6NW1PfEc0fLwOmucMXUMCR8pVsOWXXeggbEvDhY25acAlcuJbT4RSLulWZKta4xiUHuEXsOJag6VlzpP6rPF0FGKFhWSoQ8nLp07IRu1tIG8KvadNcocQMMZ59E6KIt5kqjK_Tgi4OHo0oLb52Dcmt-F8t09hDlGFbzUYGNOfAtgdVYTDw5DB_0w/s320/resin%20cosmos.png"
        });
    }
}

document.getElementById('enableNotifications').onclick = () => {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
    } else {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("Notifications Enabled! You will now hear a ping for new orders.");
                // Test sound
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
            }
        });
    }
};
