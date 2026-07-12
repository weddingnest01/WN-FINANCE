
// Dom Elements
const bookingList = document.getElementById('crm-booking-list');
const searchInput = document.getElementById('crm-search');
// Dialog elements for Bookings
const bookingDialog = document.getElementById('booking-dialog');
const bookingDialogTitle = document.getElementById('booking-dialog-title');
const bookingForm = document.getElementById('booking-form');
const bookingFormId = document.getElementById('booking-form-id');
const bfName = document.getElementById('bf-name');
const bfDate = document.getElementById('bf-date');
const bfEndDate = document.getElementById('bf-end-date');
const bfType = document.getElementById('bf-type');
const bfVenue = document.getElementById('bf-venue');
const bfPhone = document.getElementById('bf-phone');
const bfEmail = document.getElementById('bf-email');
const bfPrice = document.getElementById('bf-price');
const bfNotes = document.getElementById('bf-notes');
const bfDateWarning = document.getElementById('bf-date-warning');
const bfQtyTradPhoto = document.getElementById('bf-qty-trad-photo');
const bfQtyTradVideo = document.getElementById('bf-qty-trad-video');
const bfQtyCandPhoto = document.getElementById('bf-qty-cand-photo');
const bfQtyCinema = document.getElementById('bf-qty-cinema');
const bfQtyDrone = document.getElementById('bf-qty-drone');
const bfQtyFamPhoto = document.getElementById('bf-qty-fam-photo');
const bfQtyLedScreen = document.getElementById('bf-qty-led-screen');
const bfQtyPlasmaTv = document.getElementById('bf-qty-plasma-tv');
const bfOtherReqs = document.getElementById('bf-other-reqs');

// Detail Dialog elements
const detailDialog = document.getElementById('booking-detail-dialog');
const detClientName = document.getElementById('det-client-name');
const detStatusBadge = document.getElementById('det-status-badge');
const detShootType = document.getElementById('det-shoot-type');
const detShootDate = document.getElementById('det-shoot-date');
const detShootVenue = document.getElementById('det-shoot-venue');
const detPriceLbl = document.getElementById('det-price-lbl');
const detPaymentProgress = document.getElementById('det-payment-progress');
const detPaidAmount = document.getElementById('det-paid-amount');
const detBalanceAmount = document.getElementById('det-balance-amount');
const detActionCall = document.getElementById('det-action-call');
const detActionEmail = document.getElementById('det-action-email');
const detTeamAllocation = document.getElementById('det-team-allocation-list');
const detNotes = document.getElementById('det-notes');
const detOtherReqsContainer = document.getElementById('det-other-reqs-container');
const detOtherReqs = document.getElementById('det-other-reqs');
const detDeliverablesList = document.getElementById('det-deliverables-list');
const detBtnAddPayment = document.getElementById('det-btn-add-payment');
const detBtnInvoice = document.getElementById('det-btn-invoice');
const detBtnEdit = document.getElementById('det-btn-edit');
const detBtnDelete = document.getElementById('det-btn-delete');

let activeBookingId = null;

function initCRM() {
  // Event listeners for searches and filters
  searchInput.addEventListener('input', renderBookingList);

  bfDate.addEventListener('change', checkDateConflict);
  bfDate.addEventListener('input', checkDateConflict);

  const btnCrmAddShoot = document.getElementById('btn-crm-add-shoot');
  if (btnCrmAddShoot) {
    btnCrmAddShoot.addEventListener('click', () => openBookingForm(null));
  }

  // Detail Dialog controls
  detBtnDelete.addEventListener('click', handleDeleteBooking);
  detBtnEdit.addEventListener('click', () => {
    detailDialog.close();
    openBookingForm(activeBookingId);
  });
  
  detBtnAddPayment.addEventListener('click', () => {
    detailDialog.close();
    // Dispatch a custom event to open transaction dialog pre-linked to this booking
    window.dispatchEvent(new CustomEvent('openTransactionForm', { 
      detail: { type: 'income', bookingId: activeBookingId } 
    }));
  });

  detBtnInvoice.addEventListener('click', () => {
    detailDialog.close();
    // Dispatch a custom event to open invoice generator for this booking
    window.dispatchEvent(new CustomEvent('openInvoiceView', { 
      detail: { bookingId: activeBookingId } 
    }));
  });

  // Modal Cancel / Submit Handling
  document.getElementById('booking-dialog-cancel').addEventListener('click', () => bookingDialog.close());
  document.getElementById('booking-dialog-close').addEventListener('click', () => bookingDialog.close());
  document.getElementById('booking-detail-close').addEventListener('click', () => detailDialog.close());

  bookingForm.addEventListener('submit', handleSaveBooking);

  // Custom Event Listeners for cross-module interactions
  window.addEventListener('openBookingForm', (e) => {
    const date = e.detail?.date;
    openBookingForm(null);
    if (date) {
      bfDate.value = date;
    }
  });

  window.addEventListener('openBookingDetail', (e) => {
    const id = e.detail?.id;
    if (id) {
      openBookingDetail(id);
    }
  });

  // Watch for external state updates
  window.addEventListener('storeUpdated', () => {
    renderBookingList();
    renderDashboardUpcoming();
  });

  // Initial draw
  renderBookingList();
  renderDashboardUpcoming();
}

// Format Date beautifully: YYYY-MM-DD to "July 18, 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Render booking list inside CRM view
function renderBookingList() {
  const query = searchInput.value.toLowerCase();
  const bookings = store.getBookings();

  bookingList.innerHTML = '';

  const filtered = bookings.filter(b => {
    const matchesSearch = 
      b.clientName.toLowerCase().includes(query) ||
      b.venue.toLowerCase().includes(query) ||
      (b.phone && b.phone.includes(query)) ||
      (b.email && b.email.toLowerCase().includes(query)) ||
      b.type.toLowerCase().includes(query);
      
    return matchesSearch;
  });

  if (filtered.length === 0) {
    const isFiltered = query !== '';
    bookingList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-illustration" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="18" width="48" height="34" rx="8" class="gold-stroke" />
          <path d="M20 18V12a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v6" class="gold-stroke" />
          <circle cx="32" cy="35" r="11" class="gold-stroke" />
          <circle cx="32" cy="35" r="7" class="gold-fill" />
          <circle cx="48" cy="24" r="2" fill="var(--primary-gold)" />
        </svg>
        <h4 class="empty-state-title">${isFiltered ? 'No Matches Found' : 'Registry is Empty'}</h4>
        <p class="empty-state-text">${isFiltered ? 'Try adjusting your search terms or filters.' : 'No active bookings. Confirm a quotation to add a client here.'}</p>
      </div>`;
    return;
  }

  // Sort bookings: upcoming dates first, completed last
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  filtered.forEach(b => {
    const paid = store.getBookingPaidAmount(b.id);
    const balance = Math.max(0, b.packagePrice - paid);
    const percentPaid = b.packagePrice > 0 ? Math.min(100, Math.round((paid / b.packagePrice) * 100)) : 0;
    
    const item = document.createElement('div');
    item.className = 'booking-item';
    item.addEventListener('click', () => openBookingDetail(b.id));

    // Get assigned team initials with shift type
    const team = store.getTeam();
    const assignedNames = b.assignedTeam
      .map(id => {
        const t = team.find(x => x.id === id);
        if (!t) return '';
        const initials = t.name.split(' ').map(n => n[0]).join('');
        const shiftSymbol = b.teamShifts?.[t.id] === 'Half Day' ? '½' : '';
        return initials + shiftSymbol;
      })
      .filter(Boolean)
      .join(', ');

    item.innerHTML = `
      <div class="booking-item-header">
        <div>
          <div class="booking-client-name">${b.clientName}</div>
          <span class="badge badge-completed" style="font-size:0.6rem; padding: 2px 6px; margin-top:4px;">${b.type}</span>
        </div>
        <span class="badge badge-${b.status}">${b.status}</span>
      </div>
      
      <div class="booking-meta-row">
        <div class="booking-meta-item">
          <svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 20V8h14v12H5zm7-9H7v2h5v-2zm0 3H7v2h5v-2zm5-6H7v2h10V8zm0 3h-4v2h4v-2zm0 3h-4v2h4v-2z"/></svg>
          <span>${formatDate(b.date)}</span>
        </div>
        <div class="booking-meta-item">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span style="max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.venue.split(',')[0]}</span>
        </div>
      </div>

      ${b.status !== 'lead' && b.status !== 'cancelled' ? `
        <div style="margin-top: 4px;">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${percentPaid}%;"></div>
          </div>
          <div class="progress-text-row">
            <span>Paid: ₹${paid.toLocaleString()}</span>
            <span>₹${b.packagePrice.toLocaleString()} Total (${percentPaid}%)</span>
          </div>
        </div>
      ` : `
        <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; justify-content:space-between;">
          <span>Quote Price: ₹${b.packagePrice.toLocaleString()}</span>
          <span>Lead stage</span>
        </div>
      `}

      ${assignedNames ? `
        <div style="font-size:0.7rem; color:var(--primary-gold); display:flex; align-items:center; gap:4px; margin-top:4px;">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span>Crew: ${assignedNames}</span>
        </div>
      ` : ''}
    `;
    bookingList.appendChild(item);
  });
}

// Open client details view sheet modal
function openBookingDetail(id) {
  let b = store.getBooking(id);
  if (!b) return;
  
  activeBookingId = id;
  
  detClientName.textContent = b.clientName;
  detStatusBadge.textContent = b.status;
  detStatusBadge.className = `badge badge-${b.status}`;
  detShootType.textContent = b.type;

  // Show date range if endDate exists
  if (b.endDate && b.endDate !== b.date) {
    detShootDate.textContent = `${formatDate(b.date)} – ${formatDate(b.endDate)}`;
  } else {
    detShootDate.textContent = formatDate(b.date);
  }

  detShootVenue.textContent = b.venue;
  detNotes.textContent = b.notes || 'No special requirements listed.';
  
  if (b.otherRequirements && b.otherRequirements.trim()) {
    detOtherReqs.textContent = b.otherRequirements;
    detOtherReqsContainer.style.display = 'block';
  } else {
    detOtherReqsContainer.style.display = 'none';
  }
  detPriceLbl.textContent = `₹${b.packagePrice.toLocaleString()} Total`;

  // Financial status inside details
  const paid = store.getBookingPaidAmount(id);
  const balance = Math.max(0, b.packagePrice - paid);
  const percentPaid = b.packagePrice > 0 ? Math.min(100, Math.round((paid / b.packagePrice) * 100)) : 0;
  
  detPaidAmount.textContent = `Paid: ₹${paid.toLocaleString()}`;
  detBalanceAmount.textContent = `Balance: ₹${balance.toLocaleString()}`;
  detPaymentProgress.style.width = `${percentPaid}%`;

  // Quick Communication Links
  detActionCall.href = `tel:${b.phone}`;
  detActionEmail.href = `mailto:${b.email}?subject=Wedding Photography Shoot Setup`;

  const servicesRaw = b.servicesBooked || ['raw', 'edited', 'reels', 'video'];
  const services = servicesRaw.map(s => s === 'album' ? 'reels' : s);

  // Build day dates between b.date and b.endDate
  function getDayDates(startStr, endStr) {
    const dates = [];
    if (!startStr) return [new Date().toISOString().split('T')[0]];
    try {
      const start = new Date(startStr + 'T00:00:00');
      const end = endStr ? new Date(endStr + 'T00:00:00') : new Date(startStr + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
    } catch(e) {
      dates.push(startStr);
    }
    return dates;
  }

  const eventDays = getDayDates(b.date, b.endDate);
  const crewDayTabs = document.getElementById('det-crew-day-tabs');
  if (crewDayTabs) crewDayTabs.innerHTML = '';

  let selectedCrewDay = eventDays[0];

  function renderCrewForDay(dayDate) {
    b = store.getBooking(id); // Get fresh data
    selectedCrewDay = dayDate;

    // Update tab styling
    crewDayTabs.querySelectorAll('button').forEach(btn => {
      btn.style.background = btn.dataset.day === dayDate ? 'var(--text-primary)' : 'transparent';
      btn.style.color = btn.dataset.day === dayDate ? '#fff' : 'var(--text-primary)';
    });

    // Render crew for this day
    detTeamAllocation.innerHTML = '';
    const team = store.getTeam();
    
    if (team.length === 0) {
      detTeamAllocation.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">No crew registered yet. Add team members in the Team tab.</span>';
      return;
    }

    // Find other bookings on this day (excluding this one)
    const otherBookingsOnDay = store.getBookings().filter(ob =>
      ob.date <= dayDate &&
      (ob.endDate ? ob.endDate >= dayDate : ob.date === dayDate) &&
      ob.id !== b.id &&
      ob.status !== 'cancelled'
    );

    team.forEach(t => {
      // Per-day assignment key: teamId_dayDate
      const dayKey = `${t.id}_${dayDate}`;
      const isAssigned = (b.assignedTeamByDay || {})[dayKey] !== undefined
        ? (b.assignedTeamByDay || {})[dayKey]
        : b.assignedTeam.includes(t.id) && eventDays.length === 1;
      const currentShift = (b.teamShiftsByDay || {})[dayKey] || 'Full Day';
      const currentFee = (b.crewFeesByDay || {})[dayKey] || '';
      const currentPaid = (b.crewPaidByDay || {})[dayKey] || 'Unpaid';

      // Check conflict
      const conflictingBooking = otherBookingsOnDay.find(ob => ob.assignedTeam.includes(t.id));
      const isUnavailable = store.getUnavailability(t.id).includes(dayDate);
      let conflictHtml = '';
      if (conflictingBooking) {
        conflictHtml = `<span style="font-size:0.68rem; color:var(--warning); display:block; margin-left: 24px; margin-top: 1px;">⚠️ Assigned: ${conflictingBooking.clientName}</span>`;
      } else if (isUnavailable) {
        conflictHtml = `<span style="font-size:0.68rem; color:var(--danger); display:block; margin-left: 24px; margin-top: 1px;">🚫 Marked Unavailable</span>`;
      }

      const itemContainer = document.createElement('div');
      itemContainer.style.display = 'flex';
      itemContainer.style.flexDirection = 'column';
      itemContainer.style.gap = '2px';
      itemContainer.style.padding = '6px 0';
      itemContainer.style.borderBottom = '1px solid rgba(10, 9, 6, 0.04)';

      itemContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 6px 12px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer; flex: 1; min-width: 140px;">
            <input type="checkbox" class="crew-checkbox" data-team-id="${t.id}" data-day-key="${dayKey}" ${isAssigned ? 'checked' : ''} style="accent-color: var(--text-primary); width:16px; height:16px;">
            <span style="font-weight: 500;">${t.name} <span style="font-size:0.75rem; color:var(--text-secondary);">(${t.role.split(' ')[0]})</span></span>
          </label>
          
          <div class="crew-controls-row" style="display: ${isAssigned ? 'flex' : 'none'}; align-items: center; gap: 6px; flex-wrap: wrap;">
            <select class="crew-shift-select filter-select" style="font-size:0.72rem; padding: 4px 6px; border-radius: 6px; height:26px;">
              <option value="Full Day" ${currentShift === 'Full Day' ? 'selected' : ''}>Full Day</option>
              <option value="Half Day" ${currentShift === 'Half Day' ? 'selected' : ''}>Half Day</option>
            </select>
            
            <input type="number" class="crew-fee-input form-control" placeholder="₹ Rate" value="${currentFee}" style="width: 75px; font-size:0.72rem; padding: 2px 4px; border-radius: 6px; height:26px; border: 1px solid var(--border-gold); text-align: center;">
            
            <select class="crew-paid-select filter-select" style="font-size:0.72rem; padding: 4px 6px; border-radius: 6px; height:26px;">
              <option value="Unpaid" ${currentPaid === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
              <option value="Paid" ${currentPaid === 'Paid' ? 'selected' : ''}>Paid</option>
            </select>
          </div>
        </div>
        ${conflictHtml}
      `;

      const checkbox = itemContainer.querySelector('.crew-checkbox');
      const controlsRow = itemContainer.querySelector('.crew-controls-row');
      const shiftSelect = itemContainer.querySelector('.crew-shift-select');
      const feeInput = itemContainer.querySelector('.crew-fee-input');
      const paidSelect = itemContainer.querySelector('.crew-paid-select');

      function saveCrewDay() {
        b = store.getBooking(id); // Always save on top of fresh data
        let assignedByDay = { ...(b.assignedTeamByDay || {}) };
        let shiftsByDay = { ...(b.teamShiftsByDay || {}) };
        let feesByDay = { ...(b.crewFeesByDay || {}) };
        let paidByDay = { ...(b.crewPaidByDay || {}) };

        if (checkbox.checked) {
          assignedByDay[dayKey] = true;
          shiftsByDay[dayKey] = shiftSelect.value;
          feesByDay[dayKey] = parseFloat(feeInput.value) || 0;
          paidByDay[dayKey] = paidSelect.value;
        } else {
          delete assignedByDay[dayKey];
          delete shiftsByDay[dayKey];
          delete feesByDay[dayKey];
          delete paidByDay[dayKey];
        }

        // Also keep assignedTeam in sync for conflict-checking
        const allAssignedTeamIds = [...new Set(
          Object.entries(assignedByDay)
            .filter(([k, v]) => v)
            .map(([k]) => k.split('_')[0])
        )];

        store.updateBooking(b.id, { 
          assignedTeamByDay: assignedByDay,
          teamShiftsByDay: shiftsByDay,
          crewFeesByDay: feesByDay,
          crewPaidByDay: paidByDay,
          assignedTeam: allAssignedTeamIds
        });
      }

      checkbox.addEventListener('change', (e) => {
        controlsRow.style.display = e.target.checked ? 'flex' : 'none';
        if (e.target.checked) {
          store.addNotification(t.id, `You have been assigned to shoot: ${b.clientName} on ${dayDate}`);
        }
        saveCrewDay();
      });

      shiftSelect.addEventListener('change', saveCrewDay);
      feeInput.addEventListener('input', saveCrewDay);
      paidSelect.addEventListener('change', saveCrewDay);

      detTeamAllocation.appendChild(itemContainer);
    });
  }

  // Build day tabs
  if (crewDayTabs && eventDays.length > 1) {
    eventDays.forEach((day, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-secondary';
      btn.dataset.day = day;
      btn.textContent = `Day ${i + 1} – ${formatDate(day)}`;
      btn.style.cssText = `font-size:0.72rem; padding:4px 10px; border-radius:20px; border: 1px solid var(--border-gold); cursor:pointer; background: ${i === 0 ? 'var(--text-primary)' : 'transparent'}; color: ${i === 0 ? '#fff' : 'var(--text-primary)'}; transition: all 0.2s;`;
      btn.addEventListener('click', () => renderCrewForDay(day));
      crewDayTabs.appendChild(btn);
    });
  }

  renderCrewForDay(selectedCrewDay);
  // Deliverables Tracker List rendering
  const deliverablesDef = [
    { key: 'raw', label: '📸 Raw Photos', options: ['Pending', 'Backed Up', 'Shared', 'Completed'] },
    { key: 'edited', label: '🎨 Edited Photos', options: ['Pending', 'In Progress', 'Delivered'] },
    { key: 'reels', label: '📱 2 Reels', options: ['Pending', 'Editing', 'Delivered'] },
    { key: 'video', label: '🎥 Wedding Video', options: ['Pending', 'Editing', 'Delivered'] }
  ];

  detDeliverablesList.innerHTML = '';
  const currentDeliverables = b.deliverables || {};
  const activeDeliverables = deliverablesDef.filter(d => services.includes(d.key));

  // Determine deadlines based on 2nd payment
  const payments = store.getPaymentsForBooking(b.id) || [];
  const sortedPayments = payments.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  let secondPaymentDateStr = null;
  if (sortedPayments.length >= 2) {
    secondPaymentDateStr = sortedPayments[1].date;
  }
  
  function getDeadlineInfo(key) {
    if (key === 'video') return { text: 'Due on Final Payment', color: 'var(--text-secondary)' };
    if (!secondPaymentDateStr) return { text: 'Awaiting 2nd Installment', color: 'var(--text-secondary)' };
    
    const baseDate = new Date(secondPaymentDateStr);
    if (key === 'edited') {
      baseDate.setDate(baseDate.getDate() + 20);
    } else if (key === 'reels') {
      baseDate.setDate(baseDate.getDate() + 30);
    } else if (key === 'video') { // Fallback, though handled above
      baseDate.setMonth(baseDate.getMonth() + 3);
    } else {
      return { text: '', color: 'var(--text-secondary)' };
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = baseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let color = 'var(--text-secondary)';
    if (diffDays < 0) {
      color = 'var(--danger)';
    } else if (diffDays <= 7) {
      color = 'var(--warning)';
    }
    
    return { text: 'Deadline: ' + formatDate(baseDate.toISOString().split('T')[0]), color };
  }

  if (activeDeliverables.length === 0) {
    detDeliverablesList.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">No deliverables to track (no services booked).</span>';
  } else {
    activeDeliverables.forEach(d => {
      const currentVal = currentDeliverables[d.key] || 'Pending';
      
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '8px 0';
      row.style.borderBottom = '1px solid rgba(10, 9, 6, 0.04)';
      
      let optionsHtml = d.options.map(opt => 
        `<option value="${opt}" ${currentVal === opt ? 'selected' : ''}>${opt}</option>`
      ).join('');
      
      let deadlineHtml = '';
      const deadlineInfo = getDeadlineInfo(d.key);
      if (deadlineInfo && deadlineInfo.text) {
        deadlineHtml = `<span style="font-size:0.65rem; color:${deadlineInfo.color}; display:block; margin-top:2px;">${deadlineInfo.text}</span>`;
      }
      
      row.innerHTML = `
        <div>
          <span style="font-size:0.82rem; font-weight:500; color:var(--text-primary);">${d.label}</span>
          ${deadlineHtml}
        </div>
        <select class="deliverable-status-select filter-select" data-key="${d.key}" style="font-size:0.72rem; padding: 4px 8px; border-radius: 6px; height:28px; border-color: rgba(10, 9, 6, 0.12);">
          ${optionsHtml}
        </select>
      `;
      
      const select = row.querySelector('.deliverable-status-select');
      select.addEventListener('change', (e) => {
        b = store.getBooking(id); // Get fresh data to prevent overwriting other fields
        const updatedDeliverables = { ...(b.deliverables || {}), [d.key]: e.target.value };
        store.updateBooking(b.id, { deliverables: updatedDeliverables });
      });
      
      detDeliverablesList.appendChild(row);
    });
  }

  detailDialog.showModal();
}

function checkDateConflict() {
  const selectedDate = bfDate.value;
  const currentBookingId = bookingFormId.value;
  const bookings = store.getBookings();
  
  const hasConflict = bookings.some(b => 
    b.date === selectedDate && 
    b.id !== currentBookingId && 
    b.status !== 'cancelled'
  );

  if (hasConflict) {
    bfDateWarning.style.display = 'block';
  } else {
    bfDateWarning.style.display = 'none';
  }
}

// Open Form Modal to Add or Edit client
function openBookingForm(id = null) {
  bookingForm.reset();
  bfDateWarning.style.display = 'none';
  
  if (id) {
    // Edit Mode
    const b = store.getBooking(id);
    if (!b) return;
    
    bookingDialogTitle.textContent = 'Edit Client Details';
    bookingFormId.value = b.id;
    bfName.value = b.clientName;
    bfDate.value = b.date;
    bfEndDate.value = b.endDate || '';
    bfType.value = b.type;
    bfVenue.value = b.venue;
    bfPhone.value = b.phone || '';
    bfEmail.value = b.email || '';
    bfPrice.value = b.packagePrice || '';
    bfNotes.value = b.notes || '';
    
    const qty = b.servicesQuantities || {};
    bfQtyTradPhoto.value = qty.traditionalPhotographer ?? 0;
    bfQtyTradVideo.value = qty.traditionalVideographer ?? 0;
    bfQtyCandPhoto.value = qty.candidPhotographer ?? 0;
    bfQtyCinema.value = qty.cinematographer ?? 0;
    bfQtyDrone.value = qty.drone ?? 0;
    bfQtyFamPhoto.value = qty.familyPhotographer ?? 0;
    bfQtyLedScreen.value = qty.ledScreen ?? 0;
    bfQtyPlasmaTv.value = qty.plasmaTv ?? 0;
    bfOtherReqs.value = b.otherRequirements || '';
  } else {
    // Add Mode
    bookingDialogTitle.textContent = 'New Client Booking';
    bookingFormId.value = '';
    // Set default date as tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bfDate.value = tomorrow.toISOString().split('T')[0];
    
    bfQtyTradPhoto.value = 0;
    bfQtyTradVideo.value = 0;
    bfQtyCandPhoto.value = 0;
    bfQtyCinema.value = 0;
    bfQtyDrone.value = 0;
    bfQtyFamPhoto.value = 0;
    bfQtyLedScreen.value = 0;
    bfQtyPlasmaTv.value = 0;
    bfOtherReqs.value = '';
  }
  
  checkDateConflict();
  bookingDialog.showModal();
}

// Save action (Add or Edit)
function handleSaveBooking(e) {
  e.preventDefault();
  
  const id = bookingFormId.value;
  
  const servicesQuantities = {
    traditionalPhotographer: parseInt(bfQtyTradPhoto.value, 10) || 0,
    traditionalVideographer: parseInt(bfQtyTradVideo.value, 10) || 0,
    candidPhotographer: parseInt(bfQtyCandPhoto.value, 10) || 0,
    cinematographer: parseInt(bfQtyCinema.value, 10) || 0,
    drone: parseInt(bfQtyDrone.value, 10) || 0,
    familyPhotographer: parseInt(bfQtyFamPhoto.value, 10) || 0,
    ledScreen: parseInt(bfQtyLedScreen.value, 10) || 0,
    plasmaTv: parseInt(bfQtyPlasmaTv.value, 10) || 0
  };

  const otherRequirements = bfOtherReqs.value.trim();

  // Automatically map quantities to deliverables
  const servicesBooked = [];
  if (servicesQuantities.traditionalPhotographer > 0 || 
      servicesQuantities.candidPhotographer > 0 || 
      servicesQuantities.familyPhotographer > 0) {
    servicesBooked.push('raw', 'edited', 'reels');
  }
  if (servicesQuantities.traditionalVideographer > 0 || 
      servicesQuantities.cinematographer > 0 || 
      servicesQuantities.drone > 0) {
    servicesBooked.push('video');
  }

  const bookingData = {
    clientName: bfName.value,
    date: bfDate.value,
    endDate: bfEndDate.value || null,
    type: bfType.value,
    venue: bfVenue.value,
    phone: bfPhone.value,
    email: bfEmail.value,
    packagePrice: parseFloat(bfPrice.value) || 0,
    status: 'booked',
    notes: bfNotes.value,
    servicesQuantities: servicesQuantities,
    servicesBooked: servicesBooked,
    otherRequirements: otherRequirements
  };

  if (id) {
    store.updateBooking(id, bookingData);
  } else {
    store.addBooking(bookingData);
  }
  
  bookingDialog.close();
}

// Delete action
function handleDeleteBooking() {
  if (confirm(`Are you sure you want to delete this booking? All recorded payments for this shoot will be lost.`)) {
    store.deleteBooking(activeBookingId);
    detailDialog.close();
  }
}

// Render dashboard list of upcoming events
function renderDashboardUpcoming() {
  const container = document.getElementById('db-upcoming-shoots');
  if (!container) return;

  const bookings = store.getBookings();
  const team = store.getTeam();
  container.innerHTML = '';

  const activeShoots = bookings.filter(b => b.status === 'booked');

  if (activeShoots.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 10px 0;">
        <svg class="empty-illustration" viewBox="0 0 64 64" fill="none" style="width:40px; height:40px; margin-bottom: 4px;">
          <circle cx="32" cy="32" r="24" class="gold-stroke" />
          <path d="M22 32l6 6 14-14" class="gold-stroke" />
        </svg>
        <h4 class="empty-state-title" style="font-size:0.95rem;">No Shoots Scheduled</h4>
        <p class="empty-state-text" style="font-size:0.72rem; max-width:240px; margin-bottom:6px;">All booked shoots will display here with crew details.</p>
        <button class="btn btn-sm btn-secondary" id="btn-db-add-booking">Add Client</button>
      </div>`;
      
    document.getElementById('btn-db-add-booking').addEventListener('click', () => openBookingForm(null));
    return;
  }

  // Sort chronological
  activeShoots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Show top 2 upcoming shoots
  const limitShoots = activeShoots.slice(0, 2);

  limitShoots.forEach(b => {
    const item = document.createElement('div');
    item.className = 'timeline-event';
    item.addEventListener('click', () => openBookingDetail(b.id));

    // Parse date parts
    const dateParts = b.date.split('-');
    let day = '';
    let month = '';
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const monthIdx = parseInt(dateParts[1], 10) - 1;
      const dayNum = parseInt(dateParts[2], 10);
      const dateObj = new Date(year, monthIdx, dayNum);
      if (!isNaN(dateObj.getTime())) {
        day = dateObj.getDate();
        month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      }
    }

    const assignedCrew = b.assignedTeam
      .map(id => team.find(t => t.id === id))
      .filter(Boolean);

    let crewHtml = '';
    if (assignedCrew.length === 0) {
      crewHtml = '<span style="font-size:0.68rem; color:var(--warning); font-style:italic;">Crew unallocated</span>';
    } else {
      crewHtml = `
        <div class="timeline-team-avatars">
          ${assignedCrew.map(c => `<span class="timeline-avatar-tag" style="font-size:0.6rem; padding: 1px 4px;">${c.name.split(' ').map(n=>n[0]).join('')}</span>`).join('')}
        </div>
      `;
    }

    item.innerHTML = `
      <div class="timeline-date-badge" style="min-width:44px; padding: 4px;">
        <span class="timeline-day" style="font-size:1rem;">${day}</span>
        <span class="timeline-month" style="font-size:0.55rem;">${month}</span>
      </div>
      <div class="timeline-content">
        <span class="timeline-event-title" style="font-size:0.85rem;">${b.clientName}</span>
        <span class="timeline-event-meta" style="font-size:0.7rem;">${b.type} • ${b.venue.split(',')[0]}</span>
        ${crewHtml}
      </div>
    `;
    container.appendChild(item);
  });
}
