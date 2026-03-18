function loadHeroSearch() {
    const navHTML = `
    <style>
        .search-floating-box {
            position: fixed;
            top: 80px; 
            right: 25px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, sans-serif;
        }

        .nav-search-form { 
            display: flex; 
            flex-direction: row-reverse; 
            align-items: center; /* Vertical alignment */
            justify-content: flex-start;
            background: rgba(255, 255, 255, 0.98); 
            border-radius: 50px; 
            padding: 4px; /* Space around the button */
            width: 44px; 
            height: 44px;
            transition: width 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.3s;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            border: 2px solid #0984e3;
            box-sizing: border-box; /* Ensures border doesn't add to size */
        }

        .nav-search-form:hover { 
            width: 280px; 
        }

        .nav-search-form input { 
            border: none; 
            outline: none; 
            background: transparent;
            font-size: 1rem;
            width: 0; 
            opacity: 0;
            transition: width 0.4s, opacity 0.2s;
            padding: 0;
            color: #2d3436;
            line-height: 32px; /* Matches button height */
        }

        .nav-search-form:hover input {
            width: 200px;
            opacity: 1;
            padding: 0 15px;
        }

        /* FIXED BUTTON ALIGNMENT */
        .nav-search-form button { 
            background: #0984e3; 
            border: none; 
            color: white; 
            width: 32px; /* Fixed width */
            height: 32px; /* Fixed height */
            border-radius: 50%;
            cursor: pointer; 
            display: flex; /* Critical for centering icon */
            align-items: center; /* Centers icon vertically */
            justify-content: center; /* Centers icon horizontally */
            flex-shrink: 0;
            padding: 0; /* Removes default browser button padding */
            margin: 0;
        }

        .nav-search-form button i {
            font-size: 14px; /* Adjust icon size slightly */
            line-height: 1; /* Prevents icon from pushing down */
            margin: 0;
            padding: 0;
        }
    </style>

    <div class="search-floating-box">
        <form action="search.html" method="GET" class="nav-search-form">
            <button type="submit"><i class="fas fa-search"></i></button>
            <input type="text" name="query" placeholder="Type to search..." required>
        </form>
    </div>
    `;

    const placeholder = document.getElementById('global-search-bar');
    if (placeholder) {
        placeholder.innerHTML = navHTML;
    }
}
window.addEventListener('load', loadHeroSearch);