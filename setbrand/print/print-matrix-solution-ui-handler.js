document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const menuBtn = document.getElementById('nav-menu-btn');
    const closeBtn = document.getElementById('close-panel');
    const searchInput = document.getElementById('nav-search');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('results-grid');
    
    // Selectors for Stacked Slider
    const track = document.getElementById('heroTrack');
    const slides = document.querySelectorAll('.stacked-slide');

    // Selectors for Store Section (Added here)
    const storeSection = document.getElementById('store-section');
    const openStoreBtn = document.getElementById('openStoreBtn');
    const closeStoreBtn = document.getElementById('closeStoreBtn');

    // --- 2. SIDE PANEL & OVERLAY LOGIC ---
    const togglePanel = (isOpen) => {
        if (!sidePanel || !overlay) return;
        sidePanel.classList.toggle('active', isOpen);
        overlay.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        if (isOpen) history.pushState({ panelOpen: true }, "");
    };

    menuBtn?.addEventListener('click', () => togglePanel(true));
    closeBtn?.addEventListener('click', () => togglePanel(false));
    overlay?.addEventListener('click', () => togglePanel(false));

    // --- 3. SEARCH LOGIC ---
    let searchHistoryPushed = false;
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            resultsContainer?.classList.add('hidden');
            searchHistoryPushed = false; 
            return;
        }
        const filtered = (window.allProducts || []).filter(product => {
            const tags = product.tagweb ? product.tagweb.toLowerCase() : "";
            const name = product.name ? product.name.toLowerCase() : "";
            return tags.includes('print') && (name.includes(query) || tags.includes(query));
        });
        if (!searchHistoryPushed && filtered.length > 0) {
            history.pushState({ searchOpen: true }, "");
            searchHistoryPushed = true;
        }
        displaySearchResults(filtered);
    });

    function displaySearchResults(products) {
        if (!resultsContainer || !resultsGrid) return;
        resultsContainer.classList.remove('hidden');
        if (products.length === 0) {
            resultsGrid.innerHTML = '<p class="no-results">No products found.</p>';
            return;
        }
        resultsGrid.innerHTML = products.map(item => `
            <div class="product-card" onclick="location.href='#product-${item.id || ''}'">
                <img src="${item.images ? item.images[0] : ''}" alt="${item.name}" loading="lazy">
                <div class="card-info">
                    <h4>${item.name}</h4>
                    <p>Starting from ₹${item.sale}</p>
                    <button class="view-btn">View Options</button>
                </div>
            </div>
        `).join('');
    }

    // --- 4. HERO SLIDER LOGIC ---
    let currentIndex = 0; 
    const totalSlides = slides.length;
    let autoPlayInterval;

    function updateStackedSlider() {
        if (totalSlides === 0) return;
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev', 'next', 'hidden');
            if (i === currentIndex) slide.classList.add('active');
            else if (i === (currentIndex - 1 + totalSlides) % totalSlides) slide.classList.add('prev');
            else if (i === (currentIndex + 1) % totalSlides) slide.classList.add('next');
            else slide.classList.add('hidden');
        });
    }

    const nextSlide = () => { currentIndex = (currentIndex + 1) % totalSlides; updateStackedSlider(); };
    const prevSlide = () => { currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; updateStackedSlider(); };

    if (track && totalSlides > 0) {
        updateStackedSlider();
        autoPlayInterval = setInterval(nextSlide, 3000);
        track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        track.addEventListener('mouseleave', () => autoPlayInterval = setInterval(nextSlide, 3000));
    }

    // --- 5. STORE EXPANSION LOGIC (Merged) ---
    const expandStore = () => {
        storeSection?.classList.add('is-expanded');
        history.pushState({ storeOpen: true }, "");
    };

    const shrinkStore = () => {
        storeSection?.classList.remove('is-expanded');
        storeSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    openStoreBtn?.addEventListener('click', expandStore);
    closeStoreBtn?.addEventListener('click', shrinkStore);

    // --- 6. GLOBAL BACK BUTTON HANDLER ---
    window.addEventListener('popstate', (event) => {
        // Close Store if open
        if (storeSection?.classList.contains('is-expanded')) {
            storeSection.classList.remove('is-expanded');
        }
        // Close Side Panel if open
        if (sidePanel?.classList.contains('active')) {
            togglePanel(false);
        }
    });
}); // End of SINGLE DOMContentLoaded