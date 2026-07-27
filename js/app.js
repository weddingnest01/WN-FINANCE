

document.addEventListener('DOMContentLoaded', async () => {
  // Sync state from cloud before rendering UI
  await store.initSupabase();

  // Initialize Modules
  initCalendar();
  initCRM();
  initTeam();
  initTracker();
  initQuotation();

  // --- Pseudo-Auth & Role Simulation ---
  const authOverlay = document.getElementById('auth-overlay');
  const authUsersList = document.getElementById('auth-users-list');
  const pinDialog = document.getElementById('pin-dialog');
  const pinInput = document.getElementById('auth-pin-input');
  const pinHint = document.getElementById('pin-hint');
  const btnPinCancel = document.getElementById('btn-pin-cancel');
  const btnPinSubmit = document.getElementById('btn-pin-submit');
  const roleSwitcher = document.getElementById('role-switcher');
  
  let pendingAuthRole = null;

  function renderAuthList() {
    if (!authUsersList) return;
    authUsersList.innerHTML = '';
    const team = store.getTeam();
    
    // Admin Button
    const adminBtn = document.createElement('button');
    adminBtn.className = 'auth-user-btn admin-login-btn';
    adminBtn.innerHTML = `<strong>Studio Manager (Admin)</strong>`;
    adminBtn.onclick = () => showPinDialog('admin');
    authUsersList.appendChild(adminBtn);

    // Team Buttons
    team.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'auth-user-btn';
      btn.innerHTML = `Login as <strong>${(t && t.name) ? t.name : 'Crew'}</strong>`;
      btn.onclick = () => showPinDialog(t.id);
      authUsersList.appendChild(btn);
    });
  }

  function populateRoleSwitcher() {
    if (!roleSwitcher) return;
    const team = store.getTeam();
    roleSwitcher.innerHTML = '<option value="admin">Admin</option>';
    team.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t && t.id ? t.id : '';
      opt.textContent = `As: ${(t && t.name) ? t.name.split(' ')[0] : 'Crew'}`;
      roleSwitcher.appendChild(opt);
    });
  }

  function showPinDialog(roleId) {
    pendingAuthRole = roleId;
    pinInput.value = '';
    if (roleId === 'admin') {
      pinHint.textContent = 'Admin PIN is 1234';
    } else {
      const member = store.getTeam().find(t => t && t.id === roleId);
      pinHint.textContent = `PIN is the last 4 digits of ${(member && member.name) ? member.name + "'s" : "your"} phone number.`;
    }
    pinDialog.showModal();
  }

  function handleLogin(roleId) {
    localStorage.setItem('loggedInUser', roleId);
    if (authOverlay) authOverlay.style.display = 'none';
    pinDialog.close();
    applyRoleRestrictions(roleId);
  }

  function handleLogout() {
    localStorage.removeItem('loggedInUser');
    if (authOverlay) authOverlay.style.display = 'flex';
    renderAuthList();
    if (roleSwitcher) {
      roleSwitcher.value = 'admin';
      roleSwitcher.style.display = '';
    }
  }

  function applyRoleRestrictions(roleId) {
    const adminElements = document.querySelectorAll('.admin-only');
    const subtitle = document.getElementById('app-subtitle');
    const sections = document.querySelectorAll('.view-section');
    
    if (roleId === 'admin') {
      adminElements.forEach(el => el.style.display = '');
      if (subtitle) subtitle.textContent = 'Studio Manager';
      if (roleSwitcher) roleSwitcher.style.display = '';
      
      const activeSection = document.querySelector('.view-section.active');
      if (activeSection && activeSection.id === 'crew-portal-view') {
        const calBtn = document.querySelector('.drawer-nav-item[data-target="calendar-view"]');
        if (calBtn) calBtn.click();
      }
    } else {
      adminElements.forEach(el => el.style.display = 'none');
      if (subtitle) subtitle.textContent = 'Crew Portal';
      if (roleSwitcher) {
        const actualLoggedInUser = localStorage.getItem('loggedInUser');
        if (actualLoggedInUser === 'admin') {
          roleSwitcher.style.display = ''; // Keep it visible for Admin preview
        } else {
          roleSwitcher.style.display = 'none'; // Hide it if it's actually the crew logged in
        }
      }
      
      sections.forEach(section => section.classList.remove('active'));
      const crewView = document.getElementById('crew-portal-view');
      if (crewView) crewView.classList.add('active');
      
      window.dispatchEvent(new CustomEvent('crewLogin', { detail: roleId }));
    }
  }

  // Auth Event Listeners
  if (btnPinCancel) btnPinCancel.onclick = () => pinDialog.close();
  if (btnPinSubmit) {
    btnPinSubmit.onclick = () => {
      const pin = pinInput.value;
      if (pendingAuthRole === 'admin') {
        if (pin === '1234') handleLogin('admin');
        else alert('Incorrect PIN');
      } else {
        const member = store.getTeam().find(t => t.id === pendingAuthRole);
        const expectedPin = member.phone.slice(-4);
        if (pin === expectedPin) handleLogin(pendingAuthRole);
        else alert('Incorrect PIN. Hint: Last 4 digits of phone number.');
      }
    };
  }
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  if (adminLogoutBtn) {
    adminLogoutBtn.onclick = () => {
      // Also close the side drawer when logging out
      const sideDrawer = document.getElementById('side-drawer');
      const drawerOverlay = document.getElementById('drawer-overlay');
      if (sideDrawer) sideDrawer.classList.remove('open');
      if (drawerOverlay) drawerOverlay.classList.remove('open');
      handleLogout();
    };
  }

  if (roleSwitcher) {
    roleSwitcher.addEventListener('change', (e) => applyRoleRestrictions(e.target.value));
  }

  // Secret Logout Mechanism (Triple click on "Wedding Nest" logo)
  const brandTitle = document.getElementById('app-brand-title');
  let logoClickCount = 0;
  let logoClickTimer = null;
  
  if (brandTitle) {
    brandTitle.addEventListener('click', () => {
      logoClickCount++;
      if (logoClickCount >= 3) {
        handleLogout();
        logoClickCount = 0;
      }
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
      }, 1500); // Reset after 1.5 seconds
    });
  }

  // Store Updates Listener
  window.addEventListener('storeUpdated', () => {
    if (authOverlay && authOverlay.style.display !== 'none') {
      renderAuthList();
    }
    if (roleSwitcher) {
      const currentVal = roleSwitcher.value;
      populateRoleSwitcher();
      if (Array.from(roleSwitcher.options).some(o => o.value === currentVal)) {
        roleSwitcher.value = currentVal;
      }
    }
  });

  // Init State
  populateRoleSwitcher();
  const currentUser = localStorage.getItem('loggedInUser');
  if (currentUser) {
    if (authOverlay) authOverlay.style.display = 'none';
    if (roleSwitcher && currentUser === 'admin') roleSwitcher.value = 'admin';
    applyRoleRestrictions(currentUser);
  } else {
    if (authOverlay) authOverlay.style.display = 'flex';
    renderAuthList();
  }

  // Theme Toggle Preference
  const savedTheme = localStorage.getItem('theme') || 'classic';
  if (savedTheme === 'neumorphic') {
    document.body.classList.add('theme-neumorphic');
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    const isNeumorphic = document.body.classList.toggle('theme-neumorphic');
    localStorage.setItem('theme', isNeumorphic ? 'neumorphic' : 'classic');
  });

  // Setup Side Drawer Navigation Toggles
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const sideDrawer = document.getElementById('side-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  function openDrawer() {
    sideDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    sideDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }

  if (menuToggleBtn) menuToggleBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // Setup Drawer Navigation
  const drawerNavItems = document.querySelectorAll('.drawer-nav-item');
  const sections = document.querySelectorAll('.view-section');

  drawerNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSectionId = item.getAttribute('data-target');
      
      // Update Tab active classes
      drawerNavItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show targeted view section with smooth transition
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSectionId) {
          section.classList.add('active');
        }
      });

      // Close drawer after selection
      closeDrawer();
    });
  });

  // Top header quick shortcut (Admin only)
  const shortcutBtn = document.getElementById('header-shortcut-btn');
  if (shortcutBtn) {
    shortcutBtn.classList.add('admin-only'); // Ensure it hides for crew
    shortcutBtn.addEventListener('click', () => {
      const summary = store.getFinancialSummary();
      const activeCount = store.getBookings().filter(b => b.status === 'booked').length;
      
      const pendingFeedback = store.getFeedback().filter(f => f.status === 'Pending');
      let feedbackText = '';
      if (pendingFeedback.length > 0) {
        feedbackText = `\n\n=== PENDING CREW FEEDBACK (${pendingFeedback.length}) ===\n`;
        const team = store.getTeam();
        pendingFeedback.forEach(f => {
          const tName = team.find(t => t.id === f.memberId)?.name || 'Crew';
          const b = store.getBooking(f.bookingId);
          const bName = b ? b.clientName : 'Unknown Shoot';
          feedbackText += `- ${tName} on "${bName}": "${f.message}"\n`;
          // Automatically mark resolved when admin views it to keep it simple for now
          store.resolveFeedback(f.id); 
        });
      }
    
      alert(`
=== WEDDING NEST STUDIO SYSTEM SUMMARY ===

Active Bookings: ${activeCount}
Total Revenue: ₹${summary.totalRevenue.toLocaleString()}
Total Studio Expenses: ₹${summary.totalExpenses.toLocaleString()}
Net Profit: ₹${summary.netProfit.toLocaleString()}
Profit Margin: ${Math.round(summary.profitMargin)}%
Outstanding Accounts: ₹${summary.remainingToCollect.toLocaleString()}${feedbackText}
      `);
    });
  }
});
