window.goBackToSource = function() {
    const previousPage = document.referrer;
    
    // Check if the previous page is from your own website
    if (previousPage && previousPage.includes(window.location.hostname)) {
        window.location.href = previousPage;
    } else {
        // Fallback to home if there is no history or it's an external site
        window.location.href = '/index.html';
    }
};

window.fetchLocation = async function(pincode) {
    // Only trigger when the user has typed exactly 6 digits
    if (pincode.length === 6) {
        const cityInput = document.getElementById('city');
        const stateInput = document.getElementById('state');

        // Optional: Show a "Searching..." placeholder while fetching
        cityInput.placeholder = "Searching...";

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data && data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                
                // Automatically fill the fields
                cityInput.value = details.District;
                stateInput.value = details.State;
                
                // Clear the placeholder
                cityInput.placeholder = "";
            } else {
                console.warn("Pincode not found.");
                cityInput.placeholder = "Not found";
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            // If the API fails, allow manual entry
            cityInput.readOnly = false;
            stateInput.readOnly = false;
        }
    }
};

// Function to show the modal
function showTrustModal() {
    const modal = document.getElementById('trust-modal');
    if (modal) {
        modal.classList.add('active');
        // Optional: prevent background scrolling
        document.body.style.overflow = 'hidden';
    }
}

// Function to close the modal (for the "Edit Order Details" button)
window.closeTrustModal = function() {
    const modal = document.getElementById('trust-modal');
    if (modal) {
        modal.classList.remove('active');
        // Restore scrolling
        document.body.style.overflow = 'auto';
    }
};

// Event listener for the form submission
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the page from reloading
    
    // This is where we will eventually add the "Save to Firebase" logic
    // For now, it just shows the modal as you requested
    showTrustModal();
});


// --- WHATSAPP MESSAGE GENERATOR & REDIRECT ---
document.getElementById('whatsapp-redirect-btn').addEventListener('click', () => {
    // 1. Get Data from LocalStorage
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    const shipping = JSON.parse(localStorage.getItem('user_checkout_details'));
    const orderId = localStorage.getItem('last_order_id') || "PENDING";

    if (!shipping || cart.length === 0) {
        alert("Details or Cart missing!");
        return;
    }

    // 2. Start building the "Same to Same" Message
    let msg = `*📦 NEW ORDER REQUEST*\n`;
    msg += `ORDER ID:- ${orderId}\n`;
    msg += `------------------------------\n\n`;

    msg += `*👤 CUSTOMER DETAILS*\n`;
    msg += `Name: ${shipping.fname} ${shipping.lname}\n`;
    msg += `Mobile: ${shipping.mobile}\n`;
    msg += `Email: ${shipping.email}\n\n`;

    msg += `*📍 DELIVERY ADDRESS*\n`;
    // Combining address fields to match your format
    const fullAddress = `${shipping.address1}${shipping.society ? ', ' + shipping.society : ''}${shipping.street ? ', ' + shipping.street : ''}`;
    msg += `${fullAddress}\n`;
    msg += `${shipping.city}, ${shipping.state} - ${shipping.pincode}\n\n`;

    msg += `*🛒 ORDER SUMMARY*\n`;

    let grandTotal = 0;

    // 3. Loop for exactly formatted items
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;

        // Format variants if they exist
        const variantText = item.selectedAttr ? 
            Object.entries(item.selectedAttr).map(([k, v]) => `${k}: ${v.replace('_', ' ')}`).join(', ') : 'N/A';

        msg += `${index + 1}. *${item.name}*\n`;
        msg += `   _${item.description || ''}_\n`;
        msg += `   _ID: ${item.id}_    _SKU: ${item.sku}_\n`;
        msg += `   _Variant: ${variantText}_\n`;
        msg += `   Price: ~₹${item.mrp || item.price}~ *₹${item.price}*\n`;
        msg += `   Qty: ${item.quantity} | Total: *₹${itemTotal}*\n\n`;
    });

    // 4. Footer Section
    msg += `------------------------------\n`;
    msg += `*GRAND TOTAL: ₹${grandTotal}*\n`;
    msg += `------------------------------\n\n`;
    msg += `Please confirm availability and share payment details for my order!`;

    // 5. Open WhatsApp
    const whatsappUrl = `https://wa.me/919724362981?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');

    // 6. Redirect original page back to the Order/Home page
    setTimeout(() => {
        window.location.href = '/'; // Or your order-success page
    }, 1000);
});
