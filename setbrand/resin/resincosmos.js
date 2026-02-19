/**
 * RESIN COSMOS - Master Script
 * Includes: Sidebar, Unique Search, Auto-Slider, Hero Live, and UI Helpers
 * Location: root/resincosmos.js
 */

// --- 1. MENU & SIDEBAR LOGIC ---
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const closeBtn = document.getElementById('closeMenu');

function toggleMenu() {
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);

// --- 2. UNIQUE SEARCH LOGIC ---
function initSearch() {
    const searchInput = document.getElementById('productSearch');
    const resultsContainer = document.getElementById('searchResults');
    const allProducts = window.allProducts || [];

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 1) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = "";
            return;
        }

        // Use a Map to prevent duplicate IDs in results
        const uniqueMatches = new Map();

        allProducts.forEach(p => {
            const name = p.name ? p.name.toLowerCase() : "";
            const category = p.category ? p.category.toLowerCase() : "";
            const sku = p.id ? String(p.id).toLowerCase() : "";
            const tags = p.tagweb ? p.tagweb.toLowerCase() : "";

            // Filtering for resin-specific tags and matching query
            const isResin = tags.includes('resin');
            const matchesQuery = name.includes(query) || 
                                 category.includes(query) || 
                                 sku.includes(query);

            if (isResin && matchesQuery) {
                if (!uniqueMatches.has(p.id)) {
                    uniqueMatches.set(p.id, p);
                }
            }
        });

        renderResults(Array.from(uniqueMatches.values()));
    });
}

function renderResults(matches) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (matches.length === 0) {
        container.innerHTML = `<div class="search-item" style="padding:15px; color:#666;">No resin products found</div>`;
    } else {
        container.innerHTML = matches.map(p => `
            <div class="search-item" onclick="window.location.href='product/product.html?id=${p.id}'">
                <img src="${p.images[0]}" alt="${p.name}">
                <div class="search-info">
                    <span class="search-name">${p.name}</span>
                    <span class="search-meta">${p.category} | SKU: ${p.id}</span>
                </div>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}

// Close search when clicking outside
document.addEventListener('click', (e) => {
    const searchBar = document.querySelector('.search-bar');
    const results = document.getElementById('searchResults');
    if (results && searchBar && !searchBar.contains(e.target)) {
        results.style.display = 'none';
    }
});

// --- 3. MAIN SLIDER LOGIC (Carousel) ---
let index = 0;
let autoSlide;

function initSlider() {
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    if (!slider || slides.length === 0) return;

    function showSlide(n) {
        index = n;
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        
        slider.style.transform = `translateX(-${index * 100}%)`;
        
        dots.forEach(d => d.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
    }

    // Auto Animation (2 seconds)
    autoSlide = setInterval(() => {
        showSlide(index + 1);
    }, 2000);

    // Swipe Support
    let startX = 0;
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        clearInterval(autoSlide); 
    });

    slider.addEventListener('touchend', (e) => {
        let endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) showSlide(index + 1); 
        if (startX - endX < -50) showSlide(index - 1); 
        
        autoSlide = setInterval(() => {
            showSlide(index + 1);
        }, 2000);
    });

    // Manual Dot Navigation
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            clearInterval(autoSlide);
            showSlide(i);
            autoSlide = setInterval(() => { showSlide(index + 1); }, 2000);
        });
    });
}

window.currentSlide = function(n) {
    const dots = document.querySelectorAll('.dot');
    if(dots[n]) dots[n].click();
};

// --- 4. HERO LIVE SLIDER LOGIC ---
// --- 4. HERO CLOCK LOGIC ---
/**
 * Targets a specific Clock product for the Hero visual
 */
function initHeroClock() {
    const heroImg = document.getElementById('hero-img');
    const heroIdTag = document.getElementById('hero-id-tag');
    const heroNameTag = document.getElementById('hero-name-tag');
    const heroLink = document.getElementById('hero-link');

    if (!heroImg || !window.allProducts) return;

    // FIND YOUR CLOCK: Change "15" to your actual Clock product ID
    const clockProduct = window.allProducts.find(p => String(p.id) === "15") || 
                         window.allProducts.find(p => p.category?.toLowerCase().includes('clock'));

    if (clockProduct) {
        // Update Content
        heroImg.src = clockProduct.images[0];
        if (heroIdTag) heroIdTag.innerText = `ID: ${clockProduct.id}`;
        if (heroNameTag) heroNameTag.innerText = clockProduct.name;
        
        // Direct Link to the Clock product page
        if (heroLink) {
            heroLink.href = `setbrand/resin/product/product.html?id=${clockProduct.id}`;
        }
    }
}

// Ensure it runs when database is ready
window.addEventListener('db_ready', initHeroClock);

// --- 5. UI HELPERS & TOUCH FEEDBACK ---

function toggleLimit(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('expanded');
    
    if (!el.classList.contains('expanded')) {
        const sectionTop = el.parentElement.offsetTop - 80;
        window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
}

function scrollToId(id) {
    const target = document.getElementById(id);
    if (target) {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    }
}

function initTouchFeedback() {
    document.querySelectorAll('.interactive-row, .creative-card, .shop-card').forEach(item => {
        item.addEventListener('touchstart', () => item.style.transform = "scale(0.96)");
        item.addEventListener('touchend', () => item.style.transform = "scale(1)");
    });
}

// --- 6. GLOBAL INITIALIZATION ---

window.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initTouchFeedback();
    initSearch();
});

// Trigger Hero and Search Re-init when Database is ready
window.addEventListener('db_ready', () => {
    initSearch();
    startHeroLiveSlider();
});