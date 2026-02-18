document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');

    menuBtn.addEventListener('click', function() {
        sideMenu.classList.toggle('active');
    });
});
