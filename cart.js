/* ==========================================================
   UTTAMHUB GLOBAL CART & KIT ENGINE (cart.js)
   Features: Path-Aware Injection, Multi-Icon Sync, Kits, WhatsApp
   ========================================================== */

// Initialize Cart from LocalStorage
let cart = JSON.parse(localStorage.getItem('SHOP_CART')) || [];

// --- 1. CART CORE LOGIC ---

/**
 * Adds a product to the cart. Creates a unique ID based on attributes 
 * to ensure different variants are treated as separate items.
 */
function addToCart(id, specificProduct = null) {
    const product = specificProduct || window.allProducts.find(p => String(p.id) === String(id));
    if (!product) return;

    // Use SKU as the unique identifier for variants
    const uniqueId = product.sku ? `${product.id}_${product.sku}` : String(product.id);
    const existing = cart.find(item => item.uniqueId === uniqueId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        const startQty = parseInt(product.minOrder) || 1;
        
        // Correctly capture variant details from attrValue
        let variantLabel = 'Standard';
        if (product.attrValue) {
            // Replaces underscores with spaces and commas with slashes
            variantLabel = product.attrValue.replace(/_/g, ' ').split(',').join(' / ');
        }

        cart.push({ 
            uniqueId: uniqueId,
            id: product.id, 
            sku: product.sku,
            name: product.name,
            variant: variantLabel,
            image: (product.images && product.images.length > 0) ? product.images[0] : '', 
            sellPrice: Number(product.sale) || 0, 
            quantity: startQty 
        });
    }
    saveCart();
    
    // Open the sidebar automatically
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar && !sidebar.classList.contains('open')) toggleCart();
}    


function saveCart() {
    localStorage.setItem('SHOP_CART', JSON.stringify(cart));
    renderCartUI();
    animateCartAction();
}

function updateQuantity(uniqueId, change) {
    const item = cart.find(p => p.uniqueId === uniqueId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.uniqueId !== uniqueId);
        }
        saveCart();
    }
}

function clearCart() {
    if(confirm("Are you sure you want to clear your selections?")) {
        cart = [];
        saveCart();
    }
}

// --- 2. UI & ANIMATION ---

function renderCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-amount');
    
    const countBadges = document.querySelectorAll('#cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    countBadges.forEach(badge => {
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    });

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px;">
                                 <p style="color:#999; margin-bottom:10px;">Your cart is empty</p>
                                 <a href="index.html" style="color:var(--primary); font-size:0.9rem; text-decoration:none;">Start Shopping</a>
                               </div>`;
        if (totalDisplay) totalDisplay.innerText = "0";
        return;
    }

    let grandTotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = (Number(item.sellPrice) || 0) * item.quantity;
        grandTotal += itemTotal;
        return `
            <div class="cart-row" style="display:flex; align-items:center; gap:12px; padding:15px 10px; border-bottom:1px solid #eee;">
                <img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #f0f0f0;">
                <div style="flex:1;">
                    <p style="margin:0; font-weight:700; font-size:0.9rem; color:#333; line-height:1.2;">${item.name}</p>
                    <div style="margin-top:2px;">
                        <span style="background:#f0f0f0; color:#666; font-size:0.7rem; padding:2px 6px; border-radius:4px; display:inline-block;">
                            ${item.variant}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                        <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:4px; overflow:hidden;">
                            <button onclick="updateQuantity('${item.uniqueId}', -1)" style="border:none; background:#fff; width:28px; height:24px; cursor:pointer; font-weight:bold;">-</button>
                            <span style="font-size:0.85rem; font-weight:bold; width:30px; text-align:center;">${item.quantity}</span>
                            <button onclick="updateQuantity('${item.uniqueId}', 1)" style="border:none; background:#fff; width:28px; height:24px; cursor:pointer; font-weight:bold;">+</button>
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; color:#B12704; font-size:0.95rem;">₹${itemTotal.toLocaleString('en-IN')}</div>
                    <small style="color:#999; font-size:0.7rem;">₹${item.sellPrice} ea</small>
                </div>
            </div>`;
    }).join('');
    
    if (totalDisplay) totalDisplay.innerText = grandTotal.toLocaleString('en-IN');
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    }
}

function animateCartAction() {
    const badges = document.querySelectorAll('#cart-count');
    badges.forEach(badge => {
        badge.classList.remove('cart-bounce');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('cart-bounce');
        
        // Also animate the parent button if it has the fixed class
        const btn = badge.parentElement;
        if(btn && btn.classList.contains('cart-icon-fixed')) {
            btn.style.transform = "scale(1.2)";
            setTimeout(() => btn.style.transform = "scale(1)", 200);
        }
    });
}

// --- 3. CHECKOUT LOGIC ---

function checkoutWhatsApp() {
    if (cart.length === 0) return alert("Add items to your cart first!");
    
    let message = "*📦 NEW ORDER FROM UTTAM HUB*%0A--------------------------%0A";
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*%0A`;
        if(item.variant) message += `_Options: ${item.variant}_%0A`;
        message += `Qty: ${item.quantity} | Price: ₹${(item.sellPrice * item.quantity).toLocaleString('en-IN')}%0A%0A`;
    });
    
    const total = document.getElementById('cart-total-amount').innerText;
    message += `*TOTAL PAYABLE: ₹${total}*%0A--------------------------%0APlease process my order.`;
    
    window.open(`https://wa.me/919724362981?text=${message}`, '_blank');
}

// --- 4. KIT / BUNDLE LOGIC ---

function openKitModal(productId) {
    const product = window.allProducts.find(p => String(p.id) === String(productId));
    if (!product || !product.kitComponents) return;

    const modal = document.getElementById('kit-modal');
    const kitContent = document.getElementById('kit-items-list');
    const footerLogic = document.getElementById('modal-footer-logic');
    
    const componentIDs = product.kitComponents.split(',').map(id => id.trim());
    const components = window.allProducts.filter(p => componentIDs.includes(String(p.id)));

    let totalMRP = 0, totalSell = 0;
    
    kitContent.innerHTML = components.map((item) => {
        totalMRP += Number(item.mrp) || 0;
        totalSell += Number(item.sale) || 0;
        return `
            <div class="kit-item" style="display:flex; align-items:center; gap:15px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <img src="${item.images[0]}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
                <div class="kit-item-details">
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.85rem;">
                        <span style="color:#27ae60; font-weight:bold;">₹${item.sale}</span>
                        <span style="text-decoration:line-through; color:#999; margin-left:5px;">₹${item.mrp}</span>
                    </div>
                </div>
            </div>`;
    }).join('');

    footerLogic.innerHTML = `
        <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-top:15px;">
            <p style="margin:0; font-size:0.9rem;">Total Individual MRP: <span style="text-decoration:line-through; color:#999;">₹${totalMRP}</span></p>
            <p style="margin:5px 0; font-size:1.1rem; font-weight:bold; color:#d63031;">Combo Kit Price: ₹${totalSell}</p>
        </div>
        <button onclick="addKitToCart('${product.id}'); closeModal();" 
                style="width:100%; padding:15px; background:#0984e3; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">
            ADD FULL BUNDLE TO CART
        </button>`;
        
    modal.style.display = 'flex';
}

function addKitToCart(id) {
    const product = window.allProducts.find(p => String(p.id) === String(id));
    if (!product || !product.kitComponents) return;

    const componentIDs = product.kitComponents.split(',').map(cid => cid.trim());
    const components = window.allProducts.filter(p => componentIDs.includes(String(p.id)));
    
    let kitTotal = components.reduce((sum, item) => sum + (Number(item.sale) || 0), 0);
    const kitBundleId = `kit_${id}`; 
    
    const existingKit = cart.find(item => item.id === kitBundleId);
    if (existingKit) {
        existingKit.quantity += 1;
    } else {
        cart.push({ 
            uniqueId: kitBundleId,
            id: kitBundleId, 
            name: `${product.kitName || product.name} Bundle`, 
            image: product.images[0], 
            sellPrice: kitTotal, 
            quantity: 1 
        });
    }
    saveCart();
}

function closeModal() { 
    const modal = document.getElementById('kit-modal');
    if (modal) modal.style.display = 'none'; 
}

// --- 5. INITIALIZATION & INJECTION ---

async function injectGlobalCart() {
    const placeholder = document.getElementById('cart-placeholder');
    if (!placeholder) return;

    // Detect depth by looking at the scripts already on the page
    // This is the most reliable way to find the root
    const scripts = document.getElementsByTagName('script');
    let prefix = "";
    
    for (let s of scripts) {
        if (s.src.includes('cart.js')) {
            // Extracts "../../" from "../../cart.js"
            prefix = s.getAttribute('src').replace('cart.js', '');
            break;
        }
    }

    try {
        const response = await fetch(prefix + 'shopcart.html');
        if (response.ok) {
            placeholder.innerHTML = await response.text();
            renderCartUI(); 
            console.log("Cart injected using prefix: " + prefix);
        } else {
            console.error("Fetch failed for: " + prefix + "shopcart.html");
        }
    } catch (err) {
        console.error("Cart injection error:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    injectGlobalCart();
    
    // Auto-init listing pages if product-grid exists
    if (document.getElementById('product-grid') && typeof loadProducts === 'function') {
        loadProducts();
    }
});