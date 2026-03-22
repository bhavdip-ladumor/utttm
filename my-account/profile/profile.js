function initProfileTabs() {
    const buttons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.tab-content');

    // --- 1. EXISTING CLICK LOGIC ---
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            // Remove active from all buttons & sections
            buttons.forEach(b => b.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Add active to current
            btn.classList.add('active');
            const targetSection = document.getElementById(`${target}-section`);
            if (targetSection) targetSection.classList.add('active');

            // Mobile scroll
            if (window.innerWidth <= 768) {
                document.querySelector('.profile-content')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 2. NEW: URL PARAMETER CHECKER ---
    const urlParams = new URLSearchParams(window.location.search);
    const tabToOpen = urlParams.get('tab'); // e.g., "orders"

    if (tabToOpen) {
        // Find the button that matches the URL param
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabToOpen}"]`);
        
        if (targetBtn) {
            // Small delay to ensure transitions are ready
            setTimeout(() => {
                targetBtn.click(); 
                console.log("Auto-opened tab:", tabToOpen);
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', initProfileTabs);