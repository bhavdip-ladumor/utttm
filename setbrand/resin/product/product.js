/**
 * PRODUCT PAGE ENGINE - product.js
 * Location: root/setbrand/resin/product/
 */

let currentProduct = null;
let allVariants = [];

// --- 1. INITIALIZATION ---

async function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const skuId = params.get('sku');

    if (!productId) {
        window.location.href = '../resincosmos.html';
        return;
    }

    // Wait for database.js to populate window.allProducts
    if (window.allProducts && window.allProducts.length > 0) {
        renderProductDetails(productId, skuId);
    } else {
        window.addEventListener('db_ready', () => {
            renderProductDetails(productId, skuId);
        });
        
        // Polling fallback
        const checkDB = setInterval(() => {
            if (window.allProducts && window.allProducts.length > 0) {
                renderProductDetails(productId, skuId);
                clearInterval(checkDB);
            }
        }, 100);
    }
}

// --- 2. CORE RENDERING ---

function renderProductDetails(id, skuId) {
    // Filter variants belonging to this product ID
    allVariants = window.allProducts.filter(p => String(p.id) === String(id));
    
    if (allVariants.length === 0) {
        document.body.innerHTML = `
            <div style="text-align:center; padding:100px;">
                <h2>Product Not Found</h2>
                <a href="../resincosmos.html">Back to Home</a>
            </div>`;
        return;
    }

    // Select variant based on SKU or default to first one
    currentProduct = skuId ? allVariants.find(v => String(v.sku) === String(skuId)) : allVariants[0];
    if (!currentProduct) currentProduct = allVariants[0];

    updateMainProductUI();
    renderVariants(); 
    checkKitStatus();

    // Deferred tasks for performance
    setTimeout(() => {
        renderSimilarByTag(currentProduct.tagweb, currentProduct.id);
        renderBreadcrumbs();
    }, 50);
}

function updateMainProductUI() {
    document.title = `${currentProduct.name} | Resin Cosmos`;

    const setElementText = (elId, text) => {
        const el = document.getElementById(elId);
        if (el) el.innerText = text;
    };

    setElementText('product-brand', `By ${currentProduct.brand || 'Resin Cosmos'}`);
    setElementText('product-name', currentProduct.name);
    setElementText('product-description', currentProduct.description);
    setElementText('product-sale', `₹${currentProduct.sale}`);
    setElementText('product-mrp', `₹${currentProduct.mrp}`);
    
    // Discount Calculation
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

    // Images
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

// --- 3. VARIANT SYSTEM ---

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

    const match = allVariants.find(v => {
        const vVals = v.attrValue.split(',').map(s => s.trim());
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

// --- 4. KIT & CART LOGIC ---

function handleAddToCart() {
    if (typeof addToCart === 'function' && currentProduct) {
        // 1. Add to database/storage
        addToCart(currentProduct.id, currentProduct);
        
        // 2. Visual Feedback (Glow/Bounce the cart icon instead of opening)
        const cartPill = document.querySelector('.cart-pill');
        if (cartPill) {
            cartPill.classList.add('cart-bounce');
            setTimeout(() => cartPill.classList.remove('cart-bounce'), 400);
        }
    }
}

function checkKitStatus() {
    const kitBox = document.getElementById('kit-section');
    if (!kitBox) return;

    const isKit = currentProduct.kitComponents && currentProduct.kitComponents.length > 0;
    kitBox.style.display = isKit ? 'flex' : 'none';
}

function openKitModal(productId) {
    const product = window.allProducts.find(p => String(p.id) === String(productId));
    if (!product || !product.kitComponents) return;

    const modal = document.getElementById('kit-modal');
    const kitContent = document.getElementById('kit-items-list');
    const footerLogic = document.getElementById('modal-footer-logic');
    
    const rawIds = product.kitComponents.split(',').map(id => id.trim());
    const components = window.allProducts.filter(p => rawIds.includes(String(p.id)));

    let totalMRP = 0, totalSell = 0;

    kitContent.innerHTML = components.map((item, index) => {
        totalMRP += Number(item.mrp) || 0;
        totalSell += Number(item.sale) || 0;
        return `
            <div class="kit-item-card">
                <img src="${item.images[0]}" class="kit-item-img-small">
                <div class="kit-item-details-stack">
                    <span class="kit-item-name-small">${item.name}</span>
                    <div class="kit-item-prices-small">
                        <span class="kit-sale">₹${item.sale}</span>
                        <span class="kit-mrp">₹${item.mrp}</span>
                    </div>
                </div>
            </div>` + (index < components.length - 1 ? '<div class="kit-plus-sign">+</div>' : '');
    }).join('');

    footerLogic.innerHTML = `
        <div class="price-summary">
            <div class="summary-line"><span>Total MRP:</span> <span style="text-decoration:line-through">₹${totalMRP}</span></div>
            <div class="summary-line highlight"><span>Combo Price:</span> <span>₹${totalSell}</span></div>
        </div>
        <button class="buy-now-btn" style="width:100%; margin-top:10px;" onclick="addKitToCart('${product.id}')">ADD BUNDLE TO CART</button>`;
        
    modal.style.display = 'flex';
}

function addKitToCart(id) {
    const product = window.allProducts.find(p => String(p.id) === String(id));
    if (!product) return;
    const ids = product.kitComponents.split(',').map(cid => cid.trim());
    ids.forEach(cid => {
        const item = window.allProducts.find(p => String(p.id) === String(cid));
        if (item && typeof addToCart === 'function') addToCart(item.id, item);
    });
    closeModal();
}

function closeModal() { document.getElementById('kit-modal').style.display = 'none'; }

// --- 5. SEARCH ENGINE (Deduplicated) ---

function initProductPageSearch() {
    const input = document.getElementById('productSearch');
    const resultsContainer = document.getElementById('searchResults');
    if (!input || !resultsContainer) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            resultsContainer.style.display = 'none';
            return;
        }

        const uniqueMatches = new Map();
        window.allProducts.forEach(p => {
            if (p.name?.toLowerCase().includes(query) || String(p.id).includes(query)) {
                if (!uniqueMatches.has(p.id)) uniqueMatches.set(p.id, p);
            }
        });
        renderSearchList(Array.from(uniqueMatches.values()));
    });
}

function renderSearchList(matches) {
    const container = document.getElementById('searchResults');
    if (matches.length === 0) {
        container.innerHTML = `<div style="padding:15px; color:#999;">No results</div>`;
    } else {
        container.innerHTML = matches.slice(0, 8).map(p => `
            <div class="search-item" onclick="window.location.href='product.html?id=${p.id}'" 
                 style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee; cursor:pointer;">
                <img src="${p.images[0]}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div style="flex:1">
                    <div style="font-weight:600; font-size:0.85rem;">${p.name}</div>
                    <div style="font-size:0.75rem; color:var(--primary);">₹${p.sale}</div>
                </div>
            </div>`).join('');
    }
    container.style.display = 'block';
}

// --- 6. UTILITIES & SIMILAR PRODUCTS ---

function changeMainImage(el, src) {
    document.getElementById('main-display-img').src = src;
    document.querySelectorAll('#thumb-list img').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function renderBreadcrumbs() {
    const bc = document.getElementById('breadcrumb');
    if(bc) bc.innerHTML = `<a href="../resincosmos.html">Home</a> / <span>${currentProduct.category}</span>`;
}

function renderSimilarByTag(tagString, currentId) {
    const grid = document.getElementById('similar-products-grid');
    if (!grid) return;

    const currentTags = (tagString || "").split(',').map(t => t.trim().toLowerCase());
    
    // Use a Set to track IDs and prevent internal repeats in the list
    const seenIds = new Set();
    // Add current product ID to seenIds so it is automatically skipped
    seenIds.add(String(currentId));

    const similar = window.allProducts.filter(p => {
        const pId = String(p.id);
        
        // Skip if it's the current product OR we've already added this ID to the list
        if (seenIds.has(pId)) return false;

        const pTags = (p.tagweb || "").split(',').map(t => t.trim().toLowerCase());
        const isMatch = currentTags.some(tag => pTags.includes(tag));

        if (isMatch) {
            seenIds.add(pId);
            return true;
        }
        return false;
    }).slice(0, 4); // Limit to 4 items

    grid.innerHTML = similar.map(p => `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
            <div class="card-img-container">
                <img src="${p.images[0]}" loading="lazy">
            </div>
            <h4>${p.name}</h4>
            <div class="price-row"><span>₹${p.sale}</span></div>
        </div>`).join('');
}

function handleWhatsAppOrder() {
    const text = `Interested in: ${currentProduct.name} (₹${currentProduct.sale})\nLink: ${window.location.href}`;
    window.open(`https://wa.me/919724362981?text=${encodeURIComponent(text)}`, '_blank');
}

// Start Engine on Load
window.addEventListener('DOMContentLoaded', () => {
    initProductPage();
    initProductPageSearch();
});

// Close search on click outside
document.addEventListener('click', (e) => {
    const results = document.getElementById('searchResults');
    if (results && !e.target.closest('.search-bar')) results.style.display = 'none';
});