// 1. Navigation: Go back to the page the user came from
function goBackToSource() {
    const previousPage = document.referrer;
    if (previousPage && previousPage.includes(window.location.hostname)) {
        window.location.href = previousPage;
    } else {
        window.location.href = '/index.html'; 
    }
}

// 2. Auto-fill City/State based on Pincode
async function fetchLocation(pincode) {
    // Only trigger if exactly 6 digits
    if (pincode.length === 6) {
        const cityInput = document.getElementById('city');
        const stateInput = document.getElementById('state');
        
        // Use a placeholder instead of changing the value to "Loading..."
        cityInput.placeholder = "Searching..."; 

        try {
            // Set a 5-second timeout so the user isn't stuck forever
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data && data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                cityInput.value = details.District;
                stateInput.value = details.State;
                cityInput.placeholder = ""; // Clear placeholder
            } else {
                // If not found, let the user type manually
                cityInput.placeholder = "City";
                cityInput.readOnly = false; // Make it editable if API fails
                stateInput.readOnly = false;
            }
        } catch (error) {
            console.error("Pincode API slow or down:", error);
            // Fallback: allow manual entry if API fails
            cityInput.placeholder = "Enter City Manually";
            cityInput.readOnly = false;
            stateInput.readOnly = false;
        }
    }
}
// 3. Modal Control Functions
// Function to show the modal
// 3. Modal Control Functions
function showTrustModal() {
    const modal = document.getElementById('trust-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeTrustModal() {
    const modal = document.getElementById('trust-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// THE FIX: Click outside to close (Only closes if background is clicked)
window.addEventListener('click', (e) => {
    const modal = document.getElementById('trust-modal');
    // This checks: "Is the thing I clicked EXACTLY the dark background?"
    if (e.target === modal) {
        closeTrustModal();
    }
});

// 4. Form Submission & Lead Generation
document.getElementById('checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    
    // 🛡️ Security Check (Honeypot)
    const botField = document.getElementById('hp_field');
    if (botField && botField.value !== "") return;

    // 1. GATHER RAW INPUTS
    const rawData = {
        fname: document.getElementById('fname').value,
        lname: document.getElementById('lname').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        address1: document.getElementById('address1').value,
        society: document.getElementById('society').value,
        street: document.getElementById('street').value,
        area: document.getElementById('area').value,
        pincode: document.getElementById('pincode').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value
    };

    // 2. SAVE LOCALLY (Instant Auto-fill for next time)
    localStorage.setItem('user_checkout_details', JSON.stringify(rawData));

    // 3. PREPARE THE FULL LEAD OBJECT
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    const customerIdentity = rawData.mobile.trim(); 

    const leadData = {
        customerID: customerIdentity, // Link to show "My Orders" later
        name: `${rawData.fname} ${rawData.lname}`,
        mobile: rawData.mobile,
        email: rawData.email,
        address: `${rawData.address1}, ${rawData.society}, ${rawData.street}, ${rawData.area}`,
        city: rawData.city,
        state: rawData.state,
        pincode: rawData.pincode,
        
        // Product Details Snapshot
        items: cart.map(item => ({
            id: item.id || 'N/A',
            sku: item.sku || 'N/A',
            name: item.name,
            price: item.price,
            qty: item.quantity,
            total: item.price * item.quantity,
            variants: item.selectedAttr || {}
        })),
        
        grandTotal: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        status: "Pending", 
        note: document.getElementById('artist-note').value,
        source: document.getElementById('discovery-source').value,
        timestamp: new Date() 
    };

    // 4. WRITE TO FIRESTORE
    try {
        console.log("Writing Lead to Firestore for:", customerIdentity);
        
        // This is where you actually save to your Firebase database
        // await addDoc(collection(db, "leads"), leadData);
        
        showTrustModal();

        // 5. ATTACH DATA TO WHATSAPP BUTTON
        const whatsappBtn = document.getElementById('whatsapp-redirect-btn');
        if (whatsappBtn) {
            whatsappBtn.onclick = () => {
                sendToWhatsApp(leadData); 
            };
        }

    } catch (error) {
        console.error("Critical: Firestore Save Failed", error);
        // Fallback: Show modal anyway so you don't lose the WhatsApp sale
        showTrustModal();
        const whatsappBtn = document.getElementById('whatsapp-redirect-btn');
        if (whatsappBtn) {
            whatsappBtn.onclick = () => sendToWhatsApp(leadData);
        }
    }
};


// 5. WhatsApp Message Formatter
function sendToWhatsApp(data) {
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    
    // 1. Calculate Grand Total
    const grandTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 2. Format the Product List
    let itemsList = "";
    cart.forEach((item, index) => {
        const variants = item.selectedAttr ? 
            Object.entries(item.selectedAttr).map(([k, v]) => `${v}`).join(' | ') : '';
        
        const itemSubtotal = item.price * item.quantity;

        itemsList += `${index + 1}. *${item.name}*%0A`;
        
        if (item.description) {
            const shortDesc = item.description.length > 60 ? 
                             item.description.substring(0, 57) + "..." : item.description;
            itemsList += `   _${shortDesc}_%0A`;
        }

        if (item.id) itemsList += `   _ID: ${item.id}_ `;
        if (item.sku) itemsList += `   _SKU: ${item.sku}_`;
        if (item.id || item.sku) itemsList += `%0A`;
        
        if (variants) itemsList += `   _Variant: ${variants}_%0A`;

        // Pricing Line: MRP (Strike), Sale Price, Qty, and Total
        let pricingLine = `   Price: ~₹${item.mrp || item.price + 100}~ *₹${item.price}*`;
        pricingLine += `%0A   Qty: ${item.quantity} | Total: *₹${itemSubtotal.toLocaleString('en-IN')}*%0A%0A`;
        
        itemsList += pricingLine;
    });

    // 3. Build the Message
    let message = `*📦 NEW ORDER REQUEST*%0A`;
    message += `------------------------------%0A%0A`;
    
    message += `*👤 CUSTOMER DETAILS*%0A`;
    message += `Name: ${data.name}%0A`;
    message += `Mobile: ${data.mobile}%0A`;
    message += `Email: ${data.email || 'Not Provided'}%0A%0A`; // Added right after mobile

    message += `*📍 DELIVERY ADDRESS*%0A`;
    message += `${data.address}%0A`;
    message += `${data.city}, ${data.state} - ${data.pincode}%0A%0A`;

    message += `*🛒 ORDER SUMMARY*%0A`;
    message += itemsList;
    message += `------------------------------%0A`;
    message += `*GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN')}*%0A`;
    message += `------------------------------%0A%0A`;

    if (data.note) {
        message += `*🎨 ARTIST NOTE:*%0A_${data.note}_%0A%0A`;
    }

    message += `Please confirm availability and share payment details for my order!`;

    // 4. Open WhatsApp
    const whatsappUrl = `https://wa.me/919724362981?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// 6. Auto-Fill for Returning Customers
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('user_checkout_details');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Fill Personal Details
        document.getElementById('fname').value = data.fname || "";
        document.getElementById('lname').value = data.lname || "";
        document.getElementById('mobile').value = data.mobile || "";
        document.getElementById('email').value = data.email || "";
        
        // Fill Address Fields
        document.getElementById('address1').value = data.address1 || "";
        document.getElementById('society').value = data.society || "";
        document.getElementById('street').value = data.street || "";
        document.getElementById('area').value = data.area || "";
        document.getElementById('pincode').value = data.pincode || "";
        
        // If pincode exists, fill city and state directly
        if (data.city) document.getElementById('city').value = data.city;
        if (data.state) document.getElementById('state').value = data.state;
        
        console.log("Welcome back! Form auto-filled from LocalStorage.");
    }
});