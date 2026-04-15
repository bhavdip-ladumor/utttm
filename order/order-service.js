import { auth, db, doc, getDoc, setDoc, onAuthStateChanged, collection } from "../auth-handler.js";

// --- 1. LOAD DATA ON PAGE START ---
async function loadSavedDetails(user) {
    const fname = document.getElementById('fname');
    const lname = document.getElementById('lname');
    const mobile = document.getElementById('mobile');
    const email = document.getElementById('email');
    const address1 = document.getElementById('address1');
    const pincode = document.getElementById('pincode');
    const city = document.getElementById('city');
    const state = document.getElementById('state');

    // Priority 1: Check LocalStorage (Fastest)
    const localData = JSON.parse(localStorage.getItem('user_checkout_details'));
    
    if (localData) {
        console.log("Filling from LocalStorage");
        fillForm(localData);
    } 
    // Priority 2: If logged in and no local data, check Firestore
    else if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().shippingAddress) { 
                console.log("Filling from Firestore");
                fillForm(userDoc.data().shippingAddress);
            }
        } catch (error) {
            console.error("Error fetching from Firestore:", error);
        }
    }
}

// Helper function to map data to inputs
function fillForm(data) {
    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = data[key];
    });
}

// Watch for Auth State to trigger loading
onAuthStateChanged(auth, (user) => {
    loadSavedDetails(user);
});


// --- 2. SAVE DATA ON SUBMIT ---
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.btn-checkout-final');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const formData = {
        fname: document.getElementById('fname').value,
        lname: document.getElementById('lname').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        address1: document.getElementById('address1').value,
        society: document.getElementById('society').value,
        street: document.getElementById('street').value,
        area: document.getElementById('area').value,
        landmark: document.getElementById('landmark').value,
        pincode: document.getElementById('pincode').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        discovery: document.getElementById('discovery-source').value
    };

    localStorage.setItem('user_checkout_details', JSON.stringify(formData));

    try {
        const orderId = await window.processFinalOrder();

        if (orderId) {
            // --- NEW: EMPTY THE CART AFTER SUCCESSFUL ORDER SAVE ---
            localStorage.removeItem('user_cart'); // Clears the cart items from memory
            
            // Optional: Update the UI if you have a cart count displayed on this page
            if (typeof renderCartUI === 'function') renderCartUI(); 
            // -------------------------------------------------------

            if (auth.currentUser) {
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    shippingDetails: formData,
                    lastUpdated: new Date()
                }, { merge: true });
            }

            document.getElementById('trust-modal').classList.add('active');
        }
    } catch (error) {
        console.error("Firebase Lead Save Failed:", error);
        alert("System busy. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Continue to Order <i class="fa-solid fa-chevron-right"></i>';
    }
});

window.processFinalOrder = async function() {
    // 1. Pull data from the form/browser memory
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    const shippingDetails = JSON.parse(localStorage.getItem('user_checkout_details'));

    if (cart.length === 0) return alert("Cart is empty");

    // 2. Generate the unique Order ID (BWS + YYMMDD + Random)
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const orderId = `BWS-${dateStr}-${randomId}`;

    // --- NEW: MULTI-STORE STATUS LOGIC ---
    // Extract unique store IDs from the cart items
    const uniqueStores = [...new Set(cart.map(item => item.storeId || "Unknown-Store"))];
    
    // Create a status map: { "Resin-cosmos-store": "pending", "Wooden-Beyond-store": "pending" }
    const statusMap = {};
    uniqueStores.forEach(store => {
        statusMap[store] = "pending";
    });

    // 3. Prepare the document for Firebase
    const orderData = {
        orderId: orderId,
        customer: shippingDetails,
        items: cart, 
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        // Updated to use the status map for multi-vendor support
        status: statusMap, 
        globalStatus: "pending", 
        createdAt: new Date(),
        userId: auth.currentUser ? auth.currentUser.uid : "guest"
    };

    try {
        // --- STEP A: SAVE TO FIREBASE (CLOUDS) ---
        // Updated to "orders" as per your previous request
        await setDoc(doc(db, "orders", orderId), orderData);
        
        // --- STEP B: SAVE TO LOCAL STORAGE (BROWSER) ---
        // This is critical so the WhatsApp message can "grab" this ID
        localStorage.setItem('last_order_id', orderId);

        console.log("Success! Order saved in Cloud and Browser memory.");
        
        // 4. Return the ID for the next step (UI update or WhatsApp)
        return orderId;
    } catch (error) {
        console.error("Error saving lead:", error);
        alert("System busy. Please try again.");
    }
}; 