document.addEventListener("DOMContentLoaded", function () {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cartCount');

    function updateCartCount() {
        if (cartCount) {
            cartCount.innerText = cart.length;
        }
    }

    updateCartCount();

    window.goHome = function() {
        alert('Go to Home Page');
    };

    window.searchPage = function() {
        alert('Open Search Page');
    };

    window.openCollection = function() {
        alert('Open Collection Page');
    };

    window.openCart = function() {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        let message = "Hello, I want to order:%0A";
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.price}%0A`;
        });

        const phoneNumber = "1234567890";
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
        window.open(whatsappURL, '_blank');
    };

    window.addToCart = function(product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    };
});
