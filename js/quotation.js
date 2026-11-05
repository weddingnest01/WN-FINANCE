// Quotation Module

function initQuotation() {
  const quoteList = document.getElementById('quotation-list');
  const btnNewQuote = document.getElementById('btn-new-quotation');
  const quoteDialog = document.getElementById('quotation-dialog');
  const quoteForm = document.getElementById('quotation-form');
  const btnClose = document.getElementById('quotation-dialog-close');
  const btnCancel = document.getElementById('quotation-dialog-cancel');
  const itemsContainer = document.getElementById('qf-items-container');
  const btnAddItem = document.getElementById('btn-add-qf-item');
  
  if (!quoteList || !quoteDialog) return;

  let currentItems = [];
  let currentDays = [];
  
  const defaultDeliverables = [
    { id: 'deliv-sameday', label: 'SAME DAY COUPLE PHOTO EDITED FOR SOCIAL MEDIA', hasCount: false, checked: true },
    { id: 'deliv-weddingcouple', label: 'WEDDING COUPLE PHOTO EDITED', hasCount: false, checked: true },
    { id: 'deliv-solo', label: 'BRIDE & GROOM SOLO PICTURE EDITED', hasCount: false, checked: true },
    { id: 'deliv-social', label: 'COUPLE SOCIAL MEDIA POST EDITED', hasCount: false, checked: true },
    { id: 'deliv-highlight', label: 'WEDDING HIGHLIGHT', hasCount: true, count: 2, checked: true },
    { id: 'deliv-reels', label: 'REEL( EXTRA REELS PER REELS 1500)', hasCount: true, count: 4, checked: true },
    { id: 'deliv-pendrive', label: 'FULL WEDDING PART (PENDRIVE)', hasCount: false, checked: true }
  ];
  let currentDeliverables = [];

  const daysContainer = document.getElementById('qf-days-container');
  const deliverablesContainer = document.getElementById('qf-deliverables-container');
  const btnAddDay = document.getElementById('btn-add-qf-day');
  const btnAddDeliverable = document.getElementById('btn-add-qf-deliverable');

  function renderDaysInputs() {
    if (!daysContainer) return;
    daysContainer.innerHTML = '';
    currentDays.forEach((day, index) => {
      const card = document.createElement('div');
      card.style.border = '1px solid var(--border-gold)';
      card.style.borderRadius = '8px';
      card.style.padding = '12px';
      card.style.position = 'relative';
      
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '12px';
      
      const badgeInput = document.createElement('input');
      badgeInput.type = 'text';
      badgeInput.className = 'form-control';
      badgeInput.placeholder = 'e.g. DAY 1';
      badgeInput.value = day.badge || `DAY ${index + 1}`;
      badgeInput.style.width = '90px';
      badgeInput.style.fontWeight = 'bold';
      badgeInput.oninput = (e) => { currentDays[index].badge = e.target.value; };
      
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'form-control';
      titleInput.placeholder = 'e.g. MANDAP & SANGEET';
      titleInput.value = day.title || '';
      titleInput.style.flex = '1';
      titleInput.style.marginLeft = '8px';
      titleInput.oninput = (e) => { currentDays[index].title = e.target.value; };
      
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.innerHTML = '×';
      btnDel.style.background = 'transparent';
      btnDel.style.border = 'none';
      btnDel.style.color = 'var(--danger)';
      btnDel.style.fontSize = '1.2rem';
      btnDel.style.cursor = 'pointer';
      btnDel.style.marginLeft = '12px';
      btnDel.onclick = () => {
        currentDays.splice(index, 1);
        renderDaysInputs();
      };
      
      header.appendChild(badgeInput);
      header.appendChild(titleInput);
      header.appendChild(btnDel);
      card.appendChild(header);
      
      const reqGrid = document.createElement('div');
      reqGrid.style.display = 'grid';
      reqGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
      reqGrid.style.gap = '8px';
      
      const fields = [
        { id: 'tradPhoto', label: '📸 Trad Photo' },
        { id: 'tradVideo', label: '🎥 Trad Video' },
        { id: 'candPhoto', label: '📷 Candid Photo' },
        { id: 'cinema', label: '🎬 Cinema' },
        { id: 'drone', label: '🛸 Drone' },
        { id: 'famPhoto', label: '🧑‍🧑‍🧒 Fam Photo' },
        { id: 'ledScreen', label: '🖥️ LED Screen' },
        { id: 'plasmaTv', label: '📺 Plasma TV' }
      ];
      
      fields.forEach(f => {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.justifyContent = 'space-between';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '8px';
        
        const lbl = document.createElement('span');
        lbl.textContent = f.label;
        lbl.style.fontSize = '0.75rem';
        lbl.style.color = 'var(--text-primary)';
        
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '0';
        inp.max = '10';
        inp.value = day[f.id] || 0;
        inp.className = 'form-control';
        inp.style.width = '50px';
        inp.style.padding = '2px 6px';
        inp.style.textAlign = 'center';
        inp.style.height = '24px';
        inp.style.borderRadius = '4px';
        inp.style.border = '1px solid var(--border-gold)';
        inp.onfocus = () => inp.select();
        inp.oninput = (e) => { currentDays[index][f.id] = parseInt(e.target.value) || 0; };
        
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        reqGrid.appendChild(wrap);
      });
      
      card.appendChild(reqGrid);
      daysContainer.appendChild(card);
    });
  }

  if (btnAddDay) {
    btnAddDay.addEventListener('click', () => {
      currentDays.push({ 
        badge: `DAY ${currentDays.length + 1}`, title: '', tradPhoto: 0, tradVideo: 0, candPhoto: 0, cinema: 0, 
        drone: 0, famPhoto: 0, ledScreen: 0, plasmaTv: 0 
      });
      renderDaysInputs();
    });
  }

  function renderDeliverablesInputs() {
    if (!deliverablesContainer) return;
    deliverablesContainer.innerHTML = '';
    currentDeliverables.forEach((item, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = item.checked !== false;
      cb.onchange = (e) => { currentDeliverables[index].checked = e.target.checked; };
      
      row.appendChild(cb);

      if (item.isCustom) {
        const lblInput = document.createElement('input');
        lblInput.type = 'text';
        lblInput.className = 'form-control';
        lblInput.placeholder = 'Custom Deliverable Name';
        lblInput.value = item.label;
        lblInput.style.flex = '1';
        lblInput.style.height = '28px';
        lblInput.style.padding = '2px 8px';
        lblInput.oninput = (e) => { currentDeliverables[index].label = e.target.value; };
        row.appendChild(lblInput);
      } else {
        const lbl = document.createElement('span');
        lbl.textContent = item.label;
        lbl.style.flex = '1';
        lbl.style.fontSize = '0.85rem';
        lbl.style.color = 'var(--text-primary)';
        row.appendChild(lbl);
      }
      
      if (item.hasCount) {
        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.min = '0';
        numInput.value = item.count || 0;
        numInput.className = 'form-control';
        numInput.style.width = '60px';
        numInput.style.padding = '2px 8px';
        numInput.style.height = '28px';
        numInput.oninput = (e) => { currentDeliverables[index].count = parseInt(e.target.value) || 0; };
        
        row.appendChild(numInput);
      }

      if (item.isCustom) {
        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.innerHTML = '×';
        btnDel.style.background = 'transparent';
        btnDel.style.border = 'none';
        btnDel.style.color = 'var(--danger)';
        btnDel.style.fontSize = '1.2rem';
        btnDel.style.cursor = 'pointer';
        btnDel.onclick = () => {
          currentDeliverables.splice(index, 1);
          renderDeliverablesInputs();
        };
        row.appendChild(btnDel);
      }
      
      deliverablesContainer.appendChild(row);
    });
  }

  if (btnAddDeliverable) {
    btnAddDeliverable.addEventListener('click', () => {
      currentDeliverables.push({ id: 'custom-' + Date.now(), label: '', hasCount: false, checked: true, isCustom: true });
      renderDeliverablesInputs();
    });
  }

  function renderItemsInputs() {
    itemsContainer.innerHTML = '';
    currentItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';

      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.className = 'form-control';
      descInput.placeholder = 'Item Description';
      descInput.value = item.description;
      descInput.oninput = (e) => { currentItems[index].description = e.target.value; };
      descInput.style.flex = '1';

      const amtInput = document.createElement('input');
      amtInput.type = 'number';
      amtInput.className = 'form-control';
      amtInput.placeholder = '₹';
      amtInput.value = item.amount;
      amtInput.style.width = '80px';
      amtInput.oninput = (e) => { 
        currentItems[index].amount = parseFloat(e.target.value) || 0;
        calculateTotal();
      };

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.innerHTML = '×';
      btnDel.style.background = 'transparent';
      btnDel.style.border = 'none';
      btnDel.style.color = 'var(--danger)';
      btnDel.style.fontSize = '1.2rem';
      btnDel.style.cursor = 'pointer';
      btnDel.onclick = () => {
        currentItems.splice(index, 1);
        renderItemsInputs();
        calculateTotal();
      };

      row.appendChild(descInput);
      row.appendChild(amtInput);
      row.appendChild(btnDel);
      itemsContainer.appendChild(row);
    });
  }

  function calculateTotal() {
    const total = currentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    document.getElementById('qf-price').value = total;
  }

  btnAddItem.addEventListener('click', () => {
    currentItems.push({ description: '', amount: 0 });
    renderItemsInputs();
  });

  function openQuotationDialog(quoteId = null) {
    quoteForm.reset();
    currentItems = [];
    currentDays = [];
    currentDeliverables = JSON.parse(JSON.stringify(defaultDeliverables));
    document.getElementById('quotation-form-id').value = '';
    
    if (quoteId) {
      document.getElementById('quotation-dialog-title').textContent = 'Edit Quotation';
      const quote = store.getQuotations().find(q => q.id === quoteId);
      if (quote) {
        document.getElementById('quotation-form-id').value = quote.id;
        document.getElementById('qf-name').value = quote.clientName;
        document.getElementById('qf-phone').value = quote.phone || '';
        document.getElementById('qf-email').value = quote.email || '';
        document.getElementById('qf-start-date').value = quote.startDate || quote.date || '';
        document.getElementById('qf-end-date').value = quote.endDate || '';
        document.getElementById('qf-type').value = quote.type;
        document.getElementById('qf-venue').value = quote.venue;
        document.getElementById('qf-price').value = quote.packagePrice;
        
        if (quote.days) {
          currentDays = JSON.parse(JSON.stringify(quote.days));
        } else if (quote.servicesQuantities) {
          // Backward compatibility if days is missing but servicesQuantities exists
          currentDays.push({
            title: 'EVENT DAY',
            tradPhoto: quote.servicesQuantities.tradPhoto || 0,
            tradVideo: quote.servicesQuantities.tradVideo || 0,
            candPhoto: quote.servicesQuantities.candPhoto || 0,
            cinema: quote.servicesQuantities.cinema || 0,
            drone: quote.servicesQuantities.drone || 0,
            famPhoto: quote.servicesQuantities.famPhoto || 0,
            ledScreen: quote.servicesQuantities.ledScreen || 0,
            plasmaTv: quote.servicesQuantities.plasmaTv || 0
          });
        }

        if (quote.items) {
          currentItems = JSON.parse(JSON.stringify(quote.items));
        }
        
        if (quote.deliverables && quote.deliverables.length > 0) {
          currentDeliverables = JSON.parse(JSON.stringify(quote.deliverables));
        } else {
          currentDeliverables = JSON.parse(JSON.stringify(defaultDeliverables));
        }
      }
    } else {
      document.getElementById('quotation-dialog-title').textContent = 'Create Quotation';
      currentDays = [];
      currentItems = [];
      currentDeliverables = JSON.parse(JSON.stringify(defaultDeliverables));
    }
    
    renderItemsInputs();
    renderDaysInputs();
    renderDeliverablesInputs();
    checkQuoteDateAvailability();
    quoteDialog.showModal();
  }

  btnNewQuote.addEventListener('click', () => openQuotationDialog());
  btnClose.addEventListener('click', () => quoteDialog.close());
  btnCancel.addEventListener('click', () => quoteDialog.close());

  const qfStartDate = document.getElementById('qf-start-date');
  const qfEndDate = document.getElementById('qf-end-date');
  if (qfStartDate) qfStartDate.addEventListener('input', checkQuoteDateAvailability);
  if (qfEndDate) qfEndDate.addEventListener('input', checkQuoteDateAvailability);

  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('quotation-form-id').value;
    
    const quoteData = {
      clientName: document.getElementById('qf-name').value,
      phone: document.getElementById('qf-phone').value,
      email: document.getElementById('qf-email').value,
      date: document.getElementById('qf-start-date').value,
      startDate: document.getElementById('qf-start-date').value,
      endDate: document.getElementById('qf-end-date').value,
      type: document.getElementById('qf-type').value,
      venue: document.getElementById('qf-venue').value,
      packagePrice: parseFloat(document.getElementById('qf-price').value) || 0,
      days: currentDays,
      deliverables: currentDeliverables,
      items: currentItems.filter(i => i.description.trim() !== '')
    };

    if (id) {
      store.updateQuotation(id, quoteData);
    } else {
      store.addQuotation(quoteData);
    }
    quoteDialog.close();
    renderQuoteCalendar();
    renderQuotations();
  });

  function exportPDF(quote) {
    if (window.generatePremiumPDF) {
      window.generatePremiumPDF(quote);
    } else {
      console.error('PDF Generator not loaded');
      alert('PDF generation failed. Missing generator script.');
    }
  }

  // --- Quotation Date & Availability Management ---
  function formatQuoteDate(dateStr) {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatQuoteEventDate(quote) {
    if (!quote) return 'Date TBD';
    const start = quote.startDate || quote.date;
    const end = quote.endDate;
    if (!start) return 'Date TBD';
    if (end && end !== start) {
      return `${formatQuoteDate(start)} – ${formatQuoteDate(end)}`;
    }
    return formatQuoteDate(start);
  }

  function getYYYYMMDD(year, month, day) {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  function isDateInQuote(q, dateStr) {
    if (!q || !dateStr) return false;
    const start = q.startDate || q.date;
    if (!start) return false;
    const end = q.endDate || start;
    return dateStr >= start && dateStr <= end;
  }

  function isDateInBooking(b, dateStr) {
    if (!b || !dateStr) return false;
    const start = b.startDate || b.date;
    if (!start) return false;
    const end = b.endDate || start;
    return dateStr >= start && dateStr <= end;
  }

  const dateOverlaps = (s1, e1, s2, e2) => {
    const start1 = s1;
    const end1 = e1 || s1;
    const start2 = s2;
    const end2 = e2 || s2;
    return start1 <= end2 && end1 >= start2;
  };

  // Live Date Conflict / Availability Checker for Quote Form
  function checkQuoteDateAvailability() {
    const alertEl = document.getElementById('qf-date-alert');
    if (!alertEl) return;

    const startDate = document.getElementById('qf-start-date')?.value?.trim();
    const endDate = document.getElementById('qf-end-date')?.value?.trim() || startDate;
    const currentQuoteId = document.getElementById('quotation-form-id')?.value;

    if (!startDate) {
      alertEl.style.display = 'none';
      alertEl.innerHTML = '';
      return;
    }

    const quotations = (typeof store !== 'undefined' && store.getQuotations) ? store.getQuotations() : [];
    const bookings = (typeof store !== 'undefined' && store.getBookings) ? store.getBookings() : [];

    // Overlapping quotations (exclude current editing quote)
    const overlappingQuotes = quotations.filter(q => {
      if (currentQuoteId && q.id === currentQuoteId) return false;
      const qStart = q.startDate || q.date;
      if (!qStart) return false;
      const qEnd = q.endDate || qStart;
      return dateOverlaps(startDate, endDate, qStart, qEnd);
    });

    // Overlapping bookings
    const overlappingBookings = bookings.filter(b => {
      const bStart = b.startDate || b.date;
      if (!bStart) return false;
      const bEnd = b.endDate || bStart;
      return dateOverlaps(startDate, endDate, bStart, bEnd);
    });

    const confirmedFromQuotes = overlappingQuotes.filter(q => q.status === 'confirmed');
    const pendingQuotes = overlappingQuotes.filter(q => (q.status || 'pending') === 'pending');

    const hasConfirmedBookings = overlappingBookings.length > 0 || confirmedFromQuotes.length > 0;
    const hasPendingQuotes = pendingQuotes.length > 0;

    alertEl.style.display = 'block';

    if (hasConfirmedBookings) {
      alertEl.style.background = '#fef2f2';
      alertEl.style.border = '1.5px solid #f87171';
      alertEl.style.color = '#991b1b';

      let confirmedItems = [];
      overlappingBookings.forEach(b => {
        confirmedItems.push(`<strong>${b.clientName}</strong> (${b.type || 'Wedding'}${b.date ? ` • ${formatQuoteDate(b.date)}` : ''})`);
      });
      confirmedFromQuotes.forEach(q => {
        confirmedItems.push(`<strong>${q.clientName}</strong> (${q.type || 'Wedding'} • Confirmed Quote)`);
      });

      let pendingHtml = '';
      if (hasPendingQuotes) {
        pendingHtml = `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(153, 27, 27, 0.2); font-size: 0.74rem; color: #b45309;">
            ⚠️ <strong>Also ${pendingQuotes.length} Pending Quote(s):</strong> 
            ${pendingQuotes.map(q => `${q.clientName} (₹${(parseFloat(q.packagePrice) || 0).toLocaleString('en-IN')})`).join(', ')}
          </div>
        `;
      }

      alertEl.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1.1rem; line-height: 1;">🔴</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">
              Confirmed Booking Already Exists on this Date!
            </div>
            <div style="font-size: 0.76rem; line-height: 1.4; color: #7f1d1d;">
              ${confirmedItems.join('<br>')}
            </div>
            ${pendingHtml}
          </div>
        </div>
      `;
    } else if (hasPendingQuotes) {
      alertEl.style.background = '#fffbeb';
      alertEl.style.border = '1.5px solid #fcd34d';
      alertEl.style.color = '#92400e';

      const pendingDetails = pendingQuotes.map(q => {
        const p = (parseFloat(q.packagePrice) || 0).toLocaleString('en-IN');
        const f = q.type || 'Wedding';
        const d = formatQuoteEventDate(q);
        return `• <strong>${q.clientName}</strong> (${f} • ₹${p} • ${d})`;
      }).join('<br>');

      alertEl.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1.1rem; line-height: 1;">⚠️</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">
              ${pendingQuotes.length} Quotation${pendingQuotes.length > 1 ? 's' : ''} Already Sent for this Date:
            </div>
            <div style="font-size: 0.76rem; line-height: 1.4;">
              ${pendingDetails}
            </div>
          </div>
        </div>
      `;
    } else {
      alertEl.style.background = '#f0fdf4';
      alertEl.style.border = '1.5px solid #86efac';
      alertEl.style.color = '#166534';
      alertEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.05rem;">✅</span>
          <div style="font-weight: 600; font-size: 0.78rem;">
            Date Available: No conflicting quotations or bookings for this date.
          </div>
        </div>
      `;
    }
  }

  // --- Quotation Calendar State & Logic ---
  let quoteCalYear, quoteCalMonth; // 0-indexed month
  let quoteCalSelectedDate = null; // YYYY-MM-DD or null
  let currentQuoteStatusFilter = 'all';

  function initQuoteCalendar() {
    const monthSelect = document.getElementById('quote-cal-month-select');
    const yearSelect = document.getElementById('quote-cal-year-select');

    const today = new Date();
    quoteCalYear = today.getFullYear();
    quoteCalMonth = today.getMonth();

    if (monthSelect) {
      monthSelect.value = String(quoteCalMonth);
      monthSelect.addEventListener('change', (e) => {
        quoteCalMonth = parseInt(e.target.value, 10);
        renderQuoteCalendar();
      });
    }

    if (yearSelect) {
      yearSelect.value = String(quoteCalYear);
      yearSelect.addEventListener('change', (e) => {
        quoteCalYear = parseInt(e.target.value, 10);
        renderQuoteCalendar();
      });
    }

    // Status Filter Pills
    const pills = document.querySelectorAll('.quote-filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => {
          p.classList.remove('active');
          p.style.background = '#fff';
          const f = p.dataset.filter;
          p.style.color = f === 'pending' ? '#d97706' : (f === 'confirmed' ? '#16a34a' : (f === 'lost' ? '#ef4444' : 'var(--text-secondary)'));
          p.style.borderColor = f === 'pending' ? 'rgba(217,119,6,0.35)' : (f === 'confirmed' ? 'rgba(22,163,74,0.35)' : (f === 'lost' ? 'rgba(239,68,68,0.35)' : 'rgba(204,192,163,0.5)'));
        });
        pill.classList.add('active');
        pill.style.background = 'var(--text-primary)';
        pill.style.color = '#fff';
        pill.style.borderColor = 'var(--text-primary)';
        currentQuoteStatusFilter = pill.dataset.filter;
        renderQuotations();
      });
    });
  }

  function renderQuoteCalendar() {
    const daysGrid = document.getElementById('quote-calendar-days-grid');
    const monthSelect = document.getElementById('quote-cal-month-select');
    const yearSelect = document.getElementById('quote-cal-year-select');
    if (!daysGrid) return;

    if (monthSelect) monthSelect.value = String(quoteCalMonth);
    if (yearSelect) yearSelect.value = String(quoteCalYear);

    daysGrid.innerHTML = '';

    const firstDay = new Date(quoteCalYear, quoteCalMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = new Date(quoteCalYear, quoteCalMonth + 1, 0).getDate();
    const prevMonthDays = new Date(quoteCalYear, quoteCalMonth, 0).getDate();

    const allQuotes = (typeof store !== 'undefined' && store.getQuotations) ? store.getQuotations() : [];
    const allBookings = (typeof store !== 'undefined' && store.getBookings) ? store.getBookings() : [];

    const now = new Date();
    const todayStr = getYYYYMMDD(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // 1. Previous Month Padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.textContent = dayNum;
      daysGrid.appendChild(cell);
    }

    // 2. Current Month Days
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const cellDate = getYYYYMMDD(quoteCalYear, quoteCalMonth + 1, dayNum);
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.textContent = dayNum;

      if (cellDate === todayStr) {
        cell.classList.add('today');
      }

      if (cellDate === quoteCalSelectedDate) {
        cell.classList.add('selected');
      }

      // Match quotes & bookings for this cell date
      const dayQuotes = allQuotes.filter(q => isDateInQuote(q, cellDate));
      const dayBookings = allBookings.filter(b => isDateInBooking(b, cellDate));

      const pendingQuotes = dayQuotes.filter(q => (q.status || 'pending') === 'pending');
      const confirmedQuotes = dayQuotes.filter(q => q.status === 'confirmed');
      const confirmedTotal = confirmedQuotes.length + dayBookings.length;
      const pendingTotal = pendingQuotes.length;

      if (confirmedTotal > 0 && pendingTotal > 0) {
        cell.classList.add('has-both-quotes');
        cell.innerHTML = `
          ${dayNum}
          <span class="quote-mark-badge multi-confirmed" title="${confirmedTotal} Confirmed">${confirmedTotal}</span>
          <span class="quote-mark-badge pending" title="${pendingTotal} Quotes Sent">${pendingTotal}</span>
        `;
      } else if (confirmedTotal > 0) {
        cell.classList.add('has-confirmed-quote');
        cell.innerHTML = `
          ${dayNum}
          <span class="quote-mark-badge confirmed" title="${confirmedTotal} Confirmed">${confirmedTotal}</span>
        `;
      } else if (pendingTotal > 0) {
        cell.classList.add('has-pending-quote');
        cell.innerHTML = `
          ${dayNum}
          <span class="quote-mark-badge pending" title="${pendingTotal} Quotes Sent">${pendingTotal}</span>
        `;
      }

      // Single click: filter quotation list below to this date (or unselect)
      cell.addEventListener('click', () => {
        if (quoteCalSelectedDate === cellDate) {
          quoteCalSelectedDate = null;
        } else {
          quoteCalSelectedDate = cellDate;
        }
        renderQuoteCalendar();
        renderQuotations();
      });

      // Double click: open new quotation modal with start date set to this date
      cell.addEventListener('dblclick', () => {
        openQuotationDialog();
        const sInput = document.getElementById('qf-start-date');
        const eInput = document.getElementById('qf-end-date');
        if (sInput) sInput.value = cellDate;
        if (eInput) eInput.value = cellDate;
        checkQuoteDateAvailability();
      });

      daysGrid.appendChild(cell);
    }

    // 3. Next Month Padding
    const totalCellsRendered = startDayOfWeek + totalDays;
    const remainingCells = totalCellsRendered % 7 === 0 ? 0 : 7 - (totalCellsRendered % 7);
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.textContent = dayNum;
      daysGrid.appendChild(cell);
    }
  }

  // --- Quotation Flat List Rendering ("sab sath me tha vesa") ---
  function renderQuotations() {
    if (!quoteList) return;
    const allQuotes = (typeof store !== 'undefined' && store.getQuotations) ? store.getQuotations() : [];

    // Ensure default status
    allQuotes.forEach(q => { if (!q.status) q.status = 'pending'; });

    // 1. Status Filter
    let filtered = allQuotes;
    if (currentQuoteStatusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === currentQuoteStatusFilter);
    }

    // 2. Calendar Date Filter
    if (quoteCalSelectedDate) {
      filtered = filtered.filter(q => isDateInQuote(q, quoteCalSelectedDate));
    }

    // Update Active Filter Label
    const labelEl = document.getElementById('quote-active-filter-label');
    if (labelEl) {
      if (quoteCalSelectedDate) {
        labelEl.innerHTML = `
          <span>Function Date: <strong>${formatQuoteDate(quoteCalSelectedDate)}</strong> (${filtered.length} Quote${filtered.length === 1 ? '' : 's'})</span>
          <button type="button" onclick="window.clearQuoteDateFilter()" style="margin-left: 8px; padding: 2px 8px; font-size: 0.7rem; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 4px; cursor: pointer; font-weight: 600;">✖ Show All</button>
        `;
      } else {
        labelEl.innerHTML = `All Quotations <span style="font-size:0.75rem; color:#64748b; font-weight:500;">(${filtered.length})</span>`;
      }
    }

    // Calculate Metrics
    const total = filtered.length;
    const pending = filtered.filter(q => q.status === 'pending').length;
    const confirmed = filtered.filter(q => q.status === 'confirmed').length;
    const totalValue = filtered.reduce((sum, q) => sum + (parseFloat(q.packagePrice) || 0), 0);

    const metricsContainer = document.getElementById('quotation-metrics');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div style="background: rgba(255,255,255,0.85); padding: 12px; border-radius: 8px; border: 1px solid var(--border-gold); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${total}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Quotations (₹${totalValue.toLocaleString('en-IN')})</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.08); padding: 12px; border-radius: 8px; border: 1px solid var(--warning); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--warning);">${pending}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Pending</div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.08); padding: 12px; border-radius: 8px; border: 1px solid var(--success); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--success);">${confirmed}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Confirmed</div>
        </div>
      `;
    }

    // Empty state
    if (filtered.length === 0) {
      quoteList.innerHTML = `
        <div style="text-align:center; padding:40px 20px; background:#fff; border-radius:12px; border:1px dashed rgba(204,192,163,0.8); margin-top:8px;">
          <div style="font-size:2.5rem; margin-bottom:8px; opacity:0.6;">📄</div>
          <h3 style="font-size:1.05rem; color:#02303A; margin:0 0 6px 0;">No Quotations Found</h3>
          <p style="margin:0 0 14px 0; color:#64748b; font-size:0.8rem;">
            ${quoteCalSelectedDate ? `No quotations scheduled for ${formatQuoteDate(quoteCalSelectedDate)}.` : 'No quotations match the selected status filter.'}
          </p>
          ${quoteCalSelectedDate ? `<button type="button" onclick="window.clearQuoteDateFilter()" class="btn btn-sm" style="background:#02303A; color:#FAF8F5; padding:6px 16px; border-radius:6px; font-size:0.78rem; cursor:pointer; border:none;">Show All Quotations</button>` : ''}
        </div>
      `;
      return;
    }

    quoteList.innerHTML = '';

    // Helper to get Quote Creation / Sending timestamp
    const getQuoteCreatedTime = (q) => {
      if (!q) return 0;
      if (q.createdAt) {
        const t = new Date(q.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (q.id && typeof q.id === 'string' && q.id.startsWith('q-')) {
        const raw = q.id.replace('q-', '');
        const t = parseInt(raw, 10);
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };

    // Sort quotations by Quote Sending Date descending ("aaj banaya huva quote uper fir niche niche asa")
    const sortedQuotes = [...filtered].sort((a, b) => {
      const timeA = getQuoteCreatedTime(a);
      const timeB = getQuoteCreatedTime(b);
      return timeB - timeA;
    });

    // Render Flat List of Cards ("sab sath me tha vesa")
    sortedQuotes.forEach(quote => {
      const card = document.createElement('div');
      card.className = 'booking-card';
      card.style.cursor = 'default';
      card.style.marginBottom = '12px';
      if (quote.status === 'confirmed' || quote.status === 'lost') card.style.opacity = '0.8';

      const eventDateStr = formatQuoteEventDate(quote);
      const functionName = quote.type || 'Wedding';
      const createdStr = quote.createdAt 
        ? formatQuoteDate(quote.createdAt) 
        : (quote.id && quote.id.startsWith('q-') ? formatQuoteDate(new Date(parseInt(quote.id.replace('q-', ''), 10)).toISOString()) : '');

      const isConfirmed = quote.status === 'confirmed';
      const isLost = quote.status === 'lost';
      const isPending = (quote.status || 'pending') === 'pending';

      let statusBadge = '';
      if (isConfirmed) statusBadge = `<span class="badge" style="background: var(--success); color: white; border: none;">Confirmed</span>`;
      else if (isLost) statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid var(--danger);">Archived / Lost</span>`;
      else statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid var(--warning);">Pending</span>`;

      const confirmBtnHtml = isPending 
        ? `<button class="btn btn-sm" onclick="window.confirmQuote('${quote.id}')" style="flex:1.5; background: var(--success); color: white; border: none;">Confirm Order</button>` 
        : '';
        
      const archiveBtnHtml = isPending
        ? `<button class="btn btn-sm btn-secondary" onclick="window.archiveQuote('${quote.id}')" style="flex:0.8; color: var(--danger); border-color: rgba(244,63,94,0.3);">Mark Lost</button>`
        : '';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 class="booking-client" style="cursor:pointer;" onclick="window.editQuote('${quote.id}')">${quote.clientName}</h3>
            <div class="booking-meta" style="margin-top:4px; display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
              ${statusBadge}
              ${createdStr ? `<span style="font-size:0.75rem; color:#64748b; font-weight:600;">📨 Sent: ${createdStr}</span>` : ''}
              ${quote.phone ? `<span style="font-size:0.75rem; color:#64748b; font-weight:500;">📞 ${quote.phone}</span>` : ''}
            </div>
            <div style="font-size:0.82rem; margin-top:8px; line-height:1.5;">
              <span style="font-weight:700; color:#02303A;">🎉 Function:</span> <span style="color:#1e293b; font-weight:600;">${functionName}</span>
              <span style="margin:0 6px; color:#cbd5e1;">•</span>
              <span style="font-weight:700; color:#02303A;">🗓️ Event Date:</span> <span style="color:#1e293b; font-weight:600;">${eventDateStr}</span>
              <div style="color:var(--text-secondary); font-size:0.78rem; margin-top:2px;">
                📍 ${quote.venue || 'Surat'}
              </div>
            </div>
          </div>
          <div style="font-size:1.15rem; font-weight:700; color:#02303A; text-align:right;">
            ₹${(parseFloat(quote.packagePrice) || 0).toLocaleString('en-IN')}
            <div style="margin-top: 8px; display: flex; gap: 4px; justify-content: flex-end;">
              <button class="btn btn-sm btn-secondary" onclick="window.editQuote('${quote.id}')" style="padding: 2px 8px; font-size: 0.7rem;">Edit</button>
              <button class="btn btn-sm btn-secondary" onclick="window.deleteQuote('${quote.id}')" style="padding: 2px 8px; font-size: 0.7rem; color: var(--danger); border-color: rgba(244,63,94,0.3);">Delete</button>
            </div>
          </div>
        </div>
        
        <hr style="border: 0; height: 1px; background: rgba(0,0,0,0.05); margin: 12px 0;">
        
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <button class="btn btn-sm btn-secondary" onclick="window.exportQuote('${quote.id}')" style="flex:1;">PDF</button>
          ${confirmBtnHtml}
          ${archiveBtnHtml}
        </div>
      `;
      quoteList.appendChild(card);
    });
  }

  // Global handlers for buttons
  window.editQuote = (id) => openQuotationDialog(id);
  window.deleteQuote = (id) => {
    if (confirm('Are you sure you want to permanently delete this quotation?')) {
      store.deleteQuotation(id);
      renderQuoteCalendar();
      renderQuotations();
    }
  };
  window.archiveQuote = (id) => {
    if (confirm('Are you sure you want to mark this quotation as lost/archived? It will be moved to history.')) {
      store.markQuotationLost(id);
      renderQuoteCalendar();
      renderQuotations();
    }
  };
  window.confirmQuote = (id) => {
    const quote = (typeof store !== 'undefined' && store.getQuotations) ? store.getQuotations().find(q => q.id === id) : null;
    if (!quote) return;
    document.getElementById('cqf-quote-id').value = id;
    document.getElementById('cqf-final-price').value = quote.packagePrice;
    document.getElementById('confirm-quote-dialog').showModal();
  };

  const confirmQuoteForm = document.getElementById('confirm-quote-form');
  if (confirmQuoteForm) {
    confirmQuoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('cqf-quote-id').value;
      const finalPrice = parseFloat(document.getElementById('cqf-final-price').value) || 0;
      
      store.confirmQuotation(id, finalPrice);
      document.getElementById('confirm-quote-dialog').close();
      renderQuoteCalendar();
      renderQuotations();
      
      // Auto-switch to CRM view
      document.querySelector('.drawer-nav-item[data-target="crm-view"]').click();
    });
  }
  window.exportQuote = (id) => {
    const quote = (typeof store !== 'undefined' && store.getQuotations) ? store.getQuotations().find(q => q.id === id) : null;
    if (quote) {
      exportPDF(quote);
    }
  };

  window.clearQuoteDateFilter = () => {
    quoteCalSelectedDate = null;
    renderQuoteCalendar();
    renderQuotations();
  };
  window.renderQuotations = renderQuotations;
  window.renderQuoteCalendar = renderQuoteCalendar;

  // Initialize Quote Calendar and Render Quotations
  initQuoteCalendar();

  // Support URL testing parameters
  const quoteUrlParams = new URLSearchParams(window.location.search);
  if (quoteUrlParams.get('q_month') !== null) {
    quoteCalMonth = parseInt(quoteUrlParams.get('q_month'), 10);
  }
  if (quoteUrlParams.get('q_year') !== null) {
    quoteCalYear = parseInt(quoteUrlParams.get('q_year'), 10);
  }
  if (quoteUrlParams.get('q_date') !== null) {
    quoteCalSelectedDate = quoteUrlParams.get('q_date');
  }
  if (quoteUrlParams.get('q_modal_date') !== null) {
    setTimeout(() => {
      openQuotationDialog();
      const sInput = document.getElementById('qf-start-date');
      const eInput = document.getElementById('qf-end-date');
      if (sInput) sInput.value = quoteUrlParams.get('q_modal_date');
      if (eInput) eInput.value = quoteUrlParams.get('q_modal_date');
      checkQuoteDateAvailability();
    }, 400);
  }

  renderQuoteCalendar();
  renderQuotations();

  window.addEventListener('storeUpdated', () => {
    renderQuoteCalendar();
    renderQuotations();
  });
}
