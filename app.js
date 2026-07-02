/* ==========================================================================
   SHOPSYNC POS - CORE APPLICATION LOGIC (OFFLINE-FIRST)
   ========================================================================== */

// --- 1. GLOBAL STATE & DATABASE INITIALIZATION ---
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(`shopsync_${key}`)),
    set: (key, val) => localStorage.setItem(`shopsync_${key}`, JSON.stringify(val)),
    remove: (key) => localStorage.removeItem(`shopsync_${key}`),
    clearAll: () => {
        const keys = ['profile', 'products', 'invoices', 'users', 'currentUser'];
        keys.forEach(k => localStorage.removeItem(`shopsync_${k}`));
    }
};

// Application State
let state = {
    profile: null,
    products: [],
    invoices: [],
    currentUser: null,
    cart: [],
    activeScreen: 'screen-dashboard',
    editingProductId: null,
    dashboardPrefs: {
        sales: true,
        profit: true,
        alerts: true,
        activity: true
    }
};

// Mock Products for Shop Types to make the initial experience awesome
const mockProductsByShopType = {
    general: [
        { name: "Lux Beauty Soap 100g", category: "Cosmetics", costPrice: 90, sellPrice: 115, stockQty: 45, lowStockAlert: 10, barcode: "89610012" },
        { name: "Colgate MaxFresh 150g", category: "Oral Care", costPrice: 180, sellPrice: 220, stockQty: 25, lowStockAlert: 5, barcode: "89610013" },
        { name: "Lays Masala Family Pack", category: "Snacks", costPrice: 110, sellPrice: 130, stockQty: 8, lowStockAlert: 10, barcode: "89610014" },
        { name: "Pepsi 1.5 Litre", category: "Beverages", costPrice: 135, sellPrice: 160, stockQty: 30, lowStockAlert: 8, barcode: "89610015" },
        { name: "Sufi Sunflower Oil 1L", category: "Cooking Oil", costPrice: 480, sellPrice: 530, stockQty: 15, lowStockAlert: 5, barcode: "89610016" },
        { name: "Dawn Bread Large", category: "Bakery", costPrice: 115, sellPrice: 130, stockQty: 3, lowStockAlert: 5, barcode: "89610017" },
        { name: "Nestle Milkpak 1L", category: "Dairy", costPrice: 250, sellPrice: 270, stockQty: 20, lowStockAlert: 6, barcode: "89610018" }
    ],
    kiryana: [
        { name: "Tapal Danedar Tea 950g", category: "Tea", costPrice: 1250, sellPrice: 1400, stockQty: 18, lowStockAlert: 5, barcode: "89620011" },
        { name: "National Lal Mirch 200g", category: "Spices", costPrice: 280, sellPrice: 320, stockQty: 12, lowStockAlert: 4, barcode: "89620012" },
        { name: "Sugar / Cheeni (1kg)", category: "Groceries", costPrice: 130, sellPrice: 145, stockQty: 150, lowStockAlert: 20, barcode: "89620013" },
        { name: "Daal Chana Premium (1kg)", category: "Pulses", costPrice: 290, sellPrice: 330, stockQty: 40, lowStockAlert: 10, barcode: "89620014" },
        { name: "Sufi Banaspati Ghee 5kg", category: "Ghee", costPrice: 2450, sellPrice: 2650, stockQty: 4, lowStockAlert: 5, barcode: "89620015" },
        { name: "Basmati Rice Super kernel (1kg)", category: "Groceries", costPrice: 310, sellPrice: 350, stockQty: 80, lowStockAlert: 15, barcode: "89620016" },
        { name: "Sensodyne Multi Action Paste", category: "Personal Care", costPrice: 320, sellPrice: 370, stockQty: 14, lowStockAlert: 3, barcode: "89620017" }
    ],
    bike: [
        { name: "Spark Plug NGK C7HSA", category: "Electrical", costPrice: 210, sellPrice: 280, stockQty: 35, lowStockAlert: 8, barcode: "89630011" },
        { name: "Havoline 4T 20W-50 Engine Oil 1L", category: "Lubricants", costPrice: 1150, sellPrice: 1350, stockQty: 24, lowStockAlert: 6, barcode: "89630012" },
        { name: "Front Brake Shoe (CD70)", category: "Brakes", costPrice: 240, sellPrice: 350, stockQty: 40, lowStockAlert: 10, barcode: "89630013" },
        { name: "Chain Sprocket Kit CD70 (Crown)", category: "Transmission", costPrice: 1650, sellPrice: 1950, stockQty: 3, lowStockAlert: 5, barcode: "89630014" },
        { name: "Rear View Mirror Set (Black)", category: "Body Parts", costPrice: 320, sellPrice: 450, stockQty: 15, lowStockAlert: 4, barcode: "89630015" },
        { name: "Front Indicator Assembly CD70", category: "Electrical", costPrice: 110, sellPrice: 180, stockQty: 30, lowStockAlert: 10, barcode: "89630016" },
        { name: "Clutch Cable CD70 (Atlas Honda)", category: "Cables", costPrice: 180, sellPrice: 260, stockQty: 25, lowStockAlert: 5, barcode: "89630017" }
    ],
    rickshaw: [
        { name: "Rickshaw Spark Plug Champion", category: "Electrical", costPrice: 230, sellPrice: 300, stockQty: 50, lowStockAlert: 12, barcode: "89640011" },
        { name: "Brake Cable Front (Tezraftar)", category: "Cables", costPrice: 220, sellPrice: 320, stockQty: 20, lowStockAlert: 5, barcode: "89640012" },
        { name: "Piston Ring Set Standard size", category: "Engine Parts", costPrice: 1450, sellPrice: 1800, stockQty: 4, lowStockAlert: 5, barcode: "89640013" },
        { name: "Rickshaw Headlight Assembly LED", category: "Electrical", costPrice: 850, sellPrice: 1150, stockQty: 8, lowStockAlert: 3, barcode: "89640014" },
        { name: "Silencer Muffler (Three Wheeler)", category: "Exhaust", costPrice: 2400, sellPrice: 3000, stockQty: 2, lowStockAlert: 3, barcode: "89640015" },
        { name: "Carburetor Assembly 200cc", category: "Fuel System", costPrice: 3200, sellPrice: 3800, stockQty: 5, lowStockAlert: 2, barcode: "89640016" },
        { name: "Rickshaw Side Mirror Large Set", category: "Body Parts", costPrice: 450, sellPrice: 650, stockQty: 10, lowStockAlert: 3, barcode: "89640017" }
    ],
    electronics: [
        { name: "USB Type-C Fast Charging Cable", category: "Accessories", costPrice: 120, sellPrice: 250, stockQty: 60, lowStockAlert: 15, barcode: "89650011" },
        { name: "Samsung 25W PD Adapter (Copy)", category: "Chargers", costPrice: 750, sellPrice: 1200, stockQty: 12, lowStockAlert: 4, barcode: "89650012" },
        { name: "Infinix Hot 30 Tempered Glass", category: "Screen Protectors", costPrice: 45, sellPrice: 150, stockQty: 100, lowStockAlert: 10, barcode: "89650013" },
        { name: "TWS Earbuds Pro 2 (Wireless)", category: "Audio", costPrice: 1850, sellPrice: 2600, stockQty: 15, lowStockAlert: 5, barcode: "89650014" },
        { name: "Xiaomi 10000mAh Powerbank", category: "Power", costPrice: 2800, sellPrice: 3500, stockQty: 3, lowStockAlert: 4, barcode: "89650015" },
        { name: "OTG Adapter Micro to Type-C", category: "Accessories", costPrice: 30, sellPrice: 80, stockQty: 50, lowStockAlert: 8, barcode: "89650016" }
    ],
    pharmacy: [
        { name: "Panadol 500mg (Leaf of 10)", category: "Analgesics", costPrice: 25, sellPrice: 35, stockQty: 200, lowStockAlert: 30, barcode: "89660011" },
        { name: "Ponstan Forte 250mg (Leaf)", category: "Painkillers", costPrice: 30, sellPrice: 42, stockQty: 150, lowStockAlert: 25, barcode: "89660012" },
        { name: "Augmentin 625mg Tablets (6s)", category: "Antibiotics", costPrice: 340, sellPrice: 390, stockQty: 18, lowStockAlert: 5, barcode: "89660013" },
        { name: "Disprin Tablets Box (100s)", category: "Analgesics", costPrice: 190, sellPrice: 240, stockQty: 8, lowStockAlert: 10, barcode: "89660014" },
        { name: "Surbex-Z High Potency Zinc (30s)", category: "Multivitamins", costPrice: 420, sellPrice: 480, stockQty: 35, lowStockAlert: 8, barcode: "89660015" },
        { name: "Surgical Face Mask 3-Ply (Box)", category: "Medical Supplies", costPrice: 180, sellPrice: 290, stockQty: 14, lowStockAlert: 5, barcode: "89660016" }
    ]
};

// Helper: Generate UUID for offline record sync safety
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper: Format Money
function formatMoney(amount) {
    return "Rs. " + parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Toast Notifications
function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    // Slide out and remove
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- 2. APPLICATION INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    startClock();
});

function initApp() {
    // Load Database from LocalStorage
    state.profile = DB.get('profile');
    state.products = DB.get('products') || [];
    state.invoices = DB.get('invoices') || [];
    state.currentUser = DB.get('currentUser');
    
    const savedPrefs = DB.get('dashboardPrefs');
    if (savedPrefs) {
        state.dashboardPrefs = savedPrefs;
    }

    if (!state.currentUser) {
        // Show Login Screen
        showAuthScreen('login');
        document.body.className = 'theme-general';
    } else {
        // Logged In - Enter Main App
        enterMainApplication();
    }
}

function showAuthScreen(mode) {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-subtitle').innerText = 'Enter your admin credentials';
}

// Helper: Pull latest shop data from cloud
async function pullCloudData() {
    try {
        const response = await fetch(`/api/sync/pull?username=${encodeURIComponent(state.currentUser)}`);
        if (response.ok) {
            const data = await response.json();
            state.products = data.products || [];
            state.invoices = data.invoices || [];
            if (data.profile) {
                state.profile = {
                    ...state.profile,
                    ...data.profile,
                    lastSync: new Date().toISOString()
                };
            }
            DB.set('products', state.products);
            DB.set('invoices', state.invoices);
            DB.set('profile', state.profile);
            showToast('Pulled latest shop data from cloud!', 'success');
        }
    } catch (err) {
        console.error("Failed to pull cloud data:", err);
    }
}

function enterMainApplication() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    // Set Theme - always use general (no shop type theme switching)
    document.body.className = 'theme-general';

    // Load Header details
    document.getElementById('display-shop-name').innerText = state.profile.shopName;
    document.getElementById('display-username').innerText = state.currentUser;

    // Sync status header update
    updateSyncIndicator();

    // Default screen
    switchScreen('screen-dashboard');
}

// Clock Topbar
function startClock() {
    const clockEl = document.getElementById('system-clock');
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('en-US', { hour12: true });
    }, 1000);
}

// --- 3. THEME & SETTINGS UPDATE ---
function applyTheme(themeName) {
    // Theme switching disabled - always use general theme
    document.body.className = 'theme-general';
}

// --- 4. SCREEN SWITCHING & RENDERERS ---
function switchScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }

    // Update active sidebar menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('data-target') === screenId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    state.activeScreen = screenId;

    // Render screen-specific data
    if (screenId === 'screen-dashboard') {
        renderDashboard();
    } else if (screenId === 'screen-pos') {
        renderPOS();
    } else if (screenId === 'screen-inventory') {
        renderInventory();
    } else if (screenId === 'screen-reports') {
        renderReports();
    } else if (screenId === 'screen-settings') {
        renderSettings();
    }
}

// 4.1: Render Dashboard
function renderDashboard() {
    // Today's Calculations
    const todayStr = new Date().toDateString();
    
    const todayInvoices = state.invoices.filter(inv => new Date(inv.dateTime).toDateString() === todayStr);
    
    let todaySalesTotal = 0;
    let todayProfitTotal = 0;

    todayInvoices.forEach(inv => {
        todaySalesTotal += inv.grandTotal;
        todayProfitTotal += inv.profit;
    });

    document.getElementById('stat-sales').innerText = state.dashboardPrefs.sales ? formatMoney(todaySalesTotal) : 'Hidden';
    document.getElementById('stat-profit').innerText = state.dashboardPrefs.profit ? formatMoney(todayProfitTotal) : 'Hidden';
    document.getElementById('stat-invoices').innerText = todayInvoices.length;
    document.getElementById('stat-products').innerText = state.products.length;

    // Profit Margin
    const marginPercent = todaySalesTotal > 0 ? ((todayProfitTotal / todaySalesTotal) * 100).toFixed(1) : '0.0';
    document.getElementById('stat-profit-margin').innerText = state.dashboardPrefs.profit ? `${marginPercent}% net margin` : 'Hidden';

    // Apply visibility to panels
    document.getElementById('stat-sales').closest('.stat-card').style.display = state.dashboardPrefs.sales ? 'flex' : 'none';
    document.getElementById('stat-profit').closest('.stat-card').style.display = state.dashboardPrefs.profit ? 'flex' : 'none';
    
    const lowStockPanel = document.querySelector('.side-panel');
    const recentActivityPanel = document.querySelector('.main-panel');
    
    if (lowStockPanel) lowStockPanel.style.display = state.dashboardPrefs.alerts ? 'flex' : 'none';
    if (recentActivityPanel) recentActivityPanel.style.display = state.dashboardPrefs.activity ? 'flex' : 'none';

    // Low stock warnings
    const lowStockItems = state.products.filter(p => Number(p.stockQty) <= Number(p.lowStockAlert));
    document.getElementById('stat-low-stock-count').innerText = `${lowStockItems.length} items low stock`;
    
    const lowStockBadge = document.getElementById('low-stock-badge');
    lowStockBadge.innerText = `${lowStockItems.length} Alerts`;
    if (lowStockItems.length > 0) {
        lowStockBadge.className = "alert-badge";
    } else {
        lowStockBadge.className = "alert-badge badge-success";
    }

    const lowStockListContainer = document.getElementById('low-stock-list');
    lowStockListContainer.innerHTML = '';

    if (lowStockItems.length === 0) {
        lowStockListContainer.innerHTML = `
            <div class="empty-alert-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 10px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>All stock levels are healthy.</p>
            </div>`;
    } else {
        lowStockItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'alert-item';
            itemEl.innerHTML = `
                <div class="alert-item-info">
                    <span class="alert-item-title">${item.name}</span>
                    <span class="alert-item-stock">Stock: ${item.stockQty} (Limit: ${item.lowStockAlert})</span>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="quickAddStock('${item.id}')">+ Add Stock</button>
            `;
            lowStockListContainer.appendChild(itemEl);
        });
    }

    // Recent Sales Table (limit 5)
    const recentInvoices = [...state.invoices].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5);
    const recentSalesTableBody = document.querySelector('#dashboard-sales-table tbody');
    recentSalesTableBody.innerHTML = '';

    if (recentInvoices.length === 0) {
        recentSalesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No sales recorded today.</td></tr>';
    } else {
        recentInvoices.forEach(inv => {
            const dateObj = new Date(inv.dateTime);
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${inv.id.substring(0, 8)}...</strong></td>
                <td>Today, ${timeStr}</td>
                <td>${inv.items.length} items</td>
                <td><strong>${formatMoney(inv.grandTotal)}</strong></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewInvoiceReceipt('${inv.id}')">Receipt</button>
                </td>
            `;
            recentSalesTableBody.appendChild(tr);
        });
    }

    document.getElementById('dashboard-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// 4.2: Render POS Screen
function renderPOS() {
    updatePOSDashboardSummary();
    updateCartUI();
    document.getElementById('pos-search-input').value = '';
    document.getElementById('pos-search-results').classList.add('hidden');
}

function updatePOSDashboardSummary() {
    const todayStr = new Date().toDateString();
    const todayInvoices = state.invoices.filter(inv => new Date(inv.dateTime).toDateString() === todayStr);
    
    let todaySalesTotal = 0;
    let todayProfitTotal = 0;

    todayInvoices.forEach(inv => {
        todaySalesTotal += inv.grandTotal;
        todayProfitTotal += inv.profit;
    });

    document.getElementById('pos-stat-sales').innerText = formatMoney(todaySalesTotal);
    document.getElementById('pos-stat-profit').innerText = formatMoney(todayProfitTotal);
    document.getElementById('pos-stat-invoices').innerText = todayInvoices.length;
}

// 4.3: Render Inventory Screen
function renderInventory() {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';

    const searchQuery = document.getElementById('inventory-search').value.toLowerCase();
    const catFilter = document.getElementById('inventory-filter-category').value;
    const stockFilter = document.getElementById('inventory-filter-stock').value;

    // Populate Category Datalist & Filter Dropdown
    const categories = [...new Set(state.products.map(p => p.category))];
    const datalist = document.getElementById('categories-datalist');
    datalist.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        datalist.appendChild(option);
    });

    const categorySelect = document.getElementById('inventory-filter-category');
    const currentSelectedCat = categorySelect.value;
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        categorySelect.appendChild(option);
    });
    categorySelect.value = currentSelectedCat;

    // Filter list
    let filteredProducts = state.products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || 
                              p.barcode.includes(searchQuery) || 
                              p.category.toLowerCase().includes(searchQuery);
        
        const matchesCategory = catFilter === 'all' || p.category === catFilter;
        
        let matchesStock = true;
        if (stockFilter === 'low') {
            matchesStock = Number(p.stockQty) <= Number(p.lowStockAlert) && Number(p.stockQty) > 0;
        } else if (stockFilter === 'out') {
            matchesStock = Number(p.stockQty) <= 0;
        } else if (stockFilter === 'healthy') {
            matchesStock = Number(p.stockQty) > Number(p.lowStockAlert);
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">No products found. Add a new product to begin!</td></tr>';
        return;
    }

    filteredProducts.forEach(prod => {
        let statusBadge = '';
        if (Number(prod.stockQty) <= 0) {
            statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (Number(prod.stockQty) <= Number(prod.lowStockAlert)) {
            statusBadge = '<span class="badge badge-warning">Low Stock</span>';
        } else {
            statusBadge = '<span class="badge badge-success">In Stock</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${prod.barcode}</code></td>
            <td><strong>${prod.name}</strong></td>
            <td><span class="badge badge-secondary" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary);">${prod.category}</span></td>
            <td class="text-right">${formatMoney(prod.costPrice)}</td>
            <td class="text-right">${formatMoney(prod.sellPrice)}</td>
            <td class="text-center"><strong>${prod.stockQty}</strong></td>
            <td class="text-center">${prod.lowStockAlert}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                <div class="btn-actions">
                    <button class="btn-icon edit" onclick="openEditProductModal('${prod.id}')" title="Edit Product">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteProduct('${prod.id}')" title="Delete Product">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 4.4: Render Reports & Financials
function renderReports() {
    const tableBody = document.getElementById('reports-invoices-body');
    tableBody.innerHTML = '';

    // Date Filters
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

    // Default dates if empty (current month)
    if (!startDateInput.value || !endDateInput.value) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startDateInput.value = startOfMonth.toISOString().substring(0, 10);
        endDateInput.value = now.toISOString().substring(0, 10);
    }

    const startMs = new Date(startDateInput.value + 'T00:00:00').getTime();
    const endMs = new Date(endDateInput.value + 'T23:59:59').getTime();

    const filteredInvoices = state.invoices.filter(inv => {
        const time = new Date(inv.dateTime).getTime();
        return time >= startMs && time <= endMs;
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalProfit = 0;

    filteredInvoices.forEach(inv => {
        totalRevenue += inv.grandTotal;
        totalCogs += inv.totalCost;
        totalProfit += inv.profit;
    });

    document.getElementById('report-total-revenue').innerText = formatMoney(totalRevenue);
    document.getElementById('report-total-cogs').innerText = formatMoney(totalCogs);
    document.getElementById('report-net-profit').innerText = formatMoney(totalProfit);

    const marginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    document.getElementById('report-margin-percentage').innerText = `${marginPercent}% net profit margin`;

    if (filteredInvoices.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">No invoices generated during this period.</td></tr>';
        return;
    }

    filteredInvoices.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    // Apply search query filter
    const searchQuery = (document.getElementById('invoice-search') ? document.getElementById('invoice-search').value : '').toLowerCase().trim();
    if (searchQuery) {
        filteredInvoices = filteredInvoices.filter(inv => {
            const idMatch = inv.id.toLowerCase().includes(searchQuery);
            const dateMatch = new Date(inv.dateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toLowerCase().includes(searchQuery);
            const itemNameMatch = inv.items.some(item => item.name.toLowerCase().includes(searchQuery));
            return idMatch || dateMatch || itemNameMatch;
        });
    }

    if (filteredInvoices.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">No invoices match your search or date range.</td></tr>';
        return;
    }

    filteredInvoices.forEach(inv => {
        const dateStr = new Date(inv.dateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let syncBadge = '';
        if (inv.syncStatus === 1) {
            syncBadge = '<span class="badge badge-success">Synced</span>';
        } else {
            syncBadge = '<span class="badge badge-warning">Local</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>#${inv.id.substring(0, 8)}</code></td>
            <td>${dateStr}</td>
            <td class="text-right">${inv.items.reduce((acc, curr) => acc + curr.qty, 0)}</td>
            <td class="text-right">${formatMoney(inv.subtotal)}</td>
            <td class="text-right">${formatMoney(inv.discountAmount || 0)}</td>
            <td class="text-right"><strong>${formatMoney(inv.grandTotal)}</strong></td>
            <td class="text-right text-success"><strong>${formatMoney(inv.profit)}</strong></td>
            <td class="text-center">${syncBadge}</td>
            <td class="text-center">
                <button class="btn btn-secondary btn-sm" onclick="viewInvoiceReceipt('${inv.id}')">View</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 4.5: Render Settings Screen
function renderSettings() {
    document.getElementById('settings-shop-name').value = state.profile.shopName;
    document.getElementById('settings-shop-address').value = state.profile.shopAddress || '';
    document.getElementById('settings-shop-phone').value = state.profile.shopPhone || '';
    
    // Set sync status text
    document.getElementById('settings-sync-enabled-label').innerText = state.profile.cloudSync ? 'Enabled' : 'Disabled';
    
    // Count unsynced
    const unsyncedCount = state.invoices.filter(i => i.syncStatus === 0).length + 
                          state.products.filter(p => p.syncStatus === 0).length;
    
    const countLabel = document.getElementById('unsynced-records-count');
    countLabel.innerText = unsyncedCount;
    if (unsyncedCount > 0) {
        countLabel.className = 'text-warning';
    } else {
        countLabel.className = 'text-success';
    }

    document.getElementById('last-sync-time').innerText = state.profile.lastSync ? new Date(state.profile.lastSync).toLocaleString() : 'Never';

    // Dashboard Preferences
    document.getElementById('pref-sales').checked = state.dashboardPrefs.sales;
    document.getElementById('pref-profit').checked = state.dashboardPrefs.profit;
    document.getElementById('pref-alerts').checked = state.dashboardPrefs.alerts;
    document.getElementById('pref-activity').checked = state.dashboardPrefs.activity;
}

// --- 5. POINT OF SALE (POS) ENGINE ---

// Search dropdown in POS
function handlePOSSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const dropdown = document.getElementById('pos-search-results');

    if (!query) {
        dropdown.classList.add('hidden');
        return;
    }

    // Filter products
    const results = state.products.filter(p => {
        return p.name.toLowerCase().includes(query) || p.barcode.includes(query);
    });

    if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 13px; text-align: center;">No matching products found.</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    dropdown.innerHTML = '';
    results.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        let qtyClass = 'badge-success';
        if (prod.stockQty <= 0) qtyClass = 'badge-danger';
        else if (prod.stockQty <= prod.lowStockAlert) qtyClass = 'badge-warning';

        item.innerHTML = `
            <div class="item-details">
                <span class="item-name">${prod.name}</span>
                <span class="item-meta">Barcode: ${prod.barcode} | Stock: <span class="badge ${qtyClass}">${prod.stockQty}</span></span>
            </div>
            <div class="item-price">${formatMoney(prod.sellPrice)}</div>
        `;
        item.addEventListener('click', () => {
            addItemToCart(prod.id);
            dropdown.classList.add('hidden');
            e.target.value = '';
            e.target.focus();
        });
        dropdown.appendChild(item);
    });
    dropdown.classList.remove('hidden');
}

// Check if barcode scanner sent Enter
function handlePOSSearchKeyDown(e) {
    if (e.key === 'Enter') {
        const barcode = e.target.value.trim();
        if (barcode) {
            // Find by exact barcode match
            const prod = state.products.find(p => p.barcode === barcode);
            if (prod) {
                addItemToCart(prod.id);
                showToast(`Added: ${prod.name}`, 'success');
                e.target.value = '';
            } else {
                // Try searching by name and adding first result
                const matches = state.products.filter(p => p.name.toLowerCase().includes(barcode.toLowerCase()));
                if (matches.length > 0) {
                    addItemToCart(matches[0].id);
                    showToast(`Added: ${matches[0].name}`, 'success');
                    e.target.value = '';
                } else {
                    showToast('No product matches this barcode/search', 'danger');
                }
            }
            document.getElementById('pos-search-results').classList.add('hidden');
        }
    }
}

// Add item to cart
function addItemToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    // Check if product out of stock
    if (Number(product.stockQty) <= 0) {
        showToast('Warning: This product is out of stock!', 'danger');
    }

    const existingCartItem = state.cart.find(item => item.product.id === productId);

    if (existingCartItem) {
        if (existingCartItem.qty >= product.stockQty) {
            showToast('Warning: Selling quantity exceeds available stock!', 'warning');
        }
        existingCartItem.qty += 1;
    } else {
        state.cart.push({
            product: product,
            qty: 1
        });
    }

    updateCartUI();
}

function updateCartQty(productId, newQty) {
    const item = state.cart.find(item => item.product.id === productId);
    if (!item) return;

    newQty = parseInt(newQty);
    if (isNaN(newQty) || newQty <= 0) {
        removeCartItem(productId);
        return;
    }

    if (newQty > item.product.stockQty) {
        showToast('Warning: Quantity exceeds available stock!', 'warning');
    }

    item.qty = newQty;
    updateCartUI();
}

function removeCartItem(productId) {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    updateCartUI();
}

function clearCart() {
    state.cart = [];
    updateCartUI();
    showToast('Shopping cart cleared', 'warning');
}

// Update Cart View and Calculations
function updateCartUI() {
    const tbody = document.getElementById('cart-items-body');
    const emptyMsg = document.getElementById('empty-cart-message');
    tbody.innerHTML = '';

    if (state.cart.length === 0) {
        emptyMsg.classList.remove('hidden');
        document.getElementById('checkout-subtotal').innerText = formatMoney(0);
        document.getElementById('checkout-grand-total').innerText = formatMoney(0);
        document.getElementById('checkout-change').innerText = formatMoney(0);
        document.getElementById('checkout-tendered').value = '';
        return;
    }

    emptyMsg.classList.add('hidden');
    let subtotal = 0;

    state.cart.forEach(item => {
        const itemTotal = item.product.sellPrice * item.qty;
        subtotal += itemTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="cart-item-name">${item.product.name}</div>
                <span class="cart-item-barcode">${item.product.barcode}</span>
            </td>
            <td class="text-center">
                <div class="quantity-adjuster">
                    <button class="qty-btn" onclick="updateCartQty('${item.product.id}', ${item.qty - 1})">-</button>
                    <input type="text" class="qty-val" value="${item.qty}" onchange="updateCartQty('${item.product.id}', this.value)">
                    <button class="qty-btn" onclick="updateCartQty('${item.product.id}', ${item.qty + 1})">+</button>
                </div>
            </td>
            <td class="text-right cart-item-price">${formatMoney(item.product.sellPrice)}</td>
            <td class="text-right cart-item-total">${formatMoney(itemTotal)}</td>
            <td class="text-center">
                <button class="btn-remove-item" onclick="removeCartItem('${item.product.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Subtotal
    document.getElementById('checkout-subtotal').innerText = formatMoney(subtotal);

    // Calculate Grand Total with Discount
    calculatePOSCheckoutSummary();
}

function calculatePOSCheckoutSummary() {
    if (state.cart.length === 0) return;

    let subtotal = 0;
    state.cart.forEach(item => {
        subtotal += item.product.sellPrice * item.qty;
    });

    const discountVal = parseFloat(document.getElementById('checkout-discount').value) || 0;
    const discountType = document.getElementById('checkout-discount-type').value;

    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountVal / 100);
    } else {
        discountAmount = discountVal;
    }

    // Edge check
    if (discountAmount > subtotal) {
        discountAmount = subtotal;
        document.getElementById('checkout-discount').value = subtotal;
    }

    const grandTotal = subtotal - discountAmount;
    document.getElementById('checkout-grand-total').innerText = formatMoney(grandTotal);

    // Change Due
    const tenderedVal = parseFloat(document.getElementById('checkout-tendered').value) || 0;
    let change = 0;
    if (tenderedVal >= grandTotal) {
        change = tenderedVal - grandTotal;
    }
    document.getElementById('checkout-change').innerText = formatMoney(change);
}

// Process POS Checkout (Save invoice, deduct stock, open receipt)
function processCheckout() {
    if (state.cart.length === 0) {
        showToast('Cart is empty. Add products to check out.', 'warning');
        return;
    }

    let subtotal = 0;
    let totalCost = 0;
    const invoiceItems = [];

    // Construct invoice items & deduct stock
    for (let item of state.cart) {
        const product = state.products.find(p => p.id === item.product.id);
        if (product) {
            // Deduct stock
            product.stockQty = Math.max(0, product.stockQty - item.qty);
            product.syncStatus = 0; // Mark product as dirty/unsynced since stock changed
            product.lastUpdated = new Date().toISOString();
            
            subtotal += item.product.sellPrice * item.qty;
            totalCost += item.product.costPrice * item.qty;

            invoiceItems.push({
                productId: product.id,
                name: product.name,
                barcode: product.barcode,
                qty: item.qty,
                priceAtSale: product.sellPrice,
                costAtSale: product.costPrice
            });
        }
    }

    const discountVal = parseFloat(document.getElementById('checkout-discount').value) || 0;
    const discountType = document.getElementById('checkout-discount-type').value;

    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountVal / 100);
    } else {
        discountAmount = discountVal;
    }

    const grandTotal = subtotal - discountAmount;
    const profit = grandTotal - totalCost;

    const tenderedVal = parseFloat(document.getElementById('checkout-tendered').value) || 0;
    if (tenderedVal < grandTotal) {
        showToast('Tendered cash must be greater than or equal to grand total!', 'danger');
        return;
    }

    const invoiceId = generateUUID();
    const newInvoice = {
        id: invoiceId,
        dateTime: new Date().toISOString(),
        items: invoiceItems,
        subtotal: subtotal,
        discountVal: discountVal,
        discountType: discountType,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
        totalCost: totalCost,
        profit: profit,
        tendered: tenderedVal,
        change: tenderedVal - grandTotal,
        syncStatus: 0 // Local record
    };

    // Save to Database
    state.invoices.push(newInvoice);
    DB.set('invoices', state.invoices);
    DB.set('products', state.products);

    // Save Local Storage
    showToast('Invoice generated successfully!', 'success');

    // Show Printable Receipt Modal
    renderReceiptModal(newInvoice);

    // Clear cart & Reset inputs
    state.cart = [];
    document.getElementById('checkout-discount').value = 0;
    document.getElementById('checkout-tendered').value = '';
    
    // Update Indicators
    updateSyncIndicator();

    // Reset POS cart view
    updateCartUI();
    updatePOSDashboardSummary();
}

// --- 6. RECEIPT GENERATOR & PRINTING ---
function renderReceiptModal(invoice) {
    document.getElementById('receipt-shop-name').innerText = state.profile.shopName;
    document.getElementById('receipt-shop-address').innerText = state.profile.shopAddress || '123 Main Bazar';
    document.getElementById('receipt-shop-phone').innerText = 'Phone: ' + (state.profile.shopPhone || 'N/A');

    document.getElementById('receipt-id').innerText = invoice.id.substring(0, 13) + '...';
    document.getElementById('receipt-date').innerText = new Date(invoice.dateTime).toLocaleString();
    document.getElementById('receipt-operator').innerText = state.currentUser;

    // Items list
    const tbody = document.getElementById('receipt-items-body');
    tbody.innerHTML = '';

    invoice.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${item.name}<br>
                <span style="font-size:9px; color:#555;">${item.barcode}</span>
            </td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">${item.priceAtSale.toFixed(2)}</td>
            <td class="text-right">${(item.priceAtSale * item.qty).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('receipt-subtotal').innerText = 'Rs. ' + invoice.subtotal.toFixed(2);
    document.getElementById('receipt-discount').innerText = 'Rs. ' + (invoice.discountAmount || 0).toFixed(2);
    document.getElementById('receipt-grand-total').innerText = 'Rs. ' + invoice.grandTotal.toFixed(2);
    document.getElementById('receipt-tendered').innerText = 'Rs. ' + invoice.tendered.toFixed(2);
    document.getElementById('receipt-change').innerText = 'Rs. ' + invoice.change.toFixed(2);

    // Open Modal
    document.getElementById('modal-receipt').classList.remove('hidden');
}

function viewInvoiceReceipt(invoiceId) {
    const inv = state.invoices.find(i => i.id === invoiceId);
    if (inv) {
        renderReceiptModal(inv);
    }
}

// --- 7. INVENTORY CRUD OPERATIONS ---

// Add stock quickly from Dashboard
function quickAddStock(prodId) {
    const prod = state.products.find(p => p.id === prodId);
    if (prod) {
        const addAmount = prompt(`Enter quantity of "${prod.name}" to add to stock:`, "10");
        const qty = parseInt(addAmount);
        if (!isNaN(qty) && qty > 0) {
            prod.stockQty = Number(prod.stockQty) + qty;
            prod.syncStatus = 0;
            prod.lastUpdated = new Date().toISOString();
            DB.set('products', state.products);
            showToast(`Added ${qty} items to ${prod.name}`, 'success');
            renderDashboard();
            updateSyncIndicator();
        }
    }
}

// Open Add Product Modal
function openAddProductModal() {
    state.editingProductId = null;
    document.getElementById('modal-product-title').innerText = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    
    // Auto populate random barcode
    document.getElementById('product-barcode').value = generateRandomBarcode();
    
    document.getElementById('modal-product').classList.remove('hidden');
}

function generateRandomBarcode() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Open Edit Product Modal
function openEditProductModal(prodId) {
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) return;

    state.editingProductId = prodId;
    document.getElementById('modal-product-title').innerText = 'Edit Product Details';
    
    document.getElementById('product-id').value = prod.id;
    document.getElementById('product-name').value = prod.name;
    document.getElementById('product-barcode').value = prod.barcode;
    document.getElementById('product-category').value = prod.category;
    document.getElementById('product-cost-price').value = prod.costPrice;
    document.getElementById('product-sell-price').value = prod.sellPrice;
    document.getElementById('product-stock-qty').value = prod.stockQty;
    document.getElementById('product-low-stock-alert').value = prod.lowStockAlert;

    document.getElementById('modal-product').classList.remove('hidden');
}

// Save Product (Create or Update)
function handleProductFormSubmit(e) {
    e.preventDefault();

    const prodId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const barcode = document.getElementById('product-barcode').value.trim() || generateRandomBarcode();
    const category = document.getElementById('product-category').value.trim();
    const costPrice = parseFloat(document.getElementById('product-cost-price').value) || 0;
    const sellPrice = parseFloat(document.getElementById('product-sell-price').value) || 0;
    const stockQty = parseInt(document.getElementById('product-stock-qty').value) || 0;
    const lowStockAlert = parseInt(document.getElementById('product-low-stock-alert').value) || 0;

    // Check duplicate barcode
    const barcodeExists = state.products.some(p => p.barcode === barcode && p.id !== prodId);
    if (barcodeExists) {
        showToast('Error: A product with this barcode already exists!', 'danger');
        return;
    }

    if (prodId) {
        // Update
        const idx = state.products.findIndex(p => p.id === prodId);
        if (idx !== -1) {
            state.products[idx] = {
                ...state.products[idx],
                name, barcode, category, costPrice, sellPrice, stockQty, lowStockAlert,
                syncStatus: 0,
                lastUpdated: new Date().toISOString()
            };
            showToast('Product updated successfully!', 'success');
        }
    } else {
        // Create
        const newProduct = {
            id: generateUUID(),
            name, barcode, category, costPrice, sellPrice, stockQty, lowStockAlert,
            syncStatus: 0,
            lastUpdated: new Date().toISOString()
        };
        state.products.push(newProduct);
        showToast('New product added to inventory!', 'success');
    }

    DB.set('products', state.products);
    document.getElementById('modal-product').classList.add('hidden');
    
    updateSyncIndicator();
    renderInventory();
}

// Delete Product
function deleteProduct(prodId) {
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) return;

    if (confirm(`Are you sure you want to delete "${prod.name}" from inventory?`)) {
        state.products = state.products.filter(p => p.id !== prodId);
        DB.set('products', state.products);
        showToast('Product deleted from inventory.', 'warning');
        renderInventory();
        updateSyncIndicator();
    }
}

// --- 8. SYNC ENGINE & CLOUD SIMULATION ---

function updateSyncIndicator() {
    const unsyncedCount = state.invoices.filter(i => i.syncStatus === 0).length + 
                          state.products.filter(p => p.syncStatus === 0).length;

    const indicator = document.getElementById('cloud-sync-status');
    const text = indicator.querySelector('.indicator-text');

    if (unsyncedCount > 0) {
        indicator.className = 'sync-indicator offline';
        text.innerText = `${unsyncedCount} Unsynced Records`;
        indicator.setAttribute('title', 'Local changes are pending cloud sync.');
    } else {
        indicator.className = 'sync-indicator synced';
        text.innerText = 'Synced';
        indicator.setAttribute('title', 'All data is backed up to the cloud.');
    }
}

async function forceCloudSync() {
    const unsyncedCount = state.invoices.filter(i => i.syncStatus === 0).length + 
                          state.products.filter(p => p.syncStatus === 0).length;

    const spinner = document.getElementById('sync-spinner');
    const prgBar = document.getElementById('sync-progress-bar');
    const prgFill = prgBar.querySelector('.sync-progress-bar-fill');

    // Show Progress UI
    spinner.style.display = 'inline-block';
    prgBar.classList.remove('hidden');
    prgFill.style.width = '20%';

    try {
        // Push local changes
        const pushResponse = await fetch('https://shopsync-crm-backend.onrender.com/api/sync/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: state.currentUser,
                products: state.products,
                invoices: state.invoices,
                profile: state.profile
            })
        });

        if (!pushResponse.ok) {
            throw new Error("Push failed");
        }

        prgFill.style.width = '60%';

        // Pull latest (just in case there are updates from other devices)
        const pullResponse = await fetch(`/api/sync/pull?username=${encodeURIComponent(state.currentUser)}`);
        if (pullResponse.ok) {
            const data = await pullResponse.json();
            
            // Mark all as synced (syncStatus = 1)
            state.products = (data.products || []).map(p => ({ ...p, syncStatus: 1 }));
            state.invoices = (data.invoices || []).map(i => ({ ...i, syncStatus: 1 }));
            
            state.profile.lastSync = new Date().toISOString();
            
            DB.set('products', state.products);
            DB.set('invoices', state.invoices);
            DB.set('profile', state.profile);
        }

        prgFill.style.width = '100%';
        setTimeout(() => {
            spinner.style.display = 'none';
            prgBar.classList.add('hidden');
            showToast('Cloud Sync Completed Successfully!', 'success');
            updateSyncIndicator();
            if (state.activeScreen === 'screen-settings') {
                renderSettings();
            }
        }, 300);

    } catch (err) {
        console.error("Sync failed:", err);
        spinner.style.display = 'none';
        prgBar.classList.add('hidden');
        showToast('Sync failed: Unable to connect to cloud server.', 'danger');
    }
}

// --- 9. EVENT LISTENERS & ROUTING ---
function setupEventListeners() {
    // --- Navigation Links ---
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchScreen(target);
        });
    });

    // Quick POS Button
    document.getElementById('btn-quick-pos').addEventListener('click', () => {
        switchScreen('screen-pos');
    });

    // Submit Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const pass = document.getElementById('login-password').value;

        try {
            const response = await fetch('https://shopsync-crm-backend.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pass })
            });

            const data = await response.json();

            if (response.ok) {
                state.currentUser = data.user.username;
                state.profile = {
                    shopName: data.user.shopName,
                    shopType: data.user.shopType,
                    shopAddress: data.user.address || '',
                    shopPhone: data.user.phone || '',
                    cloudSync: true,
                    lastSync: new Date().toISOString()
                };

                DB.set('currentUser', state.currentUser);
                DB.set('profile', state.profile);

                showToast('Welcome back, ' + state.currentUser, 'success');

                // Pull latest data from cloud on login
                await pullCloudData();

                enterMainApplication();
            } else {
                showToast('Error: ' + (data.error || 'Invalid credentials!'), 'danger');
            }
        } catch (err) {
            console.error(err);
            // Fallback to local offline login if server is unreachable
            const users = DB.get('users') || [];
            const userFound = users.find(u => u.username === username && u.password === pass);
            if (userFound) {
                state.currentUser = username;
                DB.set('currentUser', username);
                showToast('Offline Login: Welcome back, ' + username, 'warning');
                enterMainApplication();
            } else {
                showToast('Error: Unable to connect to server and no local credentials found!', 'danger');
            }
        }
    });

    // Log out
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            state.currentUser = null;
            DB.remove('currentUser');
            showAuthScreen('login');
            showToast('Logged out successfully.', 'warning');
        }
    });

    // --- POS Events ---
    document.getElementById('pos-search-input').addEventListener('input', handlePOSSearch);
    document.getElementById('pos-search-input').addEventListener('keydown', handlePOSSearchKeyDown);

    // Hide search dropdown on outer click
    document.addEventListener('click', (e) => {
        const searchBox = document.querySelector('.pos-search-bar');
        if (searchBox && !searchBox.contains(e.target)) {
            document.getElementById('pos-search-results').classList.add('hidden');
        }
    });

    // POS discount input
    document.getElementById('checkout-discount').addEventListener('input', calculatePOSCheckoutSummary);
    document.getElementById('checkout-discount-type').addEventListener('change', calculatePOSCheckoutSummary);
    document.getElementById('checkout-tendered').addEventListener('input', calculatePOSCheckoutSummary);

    // POS buttons
    document.getElementById('btn-clear-cart').addEventListener('click', clearCart);
    document.getElementById('btn-pay-print').addEventListener('click', processCheckout);

    // --- Inventory Events ---
    document.getElementById('btn-add-product').addEventListener('click', openAddProductModal);
    document.getElementById('inventory-search').addEventListener('input', renderInventory);
    document.getElementById('inventory-filter-category').addEventListener('change', renderInventory);
    document.getElementById('inventory-filter-stock').addEventListener('change', renderInventory);

    // Modal Product controls
    document.getElementById('btn-close-product-modal').addEventListener('click', () => {
        document.getElementById('modal-product').classList.add('hidden');
    });
    document.getElementById('btn-cancel-product-modal').addEventListener('click', () => {
        document.getElementById('modal-product').classList.add('hidden');
    });
    document.getElementById('product-form').addEventListener('submit', handleProductFormSubmit);
    
    document.getElementById('btn-generate-barcode').addEventListener('click', () => {
        document.getElementById('product-barcode').value = generateRandomBarcode();
    });

    // --- Receipt Modal ---
    document.getElementById('btn-close-receipt-modal').addEventListener('click', () => {
        document.getElementById('modal-receipt').classList.add('hidden');
    });
    document.getElementById('btn-close-receipt-preview').addEventListener('click', () => {
        document.getElementById('modal-receipt').classList.add('hidden');
    });
    document.getElementById('btn-trigger-print').addEventListener('click', () => {
        window.print();
    });

    // --- Reports Filters ---
    document.getElementById('btn-filter-reports').addEventListener('click', renderReports);

    // Invoice Search
    document.getElementById('invoice-search').addEventListener('input', renderReports);

    // Export Invoices
    document.getElementById('btn-export-pdf').addEventListener('click', () => simulateExport('pdf'));
    document.getElementById('btn-export-excel').addEventListener('click', () => simulateExport('excel'));

    // --- Settings Events ---
    document.getElementById('settings-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        state.profile.shopName = document.getElementById('settings-shop-name').value.trim();
        state.profile.shopAddress = document.getElementById('settings-shop-address').value.trim();
        state.profile.shopPhone = document.getElementById('settings-shop-phone').value.trim();
        
        DB.set('profile', state.profile);
        
        document.getElementById('display-shop-name').innerText = state.profile.shopName;
        showToast('Shop Profile saved successfully!', 'success');
    });


    // Dashboard Preferences Toggles
    const prefToggles = ['pref-sales', 'pref-profit', 'pref-alerts', 'pref-activity'];
    prefToggles.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                const key = id.replace('pref-', '');
                state.dashboardPrefs[key] = e.target.checked;
                DB.set('dashboardPrefs', state.dashboardPrefs);
                showToast('Dashboard preferences updated', 'success');
            });
        }
    });

    // Local DB Management Buttons
    document.getElementById('btn-force-sync').addEventListener('click', forceCloudSync);

    // --- Keyboard Shortcuts ---
    window.addEventListener('keydown', (e) => {
        // Focus POS Search with "/"
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            const posSearch = document.getElementById('pos-search-input');
            if (posSearch && state.activeScreen === 'screen-pos') {
                e.preventDefault();
                posSearch.focus();
            }
        }

        // F2: Switch to POS Screen
        if (e.key === 'F2') {
            e.preventDefault();
            switchScreen('screen-pos');
        }

        // F5: Clear Cart (when on POS screen)
        if (e.key === 'F5' && state.activeScreen === 'screen-pos') {
            e.preventDefault();
            clearCart();
        }

        // F12: Checkout & Pay (when on POS screen)
        if (e.key === 'F12' && state.activeScreen === 'screen-pos') {
            e.preventDefault();
            processCheckout();
        }
    });
}

// Simulate PDF/Excel Export
function simulateExport(format) {
    if (state.invoices.length === 0) {
        showToast('No invoices to export.', 'warning');
        return;
    }

    // Build simple CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice ID,Date,Items Count,Subtotal,Discount,Grand Total,Profit,Sync Status\r\n";

    state.invoices.forEach(inv => {
        csvContent += `${inv.id},${inv.dateTime},${inv.items.length},${inv.subtotal},${inv.discountAmount},${inv.grandTotal},${inv.profit},${inv.syncStatus === 1 ? 'Synced' : 'Local'}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShopSync_Report_${new Date().toISOString().substring(0,10)}.${format === 'excel' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    showToast(`Report downloaded successfully as ${format.toUpperCase()}!`, 'success');
}

// Backup Local Database (JSON Download)
function backupDatabase() {
    const fullBackup = {
        profile: state.profile,
        products: state.products,
        invoices: state.invoices,
        users: DB.get('users')
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ShopSync_Backup_${new Date().toISOString().substring(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    
    showToast('Database backup downloaded successfully!', 'success');
}

// Reset Local Database
function resetDatabase() {
    if (confirm('🚨 CRITICAL WARNING: This will completely delete all products, invoices, and profile configurations from your local storage. This action CANNOT be undone. Are you absolutely sure?')) {
        DB.clearAll();
        showToast('All local databases wiped. Reloading...', 'danger');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}
