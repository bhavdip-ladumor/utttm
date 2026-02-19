/* ==========================================================
   UTTAMHUB CATEGORY ENGINE (category.js)
   Features: Unique ID Search, Grouped Variants, Cart Integration
   ========================================================== */

// --- 1. GLOBAL VARIABLES & PARAMS ---
const params = new URLSearchParams(window.location.search);
const filterType = params.get('type')?.toLowerCase().trim();
const mustHave = params.get('mustHave')?.toLowerCase().trim();

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initCategorySearch();
    // If DB is already loaded by another script
    if (window.allProducts && window.allProducts.length > 0) {
        renderCategory();
    }
});

// Listen for the database custom event
window.addEventListener('db_ready', () => { 
    renderCategory(); 
});

// --- 3. CORE RENDERING & FILTERING ---
function renderCategory() {
    const products = window.allProducts || [];
    const titleEl = document.getElementById('category-title') || document.getElementById('cat-title');
    const grid = document.getElementById('product-grid') || document.getElementById('category-grid');
    
    // Set the Page Title
    if (titleEl) {
        if (filterType === 'raw' && mustHave === 'resin') {
            titleEl.innerText = "RESIN RAW MATERIALS";
        } else {
            titleEl.innerText = filterType ? filterType.toUpperCase() : "PRODUCTS";
        }
    }

    // A. FILTERING LOGIC
    const filteredRaw = products.filter(item => {
        const cleanSplit = (str) => str ? str.toLowerCase().split(',').map(s => s.trim()) : [];
        const categories = cleanSplit(item.category);
        const subcategories = cleanSplit(item.subcategory);
        const tags = cleanSplit(item.tagweb);
        const keywords = cleanSplit(item.keyword);

        const allMetadata = [...categories, ...subcategories, ...tags, ...keywords];

        // Requirement 1: Must be resin related
        const isResinRelated = allMetadata.includes('resin');
        if (!isResinRelated) return false;

        // Requirement 2 & 3: Match URL Parameters
        const matchesType = !filterType || allMetadata.includes(filterType);
        const matchesMustHave = !mustHave || allMetadata.includes(mustHave);

        return matchesType && matchesMustHave;
    });

    // B. GROUPING LOGIC (Unique ID Filter to prevent repeats)
    const grouped = {};
    filteredRaw.forEach(item => {
        if (!grouped[item.id]) {
            grouped[item.id] = { ...item, variants: [] };
        }
        grouped[item.id].variants.push({
            sku: item.sku,
            mrp: item.mrp,
            sale: item.sale,
            attrName: item.attrName,
            attrValue: item.attrValue,
            stock: item.stock
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
        // Collect variant text
        const availableOptions = product.variants.map(v => {
            if(!v.attrValue) return "Standard";
            const vals = v.attrValue.split(',');
            return vals[vals.length - 1].replace(/_/g, ' ').trim();
        }).join(' | ');

        // Price Range calculation
        const sales = product.variants.map(v => parseInt(v.sale) || 0);
        const minPrice = Math.min(...sales);
        const maxPrice = Math.max(...sales);
        const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
        
        const isOutOfStock = product.variants.every(v => String(v.stock).toLowerCase() !== 'instock');

        return `
            <div class="shop-card">
                <div class="card-img-wrap" onclick="window.location.href='../product/product.html?id=${product.id}'" style="cursor:pointer">
                    <img src="${product.images[0]}" loading="lazy" alt="${product.name}">
                    ${isOutOfStock ? '<span class="sold-out">Sold Out</span>' : ''}
                </div>
                <div class="card-info">
                    <h5 onclick="window.location.href='../product/product.html?id=${product.id}'" style="cursor:pointer">${product.name}</h5>
                    <p class="brand-name">${product.brand || 'Resin Cosmos'}</p>
                    <div class="variant-strip">
                        <small>Available: ${availableOptions}</small>
                    </div>
                    <div class="price-row" style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                        <span class="sale" style="font-weight:bold; color:var(--primary);">${priceDisplay}</span>
                        <button class="add-btn" onclick="addToCart('${product.id}')" style="background:var(--dark); color:white; border:none; width:30px; height:30px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 4. UNIQUE SEARCH LOGIC (No Repetition) ---
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
            <div class="search-item" onclick="window.location.href='../product/product.html?id=${p.id}'" style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee; cursor:pointer;">
                <img src="${p.images[0]}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div>
                    <div style="font-weight:600; font-size:0.85rem;">${p.name}</div>
                    <div style="font-size:0.75rem; color:#666;">₹${p.sale}</div>
                </div>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}