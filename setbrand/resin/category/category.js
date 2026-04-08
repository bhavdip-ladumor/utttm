/* ==========================================================
   UTTAMHUB CATEGORY ENGINE (category.js)
   Updated for New Flat Database Structure
   ========================================================== */

// --- 1. GLOBAL VARIABLES & PARAMS ---
const params = new URLSearchParams(window.location.search);
const catParam = params.get('category')?.toLowerCase().trim();
const subParam = params.get('sub')?.toLowerCase().trim();
const filterType = params.get('type')?.toLowerCase().trim();
const mustHave = params.get('mustHave')?.toLowerCase().trim();


// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initCategorySearch === "function") initCategorySearch();
    if (window.allProducts && window.allProducts.length > 0) {
        renderCategory();
    }
});

window.addEventListener('db_ready', () => { 
    renderCategory(); 
});

// --- 3. CORE RENDERING & FILTERING ---
function renderCategory() {
    const products = window.allProducts || [];
    const titleEl = document.getElementById('category-title') || document.getElementById('cat-title');
    const grid = document.getElementById('product-grid') || document.getElementById('category-grid');
    
    // Update Title based on what is being viewed
    if (titleEl) {
        if (subParam) {
            titleEl.innerText = subParam.toUpperCase().replace(/_/g, ' ');
        } else if (catParam) {
            titleEl.innerText = catParam.toUpperCase();
        } else if (filterType) {
            titleEl.innerText = filterType.toUpperCase();
        } else {
            titleEl.innerText = "ALL PRODUCTS";
        }
    }

    // A. UPDATED FILTERING LOGIC
    const filteredRaw = products.filter(item => {
        if (item.isActive === "FALSE" || item.isActive === false) return false;

        const cleanSplit = (str) => str ? String(str).toLowerCase().split(',').map(s => s.trim()) : [];
        
        const categories = cleanSplit(item.category);
        const subcategories = cleanSplit(item.subcategory);
        const tags = cleanSplit(item.tagweb);
        const keywords = cleanSplit(item.keyword);

        const allMetadata = [...categories, ...subcategories, ...tags, ...keywords];

        // 1. DEFAULT REQUIREMENT: Must be resin related (optional)
        const isResinRelated = allMetadata.includes('resin');
        if (!isResinRelated) return false;

        // 2. Match by Category Parameter
        if (catParam && !categories.includes(catParam)) return false;

        // 3. Match by Subcategory Parameter
        if (subParam && !subcategories.includes(subParam)) return false;

        // 4. Support for legacy type/mustHave filters
        const matchesType = !filterType || allMetadata.includes(filterType);
        const matchesMustHave = !mustHave || allMetadata.includes(mustHave);

        return matchesType && matchesMustHave;
    });

    // B. GROUPING LOGIC (Group variants by ID)
    const grouped = {};
    filteredRaw.forEach(item => {
        if (!grouped[item.id]) {
            grouped[item.id] = { ...item, variants: [] };
        }
        grouped[item.id].variants.push({
            sku: item.sku,
            mrp: parseFloat(item.mrp) || 0,
            sale: parseFloat(item.sale) || 0,
            stock: parseInt(item.stock) || 0,
            attrName: item.attrName,
            attrValue: item.attrValue
        });
    });

    const finalItems = Object.values(grouped);

    if (!grid) return;

    if (finalItems.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 50px;">No products found matching these criteria.</p>`;
        return;
    }

    // C. HTML GENERATION
    grid.innerHTML = finalItems.map(product => {
        const hasMultipleVariants = product.variants && product.variants.length > 1;
        const optionLabel = hasMultipleVariants ? 
            `<div class="variant-tag">Options Available</div>` : '';

        // Flat Price Access
        const displayPrice = `₹${product.sale || 0}`;
        
        // Stock Logic (Checks if any variant is in stock)
        const isOutOfStock = product.variants.every(v => v.stock <= 0);
        const nameDisplay = isOutOfStock ? 
            `<span style="color: #d9534f; font-weight: 800;">[SOLD OUT]</span> ${product.name}` : 
            product.name;

        // Free Delivery Badge Logic
        const deliveryBadge = (product.freeDelivery === "TRUE" || product.freeDelivery === true) ? 
            `<span class="free-delivery-badge"><i class="fas fa-truck"></i> Free Delivery</span>` : '';

        const wpMessage = encodeURIComponent(`Hi Resin Cosmos! I'm inquiring about: ${product.name} (ID: ${product.id}). Is this available?`);
        const wpLink = `https://wa.me/919724362981?text=${wpMessage}`;

        // Prepare the Product Object for the Cart Handler
        const cartData = {
            id: product.id,
            sku: product.variants[0].sku,
            name: product.name,
            sale: product.variants[0].sale,
            mrp: product.variants[0].mrp,
            image: product.images ? product.images[0] : '',
            brand: product.brand || 'Resin Cosmos'
        };
        const productString = JSON.stringify(cartData).replace(/"/g, '&quot;');

        return `
            <div class="shop-card">
                <div class="card-img-wrap" onclick="window.location.href='../product/product.html?id=${product.id}'">
                    <img src="${product.images ? product.images[0] : ''}" loading="lazy" alt="${product.name}">
                    ${deliveryBadge}
                </div>
                <div class="card-info">
                    <h5 onclick="window.location.href='../product/product.html?id=${product.id}'">
                        ${nameDisplay}
                    </h5>
                    <p class="brand-name">${product.brand || 'Resin Cosmos'}</p>
                    
                    ${optionLabel}

                    <div class="price-box">
                        <span class="sale">${displayPrice}</span>
                        ${parseFloat(product.mrp) > parseFloat(product.sale) ? 
                            `<span class="mrp" style="text-decoration:line-through; font-size:0.8rem; color:#888; margin-left:8px;">₹${product.mrp}</span>` : ''}
                    </div>
                    
                    <div class="card-buttons">
                        <button class="action-btn add-cart-btn" 
                                onclick="handleAddToCart(this)" 
                                data-product='${productString}'
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> Add
                        </button>
                        <a href="${wpLink}" target="_blank" class="action-btn wp-btn">
                            <i class="fab fa-whatsapp"></i> Inquiry
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 4. CART HANDLER BRIDGE
 */
window.handleAddToCart = function(btn) {
    try {
        const productData = JSON.parse(btn.getAttribute('data-product'));
        if (typeof window.addToCart === "function") {
            window.addToCart(productData);
        } else {
            console.error("Cart system not initialized.");
        }
    } catch (err) {
        console.error("Cart error:", err);
    }
};

// --- 5. UNIQUE SEARCH LOGIC ---
function initCategorySearch() {
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
            if (p.isActive === "FALSE" || p.isActive === false) return;
            const name = p.name ? p.name.toLowerCase() : "";
            const idMatch = p.id ? String(p.id).toLowerCase() : "";
            
            if (name.includes(query) || idMatch.includes(query)) {
                if (!uniqueMatches.has(p.id)) {
                    uniqueMatches.set(p.id, p);
                }
            }
        });

        renderSearchResults(Array.from(uniqueMatches.values()));
    });
}

function renderSearchResults(matches) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (matches.length === 0) {
        container.innerHTML = `<div class="search-item" style="padding:15px; color:#999;">No results found</div>`;
    } else {
        container.innerHTML = matches.map(p => `
            <div class="search-item" onclick="window.location.href='../product/product.html?id=${p.id}'">
                <img src="${p.images[0]}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div>
                    <div style="font-weight:600; font-size:0.85rem;">${p.name}</div>
                    <div style="font-size:0.75rem; color:#666;">₹${p.sale || 0}</div>
                </div>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}