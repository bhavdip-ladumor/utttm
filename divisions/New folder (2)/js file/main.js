document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("productWrapper");
  const tabs = document.getElementById("categoryTabs");
  const searchInput = document.getElementById("searchInput");

  let currentCategory = "All";
  const products = [];

  // 1. Convert structured data to flat array
  // This handles both strings and the new objects {name, price} we discussed
  Object.keys(PRODUCT_DATA).forEach(mainCat => {
    Object.keys(PRODUCT_DATA[mainCat]).forEach(subCat => {
      PRODUCT_DATA[mainCat][subCat].forEach(item => {
        const isObj = typeof item === 'object';
        products.push({
          name: isObj ? item.name : item,
          mainCategory: mainCat,
          subCategory: subCat,
          // Use real price if available, otherwise random for placeholder
          price: isObj ? item.price.toFixed(2) : (Math.random() * 100 + 10).toFixed(2),
          img: `https://placehold.co/200/f8fafc/64748b?text=${encodeURIComponent(name)}`
        });
      });
    });
  });

  // 2. Create Tabs with "Active" state logic
  const catList = ["All", ...Object.keys(PRODUCT_DATA)];
  catList.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    if (index === 0) btn.classList.add("active"); // "All" active by default

    btn.onclick = () => {
      document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = cat;
      renderProducts();
    };
    tabs.appendChild(btn);
  });

  // 3. Render Function (Updated for Interactive Card Design)
  function renderProducts() {
    const searchValue = searchInput.value.toLowerCase();
    wrapper.innerHTML = "";

    const filtered = products.filter(p => {
      const matchCategory = currentCategory === "All" || p.mainCategory === currentCategory;
      const matchSearch = p.name.toLowerCase().includes(searchValue);
      return matchCategory && matchSearch;
    });

    filtered.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";

      // Updated HTML structure for 1:1 aspect ratio and interactive feel
      card.innerHTML = `
        <div class="quick-add" title="Add to Cart"><span>+</span></div>
        <div class="img-container">
            <img src="${product.img}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <small>${product.subCategory}</small>
            <h4>${product.name}</h4>
            <div class="price-tag">$${product.price}</div>
        </div>
      `;

      card.onclick = () => openModal(product);
      wrapper.appendChild(card);
    });
  }

  // 4. Search and Modal Logic
  searchInput.addEventListener("input", renderProducts);

  const modal = document.getElementById("productModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalPrice = document.getElementById("modalPrice");
  const closeModal = document.getElementById("closeModal");

  function openModal(product) {
    modal.style.display = "flex";
    modal.classList.add("modal-open"); // For animation
    modalImg.src = product.img;
    modalTitle.textContent = product.name;
    modalPrice.textContent = "$" + product.price;
  }

  closeModal.onclick = () => {
      modal.style.display = "none";
      modal.classList.remove("modal-open");
  };
  
  window.onclick = e => {
    if (e.target === modal) {
        modal.style.display = "none";
        modal.classList.remove("modal-open");
    }
  };

  renderProducts();
});