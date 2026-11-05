// js/operations.js - Operations Hub (Crew Allocation & Deliverables Tracking)

let currentOpsTab = 'crew'; // 'crew' or 'deliv'
let currentCrewFilter = 'all'; // 'all', 'pending', 'ready'
let currentDelivFilter = 'all'; // 'all', 'editing', 'delivered'

function getOpsRunningMonth() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { ym, label };
}
const initialOpsRunning = getOpsRunningMonth();
let currentOpsDateFilter = { type: 'month', ym: initialOpsRunning.ym, start: null, end: null, label: initialOpsRunning.label };
let currentOpsSearch = '';

function initOperationsHub() {
  const tabCrew = document.getElementById('ops-tab-crew');
  const tabDeliv = document.getElementById('ops-tab-deliverables');

  if (tabCrew && tabDeliv) {
    tabCrew.addEventListener('click', () => switchOpsTab('crew'));
    tabDeliv.addEventListener('click', () => switchOpsTab('deliv'));
  }

  // Filter pills for Crew
  const crewFilterPills = document.querySelectorAll('.ops-crew-filter-pill');
  crewFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      crewFilterPills.forEach(p => {
        p.classList.remove('active');
        p.style.background = '#fff';
        p.style.color = p.dataset.filter === 'pending' ? '#dc2626' : (p.dataset.filter === 'ready' ? '#16a34a' : 'var(--text-secondary)');
        p.style.borderColor = p.dataset.filter === 'pending' ? 'rgba(220,38,38,0.35)' : (p.dataset.filter === 'ready' ? 'rgba(22,163,74,0.35)' : 'rgba(204,192,163,0.5)');
      });
      pill.classList.add('active');
      pill.style.background = 'var(--text-primary)';
      pill.style.color = '#fff';
      pill.style.borderColor = 'var(--text-primary)';

      currentCrewFilter = pill.dataset.filter;
      renderCrewAllocationView(currentCrewFilter);
    });
  });

  // Filter pills for Deliverables
  const delivFilterPills = document.querySelectorAll('.ops-deliv-filter-pill');
  delivFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      delivFilterPills.forEach(p => {
        p.classList.remove('active');
        p.style.background = '#fff';
        p.style.color = p.dataset.filter === 'editing' ? '#d97706' : (p.dataset.filter === 'delivered' ? '#16a34a' : 'var(--text-secondary)');
        p.style.borderColor = p.dataset.filter === 'editing' ? 'rgba(217,119,6,0.35)' : (p.dataset.filter === 'delivered' ? 'rgba(22,163,74,0.35)' : 'rgba(204,192,163,0.5)');
      });
      pill.classList.add('active');
      pill.style.background = 'var(--text-primary)';
      pill.style.color = '#fff';
      pill.style.borderColor = 'var(--text-primary)';

      currentDelivFilter = pill.dataset.filter;
      renderDeliverablesTrackerView(currentDelivFilter);
    });
  });

  // Ops Date Picker & Search
  initOpsDatePicker();

  // Listen to store updates
  window.addEventListener('storeUpdated', () => {
    populateOpsDatePopover();
    renderOperationsHub();
  });

  // Initial setup
  populateOpsDatePopover();
  renderOperationsHub();
}

function initOpsDatePicker() {
  const btn = document.getElementById('ops-date-picker-btn');
  const popover = document.getElementById('ops-date-popover');
  const customStart = document.getElementById('ops-custom-start');
  const customEnd = document.getElementById('ops-custom-end');
  const btnApply = document.getElementById('ops-btn-apply-custom-range');
  const searchInput = document.getElementById('ops-search-input');

  if (btn && popover) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      const crmPop = document.getElementById('crm-date-popover');
      if (crmPop) crmPop.style.display = 'none';
      popover.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && !btn.contains(e.target)) {
        popover.style.display = 'none';
      }
    });
  }

  if (btnApply && customStart && customEnd) {
    btnApply.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = customStart.value;
      const eVal = customEnd.value;
      if (!s || !eVal) {
        alert('Please select both start and end dates.');
        return;
      }
      if (s > eVal) {
        alert('Start date cannot be after end date.');
        return;
      }
      currentOpsDateFilter = {
        type: 'range',
        ym: null,
        start: s,
        end: eVal,
        label: `${formatOpsDate(s)} — ${formatOpsDate(eVal)}`
      };
      if (popover) popover.style.display = 'none';
      updateOpsDateDisplay();
      renderOperationsHub();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentOpsSearch = (e.target.value || '').toLowerCase().trim();
      renderOperationsHub();
    });
  }
}

function populateOpsDatePopover() {
  const container = document.getElementById('ops-month-pills-list');
  if (!container) return;

  const bookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');
  const monthMap = new Map();

  bookings.forEach(b => {
    if (!b.date) return;
    const days = getOpsDateRange(b.date, b.endDate || b.date);
    const assignedMap = b.assignedTeamByDay || {};
    let isPending = false;

    if (Object.keys(assignedMap).length > 0) {
      days.forEach(day => {
        const hasCrew = Object.keys(assignedMap).some(k => k.endsWith(`_${day}`) && assignedMap[k]);
        if (!hasCrew) isPending = true;
      });
    } else if (!b.assignedTeam || b.assignedTeam.length === 0) {
      isPending = true;
    }

    const ymSet = new Set(days.map(d => d.substring(0, 7)));
    ymSet.forEach(ym => {
      if (!monthMap.has(ym)) {
        const parts = ym.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthMap.set(ym, { ym, label, total: 0, pendingCrew: 0 });
      }
      const data = monthMap.get(ym);
      data.total++;
      if (isPending) data.pendingCrew++;
    });
  });

  // Always ensure running month exists in map
  const now = new Date();
  const runningYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!monthMap.has(runningYm)) {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthMap.set(runningYm, { ym: runningYm, label, total: 0, pendingCrew: 0 });
  }

  const sortedYms = Array.from(monthMap.keys()).sort();

  container.innerHTML = '';

  // 1. All Shoots button
  const allBtn = document.createElement('div');
  const isAllActive = currentOpsDateFilter.type === 'all';
  allBtn.style.padding = '8px 10px';
  allBtn.style.borderRadius = '8px';
  allBtn.style.cursor = 'pointer';
  allBtn.style.display = 'flex';
  allBtn.style.justifyContent = 'space-between';
  allBtn.style.alignItems = 'center';
  allBtn.style.fontSize = '0.78rem';
  allBtn.style.fontWeight = isAllActive ? '700' : '500';
  allBtn.style.background = isAllActive ? '#02303A' : '#f8fafc';
  allBtn.style.color = isAllActive ? '#fff' : '#02303A';
  allBtn.style.marginBottom = '4px';
  allBtn.innerHTML = `<span>All Shoots</span> <span style="font-size:0.7rem; opacity:0.85;">${bookings.length} Shoots</span>`;
  allBtn.addEventListener('click', () => {
    currentOpsDateFilter = { type: 'all', ym: 'all', start: null, end: null, label: `All Shoots (${bookings.length} Shoots)` };
    const pop = document.getElementById('ops-date-popover');
    if (pop) pop.style.display = 'none';
    updateOpsDateDisplay();
    populateOpsDatePopover();
    renderOperationsHub();
  });
  container.appendChild(allBtn);

  // 2. Month buttons
  sortedYms.forEach(ym => {
    const data = monthMap.get(ym);
    const isActive = currentOpsDateFilter.type === 'month' && currentOpsDateFilter.ym === ym;
    const isRunning = ym === runningYm;
    const btn = document.createElement('div');
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.display = 'flex';
    btn.style.justifyContent = 'space-between';
    btn.style.alignItems = 'center';
    btn.style.fontSize = '0.78rem';
    btn.style.fontWeight = isActive ? '700' : '500';
    btn.style.background = isActive ? '#02303A' : '#f8fafc';
    btn.style.color = isActive ? '#fff' : '#02303A';
    btn.style.border = '1px solid rgba(204,192,163,0.3)';
    btn.style.marginBottom = '3px';

    const badgeText = data.total > 0 ? (data.pendingCrew > 0 ? `⚠️ ${data.pendingCrew} Pending` : `✅ Assigned`) : `0 Shoots`;
    const runningTag = isRunning ? `<span style="font-size:0.62rem; background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(217,119,6,0.15)'}; color:${isActive ? '#fff' : '#d97706'}; padding:1px 5px; border-radius:4px; margin-left:4px;">Running Month</span>` : '';
    btn.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span>${data.label}</span>
        ${runningTag}
      </div>
      <span style="font-size:0.68rem; font-weight:700; opacity:0.9;">${data.total} • ${badgeText}</span>
    `;

    btn.addEventListener('click', () => {
      currentOpsDateFilter = {
        type: 'month',
        ym: ym,
        start: null,
        end: null,
        label: isRunning ? `${data.label} (Running Month)` : `${data.label} (${data.total} Shoots)`
      };
      const pop = document.getElementById('ops-date-popover');
      if (pop) pop.style.display = 'none';
      updateOpsDateDisplay();
      populateOpsDatePopover();
      renderOperationsHub();
    });

    container.appendChild(btn);
  });

  updateOpsDateDisplay();
}

function updateOpsDateDisplay() {
  const display = document.getElementById('ops-date-display');
  if (!display) return;
  display.textContent = currentOpsDateFilter.label || 'All Shoots';
}

function switchOpsTab(tab) {
  currentOpsTab = tab;
  const tabCrew = document.getElementById('ops-tab-crew');
  const tabDeliv = document.getElementById('ops-tab-deliverables');
  const panelCrew = document.getElementById('ops-panel-crew');
  const panelDeliv = document.getElementById('ops-panel-deliv');

  if (tab === 'crew') {
    tabCrew.classList.add('active');
    tabCrew.style.background = 'var(--text-primary)';
    tabCrew.style.color = '#fff';
    tabCrew.style.boxShadow = '0 2px 8px rgba(2, 48, 58, 0.25)';

    tabDeliv.classList.remove('active');
    tabDeliv.style.background = 'transparent';
    tabDeliv.style.color = 'var(--text-secondary)';
    tabDeliv.style.boxShadow = 'none';

    if (panelCrew) panelCrew.style.display = 'block';
    if (panelDeliv) panelDeliv.style.display = 'none';

    renderCrewAllocationView(currentCrewFilter);
  } else {
    tabDeliv.classList.add('active');
    tabDeliv.style.background = 'var(--text-primary)';
    tabDeliv.style.color = '#fff';
    tabDeliv.style.boxShadow = '0 2px 8px rgba(2, 48, 58, 0.25)';

    tabCrew.classList.remove('active');
    tabCrew.style.background = 'transparent';
    tabCrew.style.color = 'var(--text-secondary)';
    tabCrew.style.boxShadow = 'none';

    if (panelCrew) panelCrew.style.display = 'none';
    if (panelDeliv) panelDeliv.style.display = 'block';

    renderDeliverablesTrackerView(currentDelivFilter);
  }
}

function renderOperationsHub() {
  updateOperationalBadges();
  if (currentOpsTab === 'crew') {
    renderCrewAllocationView(currentCrewFilter);
  } else {
    renderDeliverablesTrackerView(currentDelivFilter);
  }
}

function getOpsDateRange(startStr, endStr) {
  if (!startStr) return [];
  if (!endStr || endStr === startStr) return [startStr];
  const dates = [];
  let curr = new Date(startStr);
  const end = new Date(endStr);
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startStr];
}

function formatOpsDate(dStr) {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length !== 3) return dStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthTitle() {
  if (currentOpsDateFilter.type === 'month') {
    const parts = currentOpsDateFilter.ym.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    return `Total in ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  if (currentOpsDateFilter.type === 'range') {
    return 'Total in Range';
  }
  return 'Total Shoots';
}

function updateOperationalBadges() {
  const allBookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');

  // Filter for currently selected month / range and search
  const visibleBookings = allBookings.filter(b => {
    const days = getOpsDateRange(b.date, b.endDate || b.date);

    if (currentOpsDateFilter.type === 'month') {
      if (!days.some(d => d.startsWith(currentOpsDateFilter.ym))) return false;
    } else if (currentOpsDateFilter.type === 'range') {
      const s = currentOpsDateFilter.start;
      const e = currentOpsDateFilter.end;
      if (!days.some(d => d >= s && d <= e)) return false;
    }

    if (currentOpsSearch) {
      const q = currentOpsSearch;
      const matchClient = (b.clientName || '').toLowerCase().includes(q);
      const matchVenue = (b.venue || '').toLowerCase().includes(q);
      const matchType = (b.type || '').toLowerCase().includes(q);
      if (!matchClient && !matchVenue && !matchType) return false;
    }
    return true;
  });

  let pendingCrewCount = 0;
  let readyCrewCount = 0;

  visibleBookings.forEach(b => {
    const days = getOpsDateRange(b.date, b.endDate || b.date);
    const assignedMap = b.assignedTeamByDay || {};
    let isPending = false;

    if (Object.keys(assignedMap).length > 0) {
      days.forEach(day => {
        const hasCrew = Object.keys(assignedMap).some(k => k.endsWith(`_${day}`) && assignedMap[k]);
        if (!hasCrew) isPending = true;
      });
    } else {
      if (!b.assignedTeam || b.assignedTeam.length === 0) {
        isPending = true;
      }
    }

    if (isPending) pendingCrewCount++;
    else readyCrewCount++;
  });

  // Global pending crew count for subtab badge
  let globalPendingCrewCount = 0;
  allBookings.forEach(b => {
    const days = getOpsDateRange(b.date, b.endDate || b.date);
    const assignedMap = b.assignedTeamByDay || {};
    let isPending = false;
    if (Object.keys(assignedMap).length > 0) {
      days.forEach(day => {
        const hasCrew = Object.keys(assignedMap).some(k => k.endsWith(`_${day}`) && assignedMap[k]);
        if (!hasCrew) isPending = true;
      });
    } else if (!b.assignedTeam || b.assignedTeam.length === 0) {
      isPending = true;
    }
    if (isPending) globalPendingCrewCount++;
  });

  const crewBadge = document.getElementById('ops-crew-badge');
  if (crewBadge) {
    if (globalPendingCrewCount > 0) {
      crewBadge.textContent = `${globalPendingCrewCount} Pending`;
      crewBadge.style.display = 'inline-block';
    } else {
      crewBadge.style.display = 'none';
    }
  }

  const crewTotalEl = document.getElementById('ops-crew-total-count');
  const crewTotalLbl = document.getElementById('ops-crew-total-lbl');
  const crewPendingEl = document.getElementById('ops-crew-pending-count');
  const crewReadyEl = document.getElementById('ops-crew-ready-count');

  if (crewTotalEl) crewTotalEl.textContent = visibleBookings.length;
  if (crewTotalLbl) crewTotalLbl.textContent = formatMonthTitle();
  if (crewPendingEl) crewPendingEl.textContent = pendingCrewCount;
  if (crewReadyEl) crewReadyEl.textContent = readyCrewCount;
}

// -------------------------------------------------------------
// 1. CREW ALLOCATION VIEW (Ultra Slim Cards • 1-Click Opens Modal)
// -------------------------------------------------------------
function renderCrewAllocationView(filter = 'all') {
  const container = document.getElementById('ops-crew-list-container');
  if (!container) return;

  const bookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');
  const team = store.getTeam() || [];

  // Sort upcoming chronologically
  bookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const processed = bookings.map(b => {
    const days = getOpsDateRange(b.date, b.endDate || b.date);
    const assignedMap = b.assignedTeamByDay || {};
    let isPending = false;

    days.forEach((day) => {
      let crewOnDay = [];
      if (Object.keys(assignedMap).length > 0) {
        const dayTeamIds = Object.keys(assignedMap)
          .filter(k => k.endsWith(`_${day}`) && assignedMap[k])
          .map(k => k.split('_')[0]);
        crewOnDay = dayTeamIds.map(id => team.find(t => t.id === id)).filter(Boolean);
      } else if (b.assignedTeam && b.assignedTeam.length > 0) {
        crewOnDay = b.assignedTeam.map(id => team.find(t => t.id === id)).filter(Boolean);
      }
      if (crewOnDay.length === 0) isPending = true;
    });

    return { booking: b, days, isPending };
  });

  // Filter by Date / Month, Search, and Status Filter
  const filtered = processed.filter(item => {
    const b = item.booking;

    // Date / Month filter
    if (currentOpsDateFilter.type === 'month') {
      const inMonth = item.days.some(d => d.startsWith(currentOpsDateFilter.ym));
      if (!inMonth) return false;
    } else if (currentOpsDateFilter.type === 'range') {
      const s = currentOpsDateFilter.start;
      const e = currentOpsDateFilter.end;
      const inRange = item.days.some(d => d >= s && d <= e);
      if (!inRange) return false;
    }

    // Search query
    if (currentOpsSearch) {
      const q = currentOpsSearch;
      const matchClient = (b.clientName || '').toLowerCase().includes(q);
      const matchVenue = (b.venue || '').toLowerCase().includes(q);
      const matchType = (b.type || '').toLowerCase().includes(q);
      if (!matchClient && !matchVenue && !matchType) return false;
    }

    // Status filter
    if (filter === 'pending') return item.isPending;
    if (filter === 'ready') return !item.isPending;
    return true;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    const isMonthFilter = currentOpsDateFilter.type === 'month';
    container.innerHTML = `
      <div class="empty-state" style="padding: 28px 20px; text-align: center; background: #fff; border-radius: 14px; border: 1px dashed rgba(204,192,163,0.6); margin-top: 8px;">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">📅</div>
        <h4 style="margin: 0 0 6px 0; color: #02303A; font-size: 1rem;">No Shoots in ${currentOpsDateFilter.label}</h4>
        <p style="margin: 0 0 14px 0; color: #64748b; font-size: 0.8rem;">${isMonthFilter ? 'Defaulting to the running month. Click below to view all shoots across all dates.' : 'No bookings found for the selected filter.'}</p>
        <button type="button" class="btn btn-sm ops-btn-show-all-shoots" style="background: #02303A; color: #FAF8F5; padding: 6px 16px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; border: none;">View All Shoots</button>
      </div>
    `;
    const btnShowAll = container.querySelector('.ops-btn-show-all-shoots');
    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        const total = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled').length;
        currentOpsDateFilter = { type: 'all', ym: 'all', start: null, end: null, label: `All Shoots (${total} Shoots)` };
        updateOpsDateDisplay();
        populateOpsDatePopover();
        renderOperationsHub();
      });
    }
    return;
  }

  filtered.forEach(item => {
    const b = item.booking;
    const card = document.createElement('div');
    card.className = `duty-card ${item.isPending ? 'pending' : 'complete'}`;
    card.style.background = '#fff';
    card.style.borderRadius = '12px';
    card.style.border = '1px solid rgba(204, 192, 163, 0.5)';
    card.style.borderLeft = item.isPending ? '4.5px solid #dc2626' : '4.5px solid #16a34a';
    card.style.padding = '12px 16px';
    card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
    card.style.cursor = 'pointer';
    card.style.userSelect = 'none';
    card.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

    // Subtle Hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 6px 14px rgba(2, 48, 58, 0.08)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
    });

    const isMultiDay = item.days.length > 1;
    const dateText = isMultiDay
      ? `${formatOpsDate(b.date)} — ${formatOpsDate(b.endDate)} (${item.days.length} Days)`
      : formatOpsDate(b.date);

    // Slim, ultra-clean card exterior (No inline drawer)
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:12px;">
        <div style="flex:1; min-width:0;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #02303A; margin: 0; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${b.clientName}
          </h3>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>📅 ${dateText}</span>
            <span>&bull;</span>
            <span>${b.venue ? b.venue.split(',')[0] : 'Surat'}</span>
            <span>&bull;</span>
            <strong style="color: #02303A;">${b.type || 'Wedding'}</strong>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <span style="font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; ${item.isPending ? 'background:#fef2f2; color:#dc2626; border:1px solid rgba(220,38,38,0.25);' : 'background:#f0fdf4; color:#16a34a; border:1px solid rgba(22,163,74,0.25);'}">
            ${item.isPending ? '⚠️ PENDING' : '✅ ASSIGNED'}
          </span>
          <span style="font-size: 0.74rem; font-weight: 700; color: #02303A; background: rgba(204,192,163,0.25); border: 1px solid rgba(204,192,163,0.6); padding: 5px 11px; border-radius: 6px; display:inline-flex; align-items:center; gap:4px;">
            ${item.isPending ? '⚡ Assign Crew ›' : '✏️ Edit Crew ›'}
          </span>
        </div>
      </div>
    `;

    // 1-Click directly opens the modal dialog inside
    card.addEventListener('click', () => {
      openQuickCrewDialog(b.id);
    });

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 2. DELIVERABLES TRACKER VIEW (Ultra Slim Cards • 1-Click Opens Modal)
// -------------------------------------------------------------
function renderDeliverablesTrackerView(filter = 'all') {
  const container = document.getElementById('ops-deliv-list-container');
  if (!container) return;

  const allBookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');

  let activeCount = 0;
  let deliveredCount = 0;

  const processed = allBookings.map(b => {
    const delivStatus = b.deliverablesStatus || {};
    let items = [];

    if (Array.isArray(b.deliverables) && b.deliverables.length > 0) {
      items = b.deliverables.map((item, idx) => {
        const label = typeof item === 'string' ? item : item.label;
        const key = `custom_${idx}`;
        return {
          key,
          label,
          status: delivStatus[key] || (delivStatus[label]) || 'Pending'
        };
      });
    } else {
      items = [
        { key: 'raw', label: '📸 Raw Photos', status: delivStatus['raw'] || 'Pending' },
        { key: 'edited', label: '🎨 Edited Photos', status: delivStatus['edited'] || 'Pending' },
        { key: 'reels', label: '📱 Cinematic Reels', status: delivStatus['reels'] || 'Pending' },
        { key: 'video', label: '🎥 Full Film (Pen Drive)', status: delivStatus['video'] || 'Pending' }
      ];
    }

    const allDelivered = items.every(it => it.status === 'Delivered' || it.status === 'Completed');
    return { booking: b, items, allDelivered };
  });

  // Filter by Date / Month, Search, and Status Filter
  const filtered = processed.filter(item => {
    const b = item.booking;
    const days = getOpsDateRange(b.date, b.endDate || b.date);

    // Date / Month filter
    if (currentOpsDateFilter.type === 'month') {
      const inMonth = days.some(d => d.startsWith(currentOpsDateFilter.ym));
      if (!inMonth) return false;
    } else if (currentOpsDateFilter.type === 'range') {
      const s = currentOpsDateFilter.start;
      const e = currentOpsDateFilter.end;
      const inRange = days.some(d => d >= s && d <= e);
      if (!inRange) return false;
    }

    // Search query
    if (currentOpsSearch) {
      const q = currentOpsSearch;
      const matchClient = (b.clientName || '').toLowerCase().includes(q);
      const matchVenue = (b.venue || '').toLowerCase().includes(q);
      const matchType = (b.type || '').toLowerCase().includes(q);
      if (!matchClient && !matchVenue && !matchType) return false;
    }

    if (item.allDelivered) deliveredCount++;
    else activeCount++;

    if (filter === 'editing') return !item.allDelivered;
    if (filter === 'delivered') return item.allDelivered;
    return true;
  });

  // Update Deliverables Badges
  const delivBadge = document.getElementById('ops-deliv-badge');
  if (delivBadge) {
    if (activeCount > 0) {
      delivBadge.textContent = `${activeCount} Active`;
      delivBadge.style.display = 'inline-block';
    } else {
      delivBadge.style.display = 'none';
    }
  }

  const delivTotalEl = document.getElementById('ops-deliv-total-count');
  const delivTotalLbl = document.getElementById('ops-deliv-total-lbl');
  const delivActiveEl = document.getElementById('ops-deliv-active-count');
  const delivDoneEl = document.getElementById('ops-deliv-done-count');

  if (delivTotalEl) delivTotalEl.textContent = filtered.length;
  if (delivTotalLbl) delivTotalLbl.textContent = formatMonthTitle();
  if (delivActiveEl) delivActiveEl.textContent = activeCount;
  if (delivDoneEl) delivDoneEl.textContent = deliveredCount;

  container.innerHTML = '';

  if (filtered.length === 0) {
    const isMonthFilter = currentOpsDateFilter.type === 'month';
    container.innerHTML = `
      <div class="empty-state" style="padding: 28px 20px; text-align: center; background: #fff; border-radius: 14px; border: 1px dashed rgba(204,192,163,0.6); margin-top: 8px;">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">📦</div>
        <h4 style="margin: 0 0 6px 0; color: #02303A; font-size: 1rem;">No Deliverables in ${currentOpsDateFilter.label}</h4>
        <p style="margin: 0 0 14px 0; color: #64748b; font-size: 0.8rem;">${isMonthFilter ? 'Defaulting to the running month. Click below to view all client deliverables.' : 'All client orders in this view are up to date.'}</p>
        <button type="button" class="btn btn-sm ops-deliv-btn-show-all" style="background: #02303A; color: #FAF8F5; padding: 6px 16px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; border: none;">View All Shoots</button>
      </div>
    `;
    const btnShowAll = container.querySelector('.ops-deliv-btn-show-all');
    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        const total = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled').length;
        currentOpsDateFilter = { type: 'all', ym: 'all', start: null, end: null, label: `All Shoots (${total} Shoots)` };
        updateOpsDateDisplay();
        populateOpsDatePopover();
        renderOperationsHub();
      });
    }
    return;
  }

  filtered.forEach(item => {
    const b = item.booking;
    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '12px';
    card.style.border = '1px solid rgba(204, 192, 163, 0.5)';
    card.style.borderLeft = item.allDelivered ? '4.5px solid #16a34a' : '4.5px solid #d97706';
    card.style.padding = '12px 16px';
    card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
    card.style.cursor = 'pointer';
    card.style.userSelect = 'none';
    card.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

    // Hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 6px 14px rgba(2, 48, 58, 0.08)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
    });

    const doneCount = item.items.filter(it => it.status === 'Delivered' || it.status === 'Completed').length;
    const pendingCount = item.items.length - doneCount;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:12px;">
        <div style="flex:1; min-width:0;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #02303A; margin: 0; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${b.clientName}
          </h3>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>📅 ${formatOpsDate(b.date)}</span>
            <span>&bull;</span>
            <span>${b.venue ? b.venue.split(',')[0] : 'Surat'}</span>
            <span>&bull;</span>
            <strong style="color: #02303A;">${b.type || 'Wedding'}</strong>
            <span>&bull;</span>
            <span style="font-size: 0.7rem; color: #64748b;">${item.items.length} Items (${doneCount} Done, ${pendingCount} Pending)</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <span style="font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; ${item.allDelivered ? 'background:#f0fdf4; color:#16a34a; border:1px solid rgba(22,163,74,0.25);' : 'background:#fffbeb; color:#d97706; border:1px solid rgba(217,119,6,0.25);'}">
            ${item.allDelivered ? '✅ ALL DELIVERED' : `⏳ ${pendingCount} PENDING`}
          </span>
          <span style="font-size: 0.74rem; font-weight: 700; color: #02303A; background: rgba(204,192,163,0.25); border: 1px solid rgba(204,192,163,0.6); padding: 5px 11px; border-radius: 6px; display:inline-flex; align-items:center; gap:4px;">
            Track Deliverables ›
          </span>
        </div>
      </div>
    `;

    // 1-Click directly opens the modal dialog inside
    card.addEventListener('click', () => {
      openQuickDeliverablesDialog(b.id);
    });

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 3. QUICK ASSIGN CREW DIALOG
// -------------------------------------------------------------
let activeQuickCrewBookingId = null;
let activeQuickCrewDay = null;

function openQuickCrewDialog(bookingId, targetDay = null) {
  activeQuickCrewBookingId = bookingId;
  const b = store.getBooking(bookingId);
  if (!b) return;

  const dialog = document.getElementById('quick-crew-dialog');
  if (!dialog) return;

  document.getElementById('qcd-client-name').textContent = b.clientName;
  document.getElementById('qcd-shoot-meta').textContent = `${b.type || 'Wedding'} • ${formatOpsDate(b.date)} • ${b.venue ? b.venue.split(',')[0] : 'Surat'}`;

  const eventDays = getOpsDateRange(b.date, b.endDate || b.date);
  activeQuickCrewDay = (targetDay && eventDays.includes(targetDay)) ? targetDay : eventDays[0];

  const tabsContainer = document.getElementById('qcd-day-tabs');
  tabsContainer.innerHTML = '';

  if (eventDays.length > 1) {
    tabsContainer.style.display = 'flex';
    eventDays.forEach((day, idx) => {
      const dayBadge = (b.days && b.days[idx] && b.days[idx].badge) ? b.days[idx].badge : `Day ${idx + 1}`;
      const dayTitle = (b.days && b.days[idx] && b.days[idx].title) ? b.days[idx].title : '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm';
      btn.style.fontSize = '0.74rem';
      btn.style.padding = '5px 10px';
      btn.style.borderRadius = '6px';
      btn.textContent = `${dayBadge}${dayTitle ? ': ' + dayTitle : ''}`;
      btn.dataset.day = day;

      btn.addEventListener('click', () => {
        renderQuickCrewListForDay(day);
      });
      tabsContainer.appendChild(btn);
    });
  } else {
    tabsContainer.style.display = 'none';
  }

  renderQuickCrewListForDay(activeQuickCrewDay);
  dialog.showModal();
}

function renderQuickCrewListForDay(dayDate) {
  activeQuickCrewDay = dayDate;
  const b = store.getBooking(activeQuickCrewBookingId);
  if (!b) return;

  const tabsContainer = document.getElementById('qcd-day-tabs');
  if (tabsContainer) {
    tabsContainer.querySelectorAll('button').forEach(btn => {
      const isSel = btn.dataset.day === dayDate;
      btn.style.background = isSel ? 'var(--text-primary)' : 'transparent';
      btn.style.color = isSel ? '#fff' : 'var(--text-primary)';
      btn.style.borderColor = isSel ? 'var(--text-primary)' : '#CCC0A3';
    });
  }

  const listContainer = document.getElementById('qcd-crew-list');
  listContainer.innerHTML = '';
  const team = store.getTeam() || [];

  if (team.length === 0) {
    listContainer.innerHTML = '<div style="font-size:0.8rem; color:#64748b; padding:10px 0;">No team members registered yet. Add them in Team tab.</div>';
    return;
  }

  const otherBookingsOnDay = (store.getBookings() || []).filter(ob =>
    ob.date <= dayDate &&
    (ob.endDate ? ob.endDate >= dayDate : ob.date === dayDate) &&
    ob.id !== b.id &&
    ob.status !== 'cancelled'
  );

  const eventDays = getOpsDateRange(b.date, b.endDate || b.date);

  team.forEach(t => {
    const dayKey = `${t.id}_${dayDate}`;
    const isAssigned = (b.assignedTeamByDay || {})[dayKey] !== undefined
      ? (b.assignedTeamByDay || {})[dayKey]
      : (b.assignedTeam || []).includes(t.id) && eventDays.length === 1;

    const currentShift = (b.teamShiftsByDay || {})[dayKey] || 'Full Day';
    const currentFee = (b.crewFeesByDay || {})[dayKey] || '';
    const currentPaid = (b.crewPaidByDay || {})[dayKey] || 'Unpaid';

    const conflictingBooking = otherBookingsOnDay.find(ob => (ob.assignedTeam || []).includes(t.id));
    const isUnavailable = (store.getUnavailability(t.id) || []).includes(dayDate);

    let conflictHtml = '';
    if (conflictingBooking) {
      conflictHtml = `<span style="font-size:0.68rem; color:#d97706; display:block; margin-left:24px; margin-top:2px;">⚠️ Assigned to: ${conflictingBooking.clientName}</span>`;
    } else if (isUnavailable) {
      conflictHtml = `<span style="font-size:0.68rem; color:#dc2626; display:block; margin-left:24px; margin-top:2px;">🚫 Marked Unavailable</span>`;
    }

    const item = document.createElement('div');
    item.style.padding = '8px 0';
    item.style.borderBottom = '1px solid rgba(204,192,163,0.3)';

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1; min-width:140px;">
          <input type="checkbox" class="qcd-checkbox" ${isAssigned ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--text-primary); cursor:pointer;">
          <span style="font-weight:600; font-size:0.85rem; color:#02303A;">
            ${t.name} <span style="font-size:0.72rem; color:#64748b; font-weight:normal;">(${t.role.split(' ')[0]})</span>
          </span>
        </label>

        <div class="qcd-controls" style="display:${isAssigned ? 'flex' : 'none'}; align-items:center; gap:6px;">
          <select class="qcd-shift filter-select" style="font-size:0.72rem; padding:3px 6px; border-radius:6px; height:26px;">
            <option value="Full Day" ${currentShift === 'Full Day' ? 'selected' : ''}>Full Day</option>
            <option value="Half Day" ${currentShift === 'Half Day' ? 'selected' : ''}>Half Day</option>
          </select>

          <input type="number" class="qcd-fee form-control" placeholder="₹ Fee" value="${currentFee}" style="width:70px; font-size:0.72rem; padding:2px 4px; border-radius:6px; height:26px; text-align:center;">

          <select class="qcd-paid filter-select" style="font-size:0.72rem; padding:3px 6px; border-radius:6px; height:26px;">
            <option value="Unpaid" ${currentPaid === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
            <option value="Paid" ${currentPaid === 'Paid' ? 'selected' : ''}>Paid</option>
          </select>
        </div>
      </div>
      ${conflictHtml}
    `;

    const checkbox = item.querySelector('.qcd-checkbox');
    const controls = item.querySelector('.qcd-controls');
    const shiftSel = item.querySelector('.qcd-shift');
    const feeInp = item.querySelector('.qcd-fee');
    const paidSel = item.querySelector('.qcd-paid');

    function saveQuickCrew() {
      const freshB = store.getBooking(activeQuickCrewBookingId);
      if (!freshB) return;

      let assignedByDay = { ...(freshB.assignedTeamByDay || {}) };
      let shiftsByDay = { ...(freshB.teamShiftsByDay || {}) };
      let feesByDay = { ...(freshB.crewFeesByDay || {}) };
      let paidByDay = { ...(freshB.crewPaidByDay || {}) };

      if (checkbox.checked) {
        assignedByDay[dayKey] = true;
        shiftsByDay[dayKey] = shiftSel.value;
        feesByDay[dayKey] = parseFloat(feeInp.value) || 0;
        paidByDay[dayKey] = paidSel.value;
      } else {
        delete assignedByDay[dayKey];
        delete shiftsByDay[dayKey];
        delete feesByDay[dayKey];
        delete paidByDay[dayKey];
      }

      const allAssignedIds = [...new Set(
        Object.entries(assignedByDay)
          .filter(([k, v]) => v)
          .map(([k]) => k.split('_')[0])
      )];

      store.updateBooking(freshB.id, {
        assignedTeamByDay: assignedByDay,
        teamShiftsByDay: shiftsByDay,
        crewFeesByDay: feesByDay,
        crewPaidByDay: paidByDay,
        assignedTeam: allAssignedIds
      });
    }

    checkbox.addEventListener('change', (e) => {
      controls.style.display = e.target.checked ? 'flex' : 'none';
      saveQuickCrew();
    });

    shiftSel.addEventListener('change', saveQuickCrew);
    feeInp.addEventListener('input', saveQuickCrew);
    paidSel.addEventListener('change', saveQuickCrew);

    listContainer.appendChild(item);
  });
}

// -------------------------------------------------------------
// 4. QUICK UPDATE DELIVERABLES DIALOG
// -------------------------------------------------------------
let activeQuickDelivBookingId = null;

function openQuickDeliverablesDialog(bookingId) {
  activeQuickDelivBookingId = bookingId;
  const b = store.getBooking(bookingId);
  if (!b) return;

  const dialog = document.getElementById('quick-deliv-dialog');
  if (!dialog) return;

  document.getElementById('qdd-client-name').textContent = b.clientName;
  document.getElementById('qdd-shoot-meta').textContent = `${b.type || 'Wedding'} • ${formatOpsDate(b.date)}`;

  const listContainer = document.getElementById('qdd-items-list');
  listContainer.innerHTML = '';

  const delivStatus = b.deliverablesStatus || {};

  let items = [];
  if (Array.isArray(b.deliverables) && b.deliverables.length > 0) {
    items = b.deliverables.map((item, idx) => {
      const label = typeof item === 'string' ? item : item.label;
      const key = `custom_${idx}`;
      return {
        key,
        label,
        status: delivStatus[key] || (delivStatus[label]) || 'Pending'
      };
    });
  } else {
    items = [
      { key: 'raw', label: '📸 Raw Photos', status: delivStatus['raw'] || 'Pending' },
      { key: 'edited', label: '🎨 Edited Photos', status: delivStatus['edited'] || 'Pending' },
      { key: 'reels', label: '📱 Cinematic Reels', status: delivStatus['reels'] || 'Pending' },
      { key: 'video', label: '🎥 Full Film (Pen Drive)', status: delivStatus['video'] || 'Pending' }
    ];
  }

  items.forEach(it => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px 0';
    row.style.borderBottom = '1px solid rgba(204,192,163,0.3)';

    row.innerHTML = `
      <span style="font-weight:600; font-size:0.85rem; color:#02303A;">${it.label}</span>
      <select class="qdd-status-select filter-select" data-key="${it.key}" style="font-size:0.75rem; padding:4px 8px; border-radius:6px; height:28px;">
        <option value="Pending" ${it.status === 'Pending' ? 'selected' : ''}>⚠️ Pending</option>
        <option value="In Progress" ${it.status === 'In Progress' || it.status === 'Editing' || it.status === 'Backed Up' ? 'selected' : ''}>⏳ In Progress</option>
        <option value="Delivered" ${it.status === 'Delivered' || it.status === 'Completed' ? 'selected' : ''}>✅ Delivered</option>
      </select>
    `;

    row.querySelector('.qdd-status-select').addEventListener('change', (e) => {
      const freshB = store.getBooking(activeQuickDelivBookingId);
      if (!freshB) return;
      const curMap = freshB.deliverablesStatus || {};
      curMap[it.key] = e.target.value;
      store.updateBooking(freshB.id, { deliverablesStatus: curMap });
    });

    listContainer.appendChild(row);
  });

  dialog.showModal();
}
