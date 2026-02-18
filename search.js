/**
 * SEARCH ENGINE - search.js
 */

function initSearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (!query) {
        document.getElementById('search-title').innerText = "Please enter a search term.";
        return;
    }

    document.getElementById('search-title').innerText = `Results for: "${query}"`;

    if (window.allProducts && window.allProducts.length > 0) {
        performSearch(query);
    } else {
        window.addEventListener('db_ready', () => performSearch(query));
    }
}

function performSearch(query) {
    const q = query.toLowerCase();
    const grid = document.getElementById('search-results-grid');

    // Search through Name, Category, and Tags
    const results = window.allProducts.filter(p => {
        return (
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.tagweb && p.tagweb.toLowerCase().includes(q))
        );
    });

    if (results.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 50px;">
            <p>No products found matching your search.</p>
            <a href="index.html">Back to Home</a>
        </div>`;
        return;
    }

    // Reuse your existing card HTML structure
    grid.innerHTML = results.map(p => `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
            <div class="card-img-container">
                <img src="${p.images[0]}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <h4 class="card-title">${p.name}</h4>
                <div class="price-row">
                    <span class="sale-price">₹${p.sale}</span>
                    <span class="mrp-price">₹${p.mrp}</span>
                </div>
            </div>
        </div>
    `).join('');
}

initSearch();