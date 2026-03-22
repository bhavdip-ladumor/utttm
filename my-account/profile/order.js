import { auth, db, onAuthStateChanged, collection, query, where, getDocs } from "../../auth-handler.js";

async function fetchUserOrders(user) {
    console.log("1. Script linked! Fetching for:", user.uid);
    const container = document.getElementById('orders-container');

    if (!container) {
        console.error("2. Error: 'orders-container' not found in HTML!");
        return;
    }

    try {
        console.log("3. Reaching out to Firestore...");
        const ordersRef = collection(db, "orders");
        
        // Simple query to avoid Index requirements
        const q = query(ordersRef, where("userId", "==", user.uid));

        const querySnapshot = await getDocs(q);
        console.log("4. Firestore responded. Documents found:", querySnapshot.size);

        if (querySnapshot.empty) {
            container.innerHTML = `<div class="no-data-msg">No orders found for this account.</div>`;
            return;
        }

        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        // Save to cache
        localStorage.setItem(`orders_${user.uid}`, JSON.stringify(orders));
        
        // Final Render
        renderOrders(orders);

    } catch (error) {
        console.error("Critical Error during fetch:", error);
        container.innerHTML = `<div class="error-msg">Error: ${error.message}</div>`;
    }
}

// --- 2. RENDER ORDERS TO UI ---
function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = ''; 

    orders.forEach(order => {
        const status = order.globalStatus || 'pending';
        const statusClass = `status-${status.toLowerCase()}`;
        
        // 1. Format Date
        const date = order.createdAt?.seconds 
            ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : "Recent";

        // 2. Build Items HTML (Loop through all items in the order)
        const itemsHTML = order.items.map(item => `
            <div class="order-item">
                <img src="${item.image || '../../assets/placeholder.jpg'}" class="item-mini-img">
                <div class="item-info">
                    <p class="item-name">${item.name}</p>
                    <p class="item-meta">Qty: ${item.quantity} • ₹${item.price.toLocaleString('en-IN')}</p>
                </div>
            </div>
        `).join('');

        const orderHTML = `
            <div class="order-card">
                <div class="order-card-header">
                    <div class="order-id-group">
                        <span class="order-number">#${order.orderId}</span>
                        <span class="order-date">Placed on ${date}</span>
                    </div>
                    <div class="order-status ${statusClass}">${status}</div>
                </div>

                <div class="order-card-body">
                    ${itemsHTML}
                </div>

                <div class="order-card-footer">
                    <div class="total-display">
                        <span class="total-label">Total Amount</span>
                        <span class="total-price">₹${order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn-help" onclick="window.open('https://wa.me/919724362981?text=Help with Order ${order.orderId}')">
                            <i class="fa-brands fa-whatsapp"></i> Help
                        </button>
                        <button class="btn-view-details" onclick="location.href='order-details.html?id=${order.orderId}'">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', orderHTML);
    });
}

// --- 3. INITIALIZE ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchUserOrders(user);
    } else {
        console.warn("No user logged in.");
        const container = document.getElementById('orders-container');
        if(container) container.innerHTML = "Please log in to see your orders.";
    }
});