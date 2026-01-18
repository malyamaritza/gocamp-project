document.addEventListener('DOMContentLoaded', () => {
    
    // --- KONFIGURASI API ---
    // Pastikan ini URL Deployment Apps Script TERBARU kamu
    const API_URL = "https://script.google.com/macros/s/AKfycbwlNVnoZ889hAriwZZn_LKm3udhG0GTBHpxLh-pp4BLHl4n9MUVWkk35ypr9VhcJa-y/exec"; 

    // Helper Image Fix (Harus SAMA PERSIS dengan script.js)
    function fixGoogleDriveImage(url) {
        if (!url) return "https://via.placeholder.com/300?text=No+Image";
        
        // Cek link drive
        if (url.includes('drive.google.com')) {
            // Regex ini mengambil ID di antara /d/ dan /
            const idMatch = url.match(/\/d\/(.+?)\//);
            
            if (idMatch && idMatch[1]) {
                // Menggunakan endpoint lh3.googleusercontent.com/d/
                return `https://lh3.googleusercontent.com/d/${idMatch[1]}=s1000`;
            }
        }
        return url;
    }

    // --- 1. RENDER CART DI HALAMAN CHECKOUT ---
    const cart = JSON.parse(localStorage.getItem('gocamp_cart')) || [];
    const itemsWrapper = document.getElementById('checkout-items-wrapper');
    const subtotalEl = document.getElementById('c-subtotal');
    let subtotal = 0;

    // Render Logic
    if (itemsWrapper) {
        if (cart.length === 0) {
            itemsWrapper.innerHTML = "<p style='text-align:center; padding:20px;'>Cart is empty. <a href='product.html'>Shop Now</a></p>";
        } else {
            itemsWrapper.innerHTML = '';
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;
                subtotal += itemTotal;
                
                // Panggil Helper Image Fix
                const imgUrl = fixGoogleDriveImage(item.image);

                const html = `
                <div class="c-item">
                    <img src="${imgUrl}" alt="${item.name}">
                    <div class="c-item-info">
                        <div class="c-item-name">${item.name}</div>
                        
                        <div class="c-item-row-bottom">
                            <div class="c-item-qty">qty : ${item.qty}</div>
                            <div class="c-item-total">
                                ${new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(itemTotal)}
                            </div>
                        </div>
                    </div>
                </div>
                `;
                itemsWrapper.innerHTML += html;
            });
        }
        // Update Subtotal Text
        if(subtotalEl) {
            subtotalEl.textContent = new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(subtotal);
        }
    }

    // --- 2. LOGIC SUBMIT ORDER ---
    window.submitOrder = async function() {
        const btnSubmit = document.querySelector('.btn-submit-order');
        
        // Ambil Value Input Form
        const email = document.getElementById('c-email').value;
        const name = document.getElementById('c-name').value;
        const wa = document.getElementById('c-wa').value;
        const addr = document.getElementById('c-address').value;

        // Validasi Form Kosong
        if(!email || !name || !wa || !addr) {
            alert("Please fill all fields!");
            return;
        }

        // Cek Cart Kosong
        if(cart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        // Loading State
        btnSubmit.textContent = "Processing...";
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = "0.7";

        // Generate Order ID Unik (#TIMESTAMP + RANDOM)
        const orderId = "#" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);

        // Siapkan Data JSON untuk dikirim ke Backend
        const orderData = {
            order_id: orderId,
            email: email,
            name: name,
            whatsapp: wa,
            address: addr,
            subtotal: subtotal,
            items: cart // Kirim seluruh array cart
        };

        try {
            // Kirim ke Google Apps Script (doPost)
            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            // --- SUKSES ---
            // Tampilkan Order ID di Popup
            const orderIdEl = document.getElementById('final-order-id');
            if(orderIdEl) orderIdEl.textContent = orderId;
            
            // Munculkan Popup Overlay
            const popup = document.getElementById('success-overlay');
            if(popup) popup.classList.remove('hidden');

            // Hapus Data Cart dari LocalStorage
            localStorage.removeItem('gocamp_cart');

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
            
            // Reset Tombol jika gagal
            btnSubmit.textContent = "Submit";
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
        }
    };

    // --- 3. LOGIC TOMBOL OK (FINISH ORDER) ---
    window.finishOrder = function() {
        // Redirect ke halaman utama
        window.location.href = "index.html";
    };

});