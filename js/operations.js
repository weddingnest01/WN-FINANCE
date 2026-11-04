// js/operations.js - Operations Hub (Crew Allocation & Deliverables Tracking)

let currentOpsTab = 'crew'; // 'crew' or 'deliv'
let currentCrewFilter = 'all'; // 'all', 'pending', 'ready'
let currentDelivFilter = 'all'; // 'all', 'editing', 'delivered'

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

  // Listen to store updates
  window.addEventListener('storeUpdated', () => {
    renderOperationsHub();
  });

  // Initial render
  renderOperationsHub();
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

function updateOperationalBadges() {
  const bookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');
  let pendingCrewCount = 0;
  let readyCrewCount = 0;

  bookings.forEach(b => {
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

  const crewBadge = document.getElementById('ops-crew-badge');
  if (crewBadge) {
    if (pendingCrewCount > 0) {
      crewBadge.textContent = `${pendingCrewCount} Baki`;
      crewBadge.style.display = 'inline-block';
    } else {
      crewBadge.style.display = 'none';
    }
  }

  const crewTotalEl = document.getElementById('ops-crew-total-count');
  const crewPendingEl = document.getElementById('ops-crew-pending-count');
  const crewReadyEl = document.getElementById('ops-crew-ready-count');

  if (crewTotalEl) crewTotalEl.textContent = bookings.length;
  if (crewPendingEl) crewPendingEl.textContent = pendingCrewCount;
  if (crewReadyEl) crewReadyEl.textContent = readyCrewCount;
}

// -------------------------------------------------------------
// 1. CREW ALLOCATION VIEW
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
    const dayBreakdown = [];

    days.forEach((day, idx) => {
      let crewOnDay = [];
      if (Object.keys(assignedMap).length > 0) {
        const dayTeamIds = Object.keys(assignedMap)
          .filter(k => k.endsWith(`_${day}`) && assignedMap[k])
          .map(k => k.split('_')[0]);
        crewOnDay = dayTeamIds.map(id => team.find(t => t.id === id)).filter(Boolean);
      } else if (b.assignedTeam && b.assignedTeam.length > 0) {
        crewOnDay = b.assignedTeam.map(id => team.find(t => t.id === id)).filter(Boolean);
      }

      const dayTitle = (b.days && b.days[idx] && b.days[idx].title) ? b.days[idx].title : `Day ${idx + 1}`;
      const dayBadge = (b.days && b.days[idx] && b.days[idx].badge) ? b.days[idx].badge : `Day ${idx + 1}`;

      if (crewOnDay.length === 0) isPending = true;

      dayBreakdown.push({
        date: day,
        title: dayTitle,
        badge: dayBadge,
        crew: crewOnDay
      });
    });

    return { booking: b, days, isPending, dayBreakdown };
  });

  // Filter
  const filtered = processed.filter(item => {
    if (filter === 'pending') return item.isPending;
    if (filter === 'ready') return !item.isPending;
    return true;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px; text-align: center; background: #fff; border-radius: 14px; border: 1px solid rgba(204,192,163,0.4);">
        <h4 style="margin: 0 0 6px 0; color: #02303A; font-size: 1rem;">No Shoots Found</h4>
        <p style="margin: 0; color: #64748b; font-size: 0.78rem;">${filter === 'pending' ? 'All upcoming shoots have their team assigned!' : 'No bookings in registry.'}</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const b = item.booking;
    const card = document.createElement('div');
    card.className = `duty-card ${item.isPending ? 'pending' : 'complete'}`;
    card.style.background = '#fff';
    card.style.borderRadius = '14px';
    card.style.border = '1px solid rgba(204, 192, 163, 0.5)';
    card.style.borderLeft = item.isPending ? '4.5px solid #dc2626' : '4.5px solid #16a34a';
    card.style.padding = '14px';
    card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';

    // Days / Functions HTML
    let breakdownHtml = '';
    item.dayBreakdown.forEach((db, i) => {
      const isDayPending = db.crew.length === 0;
      const crewChips = db.crew.map(c => {
        const dayKey = `${c.id}_${db.date}`;
        const shift = (b.teamShiftsByDay || {})[dayKey] || (b.teamShifts?.[c.id]) || 'Full Day';
        const shiftShort = shift === 'Half Day' ? '½' : 'Full';
        return `<span style="display:inline-flex; align-items:center; gap:4px; background:#fff; padding:3px 7px; border-radius:6px; border:1px solid rgba(2,48,58,0.12); font-size:0.72rem; font-weight:600; color:#02303A; margin:2px 4px 2px 0;">
          ${c.name} <span style="font-size:0.65rem; color:#64748b;">(${c.role.split(' ')[0]} - ${shiftShort})</span>
        </span>`;
      }).join('');

      breakdownHtml += `
        <div style="padding: 6px 0; ${i > 0 ? 'border-top: 1px dashed rgba(204,192,163,0.3);' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 3px;">
            <span style="font-weight: 700; font-size: 0.78rem; color: #02303A;">
              ${db.badge}: ${db.title} <span style="font-weight: 500; font-size: 0.7rem; color: #64748b;">(${formatOpsDate(db.date)})</span>
            </span>
            <span style="font-size: 0.65rem; font-weight: 700; color: ${isDayPending ? '#dc2626' : '#16a34a'};">
              ${isDayPending ? '❌ Crew Needed' : `✅ ${db.crew.length} Assigned`}
            </span>
          </div>
          <div>${isDayPending ? '<span style="font-size:0.72rem; color:#94a3b8; font-style:italic;">No team allocated for this function yet</span>' : crewChips}</div>
        </div>
      `;
    });

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px;">
        <div>
          <h3 style="font-size: 0.98rem; font-weight: 800; color: #02303A; margin: 0; line-height: 1.2;">
            ${b.clientName}
          </h3>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
            📅 ${formatOpsDate(b.date)}${b.endDate && b.endDate !== b.date ? ' - ' + formatOpsDate(b.endDate) : ''} &bull; ${b.venue ? b.venue.split(',')[0] : 'Surat'} &bull; <strong>${b.type || 'Wedding'}</strong>
          </div>
        </div>
        <span style="font-size: 0.68rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; ${item.isPending ? 'background:#fef2f2; color:#dc2626; border:1px solid rgba(220,38,38,0.25);' : 'background:#f0fdf4; color:#16a34a; border:1px solid rgba(22,163,74,0.25);'}">
          ${item.isPending ? '⚠️ Team Baki' : '✅ Team Ready'}
        </span>
      </div>

      <div style="background: #F8F6F0; border-radius: 8px; padding: 8px 12px; margin-top: 8px;">
        ${breakdownHtml}
      </div>

      <button class="ops-btn-assign" data-booking-id="${b.id}" style="width: 100%; margin-top: 10px; padding: 8px 12px; border-radius: 8px; border: none; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; ${item.isPending ? 'background:#02303A; color:#FAF8F5; box-shadow:0 3px 8px rgba(2,48,58,0.2);' : 'background:#F0EDE5; color:#02303A; border:1px solid #CCC0A3;'}">
        ${item.isPending ? '⚡ 1-Click Assign Crew' : '✏️ Edit / Reassign Crew'}
      </button>
    `;

    card.querySelector('.ops-btn-assign').addEventListener('click', () => {
      openQuickCrewDialog(b.id);
    });

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 2. DELIVERABLES TRACKER VIEW
// -------------------------------------------------------------
function renderDeliverablesTrackerView(filter = 'all') {
  const container = document.getElementById('ops-deliv-list-container');
  if (!container) return;

  const bookings = (store.getBookings() || []).filter(b => b.status !== 'lead' && b.status !== 'cancelled');

  let activeCount = 0;
  let deliveredCount = 0;

  const processed = bookings.map(b => {
    // Deliverables definition
    const delivStatus = b.deliverablesStatus || {};
    
    // Check if b.deliverables is array (from quote) or object
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
    const isEditing = items.some(it => it.status === 'In Progress' || it.status === 'Editing' || it.status === 'Backed Up');

    if (allDelivered) deliveredCount++;
    else activeCount++;

    return {
      booking: b,
      items,
      allDelivered,
      isEditing
    };
  });

  const totalEl = document.getElementById('ops-deliv-total-count');
  const activeEl = document.getElementById('ops-deliv-active-count');
  const doneEl = document.getElementById('ops-deliv-done-count');

  if (totalEl) totalEl.textContent = bookings.length;
  if (activeEl) activeEl.textContent = activeCount;
  if (doneEl) doneEl.textContent = deliveredCount;

  const filtered = processed.filter(item => {
    if (filter === 'editing') return item.isEditing || (!item.allDelivered);
    if (filter === 'delivered') return item.allDelivered;
    return true;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px; text-align: center; background: #fff; border-radius: 14px; border: 1px solid rgba(204,192,163,0.4);">
        <h4 style="margin: 0 0 6px 0; color: #02303A; font-size: 1rem;">No Deliverables Found</h4>
        <p style="margin: 0; color: #64748b; font-size: 0.78rem;">All client orders are up to date.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const b = item.booking;
    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '14px';
    card.style.border = '1px solid rgba(204, 192, 163, 0.5)';
    card.style.padding = '14px';
    card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';

    let itemsHtml = '';
    item.items.forEach(it => {
      let badgeStyle = 'background:#fee2e2; color:#b91c1c;'; // Pending
      if (it.status === 'In Progress' || it.status === 'Editing' || it.status === 'Backed Up') {
        badgeStyle = 'background:#fef9c3; color:#a16207;';
      } else if (it.status === 'Delivered' || it.status === 'Completed') {
        badgeStyle = 'background:#dcfce7; color:#15803d;';
      }

      itemsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(204,192,163,0.2); font-size:0.77rem;">
          <span style="color:#02303A; font-weight:500;">${it.label}</span>
          <span style="${badgeStyle} font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:5px;">
            ${it.status === 'Delivered' ? '✅ Delivered' : (it.status === 'In Progress' || it.status === 'Editing' ? '⏳ ' + it.status : '⚠️ ' + it.status)}
          </span>
        </div>
      `;
    });

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
        <div>
          <h3 style="font-size: 0.98rem; font-weight: 800; color: #02303A; margin: 0;">${b.clientName}</h3>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
            📅 ${formatOpsDate(b.date)} &bull; ${b.type || 'Wedding'}
          </div>
        </div>
        <span style="font-size:0.68rem; font-weight:700; padding:3px 8px; border-radius:6px; ${item.allDelivered ? 'background:#dcfce7; color:#15803d;' : 'background:#fffbeb; color:#b45309; border:1px solid rgba(217,119,6,0.3);'}">
          ${item.allDelivered ? '✅ ALL DELIVERED' : '⏳ IN PROGRESS'}
        </span>
      </div>

      <div style="background:#F8F6F0; border-radius:8px; padding:6px 12px; margin-top:8px;">
        ${itemsHtml}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span style="font-size:0.7rem; color:#64748b;">Venue: <strong>${b.venue ? b.venue.split(',')[0] : 'Surat'}</strong></span>
        <button class="ops-btn-update-deliv" data-booking-id="${b.id}" style="background:#02303A; color:#FAF8F5; border:none; padding:6px 12px; border-radius:7px; font-weight:700; font-size:0.75rem; cursor:pointer;">
          ✏️ Update Status
        </button>
      </div>
    `;

    card.querySelector('.ops-btn-update-deliv').addEventListener('click', () => {
      openQuickDeliverablesDialog(b.id);
    });

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 3. QUICK ASSIGN CREW DIALOG (1-CLICK ASSIGN)
// -------------------------------------------------------------
let activeQuickCrewBookingId = null;
let activeQuickCrewDay = null;

function openQuickCrewDialog(bookingId) {
  activeQuickCrewBookingId = bookingId;
  const b = store.getBooking(bookingId);
  if (!b) return;

  const dialog = document.getElementById('quick-crew-dialog');
  if (!dialog) return;

  document.getElementById('qcd-client-name').textContent = b.clientName;
  document.getElementById('qcd-shoot-meta').textContent = `${b.type || 'Wedding'} • ${formatOpsDate(b.date)} • ${b.venue ? b.venue.split(',')[0] : 'Surat'}`;

  const eventDays = getOpsDateRange(b.date, b.endDate || b.date);
  activeQuickCrewDay = eventDays[0];

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

