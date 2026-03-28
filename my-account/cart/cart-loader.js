/**
 * GLOBAL CART INJECTOR
 * Edit this HTML once to update the sidebar on all pages.
 */
const cartHTML = `
<div id="cart-sidebar" class="cart-sidebar">
    <div class="cart-header">
        <h3>My Cart</h3>
        
        <div id="header-savings">
            <div class="price-line">
                <span id="header-total-sale">₹0</span> 
                <span id="header-total-mrp">₹0</span>
            </div>
            <div id="header-save-summary">
                You Save: <span id="header-save-amt">₹0</span> (<span id="header-save-percent">0%</span>)
            </div>
        </div>

        <button id="btn-close-cart"><i class="fa-solid fa-xmark"></i></button>
    </div>
    
    <div id="cart-items-container" class="cart-body">
        <p class="empty-msg">Your cart is empty.</p>
    </div>

    <div class="cart-footer">
        <div class="total-row">
            <span>Total:</span>
            <span id="cart-total-price">₹0.00</span>
        </div>
        <button id="btn-checkout" class="btn-main">Checkout</button>
    </div>
</div>
<div id="cart-overlay" class="cart-overlay"></div>
`;

// Inject into the placeholder
const placeholder = document.getElementById('cart-sidebar-placeholder');
if (placeholder) {
    placeholder.innerHTML = cartHTML;
} else {
    console.warn("Cart placeholder not found! Add <div id='cart-sidebar-placeholder'></div> to your HTML.");
}