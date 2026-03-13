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
function toggleMenu() {
    const side = document.getElementById('side-panel');
    const overlay = document.getElementById('menu-overlay');
    if(side) side.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
    document.body.style.overflow = (side && side.classList.contains('active')) ? 'hidden' : 'auto';
}

function syncSideMenu() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    const sidePanelLinks = document.getElementById('side-panel-links');
    if(!navPlaceholder || !sidePanelLinks) return;
    
    const checkNav = setInterval(() => {
        const cards = navPlaceholder.querySelectorAll('.card');
        if (cards.length > 0) {
            sidePanelLinks.innerHTML = "";
            cards.forEach(card => {
                const originalLink = card.querySelector('a');
                const title = card.querySelector('h3').innerText;
                const iconClass = card.querySelector('i').className;
                const newLink = document.createElement('a');
                newLink.href = originalLink.getAttribute('href');
                newLink.innerHTML = `<i class="${iconClass}"></i> ${title}`;
                newLink.onclick = () => toggleMenu();
                sidePanelLinks.appendChild(newLink);
            });
            clearInterval(checkNav);
        }
    }, 500);
}

/**
 * 4. SEARCH LOGIC (Overlay & Live)
 */
function openSearch() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.style.display = 'block';
        const input = document.getElementById('main-search') || document.getElementById('search-input');
        if(input) input.focus();
    }
}

function closeSearch() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Global search handler used by both root and subfolder search bars
function handleLiveSearch(query) {
    const resultsBox = document.getElementById('live-search-results') || document.getElementById('search-results');
    if (!resultsBox) return;

    const q = query.toLowerCase().trim();
    if (q.length < 2) {
        resultsBox.style.display = 'none';
        return;
    }

    const matches = window.allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.tagweb && p.tagweb.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length > 0) {
        resultsBox.innerHTML = matches.map(p => `
            <div class="live-item" onclick="window.location.href='product.html?id=${p.id}'" style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee; cursor:pointer;">
                <img src="${p.images[0]}" onerror="this.src='assets/placeholder.png'" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div class="live-item-info">
                    <h4 style="margin:0; font-size:0.9rem;">${p.name}</h4>
                    <p style="margin:0; font-size:0.8rem; color:#27ae60;">₹${p.sale}</p>
                </div>
            </div>
        `).join('') + `
        <div style="padding:10px; text-align:center; font-size:0.8rem; background:#f9f9f9; cursor:pointer;" onclick="handleManualSearch()">
            View all results for "${q}"
        </div>`;
        resultsBox.style.display = 'flex';
        resultsBox.style.flexDirection = 'column';
    } else {
        resultsBox.innerHTML = `<div style="padding:15px; text-align:center; font-size:0.85rem;">No results found</div>`;
        resultsBox.style.display = 'block';
    }
}

function handleManualSearch() {
    const input = document.getElementById('main-search') || document.getElementById('search-input');
    if (input && input.value.trim().length > 0) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
    }
}

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

    // Setup input listener for root search bar if it exists
    const rootSearch = document.getElementById('main-search');
    if (rootSearch) {
        rootSearch.addEventListener('input', (e) => handleLiveSearch(e.target.value));
        rootSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleManualSearch(); });
    }

    if (document.getElementById('product-grid') && typeof loadProducts === 'function') {
        loadProducts();
    }
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
