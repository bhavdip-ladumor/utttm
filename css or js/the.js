 function loadSection(file, elementId) {
            fetch(file)
                .then(response => response.text())
                .then(data => { document.getElementById(elementId).innerHTML = data; })
                .catch(err => console.log("Missing file: " + file));
        }

        // LOAD EVERYTHING IN ORDER

        // 1. Core Layout
        loadSection('components/header.html', 'header-placeholder');
        loadSection('components/navigation.html', 'nav-placeholder');
        loadSection('components/hero-section.html', 'hero-placeholder');
        loadSection('components/hiring-bar.html', 'hiring-placeholder');
        // 2. The 4 Main Business Areas
        loadSection('divisions/art-skill.html', 'art-placeholder');
        loadSection('divisions/divisions-section.html', 'divisions-placeholder');
        loadSection('divisions/machine-works.html', 'machine-placeholder');
        loadSection('divisions/home-essentials.html', 'home-essentials-placeholder');
        loadSection('divisions/retail-section.html', 'retail-placeholder');
        // 3. Footer 
        loadSection('components/about-us.html', 'about-placeholder');
        loadSection('components/contact-footer.html', 'footer-placeholder');

        // Add this line to your existing script in the.js
        loadSection('components/division-gateway.html', 'division-gateway-placeholder');
        

        // float whatsappp
        loadSection('/components/float-whatsapp.html', 'whatsapp-placeholder');

        // Put this at the very bottom of index.html
function runUttamSearch() {
    // 1. Look for the search bar (even if it was loaded from another file)
    var searchBox = document.getElementById('uttamSearch');
    if(!searchBox) return; // Exit if not loaded yet
    
    var filter = searchBox.value.toLowerCase();
    
    // 2. Target the cards sitting in index.html
    var cards = document.querySelectorAll('.card');

    cards.forEach(function(card) {
        var title = card.querySelector('h3').innerText.toLowerCase();
        var desc = card.querySelector('p').innerText.toLowerCase();

        if (title.indexOf(filter) > -1 || desc.indexOf(filter) > -1) {
            card.style.display = ""; 
        } else {
            card.style.display = "none"; 
        }
    });
}
document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    
    // 1. If it's not a link, ignore it
    if (!target) return;

    const path = target.getAttribute('href');

    // 2. If the link is just "#", send to coming-soon
    if (path === "#") {
        e.preventDefault();
        window.location.href = 'coming-soon.html';
        return;
    }

    // 3. Allow all other valid links (like resin.html, index.html, etc.)
    // We remove the 'fetch' check because it blocks mobile browsers
    if (path && !path.startsWith('http') && !path.startsWith('mailto') && !path.startsWith('tel')) {
        // Normal navigation happens here
        console.log("Navigating to: " + path);
    }
});
document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');

    // 1. Handle explicit "Coming Soon" markers
    if (href === "#") {
        e.preventDefault();
        window.location.href = 'coming-soon.html';
        return;
    }

    // 2. Only check internal .html links (ignore tel:, mailto:, https:)
    if (href && href.endsWith('.html') && !href.startsWith('http')) {
        e.preventDefault(); // Stop the immediate jump

        // Use a simpler check that iPhone Safari allows
        fetch(href, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.location.href = href; // File exists, go there
                } else {
                    window.location.href = 'coming-soon.html'; // 404, go to coming soon
                }
            })
            .catch(() => {
                // This part catches the iPhone security error 
                // We assume if we can't 'check' it, we should just try to open it
                window.location.href = href; 
            });
    }
});
    