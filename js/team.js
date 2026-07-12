
// Dom Elements
const teamListContainer = document.getElementById('team-list-container');
const teamScheduleContainer = document.getElementById('team-schedule-container');
const btnNewTeam = document.getElementById('btn-new-team');

// Dialog elements for Team
const teamDialog = document.getElementById('team-dialog');
const teamForm = document.getElementById('team-form');
const tmName = document.getElementById('tm-name');
const tmRole = document.getElementById('tm-role');
const tmPhone = document.getElementById('tm-phone');

function initTeam() {
  // New Team Button click
  btnNewTeam.addEventListener('click', () => {
    teamForm.reset();
    teamDialog.showModal();
  });

  // Modal Cancel / Submit Handling
  document.getElementById('team-dialog-cancel').addEventListener('click', () => teamDialog.close());
  document.getElementById('team-dialog-close').addEventListener('click', () => teamDialog.close());
  
  // Team Detail Modal Close
  const teamDetailDialog = document.getElementById('team-detail-dialog');
  if (teamDetailDialog) {
    document.getElementById('team-detail-close').addEventListener('click', () => teamDetailDialog.close());
  }

  teamForm.addEventListener('submit', handleAddTeamMember);

  // Watch for state changes
  window.addEventListener('storeUpdated', () => {
    renderTeamList();
    renderTeamSchedules();
  });

  // Initial draw
  renderTeamList();
  renderTeamSchedules();
}

// Render Team Roster Directory list
function renderTeamList() {
  const team = store.getTeam();
  teamListContainer.innerHTML = '';

  if (team.length === 0) {
    teamListContainer.innerHTML = `
      <div class="empty-state">
        <svg class="empty-illustration" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="22" r="8" class="gold-stroke" />
          <path d="M16 48c0-8.8 14.4-12 16-12s16 3.2 16 12" class="gold-stroke" />
          <circle cx="18" cy="28" r="5" class="white-stroke" />
          <path d="M6 46c0-6 10-8 12-8" class="white-stroke" />
          <circle cx="46" cy="28" r="5" class="white-stroke" />
          <path d="M58 46c0-6-10-8-12-8" class="white-stroke" />
        </svg>
        <h4 class="empty-state-title">Roster is Empty</h4>
        <p class="empty-state-text">Add crew members such as photographers, editors, and videographers to begin building your studio staff list.</p>
        <button class="btn btn-sm" id="btn-empty-add-team">Register Staff</button>
      </div>`;
      
    document.getElementById('btn-empty-add-team').addEventListener('click', () => {
      teamForm.reset();
      teamDialog.showModal();
    });
    return;
  }

  team.forEach(t => {
    const card = document.createElement('div');
    card.className = 'team-member-card';
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div class="team-member-info">
          <span class="team-member-name">${t.name}</span>
          <span class="team-member-role">${t.role}</span>
          <a href="tel:${t.phone}" class="team-member-phone" style="text-decoration:none; display:flex; align-items:center; gap:4px; margin-top:4px;">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="var(--primary-gold)" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${t.phone}
          </a>
        </div>
        <button class="header-action btn-sm delete-team-btn" data-id="${t.id}" title="Remove Staff" style="width:30px; height:30px; font-size:0.75rem; border-color: rgba(244,63,94,0.1); color: var(--danger); border-radius: 50%;">
          ✕
        </button>
      </div>
    `;

    // Hook up delete functionality
    card.querySelector('.delete-team-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to remove ${t.name}? They will be unassigned from all shoots.`)) {
        store.deleteTeamMember(t.id);
      }
    });

    // Hook up card click functionality to open detail modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) {
        return;
      }
      openTeamDetailModal(t.id);
    });

    teamListContainer.appendChild(card);
  });
}

// Render calendar shoot assignments schedule list
function renderTeamSchedules() {
  const bookings = store.getBookings();
  const team = store.getTeam();
  teamScheduleContainer.innerHTML = '';

  // Get active (booked) and upcoming bookings
  const activeShoots = bookings.filter(b => b.status === 'booked');

  if (activeShoots.length === 0) {
    teamScheduleContainer.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <svg class="empty-illustration" viewBox="0 0 64 64" fill="none" style="width: 44px; height: 44px; margin-bottom: 6px;">
          <rect x="8" y="12" width="48" height="44" rx="6" class="gold-stroke" />
          <line x1="8" y1="24" x2="56" y2="24" class="gold-stroke" />
          <line x1="20" y1="8" x2="20" y2="16" class="white-stroke" />
          <line x1="44" y1="8" x2="44" y2="16" class="white-stroke" />
          <circle cx="20" cy="35" r="2" class="gold-fill" />
          <circle cx="32" cy="35" r="2" class="gold-fill" />
          <circle cx="44" cy="35" r="2" class="gold-fill" />
          <circle cx="20" cy="45" r="2" class="gold-fill" />
          <circle cx="32" cy="45" r="2" class="gold-fill" />
          <circle cx="44" cy="45" r="2" class="gold-fill" />
        </svg>
        <h4 class="empty-state-title" style="font-size: 1rem;">No Active Schedule</h4>
        <p class="empty-state-text" style="font-size: 0.75rem; max-width: 240px;">Once you mark clients as Booked in the registry, their wedding shoots will appear on this schedule timeline.</p>
      </div>`;
    return;
  }

  // Sort chronologically
  activeShoots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  activeShoots.forEach(b => {
    const event = document.createElement('div');
    event.className = 'timeline-event';
    
    // Parse date parts robustly
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

    // Find assigned crew names
    const assignedCrew = b.assignedTeam
      .map(id => team.find(t => t.id === id))
      .filter(Boolean);

    let crewHtml = '';
    if (assignedCrew.length === 0) {
      crewHtml = '<span style="font-size:0.7rem; color:var(--warning); font-style:italic;">⚠️ Unallocated - Assign crew in client registry</span>';
    } else {
      crewHtml = `
        <div class="timeline-team-avatars">
          ${assignedCrew.map(c => {
            const shift = b.teamShifts?.[c.id] || 'Full Day';
            return `<span class="timeline-avatar-tag">${c.name} (${c.role.split(' ')[0]} - ${shift})</span>`;
          }).join('')}
        </div>
      `;
    }

    // Compute booked services text for team allocation context
    const qty = b.servicesQuantities;
    const services = (b.servicesBooked || ['raw', 'edited', 'reels', 'video']).map(s => s === 'album' ? 'reels' : s);
    let servicesText = '';
    
    if (qty) {
      const qtyLabels = [];
      if ((qty.traditionalPhotographer || 0) > 0) qtyLabels.push(`📸 Trad Photo x${qty.traditionalPhotographer}`);
      if ((qty.traditionalVideographer || 0) > 0) qtyLabels.push(`🎥 Trad Video x${qty.traditionalVideographer}`);
      if ((qty.candidPhotographer || 0) > 0) qtyLabels.push(`📷 Candid Photo x${qty.candidPhotographer}`);
      if ((qty.cinematographer || 0) > 0) qtyLabels.push(`🎬 Cinema x${qty.cinematographer}`);
      if ((qty.drone || 0) > 0) qtyLabels.push(`🛸 Drone x${qty.drone}`);
      if ((qty.familyPhotographer || 0) > 0) qtyLabels.push(`🧑‍🧑‍🧒 Family Photo x${qty.familyPhotographer}`);
      if ((qty.ledScreen || 0) > 0) qtyLabels.push(`🖥️ LED Screen x${qty.ledScreen}`);
      if ((qty.plasmaTv || 0) > 0) qtyLabels.push(`📺 Plasma TV x${qty.plasmaTv}`);
      servicesText = qtyLabels.join(', ') || 'None';
    } else {
      const serviceLabels = [];
      if (services.includes('raw')) serviceLabels.push('📸 Raw');
      if (services.includes('edited')) serviceLabels.push('🎨 Edit');
      if (services.includes('reels')) serviceLabels.push('📱 Reels');
      if (services.includes('video')) serviceLabels.push('🎥 Video');
      servicesText = serviceLabels.join(', ') || 'None';
    }

    let otherReqsHtml = b.otherRequirements ? `<div style="font-size:0.68rem; color:var(--text-secondary); margin: 2px 0 4px 0; font-style:italic;">Other Reqs: ${b.otherRequirements}</div>` : '';

    event.innerHTML = `
      <div class="timeline-date-badge">
        <span class="timeline-day">${day}</span>
        <span class="timeline-month">${month}</span>
      </div>
      <div class="timeline-content">
        <span class="timeline-event-title">${b.clientName} [${b.type}]</span>
        <span class="timeline-event-meta">${b.venue.split(',')[0]}</span>
        ${otherReqsHtml}
        ${crewHtml}
      </div>
    `;

    teamScheduleContainer.appendChild(event);
  });
}

// Handle Add Team Member
function handleAddTeamMember(e) {
  e.preventDefault();

  const memberData = {
    name: tmName.value,
    role: tmRole.value,
    phone: tmPhone.value
  };

  store.addTeamMember(memberData);
  teamDialog.close();
}

function openTeamDetailModal(memberId) {
  const member = store.getTeamMember(memberId);
  if (!member) return;

  const dialog = document.getElementById('team-detail-dialog');
  if (!dialog) return;

  document.getElementById('det-team-name').textContent = member.name;
  document.getElementById('det-team-role').textContent = member.role;
  document.getElementById('det-team-phone').textContent = member.phone;
  document.getElementById('det-team-phone-link').href = `tel:${member.phone}`;

  // Get bookings for this member
  const bookings = store.getBookings();
  const memberBookings = bookings.filter(b => b.assignedTeam && b.assignedTeam.includes(member.id));
  
  let totalEarnings = 0;
  let paidAmount = 0;
  let pendingAmount = 0;

  const shootsListContainer = document.getElementById('det-team-shoots-list');
  shootsListContainer.innerHTML = '';

  if (memberBookings.length === 0) {
    shootsListContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No shoots assigned yet.</div>';
  } else {
    memberBookings.forEach(b => {
      const fee = parseFloat(b.crewFees?.[member.id]) || 0;
      const status = b.crewPaidStatus?.[member.id] || 'Unpaid';
      totalEarnings += fee;
      if (status === 'Paid') {
        paidAmount += fee;
      } else {
        pendingAmount += fee;
      }

      const shootDiv = document.createElement('div');
      shootDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed rgba(10,9,6,0.05);';
      shootDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0; padding-right: 8px;">
          <span style="color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-weight: 600; font-size: 0.85rem;">${b.clientName}</span>
          <span style="color: var(--text-muted); font-size: 0.7rem;">${b.type} • ${formatDate(b.date)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">₹${fee.toLocaleString()}</span>
          <select class="ledger-paid-toggle filter-select" data-booking-id="${b.id}" data-member-id="${member.id}" style="font-size: 0.7rem; padding: 2px 6px; border-radius: 6px; height: 26px; cursor: pointer; color: ${status === 'Paid' ? 'var(--success)' : 'var(--warning)'}; font-weight: 600; border-color: rgba(10,9,6,0.08);">
            <option value="Unpaid" ${status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
            <option value="Paid" ${status === 'Paid' ? 'selected' : ''}>Paid</option>
          </select>
        </div>
      `;
      shootsListContainer.appendChild(shootDiv);
    });
  }

  document.getElementById('det-team-earnings').textContent = `₹${totalEarnings.toLocaleString()}`;
  document.getElementById('det-team-paid').textContent = `Paid: ₹${paidAmount.toLocaleString()}`;
  document.getElementById('det-team-balance').textContent = `Due: ₹${pendingAmount.toLocaleString()}`;
  
  const progressFill = document.getElementById('det-team-payment-progress');
  if (totalEarnings > 0) {
    const percentage = Math.min(100, Math.round((paidAmount / totalEarnings) * 100));
    progressFill.style.width = `${percentage}%`;
    progressFill.style.background = percentage === 100 ? 'var(--success)' : 'var(--text-primary)';
  } else {
    progressFill.style.width = '0%';
  }

  // Hook up paid-status toggles inside the detail modal
  shootsListContainer.querySelectorAll('.ledger-paid-toggle').forEach(select => {
    select.addEventListener('change', (e) => {
      const bookingId = e.target.getAttribute('data-booking-id');
      const mId = e.target.getAttribute('data-member-id');
      const newStatus = e.target.value;

      const b = store.getBooking(bookingId);
      if (b) {
        const currentPaidStatus = { ...(b.crewPaidStatus || {}) };
        currentPaidStatus[mId] = newStatus;
        store.updateBooking(bookingId, { crewPaidStatus: currentPaidStatus });
        // Re-render modal to update totals immediately
        openTeamDetailModal(mId); 
      }
    });
  });

  const btnDelete = document.getElementById('det-team-btn-delete');
  btnDelete.onclick = () => {
    if (confirm(`Are you sure you want to remove ${member.name}? They will be unassigned from all shoots.`)) {
      store.deleteTeamMember(member.id);
      dialog.close();
    }
  };

  // Initialize and render calendar
  if (!window.currentTeamCalDate) {
    window.currentTeamCalDate = new Date();
  }
  renderTeamMemberCalendar(member.id, window.currentTeamCalDate);

  // Setup Prev/Next Month listeners once
  const btnPrev = document.getElementById('tm-cal-prev');
  const btnNext = document.getElementById('tm-cal-next');
  
  // Clone to remove previous listeners
  const newBtnPrev = btnPrev.cloneNode(true);
  const newBtnNext = btnNext.cloneNode(true);
  btnPrev.parentNode.replaceChild(newBtnPrev, btnPrev);
  btnNext.parentNode.replaceChild(newBtnNext, btnNext);

  newBtnPrev.addEventListener('click', () => {
    window.currentTeamCalDate.setMonth(window.currentTeamCalDate.getMonth() - 1);
    renderTeamMemberCalendar(member.id, window.currentTeamCalDate);
  });
  
  newBtnNext.addEventListener('click', () => {
    window.currentTeamCalDate.setMonth(window.currentTeamCalDate.getMonth() + 1);
    renderTeamMemberCalendar(member.id, window.currentTeamCalDate);
  });

  dialog.showModal();
}

// --- CREW PORTAL LOGIC ---
let currentCrewMemberId = null;

window.addEventListener('crewLogin', (e) => {
  currentCrewMemberId = e.detail;
  renderCrewPortal();
});

function renderCrewPortal() {
  if (!currentCrewMemberId) return;

  const bookings = store.getBookings();
  const myBookings = bookings.filter(b => b.assignedTeam && b.assignedTeam.includes(currentCrewMemberId));
  myBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalAssigned = 0;
  let pending = 0;

  const timelineContainer = document.getElementById('crew-shoots-timeline');
  timelineContainer.innerHTML = '';

  if (myBookings.length === 0) {
    timelineContainer.innerHTML = '<div style="padding: 14px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">You have no assigned shoots yet.</div>';
  } else {
    myBookings.forEach(b => {
      const fee = parseFloat(b.crewFees?.[currentCrewMemberId]) || 0;
      const status = b.crewPaidStatus?.[currentCrewMemberId] || 'Unpaid';
      
      totalAssigned += fee;
      if (status === 'Unpaid') {
        pending += fee;
      }

      // Parse date parts robustly
      const dateParts = b.date.split('-');
      let day = '', month = '';
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

      const eventDiv = document.createElement('div');
      eventDiv.className = 'timeline-event';
      eventDiv.innerHTML = `
        <div class="timeline-date-badge">
          <span class="timeline-day">${day}</span>
          <span class="timeline-month">${month}</span>
        </div>
        <div class="timeline-content" style="flex: 1;">
          <span class="timeline-event-title">${b.clientName}</span>
          <span class="timeline-event-meta">${b.venue.split(',')[0]} • ${b.type}</span>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-size: 0.75rem; font-weight: 600; color: ${status === 'Paid' ? 'var(--success)' : 'var(--warning)'};">₹${fee.toLocaleString()} (${status})</span>
            <button class="btn btn-sm btn-secondary btn-report-issue" data-booking-id="${b.id}" data-booking-name="${b.clientName} (${b.date})" style="padding: 4px 8px; font-size: 0.65rem; border-color: rgba(10,9,6,0.1);">Report Issue</button>
          </div>
        </div>
      `;
      timelineContainer.appendChild(eventDiv);
    });
  }

  document.getElementById('crew-total-earnings').textContent = `₹${totalAssigned.toLocaleString()}`;
  document.getElementById('crew-pending-earnings').textContent = `₹${pending.toLocaleString()}`;

  // Attach report issue listeners
  document.querySelectorAll('.btn-report-issue').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bId = e.target.getAttribute('data-booking-id');
      const bName = e.target.getAttribute('data-booking-name');
      document.getElementById('fb-booking-id').value = bId;
      document.getElementById('fb-booking-name').textContent = bName;
      document.getElementById('fb-message').value = '';
      document.getElementById('feedback-dialog').showModal();
    });
  });

  // Render Notifications
  renderCrewNotifications();
}

function renderCrewNotifications() {
  if (!currentCrewMemberId) return;
  const notifs = store.getNotifications(currentCrewMemberId);
  const container = document.getElementById('crew-notifications-container');
  container.innerHTML = '';

  const unread = notifs.filter(n => !n.read);
  
  if (unread.length > 0) {
    unread.forEach(n => {
      const el = document.createElement('div');
      el.style.cssText = 'background: var(--bg-card); border: 1px solid var(--primary-gold); padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(204, 192, 163, 0.15);';
      el.innerHTML = `
        <span style="font-size: 0.75rem; font-weight: 500;">🔔 ${n.message}</span>
        <button class="btn btn-sm" data-id="${n.id}" style="padding: 4px 8px; font-size: 0.65rem;">Clear</button>
      `;
      el.querySelector('button').addEventListener('click', () => {
        store.markNotificationRead(n.id);
        renderCrewNotifications();
      });
      container.appendChild(el);
    });
  }
}

// Unavailability Logic
const unavDialog = document.getElementById('unavailable-dialog');
if (unavDialog) {
  document.getElementById('btn-mark-unavailable').addEventListener('click', () => {
    renderUnavailabilityList();
    unavDialog.showModal();
  });
  
  document.getElementById('unavailable-dialog-close').addEventListener('click', () => unavDialog.close());

  document.getElementById('btn-add-unav-date').addEventListener('click', () => {
    const dateInput = document.getElementById('unav-date');
    if (dateInput.value && currentCrewMemberId) {
      store.toggleUnavailability(currentCrewMemberId, dateInput.value);
      dateInput.value = '';
      renderUnavailabilityList();
      window.dispatchEvent(new CustomEvent('storeUpdated')); // Trigger global re-render
    }
  });
}

function renderUnavailabilityList() {
  if (!currentCrewMemberId) return;
  const dates = store.getUnavailability(currentCrewMemberId);
  const container = document.getElementById('unav-dates-list');
  container.innerHTML = '';

  if (dates.length === 0) {
    container.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No dates marked as busy.</div>';
    return;
  }

  // Sort dates
  dates.sort((a, b) => new Date(a) - new Date(b));

  dates.forEach(d => {
    const el = document.createElement('div');
    el.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(10,9,6,0.03); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem;';
    el.innerHTML = `
      <span>${d}</span>
      <button class="header-action btn-sm" data-date="${d}" style="width: 24px; height: 24px; color: var(--danger); border-color: rgba(244,63,94,0.2);">✕</button>
    `;
    el.querySelector('button').addEventListener('click', () => {
      store.toggleUnavailability(currentCrewMemberId, d);
      renderUnavailabilityList();
      window.dispatchEvent(new CustomEvent('storeUpdated'));
    });
    container.appendChild(el);
  });
}

// Feedback Form Handling
const feedbackForm = document.getElementById('feedback-form');
const feedbackDialog = document.getElementById('feedback-dialog');
if (feedbackForm && feedbackDialog) {
  document.getElementById('feedback-dialog-cancel').addEventListener('click', () => feedbackDialog.close());
  document.getElementById('feedback-dialog-close').addEventListener('click', () => feedbackDialog.close());

  feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentCrewMemberId) return;
    
    store.addFeedback({
      memberId: currentCrewMemberId,
      bookingId: document.getElementById('fb-booking-id').value,
      message: document.getElementById('fb-message').value
    });
    
    feedbackDialog.close();
    alert('Your issue has been reported to the Studio Manager.');
  });
}

function renderTeamMemberCalendar(memberId, currentMonthDate) {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('tm-cal-month').textContent = `${monthNames[month]} ${year}`;

  const daysContainer = document.getElementById('tm-cal-days');
  daysContainer.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookings = store.getBookings().filter(b => b.status !== 'cancelled');
  const unavDates = store.getUnavailability(memberId) || [];

  // Padding
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement('div');
    daysContainer.appendChild(emptyDiv);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Check state
    const isUnavailable = unavDates.includes(dateStr);
    const assignedShoots = bookings.filter(b => b.date === dateStr && b.assignedTeam.includes(memberId));
    const unassignedStudioShoots = bookings.filter(b => b.date === dateStr && !b.assignedTeam.includes(memberId));
    
    let bgColor = 'transparent';
    let color = 'var(--text-primary)';
    
    if (isUnavailable) {
      bgColor = 'rgba(244,63,94,0.15)'; // Redish
      color = 'var(--danger)';
    } else if (assignedShoots.length > 0) {
      bgColor = 'rgba(16, 185, 129, 0.15)'; // Greenish
      color = 'var(--success)';
    } else if (unassignedStudioShoots.length > 0) {
      bgColor = 'rgba(59, 130, 246, 0.15)'; // Blueish (Studio shoot, might need them)
      color = '#3b82f6';
    }

    // Today indicator
    const today = new Date();
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;

    dayDiv.innerHTML = `<div style="
      width: 24px; height: 24px; line-height: 24px; margin: 0 auto; 
      border-radius: 50%; background: ${bgColor}; color: ${color}; 
      font-weight: ${isToday || bgColor !== 'transparent' ? '700' : '400'};
      ${isToday && bgColor === 'transparent' ? 'border: 1px solid var(--border-gold);' : ''}
    ">${i}</div>`;
    
    // Tooltip
    if (isUnavailable || assignedShoots.length > 0 || unassignedStudioShoots.length > 0) {
      let title = '';
      if (isUnavailable) title += 'Busy/Unavailable\n';
      if (assignedShoots.length > 0) title += 'Assigned: ' + assignedShoots.map(s => s.clientName).join(', ') + '\n';
      if (unassignedStudioShoots.length > 0) title += 'Unassigned Studio Shoot: ' + unassignedStudioShoots.map(s => s.clientName).join(', ');
      dayDiv.title = title.trim();
      dayDiv.style.cursor = 'help';
    }

    daysContainer.appendChild(dayDiv);
  }
}
