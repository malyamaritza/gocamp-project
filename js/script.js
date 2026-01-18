document.addEventListener('DOMContentLoaded', () => {

    // --- 0. FITUR AUTO-INJECT HTML CART ---
    function injectCartHTML() {
        if (document.getElementById('cart-sidebar')) return;

        const cartHTML = `
        <div id="cart-overlay" class="cart-overlay hidden" onclick="toggleCart()"></div>

        <div id="cart-sidebar" class="cart-sidebar">
            <div class="cart-header">
                <h2>Cart</h2>
                <button class="close-cart" onclick="toggleCart()">×</button>
            </div>

            <div id="cart-items-container" class="cart-body"></div>

            <div class="cart-footer">
                <div class="cart-total-row">
                    <span id="total-items-label" class="total-label">Total Price (0)</span>
                    <span id="total-price-val" class="total-value">Rp 0</span>
                </div>
                <button class="btn-checkout" onclick="window.location.href='checkout.html'">Checkout</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }
    
    injectCartHTML();


    // ============================================================
    // --- KONFIGURASI & DATA ---
    // ============================================================

    const API_URL = "https://script.google.com/macros/s/AKfycbwlNVnoZ889hAriwZZn_LKm3udhG0GTBHpxLh-pp4BLHl4n9MUVWkk35ypr9VhcJa-y/exec"; 
    let allProducts = []; 
    const productGrid = document.getElementById('product-grid');

    // --- HELPER IMAGE (VERSI FINAL: KEMBALI KE POLA ASLI) ---
    function fixGoogleDriveImage(url) {
        if (!url) return "https://via.placeholder.com/300?text=No+Image";
        
        // Cek apakah link mengandung 'drive.google.com'
        if (url.includes('drive.google.com')) {
            // Regex ini mengambil ID yang ada di antara /d/ dan /
            const idMatch = url.match(/\/d\/(.+?)\//);
            
            if (idMatch && idMatch[1]) {
                // Menggunakan endpoint lh3.googleusercontent.com/d/ yang paling stabil
                return `https://lh3.googleusercontent.com/d/${idMatch[1]}=s1000`;
            }
        }
        return url;
    }

    // --- 3. FETCH DATA ---
    // --- 3. FETCH DATA (REVISI: SUPPORT HOMEPAGE) ---
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            allProducts = data;
            
            // A. RENDER HALAMAN CATALOG (Jika ada elemen product-grid)
            if (productGrid) {
                renderProducts(allProducts);
            }

            // B. RENDER HALAMAN HOME (Jika ada elemen top-products-grid)
            const topGrid = document.getElementById('top-products-grid');
            if (topGrid) {
                // Filter Produk Pilihan (GP-01, GP-05, GP-09, GP-13)
                const targetIDs = ['GP-01', 'GP-05', 'GP-09', 'GP-13'];
                const topProducts = allProducts.filter(p => targetIDs.includes(p.id));
                
                renderTopProducts(topProducts, topGrid);
            }

        } catch (error) {
            console.error("Gagal mengambil data:", error);
            if(productGrid) productGrid.innerHTML = `<p style="text-align:center;">Gagal memuat data.</p>`;
        }
    }

    // --- FUNGSI RENDER KHUSUS HOMEPAGE (AUTO SAMA STYLE) ---
    function renderTopProducts(products, container) {
        container.innerHTML = ""; 

        if (products.length === 0) {
            container.innerHTML = `<p style="text-align:center;">Produk tidak ditemukan.</p>`;
            return;
        }

        products.forEach(product => {
            const imgUrl = fixGoogleDriveImage(product.image);
            const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price);
            const stock = parseInt(product.stock || 0);
            
            // Logika Stok (Sama persis dengan katalog)
            let stockBadgeHTML = ''; 
            let btnState = ''; 

            if (stock === 0) {
                stockBadgeHTML = `<div class="badge-stok" style="background-color:#555;">Stok Habis</div>`;
                btnState = 'disabled style="background-color:#ccc; cursor:not-allowed;"'; 
            } else if (stock < 5) { 
                stockBadgeHTML = `<div class="badge-stok">Stok menipis!</div>`;
            }

            const cardHTML = `
                <div class="product-card" onclick="openDetail('${product.id}')" style="cursor:pointer;">
                    <div class="card-image">
                        <img src="${imgUrl}" alt="${product.name}" loading="lazy">
                        ${stockBadgeHTML}
                    </div>
                    <div class="card-content">
                        <div class="text-group">
                            <span class="p-category">${product.category}</span>
                            <h3 class="p-name">${product.name}</h3>
                        </div>
                        <div class="card-bottom">
                            <span class="p-price">${formattedPrice}</span>
                            <button class="btn-add" ${btnState} onclick="event.stopPropagation(); addToCart('${product.id}')">
                                ${stock === 0 ? 'Habis' : 'Add +'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    // --- 4. RENDER KATALOG ---
    function renderProducts(products) {
        if(!productGrid) return;
        productGrid.innerHTML = ""; 

        if (products.length === 0) {
            productGrid.innerHTML = `<p style="text-align:center;">Produk tidak ditemukan.</p>`;
            return;
        }

        products.forEach(product => {
            const imgUrl = fixGoogleDriveImage(product.image);
            const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price);
            const stock = parseInt(product.stock || 0); // Pastikan angka
            
            // --- LOGIKA STOK BARU ---
            let stockBadgeHTML = ''; 
            let btnState = ''; // Variabel untuk matikan tombol

            if (stock === 0) {
                // 1. Jika Stok 0 (Habis)
                stockBadgeHTML = `<div class="badge-stok" style="background-color:#555;">Stok Habis</div>`;
                btnState = 'disabled style="background-color:#ccc; cursor:not-allowed;"'; 
            } else if (stock < 5) { 
                // 2. Jika Stok < 5 (Menipis)
                stockBadgeHTML = `<div class="badge-stok">Stok menipis!</div>`;
            }

            const cardHTML = `
                <div class="product-card" onclick="openDetail('${product.id}')" style="cursor:pointer;">
                    <div class="card-image">
                        <img src="${imgUrl}" alt="${product.name}" loading="lazy">
                        ${stockBadgeHTML}
                    </div>
                    <div class="card-content">
                        <div class="text-group">
                            <span class="p-category">${product.category}</span>
                            <h3 class="p-name">${product.name}</h3>
                        </div>
                        <div class="card-bottom">
                            <span class="p-price">${formattedPrice}</span>
                            <button class="btn-add" ${btnState} onclick="event.stopPropagation(); addToCart('${product.id}')">
                                ${stock === 0 ? 'Habis' : 'Add +'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.innerHTML += cardHTML;
        });
    }

    // --- SETUP FILTER ---
    const btnCategory = document.getElementById('btn-category');
    const menuCategory = document.getElementById('menu-category');
    const labelCategory = document.getElementById('cat-label');
    const btnPrice = document.getElementById('btn-price');
    const menuPrice = document.getElementById('menu-price');
    const labelPrice = document.getElementById('price-label');
    const btnAll = document.getElementById('btn-all');

    function closeAllMenus() {
        if (menuCategory) menuCategory.classList.remove('show');
        if (menuPrice) menuPrice.classList.remove('show');
    }

    function filterAndSort(categoryFilter = null, sortType = null) {
        let filtered = [...allProducts]; 
        const currentCategory = labelCategory ? labelCategory.textContent : "Categories";
        if (currentCategory !== "Categories") {
            filtered = filtered.filter(p => p.category.includes(currentCategory) || currentCategory.includes(p.category));
        }
        if (categoryFilter) {
            filtered = allProducts.filter(p => p.category.includes(categoryFilter) || categoryFilter.includes(p.category));
        }
        const currentSort = labelPrice ? labelPrice.textContent : "Price";
        const activeSort = sortType || currentSort;

        if (activeSort === "Highest Price") {
            filtered.sort((a, b) => b.price - a.price);
        } else if (activeSort === "Lowest Price") {
            filtered.sort((a, b) => a.price - b.price);
        }
        renderProducts(filtered);
    }

    if (btnCategory && menuCategory) {
        btnCategory.addEventListener('click', (e) => { e.stopPropagation(); closeAllMenus(); menuCategory.classList.toggle('show'); });
        menuCategory.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedName = link.textContent;
                labelCategory.textContent = selectedName;
                btnCategory.classList.add('active');
                if (btnAll) btnAll.classList.remove('active');
                closeAllMenus();
                filterAndSort(selectedName, null);
            });
        });
    }
    if (btnPrice && menuPrice) {
        btnPrice.addEventListener('click', (e) => { e.stopPropagation(); closeAllMenus(); menuPrice.classList.toggle('show'); });
        menuPrice.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedName = link.textContent;
                labelPrice.textContent = selectedName;
                btnPrice.classList.add('active');
                closeAllMenus();
                filterAndSort(null, selectedName);
            });
        });
    }
    if (btnAll) {
        btnAll.addEventListener('click', () => {
            btnAll.classList.add('active');
            if(labelCategory) labelCategory.textContent = "Categories";
            if(labelPrice) labelPrice.textContent = "Price";
            if(btnCategory) btnCategory.classList.remove('active');
            if(btnPrice) btnPrice.classList.remove('active');
            closeAllMenus();
            renderProducts(allProducts);
        });
    }
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) closeAllMenus();
    });

    // --- EKSEKUSI FETCH ---
    fetchProducts();


    // ============================================================
    // --- LOGIC CART SYSTEM ---
    // ============================================================

    let cart = JSON.parse(localStorage.getItem('gocamp_cart')) || [];
    updateCartUI(); 

    window.toggleCart = function() {
        const body = document.body;
        if (body.classList.contains('cart-open')) {
            body.classList.remove('cart-open');
        } else {
            body.classList.add('cart-open');
        }
    };

    window.addToCart = function(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image, 
                qty: 1
            });
        }
        saveCart();
        updateCartUI();
        window.toggleCart(); // Auto buka cart
    };

    function updateCartUI() {
        const cartContainer = document.getElementById('cart-items-container');
        const totalLabel = document.getElementById('total-items-label');
        const totalPriceEl = document.getElementById('total-price-val');
        const cartBadge = document.getElementById('cart-badge'); 

        if(!cartContainer) return;

        cartContainer.innerHTML = '';
        let totalQty = 0;
        let totalPrice = 0;

        cart.forEach((item, index) => {
            totalQty += item.qty;
            totalPrice += item.price * item.qty;
            const imgUrl = fixGoogleDriveImage(item.image);
            const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price);

            const itemHTML = `
                <div class="cart-item">
                    <img src="${imgUrl}" class="item-img" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${formattedPrice}</div>
                        <div class="cart-controls">
                            <div class="qty-wrapper">
                                 <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                                 <span class="qty-val">${item.qty}</span>
                                 <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                            </div>
                            <button class="trash-btn" onclick="removeItem(${index})">
                                <img src="Aset/icon/icon_trash.png" alt="Hapus"> 
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.innerHTML += itemHTML;
        });

        if(totalLabel) totalLabel.textContent = `Total Price (${totalQty})`;
        if(totalPriceEl) totalPriceEl.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPrice);
        if (cartBadge) cartBadge.textContent = totalQty;
    }

    window.updateQty = function(index, change) {
        if (cart[index].qty + change > 0) {
            cart[index].qty += change;
        } else { return; }
        saveCart();
        updateCartUI();
    };

    window.removeItem = function(index) {
        cart.splice(index, 1); 
        saveCart();
        updateCartUI();
    };

    function saveCart() {
        localStorage.setItem('gocamp_cart', JSON.stringify(cart));
    }

    const cartBtnNavbar = document.getElementById('cart-btn');
    if(cartBtnNavbar) {
        cartBtnNavbar.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleCart();
        });
    }


    // ============================================================
    // --- LOGIC DETAIL PAGE ---
    // ============================================================

    window.openDetail = function(productId) {
        const product = allProducts.find(p => p.id === productId);
        if(!product) return;

        const mainSrc = fixGoogleDriveImage(product.image);
        const subSrc = product.subImage ? fixGoogleDriveImage(product.subImage) : mainSrc;

        const mainImgEl = document.getElementById('d-main-img');
        const thumb1 = document.getElementById('d-thumb-1');
        const thumb2 = document.getElementById('d-thumb-2');

        if(mainImgEl) mainImgEl.src = mainSrc;
        if(thumb1) thumb1.src = mainSrc;
        if(thumb2) thumb2.src = subSrc;

        if(thumb1) thumb1.classList.add('active-thumb');
        if(thumb2) thumb2.classList.remove('active-thumb');

        document.getElementById('d-name').textContent = product.name;
        const fPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price);
        document.getElementById('d-price').textContent = fPrice;
        document.getElementById('d-desc').textContent = product.description;

        // --- UPDATE LOGIKA STOK DETAIL (REVISI) ---
        const stock = parseInt(product.stock || 0);
        document.getElementById('d-stock-text').textContent = `Stock : ${stock}`;
        
        const badgeDiv = document.getElementById('d-stock-badge-container');
        const btnAddDetail = document.querySelector('.d-btn-add');

        // 1. Reset Tombol ke Kondisi Normal Dulu
        if(btnAddDetail) {
            btnAddDetail.disabled = false;
            btnAddDetail.style.backgroundColor = ''; // Reset warna ke CSS asli
            btnAddDetail.style.cursor = 'pointer';
            btnAddDetail.innerText = "Add to cart";
            btnAddDetail.onclick = function() { addToCart(product.id); };
        }

        // 2. Cek Kondisi Stok & Update UI
        if (stock === 0) {
            // A. KONDISI HABIS
            badgeDiv.innerHTML = `<div class="d-badge" style="background-color:#555;">Stok Habis</div>`;
            
            if(btnAddDetail) {
                btnAddDetail.disabled = true; // Matikan tombol
                btnAddDetail.style.backgroundColor = '#ccc'; // Warna Abu
                btnAddDetail.style.cursor = 'not-allowed';
                btnAddDetail.innerText = "Out of Stock";
                btnAddDetail.onclick = null; // Hapus fungsi klik
            }
        } else if (stock < 5) {
            // B. KONDISI MENIPIS
            badgeDiv.innerHTML = `<div class="d-badge">Stok menipis !</div>`;
        } else {
            // C. AMAN
            badgeDiv.innerHTML = '';
        }

        window.renderDetailList(product.specification, 'd-spec-list');
        window.renderDetailList(product.feature, 'd-feat-list');

        document.getElementById('product-detail-view').classList.remove('hidden');
        
        const hero = document.getElementById('hero-section');
        const cat = document.getElementById('catalog-section');
        if(hero) hero.classList.add('hidden');
        if(cat) cat.classList.add('hidden');
        
        window.scrollTo(0,0);
    };
    
    window.closeDetail = function() {
        document.getElementById('product-detail-view').classList.add('hidden');
        const hero = document.getElementById('hero-section');
        const cat = document.getElementById('catalog-section');
        if(hero) hero.classList.remove('hidden');
        if(cat) cat.classList.remove('hidden');
    };
    
    window.renderDetailList = function(textData, elementId) {
        const ul = document.getElementById(elementId);
        if(!ul) return;
        ul.innerHTML = '';
        if(!textData) return;
        
        textData.toString().split('|').forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.trim();
            ul.appendChild(li);
        });
    };

    window.switchImage = function(el) {
        const mainImg = document.getElementById('d-main-img');
        if(mainImg) mainImg.src = el.src;
        document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active-thumb'));
        el.classList.add('active-thumb');
    };

    window.toggleAccordion = function(contentId, iconId) {
        const content = document.getElementById(contentId);
        const icon = document.getElementById(iconId);
        if(!content || !icon) return;
        
        const wrapper = content.parentElement;
        if(wrapper.classList.contains('open')) {
            wrapper.classList.remove('open');
            icon.textContent = '+';
        } else {
            wrapper.classList.add('open');
            icon.textContent = '-';
        }
    };

});