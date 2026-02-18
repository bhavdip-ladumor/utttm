/**
 * PRODUCT PAGE ENGINE - product.js
 * Optimized for 33-column manual database.js
 * Feature: Unlimited Dynamic Variants, Kit Logic, and Cart Integration
 */

let currentProduct = null;
let allVariants = [];

async function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const skuId = params.get('sku');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    // FIX: Ensure database is ready before rendering
    if (window.allProducts && window.allProducts.length > 0) {
        renderProductDetails(productId, skuId);
    } else {
        // Listen for the custom event from your database loader
        window.addEventListener('db_ready', () => {
            renderProductDetails(productId, skuId);
        });
        // Fallback: Check every 100ms if data arrived
        const checkDB = setInterval(() => {
            if (window.allProducts && window.allProducts.length > 0) {
                renderProductDetails(productId, skuId);
                clearInterval(checkDB);
            }
        }, 100);
    }
}

function renderProductDetails(id, skuId) {
    allVariants = window.allProducts.filter(p => String(p.id) === String(id));
    
    if (allVariants.length === 0) {
        document.body.innerHTML = `<div style="text-align:center; padding:100px;"><h2>Product Not Found</h2><a href="index.html">Back to Home</a></div>`;
        return;
    }

    // Select specific variant based on SKU or default to first
    currentProduct = skuId ? allVariants.find(v => String(v.sku) === String(skuId)) : allVariants[0];
    if (!currentProduct) currentProduct = allVariants[0];

    // --- IMMEDIATE UI UPDATE ---
    updateMainProductUI();
    renderVariants(); 
    checkKitStatus();

    // --- DEFERRED TASKS ---
    setTimeout(() => {
        renderSimilarByTag(currentProduct.tagweb, currentProduct.id);
        renderBreadcrumbs();
    }, 50);
}

function updateMainProductUI() {
    document.title = `${currentProduct.name} | Uttamhub`;

    const setElementText = (elId, text) => {
        const el = document.getElementById(elId);
        if (el) el.innerText = text;
    };

    setElementText('product-brand', `By ${currentProduct.brand || 'Uttamhub'}`);
    setElementText('product-name', currentProduct.name);
    setElementText('product-description', currentProduct.description);
    setElementText('product-sale', `₹${currentProduct.sale}`);
    setElementText('product-mrp', `₹${currentProduct.mrp}`);
    
    const discElement = document.getElementById('product-discount');
    if (discElement) {
        const s = parseFloat(currentProduct.sale);
        const m = parseFloat(currentProduct.mrp);
        if (m > s) {
            const disc = Math.round(((m - s) / m) * 100);
            discElement.innerText = `${disc}% OFF`;
            discElement.style.display = 'inline';
        } else {
            discElement.style.display = 'none';
        }
    }

    const mainImg = document.getElementById('main-display-img');
    if(mainImg && currentProduct.images && currentProduct.images.length > 0) {
        mainImg.src = currentProduct.images[0];
    }
    
    const thumbList = document.getElementById('thumb-list');
    if(thumbList && currentProduct.images) {
        thumbList.innerHTML = currentProduct.images.map((img, idx) => `
            <img src="${img}" class="${idx === 0 ? 'active' : ''}" 
                 onclick="changeMainImage(this, '${img}')" 
                 onerror="this.style.display='none'">
        `).join('');
    }
}

function renderVariants() {
    const container = document.getElementById('attributes-container');
    if (!container || !currentProduct.attrName) return;

    const attrNames = currentProduct.attrName.split(',').map(s => s.trim());
    const currentValues = currentProduct.attrValue.split(',').map(s => s.trim());

    let html = "";
    attrNames.forEach((name, index) => {
        const options = [...new Set(allVariants.map(v => {
            const vals = v.attrValue.split(',').map(s => s.trim());
            return vals[index];
        }))].filter(Boolean);

        html += `<div class="attr-group">
                    <h4>Select ${name.replace(/_/g, ' ')}:</h4>
                    <div class="pill-flex">`;

        options.forEach(opt => {
            const isAvailable = checkAvailability(index, opt, currentValues);
            const isActive = opt === currentValues[index] ? 'active-pill' : '';
            const isDisabled = !isAvailable ? 'disabled-pill' : '';
            
            html += `<span class="attr-pill ${isActive} ${isDisabled}" 
                        ${isAvailable ? `onclick="selectDynamicAttr(${index}, '${opt}')"` : ''}>
                        ${opt.replace(/_/g, ' ')}
                     </span>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function checkAvailability(targetIndex, optionToTest, currentSelectedValues) {
    return allVariants.some(v => {
        const vVals = v.attrValue.split(',').map(s => s.trim());
        for (let i = 0; i < targetIndex; i++) {
            if (vVals[i] !== currentSelectedValues[i]) return false;
        }
        return vVals[targetIndex] === optionToTest;
    });
}

function selectDynamicAttr(index, newValue) {
    const targetValues = currentProduct.attrValue.split(',').map(s => s.trim());
    targetValues[index] = newValue;

    // Find the best matching variant
    const match = allVariants.find(v => {
        const vVals = v.attrValue.split(',').map(s => s.trim());
        // Match up to the current index
        for(let i = 0; i <= index; i++) {
            if(vVals[i] !== targetValues[i]) return false;
        }
        return true;
    }) || allVariants.find(v => v.attrValue.split(',')[index].trim() === newValue);

    if (match) {
        const newUrl = `product.html?id=${match.id}&sku=${match.sku}`;
        window.history.replaceState(null, '', newUrl);
        renderProductDetails(match.id, match.sku);
    }
}

// 1. Logic to show/hide the Kit Box on the main page
function checkKitStatus() {
    const kitBox = document.getElementById('kit-section');
    if (!kitBox) return;

    // Show if product has components defined in CSV
    const isKit = currentProduct.kitComponents && currentProduct.kitComponents.length > 0;
    
    if (isKit) {
        kitBox.style.display = 'flex';
        // Ensure the button inside the box is ready
        const btn = kitBox.querySelector('.add-kit-btn');
        if(btn) btn.setAttribute('onclick', `openKitModal('${currentProduct.id}')`);
    } else {
        kitBox.style.display = 'none';
    }
}

/* =========================================
   KIT MODAL LOGIC
   ========================================= */

function openKitModal(productId) {
    const product = window.allProducts.find(p => String(p.id) === String(productId));
    if (!product || !product.kitComponents) return;

    const modal = document.getElementById('kit-modal');
    const kitContent = document.getElementById('kit-items-list');
    const footerLogic = document.getElementById('modal-footer-logic');
    
    // 1. Get raw IDs from CSV
    const rawIds = product.kitComponents.split(',').map(id => id.trim());
    
    // 2. CRITICAL FIX: Filter out duplicates by Product Name
    const uniqueComponents = [];
    const seenBaseNames = new Set();

    rawIds.forEach(id => {
        const item = window.allProducts.find(p => String(p.id) === String(id));
        if (item) {
            // Trim and lowercase to ensure "Clock" and "clock " are treated as the same
            const normalizedName = item.name.trim().toLowerCase();
            if (!seenBaseNames.has(normalizedName)) {
                uniqueComponents.push(item);
                seenBaseNames.add(normalizedName);
            }
        }
    });

    let totalMRP = 0;
    let totalSell = 0;

    // 3. RENDER: Stacking logic (Image -> Details Stack)
    kitContent.innerHTML = uniqueComponents.map((item, index) => {
        totalMRP += Number(item.mrp) || 0;
        totalSell += Number(item.sale) || 0;

        const itemHtml = `
            <div class="kit-item-card">
                <img src="${item.images[0]}" class="kit-item-img-small">
                <div class="kit-item-details-stack">
                    <span class="kit-item-name-small">${item.name}</span>
                    <div class="kit-item-prices-small">
                        <span class="kit-sale">₹${item.sale}</span>
                        <span class="kit-mrp">₹${item.mrp}</span>
                    </div>
                </div>
            </div>`;
        
        // Plus sign alignment logic
        const separator = (index < uniqueComponents.length - 1) ? '<div class="kit-plus-sign">+</div>' : '';
        return itemHtml + separator;
    }).join('');

    // 4. FOOTER: Total Pricing logic
    footerLogic.innerHTML = `
        <div class="price-summary">
            <div class="summary-line">
                <span>Individual Total:</span>
                <span style="text-decoration:line-through">₹${totalMRP}</span>
            </div>
            <div class="summary-line highlight">
                <span>Combo Kit Price:</span>
                <span>₹${totalSell}</span>
            </div>
            <p class="save-tag">You save ₹${totalMRP - totalSell} instantly!</p>
        </div>
        <button class="buy-now-btn" style="width:100%; margin-top:15px; border-radius:10px;" onclick="addKitToCart('${product.id}')">
            ADD FULL BUNDLE TO CART
        </button>`;
        
    modal.style.display = 'flex';
}

function addKitToCart(id) {
    const product = window.allProducts.find(p => String(p.id) === String(id));
    if (!product) return;

    const uniqueIds = [...new Set(product.kitComponents.split(',').map(cid => cid.trim()))];

    uniqueIds.forEach(cid => {
        const item = window.allProducts.find(p => String(p.id) === String(cid));
        if (item && typeof addToCart === 'function') {
            addToCart(item.id, item);
        }
    });

    closeModal();
    if (typeof toggleCart === 'function') toggleCart();
}

function closeModal() {
    document.getElementById('kit-modal').style.display = 'none';
}


function handleAddToCart() {
    if (typeof addToCart === 'function') {
        addToCart(currentProduct.id, currentProduct);
        if (typeof toggleCart === 'function') toggleCart(); 
    }
}

function renderBreadcrumbs() {
    const bc = document.getElementById('breadcrumb');
    if(bc) bc.innerHTML = `<a href="index.html">Home</a> / <span>${currentProduct.category}</span>`;
}

function changeMainImage(el, src) {
    const mainDisplay = document.getElementById('main-display-img');
    if (mainDisplay) mainDisplay.src = src;
    document.querySelectorAll('#thumb-list img').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function renderSimilarByTag(tagString, currentId) {
    const grid = document.getElementById('similar-products-grid');
    if (!grid) return;

    // Convert tags to lowercase array for comparison
    const currentTags = (tagString || "").split(',').map(t => t.trim().toLowerCase()).filter(t => t !== "");
    
    // Set to track unique IDs already displayed to avoid duplicates
    const seenIds = new Set();

    const similar = window.allProducts.filter(p => {
        // 1. CRITICAL FIX: Skip if the product ID is the SAME as the current one
        // This hides the current product AND all its variants
        if (String(p.id) === String(currentId)) return false; 

        // 2. Check for tag matches
        const pTags = (p.tagweb || "").split(',').map(t => t.trim().toLowerCase());
        const isMatch = currentTags.some(tag => pTags.includes(tag));

        // 3. Ensure we haven't already added this product ID to the list
        if (isMatch && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            return true;
        }
        return false;
    });

    // Hide section if no similar products found
    if (similar.length === 0) {
        const container = document.querySelector('.similar-products-container');
        if(container) container.style.display = 'none';
        return;
    } else {
        const container = document.querySelector('.similar-products-container');
        if(container) container.style.display = 'block';
    }

    // Render the grid (limited to 10 items)
    grid.innerHTML = similar.slice(0, 10).map(p => `
        <div class="product-card" onclick="goToProduct('${p.id}')">
            <div class="card-img-container">
                <img src="${p.images[0]}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <h4 class="card-title">${p.name}</h4>
                <div class="price-row">
                    <span class="sale-price">₹${p.sale}</span>
                </div>
            </div>
        </div>
    `).join('');
}
function goToProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

function handleWhatsAppOrder() {
    const text = `Hi Uttamhub! I'm interested in:
Product: ${currentProduct.name}
Price: ₹${currentProduct.sale}
Link: ${window.location.href}`;
    window.open(`https://wa.me/919724362981?text=${encodeURIComponent(text)}`, '_blank');
}

// FIX: Start Engine immediately
initProductPage();