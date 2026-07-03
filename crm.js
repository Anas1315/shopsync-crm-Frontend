// --- ShopSync CRM JavaScript Controller ---

const API_BASE = "https://shopsync-crm-backend.onrender.com";

// Global State
let allUsers = [];
let selectedClientUsername = null;
let selectedClientData = { products: [], invoices: [], profile: {} };
let activeBrowserTab = "products"; // or "invoices"

// DOM Elements
const crmLoginScreen = document.getElementById("crm-login-screen");
const crmLoginForm = document.getElementById("crm-login-form");
const crmSignupForm = document.getElementById("crm-signup-form");
const btnShowLogin = document.getElementById("btn-show-login");
const btnShowSignup = document.getElementById("btn-show-signup");
const crmSidebar = document.getElementById("crm-sidebar");
const crmMainContent = document.getElementById("crm-main-content");
const crmTopbarTitleText = document.getElementById("crm-topbar-title-text");

// Screen tabs
const menuItems = document.querySelectorAll(".menu-item");
const screens = document.querySelectorAll(".app-screen");

// Init
document.addEventListener("DOMContentLoaded", () => {
    // Check if already authenticated in this session
    if (sessionStorage.getItem("crm_authenticated") === "true") {
        showMainInterface();
        loadAllData();
    }

    // Auth Toggle Logic
    btnShowLogin.addEventListener("click", () => {
        crmLoginForm.classList.remove("hidden");
        crmSignupForm.classList.add("hidden");
        btnShowLogin.classList.replace("btn-outline", "btn-primary");
        btnShowSignup.classList.replace("btn-primary", "btn-outline");
    });

    btnShowSignup.addEventListener("click", () => {
        crmSignupForm.classList.remove("hidden");
        crmLoginForm.classList.add("hidden");
        btnShowSignup.classList.replace("btn-outline", "btn-primary");
        btnShowLogin.classList.replace("btn-primary", "btn-outline");
    });

    // Login Form Submit
    crmLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("crm-username").value;
        const password = document.getElementById("crm-password").value;

        // Check against custom credentials in localStorage, or fallback to default
        const savedUser = localStorage.getItem("crm_admin_user") || "admin";
        const savedPass = localStorage.getItem("crm_admin_pass") || "admin123";

        if (username === savedUser && password === savedPass) {
            sessionStorage.setItem("crm_authenticated", "true");
            showMainInterface();
            loadAllData();
            showToast("Authenticated successfully!", "success");
        } else {
            showToast("Invalid admin credentials!", "danger");
        }
    });

    // Signup Form Submit
    crmSignupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newUsername = document.getElementById("crm-new-username").value;
        const newPassword = document.getElementById("crm-new-password").value;

        if (newUsername.trim() === "" || newPassword.trim() === "") {
            showToast("Credentials cannot be empty", "danger");
            return;
        }

        localStorage.setItem("crm_admin_user", newUsername);
        localStorage.setItem("crm_admin_pass", newPassword);
        
        showToast("New Admin Credentials Saved! Please login.", "success");
        btnShowLogin.click(); // Switch back to login view
    });

    // Logout
    document.getElementById("btn-crm-logout").addEventListener("click", () => {
        sessionStorage.removeItem("crm_authenticated");
        location.reload();
    });

    // Navigation
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetScreenId = item.getAttribute("data-target");
            
            // Set active menu item
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            // Show target screen
            screens.forEach(screen => {
                if (screen.id === targetScreenId) {
                    screen.classList.remove("hidden");
                } else {
                    screen.classList.add("hidden");
                }
            });

            // Set Title
            crmTopbarTitleText.textContent = item.querySelector("span").textContent;
        });
    });

    // Client Modal Elements
    const userModal = document.getElementById("crm-user-modal");
    const userForm = document.getElementById("crm-user-form");
    const btnCloseModal = document.getElementById("btn-crm-close-modal");
    const btnCancelModal = document.getElementById("btn-crm-cancel-modal");
    const btnCreateUser = document.getElementById("btn-crm-create-user");

    const openUserModal = (editMode = false, user = null) => {
        document.getElementById("crm-edit-mode").value = editMode ? "true" : "false";
        const passwordInput = document.getElementById("client-password");
        const usernameInput = document.getElementById("client-username");
        const passwordLabel = document.getElementById("client-password-label");

        if (editMode && user) {
            document.getElementById("crm-modal-title").textContent = "Edit Client Account";
            document.getElementById("crm-edit-username").value = user.username;
            usernameInput.value = user.username;
            usernameInput.disabled = true;
            passwordInput.required = false;
            passwordLabel.textContent = "New Password (leave blank to keep current)";
            document.getElementById("client-shop-name").value = user.shopName;
            document.getElementById("client-shop-type").value = user.shopType;
            document.getElementById("client-phone").value = user.phone;
            document.getElementById("client-address").value = user.address;
        } else {
            document.getElementById("crm-modal-title").textContent = "Create Client Account";
            usernameInput.value = "";
            usernameInput.disabled = false;
            passwordInput.value = "";
            passwordInput.required = true;
            passwordLabel.textContent = "Password *";
            document.getElementById("client-shop-name").value = "";
            document.getElementById("client-shop-type").value = "general";
            document.getElementById("client-phone").value = "";
            document.getElementById("client-address").value = "";
        }
        userModal.classList.remove("hidden");
    };

    window.openUserModal = openUserModal;

    const closeUserModal = () => {
        userModal.classList.add("hidden");
        userForm.reset();
    };

    btnCreateUser.addEventListener("click", () => openUserModal(false));
    btnCloseModal.addEventListener("click", closeUserModal);
    btnCancelModal.addEventListener("click", closeUserModal);

    // User Form Submit (Create or Update)
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const editMode = document.getElementById("crm-edit-mode").value === "true";
        const username = document.getElementById("client-username").value;
        const password = document.getElementById("client-password").value;
        const shopName = document.getElementById("client-shop-name").value;
        const shopType = document.getElementById("client-shop-type").value;
        const phone = document.getElementById("client-phone").value;
        const address = document.getElementById("client-address").value;

        const payload = { shopName, shopType, phone, address };
        if (password) {
            payload.password = password;
        }

        try {
            let response;
            if (editMode) {
                const targetUser = document.getElementById("crm-edit-username").value;
                response = await fetch(`${API_BASE}/api/crm/users/${targetUser}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: jsonEncode(payload)
                });
            } else {
                payload.username = username;
                response = await fetch(`${API_BASE}/api/crm/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: jsonEncode(payload)
                });
            }

            const data = await response.json();
            if (response.ok) {
                showToast(data.message || "Account saved successfully!", "success");
                closeUserModal();
                loadAllData();
            } else {
                showToast(data.error || "Failed to save account", "danger");
            }
        } catch (error) {
            console.error("Error saving user:", error);
            showToast("Network error while saving client account", "danger");
        }
    });

    // Browser Tabs
    const btnTabProducts = document.getElementById("btn-tab-products");
    const btnTabInvoices = document.getElementById("btn-tab-invoices");
    const productsView = document.getElementById("crm-browser-products-view");
    const invoicesView = document.getElementById("crm-browser-invoices-view");

    btnTabProducts.addEventListener("click", () => {
        activeBrowserTab = "products";
        btnTabProducts.classList.add("active");
        btnTabInvoices.classList.remove("active");
        productsView.classList.remove("hidden");
        invoicesView.classList.add("hidden");
    });

    btnTabInvoices.addEventListener("click", () => {
        activeBrowserTab = "invoices";
        btnTabInvoices.classList.add("active");
        btnTabProducts.classList.remove("active");
        invoicesView.classList.remove("hidden");
        productsView.classList.add("hidden");
    });

    // Browser Product Search
    document.getElementById("crm-browser-product-search").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        filterBrowserProducts(query);
    });

    // Server Settings Actions
    document.getElementById("btn-crm-download-db").addEventListener("click", async () => {
        try {
            window.open(`${API_BASE}/api/crm/backup`, "_blank");
        } catch (err) {
            showToast("Failed to download database backup", "danger");
        }
    });

    document.getElementById("btn-crm-wipe-db").addEventListener("click", async () => {
        const confirm1 = confirm("⚠️ WARNING: This will wipe all synced client databases, products, and invoices. Are you absolutely sure?");
        if (!confirm1) return;
        const confirm2 = confirm("🔥 FINAL CONFIRMATION: You are about to permanently delete all shop records. This cannot be undone. Proceed?");
        if (!confirm2) return;

        try {
            const response = await fetch(`${API_BASE}/api/crm/reset`, { method: "POST" });
            if (response.ok) {
                showToast("Server database reset successfully!", "success");
                loadAllData();
            } else {
                showToast("Failed to reset database", "danger");
            }
        } catch (err) {
            showToast("Network error during database wipe", "danger");
        }
    });

    // --- SOFTWARE SALES WORKFLOW ---
    const saleModal = document.getElementById("crm-software-sale-modal");
    const saleForm = document.getElementById("crm-software-sale-form");
    const clientSelect = document.getElementById("sale-client-select");
    const saleShopNameInput = document.getElementById("sale-shop-name");
    const saleDateInput = document.getElementById("sale-date");

    document.getElementById("btn-crm-create-sale").addEventListener("click", () => {
        // Populate client dropdown
        clientSelect.innerHTML = '<option value="">-- Custom Shop (Not Listed) --</option>';
        allUsers.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.username;
            opt.textContent = `${u.shopName} (@${u.username})`;
            clientSelect.appendChild(opt);
        });

        // Set default date to today
        saleDateInput.value = new Date().toISOString().substring(0, 10);
        saleForm.reset();
        saleModal.classList.remove("hidden");
    });

    clientSelect.addEventListener("change", (e) => {
        const selectedUsername = e.target.value;
        if (selectedUsername) {
            const user = allUsers.find(u => u.username === selectedUsername);
            if (user) {
                saleShopNameInput.value = user.shopName;
                saleShopNameInput.disabled = true;
            }
        } else {
            saleShopNameInput.value = "";
            saleShopNameInput.disabled = false;
        }
    });

    const closeSaleModal = () => {
        saleModal.classList.add("hidden");
        saleForm.reset();
        saleShopNameInput.disabled = false;
    };

    document.getElementById("btn-crm-close-sale-modal").addEventListener("click", closeSaleModal);
    document.getElementById("btn-crm-cancel-sale-modal").addEventListener("click", closeSaleModal);

    saleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const clientUsername = clientSelect.value;
        const clientShopName = saleShopNameInput.value;
        const salePrice = parseFloat(document.getElementById("sale-price").value);
        const costPrice = parseFloat(document.getElementById("sale-cost").value || 0);
        const date = saleDateInput.value;

        try {
            const res = await fetch(`${API_BASE}/api/crm/software-sales`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientUsername, clientShopName, salePrice, costPrice, date })
            });

            if (res.ok) {
                showToast("Software sale logged successfully!", "success");
                closeSaleModal();
                loadAllData();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to log sale", "danger");
            }
        } catch (err) {
            showToast("Network error while logging software sale", "danger");
        }
    });
});

// Helpers
function showMainInterface() {
    crmLoginScreen.classList.add("hidden");
    crmSidebar.classList.remove("hidden");
    crmMainContent.classList.remove("hidden");
}

function jsonEncode(obj) {
    return JSON.stringify(obj);
}

async function loadAllData() {
    try {
        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/api/crm/stats`);
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById("crm-stat-users").textContent = stats.totalUsers;
            document.getElementById("crm-stat-products").textContent = stats.totalProducts;
            document.getElementById("crm-stat-invoices").textContent = stats.totalInvoices;
            
            // Update main dashboard to show YOUR software profit!
            if (stats.softwareSales) {
                document.getElementById("crm-stat-revenue").textContent = "Rs. " + stats.softwareSales.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const labelEl = document.querySelector(".stat-icon.revenue").nextElementSibling.querySelector("h4");
                if (labelEl) labelEl.textContent = "Your Software Profit";
            }
        }

        // Fetch users
        const usersRes = await fetch(`${API_BASE}/api/crm/users`);
        if (usersRes.ok) {
            const data = await usersRes.json();
            allUsers = data.users;
            renderDashboardTable();
            renderUsersTable();
            renderBrowserClientList();
        }

        // Fetch software sales
        loadSoftwareSales();
    } catch (error) {
        console.error("Error loading CRM data:", error);
        showToast("Error connecting to backend API", "danger");
    }
}

// Fetch and render software sales
async function loadSoftwareSales() {
    try {
        const res = await fetch(`${API_BASE}/api/crm/software-sales`);
        if (res.ok) {
            const data = await res.json();
            renderSoftwareSalesTable(data.sales);
        }
    } catch (err) {
        console.error("Error loading software sales:", err);
    }
}

// Render software sales table and update software metrics screen
function renderSoftwareSalesTable(sales) {
    const tbody = document.getElementById("crm-sales-table-body");
    tbody.innerHTML = "";

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No software sales logged yet.</td></tr>`;
    } else {
        sales.forEach(s => {
            totalRevenue += s.salePrice;
            totalCost += s.costPrice;
            totalProfit += s.profit;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>${escapeHtml(s.date)}</code></td>
                <td><strong>${escapeHtml(s.clientShopName)}</strong></td>
                <td><code>${escapeHtml(s.clientUsername || "N/A")}</code></td>
                <td class="text-right">Rs. ${s.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="text-right">Rs. ${s.costPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="text-right" style="font-weight: 700; color: var(--accent-success);">Rs. ${s.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="text-center">
                    <button class="btn-icon delete" title="Delete Sale Record" onclick="deleteSoftwareSale('${s.id}')">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Software Sales Screen metric cards
    document.getElementById("crm-soft-revenue").textContent = "Rs. " + totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 });
    document.getElementById("crm-soft-cost").textContent = "Rs. " + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 });
    document.getElementById("crm-soft-profit").textContent = "Rs. " + totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// Delete software sale record
async function deleteSoftwareSale(id) {
    if (!confirm("Are you sure you want to delete this software sale record?")) return;
    try {
        const res = await fetch(`${API_BASE}/api/crm/software-sales/${id}`, { method: "DELETE" });
        if (res.ok) {
            showToast("Software sale record deleted", "success");
            loadAllData();
        } else {
            showToast("Failed to delete record", "danger");
        }
    } catch (err) {
        showToast("Network error while deleting record", "danger");
    }
}

// Toggle client active/inactive status
async function toggleClientActive(username) {
    try {
        const res = await fetch(`${API_BASE}/api/crm/users/${username}/toggle-active`, { method: "POST" });
        if (res.ok) {
            const data = await res.json();
            showToast(data.message, "success");
            loadAllData();
        } else {
            showToast("Failed to toggle license status", "danger");
        }
    } catch (err) {
        showToast("Network error while toggling license status", "danger");
    }
}

// Render Dashboard Table
function renderDashboardTable() {
    const tbody = document.getElementById("crm-dashboard-table-body");
    tbody.innerHTML = "";

    if (allUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No client shops registered yet.</td></tr>`;
        return;
    }

    allUsers.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${escapeHtml(u.shopName)}</strong></td>
            <td><code>${escapeHtml(u.username)}</code></td>
            <td><span class="badge badge-${u.shopType}">${u.shopType}</span></td>
            <td class="text-center">${u.productCount}</td>
            <td class="text-center">${u.invoiceCount}</td>
            <td class="text-right">Rs. ${u.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td>${escapeHtml(u.phone || "N/A")}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Users Table (includes Active Status badge and Toggle Button)
function renderUsersTable() {
    const tbody = document.getElementById("crm-users-table-body");
    tbody.innerHTML = "";

    if (allUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No client accounts found.</td></tr>`;
        return;
    }

    allUsers.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${escapeHtml(u.shopName)}</strong></td>
            <td><code>${escapeHtml(u.username)}</code></td>
            <td><span class="badge badge-${u.shopType}">${u.shopType}</span></td>
            <td>${escapeHtml(u.address || "N/A")}</td>
            <td>${escapeHtml(u.phone || "N/A")}</td>
            <td class="text-center">
                <span class="badge ${u.active ? 'badge-kiryana' : 'badge-rickshaw'}" style="padding: 4px 10px;">
                    ${u.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="text-center">
                <div class="actions-cell" style="justify-content: center;">
                    <button class="btn-icon" title="${u.active ? 'Deactivate License' : 'Activate License'}" onclick="toggleClientActive('${u.username}')" style="color: ${u.active ? 'var(--accent-warning)' : 'var(--accent-success)'}">
                        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:16px; height:16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 18.364a9 9 0 1112.728 0M12 3v9"/>
                        </svg>
                    </button>
                    <button class="btn-icon browse" title="Inspect Shop Data" onclick="inspectClientData('${u.username}')">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button class="btn-icon" title="Reset Hardware Lock" onclick="resetDevice('${u.username}')" style="color: var(--accent-primary)">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="btn-icon edit" title="Edit Profile/Password" onclick="editClient('${u.username}')">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button class="btn-icon delete" title="Delete Client Shop" onclick="deleteClient('${u.username}')">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Browser Client List
function renderBrowserClientList() {
    const list = document.getElementById("crm-browser-client-list");
    list.innerHTML = "";

    if (allUsers.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No clients registered.</div>`;
        return;
    }

    allUsers.forEach(u => {
        const div = document.createElement("div");
        div.className = `client-list-item ${selectedClientUsername === u.username ? "active" : ""}`;
        div.onclick = () => selectClientForBrowsing(u.username);
        div.innerHTML = `
            <h4>${escapeHtml(u.shopName)}</h4>
            <p>@${escapeHtml(u.username)} • ${u.productCount} Items • ${u.invoiceCount} Sales</p>
        `;
        list.appendChild(div);
    });
}

// Select Client in Inspector
async function selectClientForBrowsing(username) {
    selectedClientUsername = username;
    
    // Refresh sidebar highlights
    renderBrowserClientList();

    // Show loading state
    const displayPanel = document.getElementById("crm-browser-display-panel");
    const emptyState = document.getElementById("crm-browser-empty");
    const productsView = document.getElementById("crm-browser-products-view");
    const invoicesView = document.getElementById("crm-browser-invoices-view");

    emptyState.classList.add("hidden");
    
    try {
        const res = await fetch(`${API_BASE}/api/crm/users/${username}/data`);
        if (res.ok) {
            selectedClientData = await res.json();
            
            document.getElementById("crm-browser-products-title").textContent = `${escapeHtml(selectedClientData.profile.shopName || username)}'s Inventory`;
            
            renderBrowserProducts();
            renderBrowserInvoices();

            // Toggle active view
            if (activeBrowserTab === "products") {
                productsView.classList.remove("hidden");
                invoicesView.classList.add("hidden");
            } else {
                invoicesView.classList.remove("hidden");
                productsView.classList.add("hidden");
            }
        } else {
            showToast("Failed to fetch client database", "danger");
        }
    } catch (err) {
        console.error("Error fetching client data:", err);
        showToast("Network error while inspecting client", "danger");
    }
}

// Render Browser Products
function renderBrowserProducts(filteredProducts = null) {
    const tbody = document.getElementById("crm-browser-products-body");
    tbody.innerHTML = "";

    const prods = filteredProducts || selectedClientData.products;

    if (prods.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products in this shop's database.</td></tr>`;
        return;
    }

    prods.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><code>${escapeHtml(p.barcode || "N/A")}</code></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${p.imageInfo ? `<img src="data:image/webp;base64,${p.imageInfo}" style="width:24px; height:24px; border-radius:4px; object-fit:cover;">` : `<div style="width:24px; height:24px; border-radius:4px; background:linear-gradient(135deg,#3b82f6,#8b5cf6);"></div>`}
                    <span>${escapeHtml(p.name)}</span>
                </div>
            </td>
            <td>${escapeHtml(p.category || "General")}</td>
            <td class="text-right">Rs. ${p.costPrice.toFixed(2)}</td>
            <td class="text-right">Rs. ${p.sellPrice.toFixed(2)}</td>
            <td class="text-center">
                <span style="font-weight: 700; color: ${p.stockQty <= (p.lowStockLevel || 5) ? "var(--accent-danger)" : "var(--accent-success)"}">
                    ${p.stockQty}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Browser Products
function filterBrowserProducts(query) {
    if (!selectedClientData.products) return;
    const filtered = selectedClientData.products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
    renderBrowserProducts(filtered);
}

// Render Browser Invoices
function renderBrowserInvoices() {
    const tbody = document.getElementById("crm-browser-invoices-body");
    tbody.innerHTML = "";

    const invs = selectedClientData.invoices;

    if (invs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No sales invoices recorded.</td></tr>`;
        return;
    }

    invs.forEach(inv => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${escapeHtml(inv.id)}</strong></td>
            <td>${escapeHtml(inv.dateTime)}</td>
            <td class="text-right">Rs. ${inv.subtotal.toFixed(2)}</td>
            <td class="text-right">Rs. ${inv.discount.toFixed(2)}</td>
            <td class="text-right" style="font-weight:700; color:var(--accent-success);">Rs. ${inv.grandTotal.toFixed(2)}</td>
            <td class="text-right" style="color:var(--text-secondary);">Rs. ${inv.profit.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Inspect Client Button from Users Table
function inspectClientData(username) {
    // Switch to Browser tab
    const menuItem = document.querySelector('.menu-item[data-target="crm-screen-browser"]');
    if (menuItem) menuItem.click();

    // Select the client
    selectClientForBrowsing(username);
}

// Edit Client Account
function editClient(username) {
    const user = allUsers.find(u => u.username === username);
    if (user) {
        openUserModal(true, user);
    }
}

// Delete Client Account
async function deleteClient(username) {
    const confirmation = confirm(`⚠️ Are you absolutely sure you want to DELETE client "${username}"?\nThis will permanently destroy their account, profile, products, and sales invoice records from the server!`);
    if (!confirmation) return;

    try {
        const response = await fetch(`${API_BASE}/api/crm/users/${username}`, {
            method: "DELETE"
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message || "Client deleted successfully", "success");
            if (selectedClientUsername === username) {
                selectedClientUsername = null;
                document.getElementById("crm-browser-empty").classList.remove("hidden");
                document.getElementById("crm-browser-products-view").classList.add("hidden");
                document.getElementById("crm-browser-invoices-view").classList.add("hidden");
            }
            loadAllData();
        } else {
            showToast(data.error || "Failed to delete client", "danger");
        }
    } catch (err) {
        console.error("Error deleting client:", err);
        showToast("Network error while deleting client", "danger");
    }
}

// Reset Hardware Lock
async function resetDevice(username) {
    const confirmation = confirm(`Are you sure you want to reset the hardware lock for "${username}"? They will be able to log in from a new device.`);
    if (!confirmation) return;
    try {
        const response = await fetch(`${API_BASE}/api/crm/users/${username}/reset-device`, {
            method: "POST"
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message, "success");
        } else {
            showToast(data.error || "Failed to reset device", "danger");
        }
    } catch (err) {
        console.error("Error resetting device:", err);
        showToast("Network error while resetting device", "danger");
    }
}

// Custom Toast System
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    
    let color = "var(--accent-primary)";
    if (type === "success") color = "var(--accent-success)";
    else if (type === "danger") color = "var(--accent-danger)";
    else if (type === "warning") color = "var(--accent-warning)";
    
    toast.style.borderLeftColor = color;
    
    toast.innerHTML = `
        <div style="font-weight: 600; font-size: 14px;">${escapeHtml(message)}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Helper to escape HTML tags
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}
