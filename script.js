/* ==========================================================
   UTTAMHUB - Main Logic Script (script.js)
   Features: Multi-depth Injection, Sync Menu, Live Search
   ========================================================== */

// 1. Initial Data check
function initData() {
    if (window.allProducts && window.allProducts.length > 0) {
        console.log("Database detected. Initializing UI...");
        window.dispatchEvent(new Event('db_ready'));
    } else {
        console.warn("Waiting for database.js to load...");
    }
}

// 2. Global helper to find products
window.getProductById = function(id) {
    return (window.allProducts || []).find(product => String(product.id) === String(id));
};

// 3. Sidebar and Menu Logic
// Function to open/close the sidebar
function toggleMenu() {
    const side = document.getElementById('side-panel');
    const overlay = document.getElementById('menu-overlay');
    if(side) side.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
    
    // Lock background scroll when menu is open
    document.body.style.overflow = (side && side.classList.contains('active')) ? 'hidden' : 'auto';
}

// Ensure you have these functions to handle the Room overlay
function openRoom(roomId) {
    const overlay = document.getElementById('room-overlay');
    const rooms = document.querySelectorAll('.room-content');
    
    // Hide all rooms first
    rooms.forEach(r => r.classList.add('hidden'));
    
    // Show overlay and specific room
    overlay.classList.remove('hidden');
    document.getElementById(roomId).classList.remove('hidden');
    
    // Lock body scroll for the room view
    document.body.style.overflow = 'hidden';
}

function closeRoom() {
    document.getElementById('room-overlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
}


function handleLiveSearch(query) {
    // 1. Target the correct container (Portal vs Home Dropdown)
    const portal = document.getElementById('search-overlay-portal');
    const isPortalOpen = portal && !portal.classList.contains('hidden');
    
    const resultsContainer = isPortalOpen 
        ? portal.querySelector('.portal-results-container') 
        : document.getElementById('live-search-results');

    if (!resultsContainer) return;

    const term = query.toLowerCase().trim();

    // 2. Clear and exit if query is too short
    if (!term || term.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }

    const allStores = window.allStores || [];
    const allProducts = window.allProducts || [];

    // 3. FILTER STORES
    const storesFound = allStores.filter(s => 
        s.name.toLowerCase().includes(term) || 
        (s.keywords && s.keywords.toLowerCase().includes(term))
    );

    // 4. FILTER PRODUCTS + VARIANT DETECTION (Deduplication)
    const seenProducts = {}; 
    const uniqueProducts = [];

    allProducts.forEach(p => {
        const isMatch = p.name.toLowerCase().includes(term) || 
                        (p.keyword && p.keyword.toLowerCase().includes(term));
        
        if (isMatch) {
            if (!seenProducts[p.id]) {
                // First time seeing this ID. 
                // We set hasOptions to false initially.
                p.hasOptions = false; 
                seenProducts[p.id] = p;
                uniqueProducts.push(p);
            } else {
                // If we see the SAME ID again, NOW we mark it as having options
                seenProducts[p.id].hasOptions = true;
            }
        }
    });

    const prodsFound = uniqueProducts.slice(0, 20); // Show more in full overlay

    // 5. BUILD HTML OUTPUT
    let htmlOutput = "";

    // BUILD STORES SECTION
    if (storesFound.length > 0) {
        htmlOutput += `<div class="smart-search-label">Official Divisions</div>`;
        storesFound.forEach(store => {
            htmlOutput += `
            <div class="smart-store-card" onclick="location.href='/${store.link}'">
                <img src="/${store.image}" class="smart-store-img">
                <div class="smart-store-info">
                    <span class="smart-store-tag">Official Store</span>
                    <h4>${store.name}</h4>
                    <p>${store.description}</p>
                </div>
            </div>`;
        });
    }

    // BUILD PRODUCTS SECTION
    if (prodsFound.length > 0) {
        htmlOutput += `<div class="smart-search-label">Available Products</div>`;
        prodsFound.forEach(prod => {
            htmlOutput += `
            <div class="smart-prod-row" onclick="location.href='/setbrand/resin/product/product.html?id=${prod.id}'">
                <img src="${prod.images[0]}" class="smart-prod-img">
                <div class="smart-prod-details">
                    <span class="name">${prod.name}</span>
                    <div class="price-line">
                        <span class="old-price">₹${prod.mrp}</span>
                        <span class="sale-price">₹${prod.sale}</span>
                        ${prod.hasOptions ? `<span class="variant-badge">Options Available</span>` : ''}
                    </div>
                </div>
            </div>`;
        });
    }

    // 6. HANDLE EMPTY STATE
    if (storesFound.length === 0 && prodsFound.length === 0) {
        htmlOutput = `
            <div style="padding:60px 20px; text-align:center; color:#999;">
                <i class="fa-solid fa-magnifying-glass" style="font-size:2.5rem; margin-bottom:15px; opacity:0.2;"></i>
                <p>No results found for "<strong>${query}</strong>"</p>
                <small>Try checking your spelling or use general terms like "Resin"</small>
            </div>`;
    }

    // 7. INJECT & SHOW
    resultsContainer.innerHTML = htmlOutput;
    resultsContainer.classList.add('active');
}

// 1. Handle the 🔍 Button Click
// 1. Open the Portal
function handleManualSearch() {
    const portal = document.getElementById('search-overlay-portal');
    const mainInput = document.getElementById('main-search');
    const portalInput = document.getElementById('portal-search-input');

    // 1. Show the Overlay
    portal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 2. Transfer the value from Home Search to Portal Search
    if (mainInput && mainInput.value.trim() !== "") {
        portalInput.value = mainInput.value;
        
        // 3. Force the search results to render inside the Portal
        handleLiveSearch(portalInput.value);
    }
    
    portalInput.focus();
}

// Ensure "Enter" key on the portal input also keeps results updated
document.getElementById('portal-search-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleLiveSearch(this.value);
    }
});


// Function to close the Full-Screen Search Overlay
window.closeSearchPortal = function() {
    const portal = document.getElementById('search-overlay-portal');
    const portalInput = document.getElementById('portal-search-input');
    
    if (portal) {
        // 1. Hide the portal
        portal.classList.add('hidden');
        
        // 2. Re-enable scrolling on the main page
        document.body.style.overflow = 'auto';
        
        // 3. Optional: Clear the input and results so it's fresh for next time
        if (portalInput) portalInput.value = "";
        const resultsArea = portal.querySelector('.portal-results-container');
        if (resultsArea) {
            resultsArea.innerHTML = "";
            resultsArea.classList.remove('active');
        }
    }
};

/**
 * 5. COMPONENT INJECTION (Cart & Search)
 */
async function injectGlobalComponents() {
    // Detect depth
    const pathSegments = window.location.pathname.split('/').filter(s => s.length > 0);
    let prefix = "";
    if (pathSegments.length > 0) {
        const depth = pathSegments[pathSegments.length - 1].includes('.html') ? pathSegments.length - 1 : pathSegments.length;
        prefix = "../".repeat(depth);
    }

    // Inject Cart
    const cartPlaceholder = document.getElementById('cart-placeholder');
    if (cartPlaceholder) {
        try {
            const res = await fetch(prefix + 'shopcart.html');
            if (res.ok) {
                cartPlaceholder.innerHTML = await res.text();
                if (typeof renderCartUI === 'function') renderCartUI();
            }
        } catch (e) { console.error("Cart injection failed"); }
    }

    // Inject Search Overlay (New)
    const searchPlaceholder = document.getElementById('search-placeholder');
    if (searchPlaceholder) {
        try {
            const res = await fetch(prefix + 'search-overlay.html');
            if (res.ok) {
                searchPlaceholder.innerHTML = await res.text();
            }
        } catch (e) { console.error("Search injection failed"); }
    }
}

// Start Engine
window.addEventListener('DOMContentLoaded', () => {
    initData();
    syncSideMenu();
    injectGlobalComponents();

    // --- ADD THIS PART BELOW ---
    // If the URL has a product ID (e.g., product.html?id=RC-VIN-11), inject the schema
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId && typeof window.getProductById === 'function') {
        const product = window.getProductById(productId);
        if (product) {
            injectProductSchema(product);
        }
    }
    // ---------------------------

    
});



// --- NEW: Function to inject Product Data for Google ---
function injectProductSchema(product) {
    if (!product) return;

    // Remove existing schema if any
    const existing = document.getElementById('dynamic-product-schema');
    if (existing) existing.remove();

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images[0].startsWith('http') ? product.images[0] : "https://uttamhub.com/" + product.images[0],
        "description": product.description,
        "sku": product.sku,
        "brand": { "@type": "Brand", "name": product.brand },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "INR",
            "price": product.sale,
            "availability": product.stock === "instock" || parseInt(product.stock) > 0 
                            ? "https://schema.org/InStock" 
                            : "https://schema.org/OutOfStock"
        }
    };

    const script = document.createElement('script');
    script.id = 'dynamic-product-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}


/** --- 6. DASHBOARD ROOM LOGIC --- **/
window.openRoom = function(roomId) {
    const overlay = document.getElementById('room-overlay');
    const targetRoom = document.getElementById(roomId);
    
    if (overlay && targetRoom) {
        overlay.classList.remove('hidden');
        
        // Hide all rooms safely
        document.querySelectorAll('.room-content').forEach(room => {
            room.classList.add('hidden');
        });
        
        targetRoom.classList.remove('hidden');
        // Prevent body scrolling when room is open (Good for TV/Mobile)
        document.body.style.overflow = 'hidden';
    }
};

window.closeRoom = function() {
    const overlay = document.getElementById('room-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
};

let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');


// Close search results when clicking outside
document.addEventListener('click', function(e) {
    const searchBox = document.querySelector('.main-search-box');
    const results = document.getElementById('live-search-results');
    if (searchBox && !searchBox.contains(e.target)) {
        results.classList.remove('active');
    }
});