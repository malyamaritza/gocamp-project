// --- CEK LOGIN ADMIN (Taruh Paling Atas admin.js) ---
if (sessionStorage.getItem('gocamp_admin_logged_in') !== 'true') {
    // Jika belum login, tendang ke halaman login
    window.location.href = 'admin-login.html';
}


document.addEventListener('DOMContentLoaded', () => {

    // --- KONFIGURASI URL APPS SCRIPT ---
    const API_URL = 'https://script.google.com/macros/s/AKfycbwlNVnoZ889hAriwZZn_LKm3udhG0GTBHpxLh-pp4BLHl4n9MUVWkk35ypr9VhcJa-y/exec'; 

    var allOrders = [];
    var currentOrderData = null;
    var currentView = 'order'; // 'order' atau 'history'

    // --- 1. SIDEBAR & TAB LOGIC ---
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    window.switchTab = function(tabName) {
        currentView = tabName;
        
        // Update UI Sidebar Active
        document.getElementById('nav-order').classList.remove('active');
        document.getElementById('nav-history').classList.remove('active');
        document.getElementById('nav-' + tabName).classList.add('active');

        // Update Judul & Kolom Tabel
        const pageTitle = document.getElementById('page-title');
        const thLastCol = document.getElementById('th-last-col');
        const filterStatus = document.getElementById('filter-status');

        // Ambil Wrapper Tanggal Baru
        const dateWrapper = document.getElementById('date-wrapper');

        if (tabName === 'order') {
            pageTitle.innerText = "Active Orders";
            thLastCol.innerText = "Action";
            
            // Sembunyikan Tanggal di menu Order
            if(dateWrapper) dateWrapper.style.display = 'none';

            // Filter Status Order
            filterStatus.innerHTML = `
                <option value="all">All Active</option>
                <option value="Pending">Pending</option>
                <option value="Waiting for Payment">Waiting Payment</option>
            `;
        } else {
            pageTitle.innerText = "History Logs";
            thLastCol.innerText = "Action";

            // Munculkan Tanggal di menu History (pakai flex biar sejajar)
            if(dateWrapper) dateWrapper.style.display = 'flex';

            // Filter Status History
            filterStatus.innerHTML = `
                <option value="all">All History</option>
                <option value="Paid">Paid</option>
                <option value="Declined">Declined</option>
            `;
        }

        toggleSidebar();
        applyFilters(); 
    };

    // --- 2. FETCH DATA ---
   // --- 2. FETCH DATA (REVISI UI LOADING) ---
    fetchOrders(); 

    function fetchOrders() {
        const tbody = document.getElementById('table-body');
        const btnRefresh = document.querySelector('.btn-refresh'); // Ambil elemen tombol

        // 1. EFEK LOADING PADA TOMBOL
        if (btnRefresh) {
            btnRefresh.innerHTML = '⏳ Refreshing...'; // Ganti Teks
            btnRefresh.disabled = true;                // Matikan tombol
            btnRefresh.style.opacity = '0.7';          // Bikin agak transparan
            btnRefresh.style.cursor = 'not-allowed';   // Cursor tanda stop
        }

        // 2. TAMPILKAN LOADING DI TABEL
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Loading data...</td></tr>';

        fetch(API_URL + '?action=get_orders')
            .then(response => response.json())
            .then(data => {
                allOrders = data;
                
                // Setup awal tampilan filter (default Order page)
                const filterStatus = document.getElementById('filter-status');
                // Cek agar option tidak di-reset terus menerus jika sudah ada isinya
                // Kecuali jika kita ingin mereset layout
                if(filterStatus && filterStatus.options.length <= 1) { 
                     filterStatus.innerHTML = `
                        <option value="all">All Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Waiting for Payment">Waiting Payment</option>
                    `;
                }
                
                applyFilters();
                calculateStats();
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:40px;">Gagal mengambil data.</td></tr>';
            })
            .finally(() => {
                // 3. KEMBALIKAN TOMBOL KE POSISI SEMULA (SELESAI LOAD)
                // Bagian ini akan jalan baik sukses maupun error
                if (btnRefresh) {
                    btnRefresh.innerHTML = 'Refresh Data';
                    btnRefresh.disabled = false;
                    btnRefresh.style.opacity = '1';
                    btnRefresh.style.cursor = 'pointer';
                }
            });
    }
    
    // --- 3. FILTER & SEARCH LOGIC ---
    window.applyFilters = function() {
        let filtered = [...allOrders];

        // FILTER LEVEL 1: Berdasarkan Halaman (Order vs History)
        if (currentView === 'order') {
            filtered = filtered.filter(o => o.status === 'Pending' || o.status === 'Waiting for Payment');
        } else {
            filtered = filtered.filter(o => o.status === 'Paid' || o.status === 'Declined');
            
            // [BARU] FILTER LEVEL 1.5 (Date Range - Khusus History)
            const startVal = document.getElementById('date-start').value;
            const endVal = document.getElementById('date-end').value;

            if (startVal && endVal) {
                const startDate = new Date(startVal);
                const endDate = new Date(endVal);
                // Set end date ke akhir hari (23:59:59) agar inklusif
                endDate.setHours(23, 59, 59);

                filtered = filtered.filter(o => {
                    const orderDate = new Date(o.date); // Asumsi format ISO dari Code.gs
                    return orderDate >= startDate && orderDate <= endDate;
                });
            }
        }

        // FILTER LEVEL 2: Dropdown Status
        const statusVal = document.getElementById('filter-status').value;
        if (statusVal !== 'all') {
            filtered = filtered.filter(order => order.status === statusVal);
        }

        // FILTER LEVEL 3: Search ID
        const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
        if (searchVal !== "") {
            filtered = filtered.filter(order => 
                String(order.order_id).toLowerCase().includes(searchVal)
            );
        }

        // FILTER LEVEL 4: Sort Date
        const dateSort = document.getElementById('filter-date').value;
        filtered.sort((a, b) => {
            let dateA = new Date(a.date);
            let dateB = new Date(b.date);
            if (isNaN(dateA.getTime())) dateA = new Date(0);
            if (isNaN(dateB.getTime())) dateB = new Date(0);
            return dateSort === 'latest' ? dateB - dateA : dateA - dateB;
        });

        renderTable(filtered);
        calculateStats(filtered);
    };

    // --- 4. RENDER TABLE ---
    // --- 4. RENDER TABLE (REVISI: OVERDUE LOGIC) ---
    function renderTable(data) {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Data tidak ditemukan</td></tr>';
            return;
        }

        data.forEach((order, index) => {
            // Parsing Date
            let dateStr = "-";
            let dateObj = null;
            try {
                dateObj = new Date(order.date);
                if (!isNaN(dateObj.getTime())) {
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    dateStr = `${day}/${month}/${year}`;
                } else {
                    dateStr = String(order.date).split("T")[0]; 
                }
            } catch(e) {}

            // Badge Status
            let badgeClass = 'badge-pending';
            if(order.status === 'Waiting for Payment') badgeClass = 'badge-waiting';
            else if(order.status === 'Paid') badgeClass = 'badge-paid';
            else if(order.status === 'Declined') badgeClass = 'badge-declined';

            // Overdue Logic
            let overdueHTML = '';
            if (order.status === 'Waiting for Payment' && dateObj) {
                const now = new Date();
                const diffHours = (now - dateObj) / (1000 * 60 * 60);
                if (diffHours > 24) {
                    overdueHTML = `<div class="overdue-badge">⚠️ >24 Jam</div>`;
                }
            }

            // REVISI: Kolom Terakhir SELALU tombol View Detail
            // Kita tidak lagi menampilkan notes di tabel, tapi di dalam modal detail
            let lastColumnContent = `<button class="action-btn" onclick="openModal('${order.order_id}')">View Detail</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${dateStr}</td>
                <td>${order.order_id}</td>
                <td>${order.customer_name}</td>
                <td class="status-cell">
                    <span class="badge ${badgeClass}">${order.status}</span>
                    ${overdueHTML} 
                </td>
                <td>${lastColumnContent}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- 5. MODAL LOGIC (Detail) ---
    // (Tidak ada perubahan logika besar disini, hanya copy paste fungsi openModal dll yang sebelumnya)
    window.openModal = function(orderId) {
        currentOrderData = allOrders.find(o => o.order_id == orderId);
        if(!currentOrderData) return;

        // 1. Isi Data Dasar (Sama kayak dulu)
        let displayId = String(currentOrderData.order_id);
        if (!displayId.startsWith('#')) displayId = "#" + displayId;
        document.getElementById('m-order-id').innerText = displayId;
        document.getElementById('m-status-badge').innerText = currentOrderData.status;
        document.getElementById('m-name').innerText = currentOrderData.customer_name;
        document.getElementById('m-email').innerText = currentOrderData.email;
        document.getElementById('m-phone').innerText = currentOrderData.whatsapp; 
        document.getElementById('m-address').innerText = currentOrderData.address;

        // 2. Render Items (Sama kayak dulu)
        const items = JSON.parse(currentOrderData.items || "[]");
        const tbody = document.getElementById('m-items-body');
        tbody.innerHTML = '';
        
        let cleanSubtotal = String(currentOrderData.subtotal).replace(/[^0-9.-]+/g,"");
        let subtotalValue = parseFloat(cleanSubtotal) || 0;
        if (subtotalValue === 0 && items.length > 0) {
            items.forEach(item => subtotalValue += (parseInt(item.price) * parseInt(item.qty)));
        }
        currentOrderData.clean_subtotal = subtotalValue;

        items.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">${formatRupiah(item.price)}</td>
                    <td class="text-right" style="font-weight:700">${formatRupiah(item.total)}</td>
                </tr>
            `;
        });

        document.getElementById('m-subtotal').innerText = formatRupiah(currentOrderData.clean_subtotal);
        const shipInput = document.getElementById('m-shipping-input');
        shipInput.value = currentOrderData.shipping || 0;
        
        // Hitung total awal
        calculateTotal(); 

        // --- 3. LOGIKA UI: ACTIVE vs HISTORY ---
        
        // Ambil elemen-elemen UI
        const btnSendWA = document.querySelector('.btn-send-wa');
        const btnActions = document.querySelector('.action-buttons'); // Tombol Confirm/Decline
        const btnCount = document.querySelector('.btn-count');
        const historyBox = document.getElementById('history-info-box');
        
        // Reset Kelas Warna Box
        historyBox.classList.remove('paid', 'declined');

        if (currentOrderData.status === 'Paid' || currentOrderData.status === 'Declined') {
            /* --- MODE HISTORY (READ ONLY) --- */
            
            // A. Sembunyikan Tombol Aksi
            btnSendWA.style.display = 'none';
            btnActions.style.display = 'none';
            btnCount.style.display = 'none';
            
            // B. Matikan Input Shipping
            shipInput.disabled = true;
            shipInput.style.backgroundColor = "#f0f0f0";
            shipInput.style.border = "none";

            // C. Munculkan Kotak History
            historyBox.style.display = 'block';

            // D. Isi Data Tanggal & Notes
            // Format Tanggal (Dari data json 'date')
            let histDate = new Date(currentOrderData.date).toLocaleString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
            });
            document.getElementById('h-date-change').innerText = histDate;

            // Isi Notes
            const noteEl = document.getElementById('h-notes-text');
            if (currentOrderData.status === 'Declined') {
                historyBox.classList.add('declined'); // Warna Merah
                document.getElementById('row-notes').style.display = 'flex';
                noteEl.innerText = currentOrderData.notes || "No reason provided.";
            } else {
                historyBox.classList.add('paid'); // Warna Hijau
                // Kalau Paid biasanya gak ada notes penolakan, jadi kita sembunyikan atau tulis pesan sukses
                document.getElementById('row-notes').style.display = 'flex';
                noteEl.innerText = "Payment Verified & Order Completed.";
            }

        } else {
            /* --- MODE ACTIVE (EDITABLE) --- */
            
            // A. Munculkan Tombol Aksi
            btnSendWA.style.display = 'flex';
            btnActions.style.display = 'flex';
            btnCount.style.display = 'inline-block';
            
            // B. Sembunyikan Kotak History
            historyBox.style.display = 'none';

            // C. Atur Input Shipping & Tombol Confirm
            if (currentOrderData.status === 'Pending') {
                shipInput.disabled = false;
                shipInput.style.backgroundColor = "white";
                shipInput.style.border = "1px solid #ccc";
                // Disable Confirm, Enable Decline
                document.getElementById('btn-confirm-order').disabled = true;
                document.getElementById('btn-confirm-order').style.backgroundColor = "#ccc";
            } else if (currentOrderData.status === 'Waiting for Payment') {
                shipInput.disabled = true; // Biasanya dikunci kalau udah kirim tagihan
                shipInput.style.backgroundColor = "#f0f0f0";
                // Enable Confirm
                const btnConfirm = document.getElementById('btn-confirm-order');
                btnConfirm.disabled = false;
                btnConfirm.style.backgroundColor = "#0047AB";
                btnConfirm.innerText = "Confirm Payment";
            }
        }

        // Tampilkan Modal
        document.getElementById('detail-modal').classList.add('active');
    };

    window.closeModal = function() {
        document.getElementById('detail-modal').classList.remove('active');
    };

    window.calculateTotal = function() {
        if(!currentOrderData) return;
        const sub = currentOrderData.clean_subtotal || 0;
        const shipInput = document.getElementById('m-shipping-input').value;
        const ship = parseFloat(shipInput) || 0;
        const total = sub + ship;
        document.getElementById('m-total-price').innerText = formatRupiah(total);
        currentOrderData.temp_shipping = ship;
        currentOrderData.temp_total = total;
    };

    window.sendBill = function() {
        if(!currentOrderData) return;
        calculateTotal();
        const finalShip = currentOrderData.temp_shipping;
        const finalTotal = currentOrderData.temp_total;
        
        // --- LOGIKA PERBAIKAN NOMOR WA ---
        // 1. Ambil nomor, jadikan string, hapus karakter selain angka
        let rawPhone = String(currentOrderData.whatsapp || "").replace(/\D/g, ''); 
        let phone = rawPhone;

        // 2. Cek format dan perbaiki
        if (phone.startsWith('62')) {
            // Sudah benar (628xxxx) -> Biarkan
        } else if (phone.startsWith('0')) {
            // Format 08xxxx -> Ganti 0 depan jadi 62
            phone = '62' + phone.substring(1);
        } else if (phone.startsWith('8')) {
            // Format 8xxxx (0 hilang) -> Tambahkan 62 di depan
            phone = '62' + phone;
        } else {
            // Format tidak dikenal -> Default tambah 62
            phone = '62' + phone; 
        }

        let itemDetails = "";
        try {
            const items = JSON.parse(currentOrderData.items || "[]");
            items.forEach(item => { itemDetails += `- ${item.name} (x${item.qty})\n`; });
        } catch(e) {}

        let msg = `Halo Kak ${currentOrderData.customer_name},\n\nKami dari *GoCamp* ingin menginformasikan rincian tagihan pesanan kakak dengan ID *${currentOrderData.order_id}*.\n\n*Detail Pesanan:*\n${itemDetails}\n--------------------------------\nSubtotal: ${formatRupiah(currentOrderData.clean_subtotal)}\nOngkir: ${formatRupiah(finalShip)}\n*TOTAL TAGIHAN: ${formatRupiah(finalTotal)}*\n\nSilakan melakukan pembayaran ke rekening berikut:\n*BCA 1234567890 a/n GoCamp*\n\nMohon konfirmasi jika sudah transfer ya kak. Terima kasih!`;

        // Buka WhatsApp
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

        // Update Database
        const payload = { action: "update_shipping", order_id: currentOrderData.order_id, shipping_fee: finalShip, total_price: finalTotal };
        const btnSend = document.querySelector('.btn-send-wa');
        const oriText = btnSend.innerHTML;
        btnSend.innerText = "Sending...";

        fetch(API_URL, {method: "POST", body: JSON.stringify(payload)})
        .then(res => res.json())
        .then(data => {
            btnSend.innerHTML = oriText;
            if(data.result === 'success') {
                alert("Tagihan terkirim! Status diupdate.");
                currentOrderData.shipping = finalShip;
                currentOrderData.total = finalTotal;
                currentOrderData.status = "Waiting for Payment";
                openModal(currentOrderData.order_id);
                applyFilters();
            } else { alert("Gagal update database."); }
        })
        .catch(err => { btnSend.innerHTML = oriText; alert("Terjadi kesalahan koneksi."); });
    };

    window.confirmOrder = function() {
        if(!currentOrderData) return;
        if(!confirm("Yakin ingin konfirmasi pembayaran?")) return;
        const payload = { action: "confirm_order", order_id: currentOrderData.order_id };
        fetch(API_URL, {method: "POST", body: JSON.stringify(payload)})
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                alert("Order Paid!");
                closeModal();
                fetchOrders();
            }
        });
    };

    window.declineOrder = function() {
        if(!currentOrderData) return;
        const reason = prompt("Masukkan alasan penolakan:");
        if(!reason) return; 
        const payload = { action: "decline_order", order_id: currentOrderData.order_id, notes: reason };
        fetch(API_URL, {method: "POST", body: JSON.stringify(payload)})
        .then(res => res.json())
        .then(data => {
            alert("Order Declined.");
            closeModal();
            fetchOrders();
        });
    };

    function formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }

    // --- 10. DYNAMIC DASHBOARD STATS ---
    function calculateStats(filteredData) {
        // Gunakan filteredData jika ada (untuk History), atau allOrders default
        const dataToProcess = filteredData || allOrders; 
        const statsGrid = document.querySelector('.stats-grid');
        
        if (!statsGrid) return;

        let htmlCards = '';

        if (currentView === 'order') {
            // --- KARTU MENU ORDER (TETAP SAMA) ---
            let todayCount = 0, pendingCount = 0, waitingCount = 0, paidCount = 0;
            const todayStr = new Date().toISOString().split('T')[0];

            allOrders.forEach(order => {
                if (order.status === 'Pending') pendingCount++;
                if (order.status === 'Waiting for Payment') waitingCount++;
                if (order.status === 'Paid') paidCount++;
                if (order.date.startsWith(todayStr)) todayCount++;
            });

            htmlCards = `
                <div class="stat-card border-today">
                    <span class="stat-label">Orders Today</span>
                    <h3>${todayCount}</h3>
                </div>
                <div class="stat-card border-pending">
                    <span class="stat-label">Total Pending</span>
                    <h3>${pendingCount}</h3>
                </div>
                <div class="stat-card border-waiting">
                    <span class="stat-label">Need Payment</span>
                    <h3>${waitingCount}</h3>
                </div>
                <div class="stat-card border-paid">
                    <span class="stat-label">Total Paid (All)</span>
                    <h3>${paidCount}</h3>
                </div>
            `;

        } else {
            // --- KARTU MENU HISTORY (DINAMIS) ---
            
            // 1. Hitung Total Seumur Hidup (Global)
            let totalPaidAll = 0, totalDeclinedAll = 0;
            allOrders.forEach(o => {
                if(o.status === 'Paid') totalPaidAll++;
                if(o.status === 'Declined') totalDeclinedAll++;
            });

            // Kartu Default History
            htmlCards += `
                <div class="stat-card border-paid">
                    <span class="stat-label">Total Paid (All Time)</span>
                    <h3>${totalPaidAll}</h3>
                </div>
                <div class="stat-card border-declined">
                    <span class="stat-label">Total Declined (All Time)</span>
                    <h3>${totalDeclinedAll}</h3>
                </div>
            `;

            // 2. Cek apakah Filter Tanggal Aktif?
            const startVal = document.getElementById('date-start').value;
            const endVal = document.getElementById('date-end').value;

            if (startVal && endVal) {
                // Hitung dari data yang SUDAH difilter (filteredData)
                let rangePaid = 0, rangeDeclined = 0;
                
                // filteredData isinya sudah dipotong tanggal di applyFilters
                dataToProcess.forEach(o => {
                    if(o.status === 'Paid') rangePaid++;
                    if(o.status === 'Declined') rangeDeclined++;
                });

                // Tambahkan Kartu Filter
                htmlCards += `
                    <div class="stat-card border-paid" style="background:#f0fff4">
                        <span class="stat-label">Paid (${startVal} to ${endVal})</span>
                        <h3>${rangePaid}</h3>
                    </div>
                    <div class="stat-card border-declined" style="background:#fff5f5">
                        <span class="stat-label">Declined (${startVal} to ${endVal})</span>
                        <h3>${rangeDeclined}</h3>
                    </div>
                `;
            }
        }

        // Render ke HTML
        statsGrid.innerHTML = htmlCards;
    }

    window.logout = function() {
        // 1. Hapus Session (Kunci Masuk)
        sessionStorage.removeItem('gocamp_admin_logged_in');
        
        // 2. Redirect Paksa ke Halaman Login
        window.location.href = 'admin-login.html';
    };
});