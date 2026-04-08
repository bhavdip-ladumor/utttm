// Data Arrays
const stores = ["Resin Cosmos", "Wooden Beyond", "Acrylic Fortune"];
const services = ["Laser Cutting", "UV Printing", "Job Work", "Solar Setup"];

/**
 * INITIALIZE OVERVIEW
 * Fills the horizontal scroll rows and the side menu lists
 */
function initOverview() {
    const storeRow = document.getElementById('storeRow');
    const serviceRow = document.getElementById('serviceRow');
    const storeList = document.getElementById('storeSelectList');
    const serviceList = document.getElementById('serviceSelectList');

    // Clear existing content to prevent duplicates
    if(storeRow) storeRow.innerHTML = '';
    if(serviceRow) serviceRow.innerHTML = '';

    // Load Stores into Row and Menu
    stores.forEach(name => {
        if(storeRow) {
            storeRow.innerHTML += `
                <div class="row-item" onclick="openFullDiv('store', '${name}')">
                    <div class="card-icon"><i class="fa fa-store"></i></div>
                    <span>${name}</span>
                </div>`;
        }
        if(storeList) {
            storeList.innerHTML += `<button class="menu-item" onclick="openFullDiv('store', '${name}')"><i class="fa fa-chevron-right"></i> ${name}</button>`;
        }
    });

    // Load Services into Row and Menu
    services.forEach(name => {
        if(serviceRow) {
            serviceRow.innerHTML += `
                <div class="row-item" onclick="openFullDiv('service', '${name}')">
                    <div class="card-icon"><i class="fa fa-gears"></i></div>
                    <span>${name}</span>
                </div>`;
        }
        if(serviceList) {
            serviceList.innerHTML += `<button class="menu-item" onclick="openFullDiv('service', '${name}')"><i class="fa fa-chevron-right"></i> ${name}</button>`;
        }
    });
}

/**
 * MENU CONTROLS
 */
const sideMenu = document.getElementById('sideMenu');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenu');

if(menuBtn) {
    menuBtn.onclick = () => sideMenu.classList.add('active');
}

if(closeMenuBtn) {
    closeMenuBtn.onclick = () => sideMenu.classList.remove('active');
}

/**
 * FULL PAGE OVERLAY LOGIC
 * Opens the specific management view
 */
window.openFullDiv = (type, name = "") => {
    // 1. Close side menu if open
    if(sideMenu) sideMenu.classList.remove('active');

    const overlay = document.getElementById('fullPageOverlay');
    const content = document.getElementById('overlayContent');
    const title = document.getElementById('overlayTitle');
    
    // 2. Show the overlay
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // 3. Set the Title
    if (title) {
        title.innerText = name ? name : (type === 'ordersDiv' ? "All Orders" : type.toUpperCase());
    }

    // 4. Handle Content Injection
    if(type === 'ordersDiv') {
        // IMPORTANT: We inject the ID 'orderGrid' so order-monitor.js can find it
        content.innerHTML = `
            <div class="view-header-bar">
                <p>Live Orders from all Stores</p>
            </div>
            <div id="orderGrid" class="order-grid">
                <div class="loading-state">
                    <i class="fa fa-spinner fa-spin"></i> Connecting to Workshop Database...
                </div>
            </div>
        `;
        
        // 5. TRIGGER ORDER MONITOR
        // We send a signal that the 'orderGrid' element is now ready in the DOM
        window.dispatchEvent(new CustomEvent('loadOrders'));
        
    } else if (type === 'store' || type === 'storesDiv') {
        content.innerHTML = `
            <div class="placeholder-view">
                <i class="fa fa-store-alt"></i>
                <h3>${name || 'Stores'} Management</h3>
                <p>Inventory and Store settings for ${name || 'all stores'} coming soon.</p>
            </div>
        `;
    } else if (type === 'service' || type === 'servicesDiv') {
        content.innerHTML = `
            <div class="placeholder-view">
                <i class="fa fa-tools"></i>
                <h3>${name || 'Services'} Management</h3>
                <p>Queue and pricing for ${name || 'all services'} coming soon.</p>
            </div>
        `;
    }
};

/**
 * CLOSE OVERLAY
 */
window.closeFullDiv = () => {
    const overlay = document.getElementById('fullPageOverlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Re-enable background scrolling
    
    // Optional: Clear content to save memory
    document.getElementById('overlayContent').innerHTML = '';
};

// Initialize the view
initOverview();