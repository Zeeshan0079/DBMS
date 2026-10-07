/* ==========================================================================
   PROPERTYDESK - Application Core JavaScript
   Handles Navigation, Real-Time Dashboard Metrics, Properties & Units CRUD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDatabaseStatus();
    loadDashboardMetrics();
    initGlobalSearch();
});

// Cache for global dropdown data
let cachedOwners = [];
let cachedProperties = [];
let allPropertiesData = [];
let allUnitsData = [];

/* ==========================================================================
   1. NAVIGATION & LAYOUT SWITCHING
   ========================================================================== */

function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            if (!targetPage) return;

            // Active State Toggle
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // View Switching
            const views = document.querySelectorAll('.page-view');
            views.forEach(v => v.classList.remove('active'));
            
            const targetView = document.getElementById(`${targetPage}-view`);
            if (targetView) {
                targetView.classList.add('active');
            }

            // Header Title & Data Loading
            updateHeaderInfo(targetPage);
        });
    });
}

function updateHeaderInfo(page) {
    const titleElem = document.getElementById('current-page-title');
    const subtitleElem = document.getElementById('current-page-subtitle');

    const headers = {
        'dashboard': { title: 'Dashboard', subtitle: 'Property portfolio analytics & real-time activity' },
        'properties': { title: 'Properties', subtitle: 'Manage your property portfolio' },
        'units': { title: 'Units', subtitle: 'Manage units across your property portfolio' },
        'tenants': { title: 'Tenants Management', subtitle: 'Manage tenant occupants and contact records' },
        'leases': { title: 'Leases', subtitle: 'Manage rental agreements and lease lifecycle' },
        'finance': { title: 'Rent & Payments', subtitle: 'Rent schedules and payment transactions' },
        'maintenance': { title: 'Maintenance', subtitle: 'Service requests and property upkeep' },
        'reports': { title: 'Reports & Analytics', subtitle: 'Property performance analytics & database views' }
    };

    if (headers[page]) {
        titleElem.textContent = headers[page].title;
        subtitleElem.textContent = headers[page].subtitle;
    }

    // Trigger page-specific data loads
    if (page === 'dashboard') {
        loadDashboardMetrics();
    } else if (page === 'properties') {
        loadPropertiesPage();
    } else if (page === 'units') {
        loadUnitsPage();
    } else if (page === 'tenants') {
        loadTenantsPage();
    } else if (page === 'leases') {
        loadLeasesPage();
    } else if (page === 'finance') {
        loadFinancePage();
    } else if (page === 'maintenance') {
        loadMaintenancePage();
    } else if (page === 'reports') {
        loadReportsPage();
    }
}

/* ==========================================================================
   2. DATABASE CONNECTION INDICATOR
   ========================================================================== */

function initDatabaseStatus() {
    fetch('/api/db-status')
        .then(res => res.json())
        .then(data => {
            const statusText = document.getElementById('db-status-text');
            if (data.status === 'online') {
                statusText.textContent = `MySQL Connected (${data.database})`;
            } else {
                statusText.textContent = 'Database Offline';
                statusText.style.color = '#EF4444';
            }
        })
        .catch(() => {
            const statusText = document.getElementById('db-status-text');
            statusText.textContent = 'Connection Error';
            statusText.style.color = '#EF4444';
        });
}

/* ==========================================================================
   3. DASHBOARD METRICS & RECENT ACTIVITY
   ========================================================================== */

function loadDashboardMetrics() {
    fetch('/api/dashboard')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderDashboard(res.data);
            }
        })
        .catch(err => console.error('Failed to load dashboard metrics:', err));
}

function renderDashboard(data) {
    // 1. Metric Cards
    document.getElementById('metric-total-properties').textContent = data.total_properties || 0;
    document.getElementById('metric-total-units').textContent = data.total_units || 0;
    document.getElementById('metric-available-units').textContent = data.available_units || 0;
    document.getElementById('metric-occupied-units').textContent = data.occupied_units || 0;
    document.getElementById('metric-total-tenants').textContent = data.total_tenants || 0;
    document.getElementById('metric-active-leases').textContent = data.active_leases || 0;

    // 2. Occupancy Bar
    const total = data.total_units || 1;
    const occPct = Math.round(((data.occupied_units || 0) / total) * 100);
    const availPct = Math.round(((data.available_units || 0) / total) * 100);
    const maintPct = Math.round(((data.maintenance_units || 0) / total) * 100);

    document.getElementById('bar-occupied').style.width = `${occPct}%`;
    document.getElementById('bar-available').style.width = `${availPct}%`;
    document.getElementById('bar-maintenance').style.width = `${maintPct}%`;

    document.getElementById('count-occupied').textContent = `${data.occupied_units || 0} (${occPct}%)`;
    document.getElementById('count-available').textContent = `${data.available_units || 0} (${availPct}%)`;
    document.getElementById('count-maintenance').textContent = `${data.maintenance_units || 0} (${maintPct}%)`;

    // 3. Recent Lease Activity Table
    const leasesTbody = document.getElementById('recent-leases-tbody');
    if (data.recent_leases && data.recent_leases.length > 0) {
        leasesTbody.innerHTML = data.recent_leases.map(l => `
            <tr>
                <td><strong>${escapeHtml(l.tenant_name)}</strong></td>
                <td><span class="badge badge-available">${escapeHtml(l.unit_no)}</span></td>
                <td>₹${formatCurrency(l.monthly_rent)}</td>
                <td>${l.start_date}</td>
                <td>${l.end_date}</td>
                <td><span class="badge badge-active">${escapeHtml(l.status)}</span></td>
            </tr>
        `).join('');
    } else {
        leasesTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No recent lease records found.</td></tr>';
    }

    // 4. Upcoming Lease Expirations Table
    const expirationsTbody = document.getElementById('upcoming-leases-tbody');
    if (data.upcoming_expirations && data.upcoming_expirations.length > 0) {
        expirationsTbody.innerHTML = data.upcoming_expirations.map(l => `
            <tr>
                <td><strong>${escapeHtml(l.tenant_name)}</strong></td>
                <td><span class="badge badge-available">${escapeHtml(l.unit_no)}</span></td>
                <td>${l.end_date}</td>
                <td>₹${formatCurrency(l.monthly_rent)}</td>
                <td><span class="badge badge-maintenance">Expiring</span></td>
            </tr>
        `).join('');
    } else {
        expirationsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No upcoming expirations.</td></tr>';
    }

    // 5. Recent Payments Stream
    const activityList = document.getElementById('activity-list');
    if (data.recent_payments && data.recent_payments.length > 0) {
        activityList.innerHTML = data.recent_payments.map(p => `
            <li class="activity-item">
                <div class="activity-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="activity-details">
                    <div>Payment of <strong>₹${formatCurrency(p.amount_paid)}</strong> received</div>
                    <div class="activity-time">Tenant: ${escapeHtml(p.tenant_name)} (Unit ${escapeHtml(p.unit_no)}) • ${p.payment_date}</div>
                </div>
            </li>
        `).join('');
    } else {
        activityList.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:10px 0;">No payment activity yet.</li>';
    }
}

/* ==========================================================================
   4. PROPERTIES MODULE (CRUD)
   ========================================================================== */

function loadPropertiesPage() {
    // 1. Fetch Filters
    fetch('/api/properties/filters')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                populatePropertyFilters(res.data);
            }
        });

    // 2. Fetch Owners (for Modal dropdown)
    fetch('/api/owners')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                cachedOwners = res.data;
            }
        });

    // 3. Fetch Properties
    fetchPropertiesList();
}

function fetchPropertiesList() {
    const search = document.getElementById('prop-search')?.value || '';
    const city = document.getElementById('prop-city-filter')?.value || 'All';
    const type = document.getElementById('prop-type-filter')?.value || 'All';

    const url = `/api/properties?search=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}&type=${encodeURIComponent(type)}`;

    fetch(url)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                allPropertiesData = res.data;
                renderPropertiesTable(allPropertiesData);
            }
        })
        .catch(err => console.error('Error fetching properties:', err));
}

function populatePropertyFilters(filters) {
    const citySelect = document.getElementById('prop-city-filter');
    const typeSelect = document.getElementById('prop-type-filter');

    if (citySelect && filters.cities) {
        const currentCity = citySelect.value;
        citySelect.innerHTML = '<option value="All">All Cities</option>' + 
            filters.cities.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        citySelect.value = currentCity || 'All';
    }

    if (typeSelect && filters.property_types) {
        const currentType = typeSelect.value;
        typeSelect.innerHTML = '<option value="All">All Property Types</option>' + 
            filters.property_types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
        typeSelect.value = currentType || 'All';
    }
}

function filterProperties() {
    fetchPropertiesList();
}

function renderPropertiesTable(properties) {
    const tbody = document.getElementById('properties-tbody');
    if (!properties || properties.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No properties found.</td></tr>';
        return;
    }

    tbody.innerHTML = properties.map(p => `
        <tr>
            <td><strong>#${p.property_id}</strong></td>
            <td><strong>${escapeHtml(p.owner_name)}</strong></td>
            <td>${escapeHtml(p.address)}</td>
            <td>${escapeHtml(p.city)}</td>
            <td><span class="badge badge-available">${escapeHtml(p.property_type)}</span></td>
            <td><span class="badge badge-active">${p.unit_count} Units</span></td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-action-view" onclick="openViewPropertyModal(${p.property_id})">View</button>
                <button class="btn btn-sm btn-action-delete" onclick="confirmDeleteProperty(${p.property_id}, '${escapeJs(p.address)}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

/* Add Property Modal */
function openAddPropertyModal() {
    if (cachedOwners.length === 0) {
        fetch('/api/owners')
            .then(res => res.json())
            .then(res => {
                cachedOwners = res.data || [];
                renderAddPropertyForm();
            });
    } else {
        renderAddPropertyForm();
    }
}

function renderAddPropertyForm() {
    const ownerOptions = cachedOwners.map(o => `<option value="${o.owner_id}">${escapeHtml(o.name)} (${escapeHtml(o.phone || 'No Phone')})</option>`).join('');

    const bodyHtml = `
        <form id="add-property-form">
            <div class="form-group">
                <label>Property Owner *</label>
                <select id="prop-owner-id" class="form-select" required>
                    <option value="">Select Owner...</option>
                    ${ownerOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Property Address *</label>
                <input type="text" id="prop-address" class="form-control" placeholder="e.g. 102 MG Road, Bandra West" required>
            </div>
            <div class="form-group">
                <label>City *</label>
                <input type="text" id="prop-city" class="form-control" placeholder="e.g. Mumbai" required>
            </div>
            <div class="form-group">
                <label>Property Type *</label>
                <select id="prop-type" class="form-select" required>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Residential Building">Residential Building</option>
                    <option value="Commercial Building">Commercial Building</option>
                    <option value="Villa">Villa</option>
                </select>
            </div>
        </form>
    `;

    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddPropertyForm()">Save Property</button>
    `;

    openModal('Add New Property', bodyHtml, footerHtml);
}

function submitAddPropertyForm() {
    const owner_id = document.getElementById('prop-owner-id').value;
    const address = document.getElementById('prop-address').value.trim();
    const city = document.getElementById('prop-city').value.trim();
    const property_type = document.getElementById('prop-type').value.trim();

    if (!owner_id || !address || !city || !property_type) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id, address, city, property_type })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            showToast(res.message || 'Property added successfully!', 'success');
            closeModal();
            loadPropertiesPage();
            loadDashboardMetrics();
        } else {
            showToast(res.message || 'Failed to add property.', 'error');
        }
    })
    .catch(err => {
        showToast('Server error while adding property.', 'error');
    });
}

/* View Property Details Modal */
function openViewPropertyModal(propertyId) {
    fetch(`/api/properties/${propertyId}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                const p = res.data;
                const unitsList = p.units && p.units.length > 0 ? 
                    p.units.map(u => `
                        <tr>
                            <td><strong>${escapeHtml(u.unit_no)}</strong></td>
                            <td>Floor ${u.floor} (${u.bedrooms} BHK)</td>
                            <td>₹${formatCurrency(u.rent_amount)}</td>
                            <td><span class="badge badge-${u.status.toLowerCase()}">${escapeHtml(u.status)}</span></td>
                        </tr>
                    `).join('') :
                    '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No units currently associated with this property.</td></tr>';

                const bodyHtml = `
                    <div class="detail-grid" style="margin-bottom: 20px;">
                        <div class="detail-item">
                            <label>Property ID</label>
                            <p>#${p.property_id}</p>
                        </div>
                        <div class="detail-item">
                            <label>Owner Name</label>
                            <p>${escapeHtml(p.owner_name)}</p>
                        </div>
                        <div class="detail-item">
                            <label>City</label>
                            <p>${escapeHtml(p.city)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Property Type</label>
                            <p>${escapeHtml(p.property_type)}</p>
                        </div>
                        <div class="detail-item" style="grid-column: span 2;">
                            <label>Address</label>
                            <p>${escapeHtml(p.address)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Owner Phone</label>
                            <p>${escapeHtml(p.owner_phone || 'N/A')}</p>
                        </div>
                        <div class="detail-item">
                            <label>Owner Email</label>
                            <p>${escapeHtml(p.owner_email || 'N/A')}</p>
                        </div>
                    </div>

                    <h4 style="font-size: 14px; font-weight:700; margin-bottom: 10px;">Associated Units (${p.units.length})</h4>
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Unit No</th>
                                    <th>Specs</th>
                                    <th>Monthly Rent</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${unitsList}
                            </tbody>
                        </table>
                    </div>
                `;

                const footerHtml = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
                openModal(`Property Details #${p.property_id}`, bodyHtml, footerHtml);
            }
        });
}

/* Delete Property */
function confirmDeleteProperty(propertyId, address) {
    const bodyHtml = `
        <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">Are you sure you want to delete the property at <strong>${escapeHtml(address)}</strong>?</p>
        <p style="font-size:12px; color:var(--text-muted);">Note: This operation will check database integrity constraints. Properties with associated units cannot be deleted directly.</p>
    `;

    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="executeDeleteProperty(${propertyId})">Delete Property</button>
    `;

    openModal('Confirm Property Deletion', bodyHtml, footerHtml);
}

function executeDeleteProperty(propertyId) {
    fetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                showToast(res.message, 'success');
                closeModal();
                loadPropertiesPage();
                loadDashboardMetrics();
            } else {
                showToast(res.message, 'error');
            }
        })
        .catch(err => {
            showToast('Server error while deleting property.', 'error');
        });
}

/* ==========================================================================
   5. UNITS MODULE (CRUD)
   ========================================================================== */

function loadUnitsPage() {
    // 1. Fetch Properties (for filter dropdown)
    fetch('/api/properties')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                cachedProperties = res.data;
                populateUnitPropertyFilter(cachedProperties);
            }
        });

    // 2. Fetch Units
    fetchUnitsList();
}

function fetchUnitsList() {
    const search = document.getElementById('unit-search')?.value || '';
    const propId = document.getElementById('unit-property-filter')?.value || 'All';
    const status = document.getElementById('unit-status-filter')?.value || 'All';

    const url = `/api/units?search=${encodeURIComponent(search)}&property_id=${encodeURIComponent(propId)}&status=${encodeURIComponent(status)}`;

    fetch(url)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                allUnitsData = res.data;
                renderUnitsTable(allUnitsData);
            }
        })
        .catch(err => console.error('Error fetching units:', err));
}

function populateUnitPropertyFilter(properties) {
    const filterSelect = document.getElementById('unit-property-filter');
    if (filterSelect && properties) {
        const currVal = filterSelect.value;
        filterSelect.innerHTML = '<option value="All">All Properties</option>' + 
            properties.map(p => `<option value="${p.property_id}">${escapeHtml(p.address)} (${escapeHtml(p.city)})</option>`).join('');
        filterSelect.value = currVal || 'All';
    }
}

function filterUnits() {
    fetchUnitsList();
}

function renderUnitsTable(units) {
    const tbody = document.getElementById('units-tbody');
    if (!units || units.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">No units found matching criteria.</td></tr>';
        return;
    }

    tbody.innerHTML = units.map(u => {
        let badgeClass = 'badge-available';
        const st = (u.status || '').toLowerCase();
        if (st === 'occupied') badgeClass = 'badge-active';
        else if (st.includes('maint')) badgeClass = 'badge-maintenance';

        return `
            <tr>
                <td><strong>#${u.unit_id}</strong></td>
                <td>${escapeHtml(u.property_address)} <span style="font-size:11px; color:var(--text-muted);">(${escapeHtml(u.city)})</span></td>
                <td><span class="badge badge-available">${escapeHtml(u.unit_no)}</span></td>
                <td>Floor ${u.floor || 1}</td>
                <td>${u.bedrooms || 1} BHK</td>
                <td><strong>₹${formatCurrency(u.rent_amount)}</strong></td>
                <td><span class="badge ${badgeClass}">${escapeHtml(u.status)}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-action-view" onclick="openViewUnitModal(${u.unit_id})">View</button>
                    <button class="btn btn-sm btn-action-delete" onclick="confirmDeleteUnit(${u.unit_id}, '${escapeJs(u.unit_no)}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

/* Add Unit Modal */
function openAddUnitModal() {
    if (cachedProperties.length === 0) {
        fetch('/api/properties')
            .then(res => res.json())
            .then(res => {
                cachedProperties = res.data || [];
                renderAddUnitForm();
            });
    } else {
        renderAddUnitForm();
    }
}

function renderAddUnitForm() {
    const propertyOptions = cachedProperties.map(p => `<option value="${p.property_id}">${escapeHtml(p.address)} (${escapeHtml(p.city)})</option>`).join('');

    const bodyHtml = `
        <form id="add-unit-form">
            <div class="form-group">
                <label>Property *</label>
                <select id="unit-property-id" class="form-select" required>
                    <option value="">Select Property...</option>
                    ${propertyOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Unit Number *</label>
                <input type="text" id="unit-no" class="form-control" placeholder="e.g. A-101 or Unit 302" required>
            </div>
            <div class="detail-grid">
                <div class="form-group">
                    <label>Floor Number</label>
                    <input type="number" id="unit-floor" class="form-control" value="1" min="0" required>
                </div>
                <div class="form-group">
                    <label>Bedrooms (BHK)</label>
                    <input type="number" id="unit-bedrooms" class="form-control" value="2" min="1" required>
                </div>
            </div>
            <div class="form-group">
                <label>Monthly Rent Amount (₹) *</label>
                <input type="number" id="unit-rent" class="form-control" placeholder="e.g. 25000" step="500" required>
            </div>
            <div class="form-group">
                <label>Status *</label>
                <select id="unit-status" class="form-select" required>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
            </div>
        </form>
    `;

    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddUnitForm()">Save Unit</button>
    `;

    openModal('Add New Unit', bodyHtml, footerHtml);
}

function submitAddUnitForm() {
    const property_id = document.getElementById('unit-property-id').value;
    const unit_no = document.getElementById('unit-no').value.trim();
    const floor = document.getElementById('unit-floor').value;
    const bedrooms = document.getElementById('unit-bedrooms').value;
    const rent_amount = document.getElementById('unit-rent').value;
    const status = document.getElementById('unit-status').value;

    if (!property_id || !unit_no || !rent_amount) {
        showToast('Property, Unit Number, and Rent Amount are required.', 'error');
        return;
    }

    fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id, unit_no, floor, bedrooms, rent_amount, status })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            showToast(res.message || 'Unit added successfully!', 'success');
            closeModal();
            loadUnitsPage();
            loadDashboardMetrics();
        } else {
            showToast(res.message || 'Failed to add unit.', 'error');
        }
    })
    .catch(err => {
        showToast('Server error while adding unit.', 'error');
    });
}

/* View Unit Details Modal */
function openViewUnitModal(unitId) {
    fetch(`/api/units/${unitId}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                const u = res.data;
                const leaseInfo = u.active_lease ? `
                    <div style="background-color:var(--status-active-bg); border:1px solid var(--status-active-border); padding:12px; border-radius:var(--radius-sm); margin-top:14px;">
                        <h5 style="font-size:13px; font-weight:700; color:var(--status-active-text); margin-bottom:6px;">Current Lease Agreement</h5>
                        <p style="font-size:13px;"><strong>Tenant:</strong> ${escapeHtml(u.active_lease.tenant_name)} (${escapeHtml(u.active_lease.tenant_phone)})</p>
                        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Lease Term: ${u.active_lease.start_date} to ${u.active_lease.end_date}</p>
                    </div>
                ` : '<p style="font-size:12px; color:var(--text-muted); margin-top:10px;">No active tenant lease currently attached to this unit.</p>';

                const bodyHtml = `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Unit ID</label>
                            <p>#${u.unit_id}</p>
                        </div>
                        <div class="detail-item">
                            <label>Unit Number</label>
                            <p>${escapeHtml(u.unit_no)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Property</label>
                            <p>${escapeHtml(u.property_address)}</p>
                        </div>
                        <div class="detail-item">
                            <label>City</label>
                            <p>${escapeHtml(u.city)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Floor & Bedrooms</label>
                            <p>Floor ${u.floor}, ${u.bedrooms} BHK</p>
                        </div>
                        <div class="detail-item">
                            <label>Monthly Rent</label>
                            <p>₹${formatCurrency(u.rent_amount)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Owner</label>
                            <p>${escapeHtml(u.owner_name)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Status</label>
                            <p><span class="badge badge-${u.status.toLowerCase()}">${escapeHtml(u.status)}</span></p>
                        </div>
                    </div>
                    ${leaseInfo}
                `;

                const footerHtml = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
                openModal(`Unit Details #${u.unit_id}`, bodyHtml, footerHtml);
            }
        });
}

/* Delete Unit */
function confirmDeleteUnit(unitId, unitNo) {
    const bodyHtml = `
        <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">Are you sure you want to delete <strong>Unit ${escapeHtml(unitNo)}</strong>?</p>
        <p style="font-size:12px; color:var(--text-muted);">Note: Referential integrity will be checked. If active leases or maintenance requests reference this unit, deletion will be blocked.</p>
    `;

    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="executeDeleteUnit(${unitId})">Delete Unit</button>
    `;

    openModal('Confirm Unit Deletion', bodyHtml, footerHtml);
}

function executeDeleteUnit(unitId) {
    fetch(`/api/units/${unitId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                showToast(res.message, 'success');
                closeModal();
                loadUnitsPage();
                loadDashboardMetrics();
            } else {
                showToast(res.message, 'error');
            }
        })
        .catch(err => {
            showToast('Server error while deleting unit.', 'error');
        });
}

/* ==========================================================================
   6. TENANTS MODULE (CRUD)
   ========================================================================== */

function loadTenantsPage() {
    fetchTenantsList();
}

function fetchTenantsList() {
    const search = document.getElementById('tenant-search')?.value || '';
    fetch(`/api/tenants?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') renderTenantsTable(res.data);
        })
        .catch(err => console.error('Error fetching tenants:', err));
}

function renderTenantsTable(tenants) {
    const tbody = document.getElementById('tenants-tbody');
    if (!tenants || tenants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No tenant records found.</td></tr>';
        return;
    }
    tbody.innerHTML = tenants.map(t => `
        <tr>
            <td><strong>#${t.tenant_id}</strong></td>
            <td><strong>${escapeHtml(t.name)}</strong></td>
            <td>${escapeHtml(t.phone || '—')}</td>
            <td>${escapeHtml(t.email || '—')}</td>
            <td>${escapeHtml(t.id_proof_no || '—')}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-action-view" onclick="openViewTenantModal(${t.tenant_id})">View</button>
                <button class="btn btn-sm btn-action-delete" onclick="confirmDeleteTenant(${t.tenant_id}, '${escapeJs(t.name)}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openAddTenantModal() {
    const bodyHtml = `
        <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="t-name" class="form-control" placeholder="e.g. Ravi Kumar" required>
        </div>
        <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="t-phone" class="form-control" placeholder="e.g. 9876543210">
        </div>
        <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="t-email" class="form-control" placeholder="e.g. ravi@gmail.com">
        </div>
        <div class="form-group">
            <label>ID Proof Number</label>
            <input type="text" id="t-id-proof" class="form-control" placeholder="e.g. AADHAR1099">
        </div>
    `;
    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddTenantForm()">Save Tenant</button>
    `;
    openModal('Add New Tenant', bodyHtml, footerHtml);
}

function submitAddTenantForm() {
    const name = document.getElementById('t-name').value.trim();
    const phone = document.getElementById('t-phone').value.trim();
    const email = document.getElementById('t-email').value.trim();
    const id_proof_no = document.getElementById('t-id-proof').value.trim();
    if (!name) { showToast('Tenant name is required.', 'error'); return; }
    fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, id_proof_no })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            showToast(res.message, 'success');
            closeModal();
            fetchTenantsList();
            loadDashboardMetrics();
        } else {
            showToast(res.message, 'error');
        }
    })
    .catch(() => showToast('Server error while adding tenant.', 'error'));
}

function openViewTenantModal(tenantId) {
    fetch(`/api/tenants/${tenantId}`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;
            const t = res.data;
            const leaseRows = t.lease_history && t.lease_history.length > 0 ?
                t.lease_history.map(l => `
                    <tr>
                        <td>${escapeHtml(l.unit_no)}</td>
                        <td>${escapeHtml(l.property_address)}, ${escapeHtml(l.city)}</td>
                        <td>${l.start_date} → ${l.end_date}</td>
                        <td>₹${formatCurrency(l.monthly_rent)}</td>
                        <td><span class="badge badge-${(l.status||'').toLowerCase()}">${escapeHtml(l.status)}</span></td>
                    </tr>`).join('') :
                '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No lease history found.</td></tr>';

            const bodyHtml = `
                <div class="detail-grid" style="margin-bottom:20px;">
                    <div class="detail-item"><label>Tenant ID</label><p>#${t.tenant_id}</p></div>
                    <div class="detail-item"><label>Full Name</label><p>${escapeHtml(t.name)}</p></div>
                    <div class="detail-item"><label>Phone</label><p>${escapeHtml(t.phone || 'N/A')}</p></div>
                    <div class="detail-item"><label>Email</label><p>${escapeHtml(t.email || 'N/A')}</p></div>
                    <div class="detail-item" style="grid-column:span 2;"><label>ID Proof Number</label><p>${escapeHtml(t.id_proof_no || 'N/A')}</p></div>
                </div>
                <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Lease History (${t.lease_history.length})</h4>
                <div class="table-responsive">
                    <table class="custom-table">
                        <thead><tr><th>Unit</th><th>Property</th><th>Lease Period</th><th>Monthly Rent</th><th>Status</th></tr></thead>
                        <tbody>${leaseRows}</tbody>
                    </table>
                </div>
            `;
            openModal(`Tenant Details #${t.tenant_id}`, bodyHtml, `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`);
        });
}

function confirmDeleteTenant(tenantId, name) {
    const bodyHtml = `
        <p style="font-size:14px; color:var(--text-main); margin-bottom:12px;">Are you sure you want to delete tenant <strong>${escapeHtml(name)}</strong>?</p>
        <p style="font-size:12px; color:var(--text-muted);">Note: Tenants with active leases or maintenance records cannot be deleted.</p>
    `;
    const footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="executeDeleteTenant(${tenantId})">Delete Tenant</button>
    `;
    openModal('Confirm Tenant Deletion', bodyHtml, footerHtml);
}

function executeDeleteTenant(tenantId) {
    fetch(`/api/tenants/${tenantId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                showToast(res.message, 'success');
                closeModal();
                fetchTenantsList();
                loadDashboardMetrics();
            } else {
                showToast(res.message, 'error');
            }
        })
        .catch(() => showToast('Server error while deleting tenant.', 'error'));
}

/* ==========================================================================
   6A. LEASES MODULE
   ========================================================================== */

function loadLeasesPage() {
    fetchLeasesList();
}

function fetchLeasesList() {
    const search = document.getElementById('lease-search')?.value.trim() || '';
    const tbody = document.getElementById('leases-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted);">Loading leases...</td></tr>';

    fetch(`/api/leases?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderLeasesTable(res.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--danger);">${escapeHtml(res.message)}</td></tr>`;
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--danger);">Failed to load leases.</td></tr>';
        });
}

function renderLeasesTable(leases) {
    const tbody = document.getElementById('leases-tbody');
    if (!tbody) return;

    if (!leases || leases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:30px;">No lease records found.</td></tr>';
        return;
    }

    tbody.innerHTML = leases.map(l => {
        const badgeClass = l.status === 'Active' ? 'badge-success' : 'badge-danger';
        return `
            <tr>
                <td>#${l.lease_id}</td>
                <td><strong>${escapeHtml(l.tenant_name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(l.tenant_phone)}</small></td>
                <td>${escapeHtml(l.unit_no)}</td>
                <td>${escapeHtml(l.property_address)}</td>
                <td>${l.start_date || '-'}</td>
                <td>${l.end_date || '-'}</td>
                <td>₹${formatCurrency(l.monthly_rent)}</td>
                <td>₹${formatCurrency(l.monthly_rent * 2)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(l.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewLeaseDetail(${l.lease_id})">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddLeaseModal() {
    // Fetch units and tenants for dropdown selection
    Promise.all([
        fetch('/api/units').then(r => r.json()),
        fetch('/api/tenants').then(r => r.json())
    ]).then(([unitsRes, tenantsRes]) => {
        const units = unitsRes.data || [];
        const tenants = tenantsRes.data || [];

        const unitOpts = units.map(u => `<option value="${u.unit_id}">${escapeHtml(u.unit_no)} (${escapeHtml(u.property_address)}) - ₹${formatCurrency(u.rent_amount)}/mo</option>`).join('');
        const tenantOpts = tenants.map(t => `<option value="${t.tenant_id}">${escapeHtml(t.name)} (${escapeHtml(t.phone)})</option>`).join('');

        const bodyHtml = `
            <form id="add-lease-form" onsubmit="event.preventDefault(); submitCreateLease();">
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <label class="form-label">Select Unit *</label>
                        <select id="lease-unit-id" class="form-select" required>${unitOpts}</select>
                    </div>
                    <div>
                        <label class="form-label">Select Tenant *</label>
                        <select id="lease-tenant-id" class="form-select" required>${tenantOpts}</select>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <div>
                            <label class="form-label">Start Date *</label>
                            <input type="date" id="lease-start-date" class="form-input" required>
                        </div>
                        <div>
                            <label class="form-label">End Date *</label>
                            <input type="date" id="lease-end-date" class="form-input" required>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Monthly Rent (₹) *</label>
                        <input type="number" id="lease-monthly-rent" class="form-input" placeholder="e.g. 25000" step="0.01" required>
                    </div>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitCreateLease()">Create Lease</button>
        `;

        openModal('Create New Lease Agreement', bodyHtml, footerHtml);
    }).catch(() => showToast('Failed to load form options.', 'error'));
}

function submitCreateLease() {
    const unit_id = document.getElementById('lease-unit-id')?.value;
    const tenant_id = document.getElementById('lease-tenant-id')?.value;
    const start_date = document.getElementById('lease-start-date')?.value;
    const end_date = document.getElementById('lease-end-date')?.value;
    const monthly_rent = document.getElementById('lease-monthly-rent')?.value;

    if (!unit_id || !tenant_id || !start_date || !end_date || !monthly_rent) {
        showToast('All fields are required.', 'error');
        return;
    }

    fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id, tenant_id, start_date, end_date, monthly_rent })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            closeModal();
            showToast(res.message, 'success');
            fetchLeasesList();
        } else {
            showToast(res.message, 'error');
        }
    })
    .catch(() => showToast('Server error while creating lease.', 'error'));
}

function viewLeaseDetail(leaseId) {
    fetch(`/api/leases/${leaseId}`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success' || !res.data) {
                showToast('Lease details unavailable.', 'error');
                return;
            }
            const l = res.data;
            const bodyHtml = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <div><strong style="color:var(--text-muted); font-size:12px;">LEASE ID</strong><div>#${l.lease_id}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">STATUS</strong><div><span class="badge ${l.status === 'Active' ? 'badge-success' : 'badge-danger'}">${escapeHtml(l.status)}</span></div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">TENANT</strong><div>${escapeHtml(l.tenant_name)} (${escapeHtml(l.tenant_phone)})</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">UNIT</strong><div>Unit ${escapeHtml(l.unit_no)} - ${escapeHtml(l.property_address)}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">START DATE</strong><div>${l.start_date || '-'}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">END DATE</strong><div>${l.end_date || '-'}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">MONTHLY RENT</strong><div>₹${formatCurrency(l.monthly_rent)}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">EST. DEPOSIT</strong><div>₹${formatCurrency(l.monthly_rent * 2)}</div></div>
                    </div>
                </div>
            `;
            const footerHtml = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
            openModal(`Lease Details #${l.lease_id}`, bodyHtml, footerHtml);
        });
}

/* ==========================================================================
   6B. RENT & PAYMENTS MODULE
   ========================================================================== */

function loadFinancePage() {
    fetchPaymentsList();
}

function fetchPaymentsList() {
    const search = document.getElementById('payment-search')?.value.trim() || '';
    const status = document.getElementById('payment-status-filter')?.value || 'All';
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">Loading payment records...</td></tr>';

    fetch(`/api/payments?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderPaymentsTable(res.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--danger);">${escapeHtml(res.message)}</td></tr>`;
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--danger);">Failed to load payment records.</td></tr>';
        });
}

function renderPaymentsTable(rows) {
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:30px;">No rent schedule or payment records found.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(r => {
        let badgeClass = 'badge-secondary';
        if (r.status === 'Paid') badgeClass = 'badge-success';
        else if (r.status === 'Pending') badgeClass = 'badge-warning';
        else if (r.status === 'Overdue') badgeClass = 'badge-danger';

        return `
            <tr>
                <td>#${r.schedule_id}</td>
                <td><strong>${escapeHtml(r.tenant_name)}</strong></td>
                <td>${escapeHtml(r.unit_no)}</td>
                <td>${r.due_date || '-'}</td>
                <td>₹${formatCurrency(r.amount_due)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
                <td>${r.amount_paid ? '₹' + formatCurrency(r.amount_paid) : '-'}</td>
                <td>${r.payment_date || '-'}</td>
                <td>${escapeHtml(r.mode || '-')}</td>
            </tr>
        `;
    }).join('');
}

/* ==========================================================================
   6C. MAINTENANCE MODULE
   ========================================================================== */

function loadMaintenancePage() {
    fetchMaintenanceList();
}

function fetchMaintenanceList() {
    const search = document.getElementById('maintenance-search')?.value.trim() || '';
    const status = document.getElementById('maintenance-status-filter')?.value || 'All';
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">Loading maintenance records...</td></tr>';

    fetch(`/api/maintenance?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderMaintenanceTable(res.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--danger);">${escapeHtml(res.message)}</td></tr>`;
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--danger);">Failed to load maintenance records.</td></tr>';
        });
}

function renderMaintenanceTable(rows) {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:30px;">No maintenance requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(m => {
        let badgeClass = 'badge-warning';
        if (m.status === 'Completed') badgeClass = 'badge-success';
        else if (m.status === 'Open') badgeClass = 'badge-danger';

        return `
            <tr>
                <td>#${m.request_id}</td>
                <td><strong>${escapeHtml(m.tenant_name)}</strong></td>
                <td>${escapeHtml(m.unit_no)}</td>
                <td>${escapeHtml(m.property_address)}</td>
                <td>${m.request_date || '-'}</td>
                <td>${escapeHtml(m.description)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(m.status)}</span></td>
                <td>₹${formatCurrency(m.cost)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewMaintenanceDetail(${m.request_id})">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewMaintenanceDetail(reqId) {
    fetch(`/api/maintenance/${reqId}`)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success' || !res.data) {
                showToast('Maintenance request details unavailable.', 'error');
                return;
            }
            const m = res.data;
            const bodyHtml = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <div><strong style="color:var(--text-muted); font-size:12px;">REQUEST ID</strong><div>#${m.request_id}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">STATUS</strong><div><span class="badge ${m.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${escapeHtml(m.status)}</span></div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">TENANT</strong><div>${escapeHtml(m.tenant_name)} (${escapeHtml(m.tenant_phone)})</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">UNIT / PROPERTY</strong><div>Unit ${escapeHtml(m.unit_no)} - ${escapeHtml(m.property_address)}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">REQUEST DATE</strong><div>${m.request_date || '-'}</div></div>
                        <div><strong style="color:var(--text-muted); font-size:12px;">ESTIMATED COST</strong><div>₹${formatCurrency(m.cost)}</div></div>
                    </div>
                    <div>
                        <strong style="color:var(--text-muted); font-size:12px;">ISSUE DESCRIPTION</strong>
                        <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:12px; border-radius:6px; margin-top:4px;">${escapeHtml(m.description)}</div>
                    </div>
                </div>
            `;
            const footerHtml = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
            openModal(`Maintenance Request #${m.request_id}`, bodyHtml, footerHtml);
        });
}

/* ==========================================================================
   6D. REPORTS MODULE
   ========================================================================== */

function loadReportsPage() {
    // Optionally auto-load vacant_units and due_rent
    loadReport('vacant_units', 'report-vacant-tbody');
    loadReport('due_rent', 'report-duerent-tbody');
}

function loadReport(viewName, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted);">Fetching view results...</td></tr>';

    fetch(`/api/reports/${viewName}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderReportTable(viewName, res.data, tbody);
            } else {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--danger);">${escapeHtml(res.message)}</td></tr>`;
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--danger);">Failed to load report.</td></tr>';
        });
}

function renderReportTable(viewName, data, tbody) {
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:20px;">No records returned by database view.</td></tr>';
        return;
    }

    if (viewName === 'vacant_units') {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.unit_id}</td>
                <td>${escapeHtml(r.address)}</td>
                <td>${escapeHtml(r.city)}</td>
                <td>${escapeHtml(r.unit_no)}</td>
                <td>${r.floor}</td>
                <td>${r.bedrooms} BHK</td>
                <td>₹${formatCurrency(r.rent_amount)}</td>
            </tr>
        `).join('');
    } else if (viewName === 'due_rent') {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.schedule_id}</td>
                <td><strong>${escapeHtml(r.tenant_name)}</strong></td>
                <td>${r.due_date || '-'}</td>
                <td>₹${formatCurrency(r.amount_due)}</td>
                <td><span class="badge badge-warning">${escapeHtml(r.status)}</span></td>
            </tr>
        `).join('');
    } else if (viewName === 'lease_expiry_report') {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.lease_id}</td>
                <td><strong>${escapeHtml(r.tenant_name)}</strong></td>
                <td>${escapeHtml(r.unit_no)}</td>
                <td>${r.start_date || '-'}</td>
                <td>${r.end_date || '-'}</td>
                <td>₹${formatCurrency(r.monthly_rent)}</td>
            </tr>
        `).join('');
    } else if (viewName === 'owner_income') {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.owner_id}</td>
                <td><strong>${escapeHtml(r.owner_name)}</strong></td>
                <td>₹${formatCurrency(r.total_income)}</td>
            </tr>
        `).join('');
    } else if (viewName === 'tenant_history') {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.tenant_id}</td>
                <td><strong>${escapeHtml(r.tenant_name)}</strong></td>
                <td>${escapeHtml(r.address)}</td>
                <td>${escapeHtml(r.unit_no)}</td>
                <td>${r.start_date || '-'}</td>
                <td>${r.end_date || '-'}</td>
                <td>₹${formatCurrency(r.monthly_rent)}</td>
                <td><span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-secondary'}">${escapeHtml(r.status)}</span></td>
            </tr>
        `).join('');
    }
}


/* ==========================================================================
   7. UTILITY FUNCTIONS & MODAL / TOAST CONTROLLERS
   ========================================================================== */

function openModal(title, bodyHtml, footerHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatCurrency(val) {
    if (val === null || val === undefined) return '0';
    return Number(val).toLocaleString('en-IN');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/* ==========================================================================
   8. GLOBAL HEADER SEARCH CONTROLLER
   ========================================================================== */

function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const clearBtn = document.getElementById('global-search-clear');
    const dropdown = document.getElementById('global-search-results');
    if (!searchInput || !dropdown) return;

    let debounceTimer = null;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else {
            if (clearBtn) clearBtn.classList.add('hidden');
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchGlobalSearchResults(query);
        }, 250);
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 0 && dropdown.children.length > 0) {
            dropdown.classList.remove('hidden');
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.add('hidden');
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            searchInput.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            dropdown.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.add('hidden');
        }
    });
}

function fetchGlobalSearchResults(query) {
    const dropdown = document.getElementById('global-search-results');
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                renderGlobalSearchResults(res.data, query);
            }
        })
        .catch(err => {
            console.error('Global search error:', err);
        });
}

function renderGlobalSearchResults(data, query) {
    const dropdown = document.getElementById('global-search-results');
    dropdown.innerHTML = '';

    const { properties = [], units = [], tenants = [], leases = [], maintenance = [] } = data;
    const totalCount = properties.length + units.length + tenants.length + leases.length + maintenance.length;

    if (totalCount === 0) {
        dropdown.innerHTML = `<div class="search-no-results">No results found matching "<strong>${escapeHtml(query)}</strong>"</div>`;
        dropdown.classList.remove('hidden');
        return;
    }

    let html = '';

    if (properties.length > 0) {
        html += `<div class="search-group-header">Properties (${properties.length})</div>`;
        properties.forEach(p => {
            html += `
                <div class="search-result-item" onclick="handleSearchResultClick('properties', '${escapeJs(p.address)}')">
                    <div class="search-result-main">
                        <div class="search-result-title">🏢 ${escapeHtml(p.address)}</div>
                        <div class="search-result-sub">${escapeHtml(p.city)} • Owner: ${escapeHtml(p.owner_name || 'N/A')}</div>
                    </div>
                    <span class="search-result-badge">${escapeHtml(p.property_type)}</span>
                </div>
            `;
        });
    }

    if (units.length > 0) {
        html += `<div class="search-group-header">Units (${units.length})</div>`;
        units.forEach(u => {
            const statusClass = (u.status || '').toLowerCase();
            html += `
                <div class="search-result-item" onclick="handleSearchResultClick('units', '${escapeJs(u.unit_no)}')">
                    <div class="search-result-main">
                        <div class="search-result-title">🚪 Unit ${escapeHtml(u.unit_no)}</div>
                        <div class="search-result-sub">${escapeHtml(u.property_address)} (${escapeHtml(u.city)})</div>
                    </div>
                    <span class="search-result-badge ${statusClass}">${escapeHtml(u.status)}</span>
                </div>
            `;
        });
    }

    if (tenants.length > 0) {
        html += `<div class="search-group-header">Tenants (${tenants.length})</div>`;
        tenants.forEach(t => {
            html += `
                <div class="search-result-item" onclick="handleSearchResultClick('tenants', '${escapeJs(t.name)}')">
                    <div class="search-result-main">
                        <div class="search-result-title">👤 ${escapeHtml(t.name)}</div>
                        <div class="search-result-sub">📧 ${escapeHtml(t.email)} • 📞 ${escapeHtml(t.phone)}</div>
                    </div>
                </div>
            `;
        });
    }

    if (leases.length > 0) {
        html += `<div class="search-group-header">Leases (${leases.length})</div>`;
        leases.forEach(l => {
            const statusClass = (l.status || '').toLowerCase();
            html += `
                <div class="search-result-item" onclick="handleSearchResultClick('leases', '${escapeJs(l.tenant_name)}')">
                    <div class="search-result-main">
                        <div class="search-result-title">📄 Lease: ${escapeHtml(l.tenant_name)}</div>
                        <div class="search-result-sub">Unit ${escapeHtml(l.unit_no)} • ${escapeHtml(l.property_address)}</div>
                    </div>
                    <span class="search-result-badge ${statusClass}">${escapeHtml(l.status)}</span>
                </div>
            `;
        });
    }

    if (maintenance.length > 0) {
        html += `<div class="search-group-header">Maintenance (${maintenance.length})</div>`;
        maintenance.forEach(m => {
            const statusClass = (m.status || '').toLowerCase();
            html += `
                <div class="search-result-item" onclick="handleSearchResultClick('maintenance', '${escapeJs(m.tenant_name)}')">
                    <div class="search-result-main">
                        <div class="search-result-title">🛠️ ${escapeHtml(m.description)}</div>
                        <div class="search-result-sub">Tenant: ${escapeHtml(m.tenant_name)} • Unit ${escapeHtml(m.unit_no)}</div>
                    </div>
                    <span class="search-result-badge ${statusClass}">${escapeHtml(m.status)}</span>
                </div>
            `;
        });
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
}

function handleSearchResultClick(pageName, searchKeyword) {
    const dropdown = document.getElementById('global-search-results');
    if (dropdown) dropdown.classList.add('hidden');

    const navLink = document.querySelector(`.sidebar-nav .nav-link[data-page="${pageName}"]`);
    if (navLink) {
        navLink.click();
    }

    setTimeout(() => {
        if (pageName === 'properties') {
            const input = document.getElementById('properties-search-input');
            if (input) { input.value = searchKeyword; input.dispatchEvent(new Event('input')); }
        } else if (pageName === 'units') {
            const input = document.getElementById('units-search-input');
            if (input) { input.value = searchKeyword; input.dispatchEvent(new Event('input')); }
        } else if (pageName === 'tenants') {
            const input = document.getElementById('tenants-search-input');
            if (input) { input.value = searchKeyword; input.dispatchEvent(new Event('input')); }
        } else if (pageName === 'leases') {
            const input = document.getElementById('leases-search-input');
            if (input) { input.value = searchKeyword; input.dispatchEvent(new Event('input')); }
        } else if (pageName === 'maintenance') {
            const input = document.getElementById('maintenance-search-input');
            if (input) { input.value = searchKeyword; input.dispatchEvent(new Event('input')); }
        }
    }, 150);
}

