// Load Header 
fetch('header.html')
    .then(res => res.text())
    .then(data => document.getElementById('header').innerHTML = data);

// Load Navbar
fetch('nav bar/navbar.html')
    .then(res => res.text())
    .then(data => document.getElementById('navbar').innerHTML = data);

  

  
//  Footer Dynamically
fetch('footer.html')
    .then(res => res.text())
    .then(data => document.getElementById('footer').innerHTML = data);
