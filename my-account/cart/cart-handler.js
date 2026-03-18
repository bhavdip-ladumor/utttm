/**
 * CART HANDLER - MASTER FILE
 * Handles logic for adding, removing, rendering, and calculating savings.
 */

// Data: Load from LocalStorage
let cart = JSON.parse(localStorage.getItem('user_cart')) || [];

/**
 * HELPER: Get Elements Dynamically
 * Ensures we find elements injected by cart-loader.js on every render call.
 */
const getCartElements = () => ({
    sidebar: document.getElementById('cart-sidebar'),
    overlay: document.getElementById('cart-overlay'),
    container: document.getElementById('cart-items-container'),
    totalElem: document.getElementById('cart-total-price'), // Footer Total
    countBadge: document.getElementById('cart-count'),
    // Header Savings Elements
    hSale: document.getElementById('header-total-sale'),
    hMrp: document.getElementById('header-total-mrp'),
    hSaveAmt: document.getElementById('header-save-amt'),
    hSavePercent: document.getElementById('header-save-percent')
});

/**
 * CORE: Add to Cart Logic
 */
export function addToCart(product) {
    if (!product || !product.sku) {
        console.error("Invalid product added to cart. Missing SKU.");
        return;
    }

    // FIX 1: Find by SKU instead of ID to distinguish variants (Size, Color, etc.)
    const existingItem = cart.find(item => String(item.sku) === String(product.sku));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // FIX 2: Extract attributes from attrName/attrValue for the cart display
        let attributes = {};
        if (product.attrName && product.attrValue) {
            const keys = product.attrName.split(',').map(s => s.trim());
            const vals = product.attrValue.split(',').map(s => s.trim());
            keys.forEach((key, i) => {
                if (key && vals[i]) attributes[key] = vals[i];
            });
        }

        cart.push({
            id: product.id,
            sku: product.sku, // Save SKU so we can find it later
            name: product.name,
            description: product.description || '', // Fix: Correctly pull description
            price: parseFloat(product.sale), 
            mrp: parseFloat(product.mrp || product.sale),
            image: Array.isArray(product.images) ? product.images[0] : (product.image || ''),
            selectedAttr: attributes, // Fix: Properly formatted for renderCart()
            quantity: 1
        });
    }

    saveAndRender();
    toggleCart(true); 
}

/**
 * CORE: Render Function
 */
export function renderCart() {
    const el = getCartElements();
    if (!el.container) return; 
    
    el.container.innerHTML = '';
    
    // FIX 1: Initialize totals to 0
    let totalSale = 0;
    let totalMRP = 0;

    if (cart.length === 0) {
        el.container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
        if (el.totalElem) el.totalElem.textContent = '₹0';
        if (el.countBadge) el.countBadge.textContent = '0';
        if (el.hSale) el.hSale.textContent = '₹0';
        if (el.hMrp) el.hMrp.textContent = '';
        if (el.hSaveAmt) el.hSaveAmt.textContent = '₹0';
        if (el.hSavePercent) el.hSavePercent.textContent = '0%';
        return;
    }

    cart.forEach((item, index) => {
    const itemTotalSale = item.price * item.quantity;
    totalSale += itemTotalSale;
    totalMRP += (item.mrp || item.price) * item.quantity;

    // 1. Create the variant slug for the URL
    const variantSlug = item.selectedAttr ? 
        Object.entries(item.selectedAttr).map(([k, v]) => `${k}:${v}`).join(',') : '';

    // 2. Build the link back to the product
    const productLink = `product.html?id=${item.id}${variantSlug ? '&variant=' + encodeURIComponent(variantSlug) : ''}`;

    const variantDisplay = item.selectedAttr ? 
        Object.entries(item.selectedAttr)
            .map(([key, val]) => `<span class="cart-variant-tag"><strong>${key}:</strong> ${val.replace('_', ' ')}</span>`)
            .join(' ') : '';

    el.container.innerHTML += `
        <div class="cart-item">
            <a href="${productLink}" class="cart-item-link">
                <img src="${item.image}" alt="${item.name}" class="cart-thumb">
                
                <div class="cart-details">
                    <p class="cart-item-name"><strong>${item.name}</strong></p>
                    <p class="cart-item-desc">${item.description || ''}</p>
                    <div class="cart-item-variants">${variantDisplay}</div>
                    
                    <div class="cart-price-row">
                        <span class="cart-sale-price">₹${item.price.toLocaleString('en-IN')}</span>
                        <span class="cart-mrp-price">₹${(item.mrp || item.price).toLocaleString('en-IN')}</span>
                        <span class="cart-qty-label">x ${item.quantity}</span>
                        <div class="item-subtotal">₹${itemTotalSale.toLocaleString('en-IN')}</div>
                    </div>

                    <div class="qty-stepper" onclick="event.preventDefault(); event.stopPropagation();">
                        <button onclick="updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
            </a>

            <div class="cart-item-action-column">
                <button class="share-btn" onclick="event.preventDefault(); event.stopPropagation(); shareProduct(${index})" title="Share Product">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>

                <button class="remove-btn" onclick="event.preventDefault(); event.stopPropagation(); removeItem(${index})" title="Remove">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `;
});
    const totalSavings = totalMRP - totalSale;
    const savePercent = totalMRP > 0 ? Math.round((totalSavings / totalMRP) * 100) : 0;

    if (el.hSale) el.hSale.textContent = `₹${totalSale.toLocaleString('en-IN')}`;
    if (el.hMrp) {
        el.hMrp.textContent = totalMRP > totalSale ? `₹${totalMRP.toLocaleString('en-IN')}` : '';
    }
    if (el.hSaveAmt) el.hSaveAmt.textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
    if (el.hSavePercent) el.hSavePercent.textContent = `${savePercent}%`;

    if (el.totalElem) el.totalElem.textContent = `₹${totalSale.toLocaleString('en-IN')}`;
    if (el.countBadge) {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        el.countBadge.textContent = totalItems;
    }
}

/**
 * ACTIONS & PERSISTENCE
 */
export function toggleCart(isOpen) {
    const el = getCartElements();
    if (!el.sidebar || !el.overlay) return;

    if (isOpen) {
        el.sidebar.classList.add('open');
        el.overlay.classList.add('active');
        
        // STOP BACKGROUND SCROLL
        document.body.style.overflow = 'hidden'; 
        document.body.style.height = '100vh'; // Extra safety for mobile
        
        renderCart();
    } else {
        el.sidebar.classList.remove('open');
        el.overlay.classList.remove('active');
        
        // RESTORE BACKGROUND SCROLL
        document.body.style.overflow = ''; 
        document.body.style.height = '';
    }
}

function saveAndRender() {
    localStorage.setItem('user_cart', JSON.stringify(cart));
    renderCart();
}

window.removeItem = (index) => {
    cart.splice(index, 1);
    saveAndRender();
};

window.updateQuantity = (index, change) => {
    cart[index].quantity += change;
    if (cart[index].quantity < 1) {
        window.removeItem(index);
    } else {
        saveAndRender();
    }
};

window.shareProduct = (index) => {
    const item = cart[index];
    
    // 1. Construct the variant slug from the stored attributes (e.g., "Size:8_inch,Width:4_mm")
    const variantSlug = item.selectedAttr ? 
        Object.entries(item.selectedAttr)
            .map(([k, v]) => `${k}:${v}`)
            .join(',') : '';

    // 2. Build the URL including the variant parameter
    const shareUrl = `${window.location.origin}/product.html?id=${item.id}${variantSlug ? '&variant=' + encodeURIComponent(variantSlug) : ''}`;

    // 3. Prepare professional text for the share
    const variantDisplay = item.selectedAttr ? 
        Object.entries(item.selectedAttr).map(([k, v]) => `${k}: ${v.replace('_', ' ')}`).join(', ') : '';
        
    const shareText = `Check out this ${item.name} (${variantDisplay}) at Resin Cosmos!\nPrice: ₹${item.price}`;

    if (navigator.share) {
        navigator.share({ 
            title: item.name, 
            text: shareText, 
            url: shareUrl 
        }).catch(err => {
            if (err.name !== 'AbortError') console.error('Share failed:', err);
        });
    } else {
        // Fallback for Desktop
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("Link with variant copied to clipboard!");
    }
};

// Global Exposure
window.addToCart = addToCart; 
window.toggleCart = toggleCart;

function initCart() {
    const el = getCartElements();
    const openBtn = document.getElementById('btn-open-cart');
    const closeBtn = document.getElementById('btn-close-cart');

    if (openBtn) openBtn.onclick = () => toggleCart(true);
    if (closeBtn) closeBtn.onclick = () => toggleCart(false);
    if (el.overlay) el.overlay.onclick = () => toggleCart(false);
    
    renderCart();
}

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}

// Inside initCart()
const checkoutBtn = document.getElementById('btn-checkout');

if (checkoutBtn) {
    checkoutBtn.onclick = () => {
        // 1. Check if cart is empty
        const currentCart = JSON.parse(localStorage.getItem('user_cart')) || [];
        
        if (currentCart.length === 0) {
            alert("Your cart is empty! Add some art pieces first.");
            return;
        }

        // 2. Redirect to the checkout page
        // Use /order/checkout.html if you are on the homepage
        // If you are already in a subfolder, you might need '../order/checkout.html'
        window.location.href = '/order/checkout.html'; 
    };
}