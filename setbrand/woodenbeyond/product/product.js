/**
 * PRODUCT PAGE ENGINE - Full Version
 * Handles: URL ID lookup, Multi-Attribute Selection, Image Gallery, and Search.
 */

let productVariants = []; // All SKUs sharing the same product ID
let selectedVariant = null; // The specific SKU currently active
let currentSelections = {}; // Current attribute state, e.g., { Width: "4_mm", Size: "8_inch" }

async function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = '../woodenbeyond.html';
        return;
    }

    // Initialize the search bar in the header
    initGlobalSearch();

    // Check if database is already loaded, otherwise wait for it
    if (window.allProducts && window.allProducts.length > 0) {
        setupProductData(productId);
    } else {
        window.addEventListener('db_ready', () => setupProductData(productId));
    }
}

/**
 * 1. DATA SETUP
 */
/**
 * 1. DATA SETUP
 */
function setupProductData(id) {
    // Show Loading state (Optional: already visible via HTML)
    const loader = document.getElementById('loading-overlay');
    
    // 1. ADD THIS: Check the URL for existing variant selections first
    parseVariantFromURL();

    // Find all variants for this ID
    productVariants = window.allProducts.filter(p => String(p.id) === String(id));

    if (productVariants.length === 0) {
        if (loader) loader.style.display = 'none'; // Hide loader if error
        document.body.innerHTML = `
            <div style="text-align:center; padding:100px; font-family:sans-serif;">
                <h2>Product Not Found</h2>
                <a href="../woodenbeyond.html" style="color:#000;">Return to Shop</a>
            </div>`;
        return;
    }

// 2. MODIFIED: Only set default if URL didn't already set selections
    if (Object.keys(currentSelections).length === 0) {
        selectedVariant = productVariants[0];
        const names = (selectedVariant.attrName || "").split(',').map(s => s.trim());
        const values = (selectedVariant.attrValue || "").split(',').map(s => s.trim());
        names.forEach((name, i) => {
            if (name) currentSelections[name] = values[i];
        });
    } else {
        // Find the variant that matches the URL params
        const match = productVariants.find(v => {
            const vKeys = v.attrName.split(',').map(s => s.trim());
            const vVals = v.attrValue.split(',').map(s => s.trim());
            return vKeys.every((k, i) => currentSelections[k] === vVals[i]);
        });
        selectedVariant = match || productVariants[0];
    }

    // --- TRIGGER THE UI ENGINE ---
    renderStaticUI();
    renderVariantSelectors();
    updateVariantSpecificUI();
    renderSimilarProducts();
    autoRenderOtherCategories(); 
    renderSidebarCategories();
    
    // 3. ADD THIS: Initialize the share button listener
    initShareButton();

    // --- FINISHED ---
    // Hide the loader with a smooth fade
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// 1. Sidebar Toggle Logic
function toggleSidebar() {
    document.getElementById('sidebar-menu').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}



// 3. Inject Categories into Sidebar (Run this inside setupProductData)
function renderSidebarCategories() {
    const container = document.getElementById('sidebar-content');
    if (!container || !window.allProducts) return;

    // Grouping logic for Sidebar
    const categories = [...new Set(window.allProducts.map(p => p.category))];
    
    container.innerHTML = categories.map(cat => {
        const subs = [...new Set(window.allProducts
            .filter(p => p.category === cat)
            .map(p => p.subcategory))];

        return `
            <div class="sidebar-cat-item">
                <span class="sidebar-cat-title">${cat}</span>
                <ul class="sidebar-sub-list">
                    ${subs.map(sub => `
                        <li><a href="../category/category.html?category=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}">${sub}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

/**
 * 2. STATIC UI RENDERING (Titles, Brand, Images)
 * 
 */

/**
 * SWIPE ENGINE
 * Detects left/right swipes on the main image
 */
/**
 * 1. SWIPE ENGINE
 * Detects left/right swipes on the main image
 */
let touchStartX = 0;
let touchEndX = 0;
let isSwipeListenerAttached = false;
let currentImageIndex = 0;

function initSwipe() {
    const mainImgContainer = document.querySelector('.main-image-container');
    if (!mainImgContainer || isSwipeListenerAttached) return;

    mainImgContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImgContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    isSwipeListenerAttached = true;
}

/**
 * FIXED: handleSwipe
 * Robust detection for Localhost (127.0.0.1) and Uttamhub
 */
function handleSwipe() {
    const threshold = 40; 
    const images = selectedVariant.images;
    if (!images || images.length <= 1) return;

    const diff = touchStartX - touchEndX;
    
    // Reset coordinates immediately
    touchStartX = 0;
    touchEndX = 0;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
        // Swiped Left -> Next (using our tracker)
        currentImageIndex = (currentImageIndex + 1) % images.length;
    } else {
        // Swiped Right -> Previous (using our tracker)
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    }
    
    triggerImageUpdate(currentImageIndex);
}

/**
 * FIXED: Image Trigger
 * Ensures thumbnails and main image are perfectly synced
 */
function triggerImageUpdate(index) {
    const images = selectedVariant.images;
    const mainImg = document.getElementById('main-display-img');
    const thumbImgs = document.querySelectorAll('#thumb-list img');

    if (!images || !images[index]) return;

    // Update our tracker
    currentImageIndex = index;

    // Update the image
    mainImg.src = images[index];

    // Update Thumbnails UI
    thumbImgs.forEach((img, i) => {
        if (i === index) {
            img.classList.add('active');
            img.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            img.classList.remove('active');
        }
    });
}

// Fix: Ensure manual clicks also update the attribute
// Update this to sync the tracker when a thumbnail is clicked
function updateMainImg(el, src) {
    const images = selectedVariant.images;
    // Even if URLs are same, we find the specific thumbnail index clicked
    const thumbImgs = Array.from(document.querySelectorAll('#thumb-list img'));
    const index = thumbImgs.indexOf(el); 

    if (index !== -1) {
        triggerImageUpdate(index);
    }
}

/**
 * 3. UI RENDERING
 */
function renderStaticUI() {
    currentImageIndex = 0; // Reset to first image
    // 1. Update Text Content
    document.title = `${selectedVariant.name} | Wooden beyond`;
    document.getElementById('product-name').innerText = selectedVariant.name;
    document.getElementById('product-brand').innerText = `By ${selectedVariant.brand || 'Wooden beyond'}`;
    document.getElementById('product-tagline').innerText = selectedVariant.tagline || "";

    // 2. Update Gallery Images
    const mainImg = document.getElementById('main-display-img');
    const thumbList = document.getElementById('thumb-list');

    if (selectedVariant.images && selectedVariant.images.length > 0) {
        // Set first image
        mainImg.src = selectedVariant.images[0];

        // Rebuild thumbnails
        thumbList.innerHTML = selectedVariant.images.map((img, idx) => `
            <img src="${img}" 
                 class="${idx === 0 ? 'active' : ''}" 
                 onclick="updateMainImg(this, '${img}')"
                 alt="Thumbnail for ${selectedVariant.name}">
        `).join('');
    }

    // Initialize swipe engine (Fix: only runs if not already attached)
    initSwipe();
}

/**
 * 3. DYNAMIC VARIANT SELECTORS (Width, Size, etc.)
 */
function renderVariantSelectors() {
    const container = document.getElementById('variant-chips');
    if (!container) return;
    
    container.innerHTML = '';
    const attrKeys = selectedVariant.attrName.split(',').map(s => s.trim());

    if (productVariants.length <= 1) {
        document.querySelector('.variant-section').style.display = 'none';
        return;
    }

    attrKeys.forEach(key => {
        const row = document.createElement('div');
        row.className = 'variant-row';

        const label = document.createElement('p');
        label.className = 'variant-label';
        label.innerText = `SELECT ${key.toUpperCase()}:`;
        row.appendChild(label);

        const group = document.createElement('div');
        group.className = 'chip-group';

        const uniqueValues = [...new Set(productVariants.map(v => {
            const vKeys = v.attrName.split(',').map(s => s.trim());
            const vVals = v.attrValue.split(',').map(s => s.trim());
            return vVals[vKeys.indexOf(key)];
        }))];

        uniqueValues.forEach(val => {
            const isActive = currentSelections[key] === val;
            
            // --- CHECK IF THIS COMBINATION EXISTS ---
            const wouldBeSelections = { ...currentSelections, [key]: val };
            const exists = productVariants.some(v => {
                const vKeys = v.attrName.split(',').map(s => s.trim());
                const vVals = v.attrValue.split(',').map(s => s.trim());
                return vKeys.every((k, i) => wouldBeSelections[k] === vVals[i]);
            });

            const chip = document.createElement('div');
            // If it doesn't exist, add the 'disabled' class
            chip.className = `variant-chip ${isActive ? 'active' : ''} ${!exists ? 'disabled' : ''}`;
            chip.innerText = val.replace(/_/g, ' '); 
            
            if (exists) {
                chip.onclick = () => handleAttributeClick(key, val);
            }
            
            group.appendChild(chip);
        });

        row.appendChild(group);
        container.appendChild(row);
    });
}

function handleAttributeClick(key, value) {
    currentSelections[key] = value;

    const match = productVariants.find(v => {
        const vKeys = v.attrName.split(',').map(s => s.trim());
        const vVals = v.attrValue.split(',').map(s => s.trim());
        return vKeys.every((k, i) => currentSelections[k] === vVals[i]);
    });

    if (match) {
        selectedVariant = match;
        
        // --- NEW URL SYNC LOGIC ---
        // This adds &variant=Size:8_inch,Width:4_mm to the URL without reloading
        const variantSlug = Object.entries(currentSelections)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        const newUrl = `${window.location.origin}${window.location.pathname}?id=${selectedVariant.id}&variant=${encodeURIComponent(variantSlug)}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        // --------------------------

        renderStaticUI(); 
        renderVariantSelectors();
        updateVariantSpecificUI();
    }
}
// Add this logic where you initialize currentSelections
function parseVariantFromURL() {
    const params = new URLSearchParams(window.location.search);
    const variantStr = params.get('variant');
    if (variantStr) {
        const pairs = variantStr.split(',');
        pairs.forEach(pair => {
            const [k, v] = pair.split(':');
            if (k && v) currentSelections[k] = v;
        });
    }
}

function initShareButton() {
    // 1. MATCH THE ID: Changed from 'share-btn' to 'img-share-btn'
    const shareBtn = document.getElementById('img-share-btn'); 
    if (!shareBtn) return;

    shareBtn.onclick = async () => {
        // 2. CONSTRUCT CLEAN URL: Ensure the shared link has the current variant
        const variantSlug = Object.entries(currentSelections)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${selectedVariant.id}&variant=${encodeURIComponent(variantSlug)}`;

        const shareData = {
            title: selectedVariant.name,
            text: `Check out the ${selectedVariant.name} (${selectedVariant.attrValue}) on Wooden beyond!`,
            url: shareUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for desktop: Copy the generated shareUrl to clipboard
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };
}

// Call initShareButton() inside your window.onload or main init function
/**
 * 4. UI UPDATES (Price, Badges, WhatsApp)
 */
function updateVariantSpecificUI() {
    const sale = parseFloat(selectedVariant.sale);
    const mrp = parseFloat(selectedVariant.mrp);
    const stockCount = parseInt(selectedVariant.stock) || 0; // Get stock from DB

    document.getElementById('product-sale').innerText = `₹${sale}`;
    document.getElementById('product-mrp').innerText = `₹${mrp}`;

    // --- STOCK LOGIC ---
    const stockEl = document.getElementById('stock-status');
    if (stockEl) {
        if (stockCount <= 0) {
            stockEl.innerHTML = `<span class="out-of-stock"><i class="fas fa-times-circle"></i> Out of Stock</span>`;
            document.getElementById('whatsapp-inquiry').style.opacity = "0.5"; // Dim the button
            document.getElementById('whatsapp-inquiry').innerText = "Notify Me on WhatsApp";
        } else if (stockCount > 0 && stockCount <= 5) {
            stockEl.innerHTML = `<span class="low-stock"><i class="fas fa-fire"></i> Only ${stockCount} left! Selling fast</span>`;
            document.getElementById('whatsapp-inquiry').style.opacity = "1";
            document.getElementById('whatsapp-inquiry').innerHTML = `<i class="fab fa-whatsapp"></i> Inquiry Now`;
        } else {
            stockEl.innerHTML = `<span class="in-stock"><i class="fas fa-check-circle"></i> In Stock (${stockCount} units)</span>`;
            document.getElementById('whatsapp-inquiry').style.opacity = "1";
        }
    }

    // Delivery Tag
    const deliveryTag = document.getElementById('free-delivery-tag');
    deliveryTag.style.display = (selectedVariant.freeDelivery === "TRUE" || selectedVariant.freeDelivery === true) ? 'flex' : 'none';

    // Discount Calculation
    const discEl = document.getElementById('detail-discount');
    const badge = document.getElementById('image-discount-badge');
    
    if (mrp > sale) {
        const d = Math.round(((mrp - sale) / mrp) * 100);
        discEl.innerText = `${d}% OFF`;
        badge.innerText = `${d}% OFF`;
        discEl.style.display = 'inline-block';
        badge.style.display = 'block';
    } else {
        discEl.style.display = 'none';
        badge.style.display = 'none';
    }

// 1. Set Description
    const descEl = document.getElementById('product-description');
    if (descEl) {
        descEl.innerText = selectedVariant.description || "Premium quality product from Resin Cosmos.";
    }

// --- 1. Handle Highlights ---
const otherDetailsContainer = document.getElementById('other-details-section');
const otherDetailsList = document.getElementById('other-details-list');

if (selectedVariant.otherDetails && otherDetailsList) {
    otherDetailsContainer.style.display = 'block';
    const items = selectedVariant.otherDetails.split(',');

    // Only update the internal list, NOT the whole section
    otherDetailsList.innerHTML = items.map(item => {
        const trimmedItem = item.trim();
        const firstSpaceIndex = trimmedItem.indexOf(' ');
        if (firstSpaceIndex !== -1) {
            const head = trimmedItem.substring(0, firstSpaceIndex);
            const value = trimmedItem.substring(firstSpaceIndex + 1);
            return `<div class="detail-line"><strong>${head}:-</strong> <span>${value}</span></div>`;
        }
        return `<div class="detail-line"><span>${trimmedItem}</span></div>`;
    }).join('');
} else {
    otherDetailsContainer.style.display = 'none';
}

// --- 2. Handle Specifications ---
const specsEl = document.getElementById('product-specs');
if (specsEl) {
    // Only update the grid items, do NOT touch the button or title in HTML
    specsEl.innerHTML = `
        <div class="spec-item"><span>Weight</span><strong>${selectedVariant.weight}</strong></div>
        <div class="spec-item"><span>Length</span><strong>${selectedVariant.length}</strong></div>
        <div class="spec-item"><span>Width</span><strong>${selectedVariant.width}</strong></div>
        <div class="spec-item"><span>Height</span><strong>${selectedVariant.height}</strong></div>
        <div class="spec-item"><span>Category</span><strong>${selectedVariant.subcategory}</strong></div>
        <div class="spec-item"><span>HSN</span><strong>${selectedVariant.hsn}</strong></div>
        <div class="spec-item"><span>Tax</span><strong>${selectedVariant.tax_rate}%</strong></div>
    `;
}
// --- 3. ADD THE RESET CODE HERE ---
    ['highlights', 'specs'].forEach(id => {
        const wrapper = document.getElementById(`wrapper-${id}`);
        if (wrapper) {
            wrapper.classList.remove('open');
            // Find the button next to the wrapper and reset its text
            const btn = wrapper.nextElementSibling;
            if (btn && btn.classList.contains('mini-toggle-btn')) {
                btn.innerText = 'Show All';
            }
        }
    });

    // Update WhatsApp link
    const wpBtn = document.getElementById('whatsapp-inquiry');
    const msg = encodeURIComponent(`Hi Resin Cosmos! I'm interested in: ${selectedVariant.name} (${selectedVariant.attrValue}). SKU: ${selectedVariant.sku}`);
    wpBtn.onclick = () => window.open(`https://wa.me/919724362981?text=${msg}`, '_blank');
}

/**
 * 5. UTILITY FUNCTIONS
 */
function updateMainImg(el, src) {
    document.getElementById('main-display-img').src = src;
    document.querySelectorAll('.thumb-scroll-container img').forEach(img => img.classList.remove('active'));
    el.classList.add('active');
}

function initGlobalSearch() {
    const input = document.getElementById('productSearch');
    const dropdown = document.getElementById('searchResults');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (q.length < 1) { dropdown.style.display = 'none'; return; }

        const matches = window.allProducts.filter(p => 
            (p.name.toLowerCase().includes(q) || String(p.id).includes(q)) && 
            p.isActive !== "FALSE"
        ).slice(0, 6);

        dropdown.innerHTML = matches.map(p => `
            <div class="search-item" onclick="window.location.href='product.html?id=${p.id}'" 
                 style="display:flex; align-items:center; gap:12px; padding:10px; cursor:pointer; border-bottom:1px solid #f0f0f0;">
                <img src="${p.images[0]}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                <div>
                    <div style="font-weight:700; font-size:0.85rem; color:#000;">${p.name}</div>
                    <div style="font-size:0.75rem; color:#28a745; font-weight:700;">₹${p.sale}</div>
                </div>
            </div>
        `).join('');
        dropdown.style.display = 'block';
    });

    // Close search if clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
    });
}

// Global scope addToCartSilent if not defined in cart.js
window.addToCartSilent = window.addToCartSilent || function(sku) {
    console.log("Adding to cart SKU:", sku);
    if (typeof addToCart === "function") addToCart(sku);
};

// Initialize the whole engine
window.addEventListener('DOMContentLoaded', initProductPage);

function renderSimilarProducts() {
    const grid = document.getElementById('similar-grid');
    if (!grid || !selectedVariant) return;

    const categoryStr = selectedVariant.category || "";
    const currentCat = categoryStr.split(',')[0].trim().toLowerCase();

    if (!currentCat) return;

    // 1. Filter the list
    const similar = window.allProducts.filter(p => {
        const pCat = (p.category || "").toLowerCase();
        // Trim IDs to ensure "101" matches "101 "
        return pCat.includes(currentCat) && 
               String(p.id).trim() !== String(selectedVariant.id).trim() &&
               p.isActive !== "FALSE";
    });

    // 2. Map by ID to guarantee uniqueness
    // We use a Map to ensure only ONE instance of an ID exists
    const uniqueMap = new Map();
    similar.forEach(p => {
        const cleanId = String(p.id).trim();
        if (!uniqueMap.has(cleanId)) {
            uniqueMap.set(cleanId, p);
        }
    });

    const uniqueSimilar = Array.from(uniqueMap.values()).slice(0, 4);

    // 3. Render
    if (uniqueSimilar.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; color: #888; text-align: center;">No similar products found.</p>`;
        return;
    }

    grid.innerHTML = uniqueSimilar.map(p => {
        const wpLink = `https://wa.me/919724362981?text=${encodeURIComponent("Hi! I'm interested in " + p.name + " (ID: " + p.id + ")")}`;
        const hasDiscount = parseFloat(p.mrp) > parseFloat(p.sale);
        const firstImg = (p.images && p.images.length > 0) ? p.images[0] : 'placeholder.jpg';

        return `
            <div class="shop-card similar-card">
                <div class="card-img-wrap" onclick="window.location.href='product.html?id=${p.id}'">
                    <img src="${firstImg}" loading="lazy" alt="${p.name}">
                </div>
                <div class="card-info">
                    <h5 onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">${p.name}</h5>
                    <p class="brand-name">${p.brand || 'RESIN COSMOS'}</p>
                    <div class="price-box">
                        <span class="sale">₹${p.sale}</span>
                        ${hasDiscount ? `<span class="mrp" style="text-decoration:line-through; font-size:0.8rem; color:#888; margin-left:8px;">₹${p.mrp}</span>` : ''}
                    </div>
                    <div class="card-buttons" style="display:flex; gap:5px; margin-top:10px;">
                        <button class="action-btn add-cart-btn" onclick="addToCartSilent('${p.id}')" style="flex:1;">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <a href="${wpLink}" target="_blank" class="action-btn wp-btn" style="flex:1; text-align:center;">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Call this inside your init function:
function autoRenderOtherCategories() {
    const area = document.getElementById('other-categories-area');
    if (!area || !window.allProducts || !selectedVariant) return;

    area.innerHTML = ''; 

    const categoryNames = {
        "MDF": "The MDF Collection",
        "Resin": "Resin & Hardener Supplies"
    };

    const subCategoryNames = {
        "base": "Premium Clock Bases",
        "raw": "Handcrafted Raw Materials",
        "clock": "Designer Clock Collection",
        "epoxy": "High-Gloss Epoxy Resin"
    };

    const allCategories = [...new Set(window.allProducts.map(p => p.category))];
    const otherCategories = allCategories.filter(cat => cat && cat !== selectedVariant.category);

    otherCategories.forEach(catName => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'main-category-block';
        
        const catTitle = categoryNames[catName] || catName;
        categoryDiv.innerHTML = `<h1 class="main-cat-header">${catTitle}</h1>`;

        const subInCat = [...new Set(window.allProducts
            .filter(p => p.category === catName)
            .map(p => p.subcategory)
        )];

        subInCat.forEach(subName => {
            // --- NEW LOGIC START ---
            // 1. Filter raw list (exclude current, ensure active)
            const rawList = window.allProducts.filter(p => 
                p.category === catName && 
                p.subcategory === subName && 
                p.isActive !== "FALSE" &&
                String(p.id) !== String(selectedVariant.id)
            );

            // 2. Group by ID to ensure unique products only
            const uniqueProductsMap = new Map();
            rawList.forEach(p => {
                if (!uniqueProductsMap.has(p.id)) {
                    uniqueProductsMap.set(p.id, p); // Only keep the first variant found for this ID
                }
            });

            // 3. Convert map back to array and slice for the UI
           const products = Array.from(uniqueProductsMap.values()).slice(0, 1000);
            // --- NEW LOGIC END ---

            if (products.length > 0) {
                const subTitle = subCategoryNames[subName] || subName;
                
                const rowHTML = `
                    <section class="tag-row-section">
                        <h2 class="tag-row-title">${subTitle}</h2>
                        <div class="tag-scroll-container">
                            ${products.map(p => {
                                const hasDiscount = parseFloat(p.mrp) > parseFloat(p.sale);
                                return `
                                <div class="tag-card">
                                    <div class="tag-card-img" onclick="window.location.href='product.html?id=${p.id}'">
                                        <img src="${p.images ? p.images[0] : ''}" loading="lazy">
                                    </div>
                                    <div class="tag-card-info">
                                        <h5>${p.name}</h5>
                                        <div class="tag-price">
                                            <span class="sale">₹${p.sale}</span>
                                            ${hasDiscount ? `<span class="mrp">₹${p.mrp}</span>` : ''}
                                        </div>
                                        <div class="tag-buttons">
                                            <button class="tag-btn-add" onclick="addToCartSilent('${p.id}')">Add</button>
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    </section>
                `;
                categoryDiv.insertAdjacentHTML('beforeend', rowHTML);
            }
        });

        area.appendChild(categoryDiv);
    });
}

/**
 * Independent Toggle for Highlights and Specs
 * @param {string} sectionId - 'highlights' or 'specs'
 */
function toggleSection(sectionId) {
    const wrapper = document.getElementById(`wrapper-${sectionId}`);
    const btn = event.currentTarget; // Safer than event.target

    if (wrapper.classList.contains('open')) {
        wrapper.classList.remove('open');
        btn.innerText = 'Show All';
    } else {
        wrapper.classList.add('open');
        btn.innerText = 'Show Less';
    }
}