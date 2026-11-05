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
    quoteDialog.showModal();
  }

  btnNewQuote.addEventListener('click', () => openQuotationDialog());
  btnClose.addEventListener('click', () => quoteDialog.close());
  btnCancel.addEventListener('click', () => quoteDialog.close());

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

  // --- Quotation Date & Filter Management ---
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

  function formatQuoteFullDate(dateStr) {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getQuoteRunningMonth() {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return { ym, label: `${monthNames[now.getMonth()]} ${now.getFullYear()}` };
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

  const runningMonth = getQuoteRunningMonth();
  let currentQuoteDateFilter = {
    type: 'month',
    ym: runningMonth.ym,
    label: `${runningMonth.label} (Running Month)`
  };
  let currentQuoteStatusFilter = 'all';

  function getQuoteDateKey(quote) {
    if (!quote) return '';
    if (quote.createdAt) return quote.createdAt.split('T')[0];
    return quote.date || quote.startDate || '';
  }

  function initQuoteDatePicker() {
    const btn = document.getElementById('quote-date-picker-btn');
    const popover = document.getElementById('quote-date-popover');
    const customDateInput = document.getElementById('quote-custom-date');
    const btnApplyCustom = document.getElementById('quote-btn-apply-custom-date');
    const searchInput = document.getElementById('quote-search');

    if (btn && popover) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = popover.style.display === 'block';
        popover.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) populateQuoteDatePopover();
      });

      document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !btn.contains(e.target)) {
          popover.style.display = 'none';
        }
      });

      popover.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (btnApplyCustom && customDateInput) {
      btnApplyCustom.addEventListener('click', () => {
        const val = customDateInput.value;
        if (!val) return;
        const quotes = store.getQuotations() || [];
        const matchCount = quotes.filter(q => getQuoteDateKey(q) === val).length;
        currentQuoteDateFilter = {
          type: 'date',
          date: val,
          label: `${formatQuoteDate(val)} (${matchCount} Quotes Sent)`
        };
        if (popover) popover.style.display = 'none';
        updateQuoteDateDisplay();
        populateQuoteDatePopover();
        renderQuotations();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderQuotations();
      });
    }

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

  function populateQuoteDatePopover() {
    const allBtnContainer = document.getElementById('quote-popover-all-btn');
    const monthListContainer = document.getElementById('quote-month-pills-list');
    const dateListContainer = document.getElementById('quote-date-pills-list');
    if (!monthListContainer || !dateListContainer) return;

    const quotes = store.getQuotations() || [];
    const running = getQuoteRunningMonth();

    // 1. All Quotations Button
    if (allBtnContainer) {
      allBtnContainer.innerHTML = '';
      const isAllActive = currentQuoteDateFilter.type === 'all';
      const allBtn = document.createElement('div');
      allBtn.style.padding = '8px 10px';
      allBtn.style.borderRadius = '8px';
      allBtn.style.cursor = 'pointer';
      allBtn.style.display = 'flex';
      allBtn.style.justifyContent = 'space-between';
      allBtn.style.alignItems = 'center';
      allBtn.style.fontWeight = '600';
      allBtn.style.fontSize = '0.78rem';
      allBtn.style.border = '1px solid ' + (isAllActive ? '#02303A' : 'rgba(204,192,163,0.4)');
      allBtn.style.background = isAllActive ? '#02303A' : '#f8fafc';
      allBtn.style.color = isAllActive ? '#fff' : '#02303A';
      allBtn.style.marginBottom = '6px';
      allBtn.innerHTML = `<span>All Quotations</span> <span style="font-size:0.7rem; opacity:0.85;">${quotes.length} Quotes</span>`;
      allBtn.addEventListener('click', () => {
        currentQuoteDateFilter = { type: 'all', label: `All Quotations (${quotes.length} Quotes)` };
        const pop = document.getElementById('quote-date-popover');
        if (pop) pop.style.display = 'none';
        updateQuoteDateDisplay();
        populateQuoteDatePopover();
        renderQuotations();
      });
      allBtnContainer.appendChild(allBtn);
    }

    // 2. Aggregate by Month & by Date
    const monthMap = new Map();
    monthMap.set(running.ym, { count: 0, label: running.label });

    const dateMap = new Map(); // 'YYYY-MM-DD' => { count, totalAmount }

    quotes.forEach(q => {
      const d = getQuoteDateKey(q);
      if (!d) return;
      const ym = d.substring(0, 7);
      if (!monthMap.has(ym)) {
        const parts = ym.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthMap.set(ym, { count: 0, label: `${monthNames[m]} ${y}` });
      }
      monthMap.get(ym).count += 1;

      if (!dateMap.has(d)) {
        dateMap.set(d, { count: 0, totalAmount: 0 });
      }
      const dObj = dateMap.get(d);
      dObj.count += 1;
      dObj.totalAmount += (parseFloat(q.packagePrice) || 0);
    });

    // Render Month pills
    monthListContainer.innerHTML = '';
    const sortedYms = Array.from(monthMap.keys()).sort().reverse();
    sortedYms.forEach(ym => {
      const data = monthMap.get(ym);
      const isActive = currentQuoteDateFilter.type === 'month' && currentQuoteDateFilter.ym === ym;
      const isRunning = ym === running.ym;
      const btn = document.createElement('div');
      btn.style.padding = '7px 10px';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.justifyContent = 'space-between';
      btn.style.alignItems = 'center';
      btn.style.fontSize = '0.76rem';
      btn.style.fontWeight = '600';
      btn.style.background = isActive ? '#02303A' : '#fff';
      btn.style.color = isActive ? '#fff' : '#02303A';
      btn.style.border = '1px solid ' + (isActive ? '#02303A' : 'rgba(204,192,163,0.3)');

      const countTag = isRunning 
        ? `<span style="background:${isActive ? '#fff' : '#02303A'}; color:${isActive ? '#02303A' : '#fff'}; font-size:0.6rem; padding:1px 6px; border-radius:10px; font-weight:700;">Running • ${data.count}</span>`
        : `<span style="opacity:0.8; font-size:0.7rem;">${data.count} ${data.count === 1 ? 'Quote' : 'Quotes'}</span>`;

      btn.innerHTML = `<span>${data.label}</span> ${countTag}`;
      btn.addEventListener('click', () => {
        currentQuoteDateFilter = {
          type: 'month',
          ym: ym,
          label: isRunning ? `${data.label} (Running Month)` : `${data.label} (${data.count} Quotes)`
        };
        const pop = document.getElementById('quote-date-popover');
        if (pop) pop.style.display = 'none';
        updateQuoteDateDisplay();
        populateQuoteDatePopover();
        renderQuotations();
      });
      monthListContainer.appendChild(btn);
    });

    // Render Date pills (Dates with quotes sent)
    // If a month is selected, filter dates to that month! If 'all' or a specific date, show all dates or the month of that date.
    let targetYm = null;
    if (currentQuoteDateFilter.type === 'month') {
      targetYm = currentQuoteDateFilter.ym;
    } else if (currentQuoteDateFilter.type === 'date') {
      targetYm = currentQuoteDateFilter.date.substring(0, 7);
    }

    const dateListTitle = document.getElementById('quote-date-list-title');
    let datesToShow = Array.from(dateMap.keys()).sort().reverse();
    if (targetYm) {
      datesToShow = datesToShow.filter(d => d.startsWith(targetYm));
      if (dateListTitle) {
        const mInfo = monthMap.get(targetYm);
        dateListTitle.textContent = mInfo ? `Quotes Sent in ${mInfo.label}` : 'Quotes by Specific Date';
      }
    } else {
      if (dateListTitle) dateListTitle.textContent = 'Quotes by Specific Date (All)';
    }

    dateListContainer.innerHTML = '';
    if (datesToShow.length === 0) {
      dateListContainer.innerHTML = '<div style="font-size:0.72rem; color:#94a3b8; text-align:center; padding:8px;">No quotes sent in this period</div>';
    } else {
      datesToShow.forEach(d => {
        const data = dateMap.get(d);
        const isActive = currentQuoteDateFilter.type === 'date' && currentQuoteDateFilter.date === d;
        const btn = document.createElement('div');
        btn.style.padding = '6px 8px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.style.fontSize = '0.74rem';
        btn.style.background = isActive ? '#02303A' : '#f8fafc';
        btn.style.color = isActive ? '#fff' : '#1e293b';
        btn.style.border = '1px solid ' + (isActive ? '#02303A' : '#e2e8f0');

        btn.innerHTML = `
          <span style="font-weight:600;">📅 ${formatQuoteDate(d)}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="background:${isActive ? '#fff' : '#02303A'}; color:${isActive ? '#02303A' : '#fff'}; font-size:0.65rem; font-weight:700; padding:1px 6px; border-radius:10px;">
              ${data.count} ${data.count === 1 ? 'Quote' : 'Quotes'}
            </span>
            <span style="font-size:0.68rem; opacity:0.8;">₹${data.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        `;

        btn.addEventListener('click', () => {
          currentQuoteDateFilter = {
            type: 'date',
            date: d,
            label: `${formatQuoteDate(d)} (${data.count} Quotes Sent)`
          };
          const pop = document.getElementById('quote-date-popover');
          if (pop) pop.style.display = 'none';
          updateQuoteDateDisplay();
          populateQuoteDatePopover();
          renderQuotations();
        });

        dateListContainer.appendChild(btn);
      });
    }

    updateQuoteDateDisplay();
  }

  function updateQuoteDateDisplay() {
    const display = document.getElementById('quote-date-display');
    if (display && currentQuoteDateFilter) {
      display.textContent = currentQuoteDateFilter.label || 'All Quotations';
    }
  }

  // --- Quotation List Rendering ---
  function renderQuotations() {
    if (!quoteList) return;
    const allQuotes = store.getQuotations() || [];
    
    // Ensure backwards compatibility
    allQuotes.forEach(q => { if (!q.status) q.status = 'pending'; });

    const searchQuery = (document.getElementById('quote-search')?.value || '').toLowerCase().trim();

    // 1. Filter by Status
    let filtered = allQuotes;
    if (currentQuoteStatusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === currentQuoteStatusFilter);
    }

    // 2. Filter by Search
    if (searchQuery) {
      filtered = filtered.filter(q => {
        const client = (q.clientName || '').toLowerCase();
        const phone = (q.phone || '').toLowerCase();
        const venue = (q.venue || '').toLowerCase();
        const type = (q.type || '').toLowerCase();
        const sDate = (q.date || '').toLowerCase();
        const cDate = (q.createdAt || '').toLowerCase();
        return client.includes(searchQuery) || phone.includes(searchQuery) || venue.includes(searchQuery) || type.includes(searchQuery) || sDate.includes(searchQuery) || cDate.includes(searchQuery);
      });
    }

    // 3. Filter by Date (Sent Date or Shoot Date)
    if (currentQuoteDateFilter.type === 'month') {
      filtered = filtered.filter(q => {
        const d = getQuoteDateKey(q);
        return d && d.startsWith(currentQuoteDateFilter.ym);
      });
    } else if (currentQuoteDateFilter.type === 'date') {
      filtered = filtered.filter(q => {
        const d = getQuoteDateKey(q);
        return d === currentQuoteDateFilter.date;
      });
    }

    // Calculate metrics
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

    const subtitle = document.getElementById('quote-period-subtitle');
    if (subtitle) {
      subtitle.textContent = `Viewing: ${currentQuoteDateFilter.label}`;
    }

    // Empty state
    if (filtered.length === 0) {
      const isMonthOrDate = currentQuoteDateFilter.type !== 'all';
      quoteList.innerHTML = `
        <div style="text-align:center; padding:40px 20px; background:#fff; border-radius:12px; border:1px dashed rgba(204,192,163,0.8); margin-top:8px;">
          <div style="font-size:2.5rem; margin-bottom:8px; opacity:0.6;">📄</div>
          <h3 style="font-size:1.05rem; color:#02303A; margin:0 0 6px 0;">No Quotations Found</h3>
          <p style="margin:0 0 14px 0; color:#64748b; font-size:0.8rem;">
            ${isMonthOrDate ? `No quotations match ${currentQuoteDateFilter.label}. Click below to view all historical quotations.` : 'No quotations match your current search or status filter.'}
          </p>
          <button type="button" class="btn btn-sm btn-quote-show-all" style="background:#02303A; color:#FAF8F5; padding:6px 16px; border-radius:6px; font-size:0.78rem; cursor:pointer; border:none;">View All Quotations (${allQuotes.length})</button>
        </div>
      `;
      const btnShowAll = quoteList.querySelector('.btn-quote-show-all');
      if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
          currentQuoteDateFilter = { type: 'all', label: `All Quotations (${allQuotes.length} Quotes)` };
          updateQuoteDateDisplay();
          populateQuoteDatePopover();
          renderQuotations();
        });
      }
      return;
    }

    quoteList.innerHTML = '';

    // Group filtered quotes by Date Key
    const groupsMap = new Map();
    filtered.forEach(q => {
      const d = getQuoteDateKey(q) || 'No Date';
      if (!groupsMap.has(d)) {
        groupsMap.set(d, []);
      }
      groupsMap.get(d).push(q);
    });

    // Sort date groups descending
    const sortedDateKeys = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === 'No Date') return 1;
      if (b === 'No Date') return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    });

    sortedDateKeys.forEach(dateKey => {
      const groupQuotes = groupsMap.get(dateKey);
      const groupTotal = groupQuotes.reduce((sum, q) => sum + (parseFloat(q.packagePrice) || 0), 0);

      const groupWrapper = document.createElement('div');
      groupWrapper.className = 'quote-date-group';
      groupWrapper.style.marginBottom = '20px';

      // Header Bar for this Date
      const dateHeader = document.createElement('div');
      dateHeader.className = 'quote-date-group-header';
      dateHeader.style.display = 'flex';
      dateHeader.style.justifyContent = 'space-between';
      dateHeader.style.alignItems = 'center';
      dateHeader.style.background = '#FAF8F5';
      dateHeader.style.border = '1px solid rgba(204,192,163,0.6)';
      dateHeader.style.padding = '8px 12px';
      dateHeader.style.borderRadius = '8px';
      dateHeader.style.marginBottom = '10px';

      const modeBadgeText = `${groupQuotes.length} ${groupQuotes.length === 1 ? 'QUOTATION SENT' : 'QUOTATIONS SENT'}`;

      dateHeader.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.1rem;">📅</span>
          <div>
            <div style="font-weight:700; color:#02303A; font-size:0.86rem; line-height:1.2;">
              ${dateKey === 'No Date' ? 'Undated Proposals' : formatQuoteFullDate(dateKey)}
            </div>
            <div style="font-size:0.62rem; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
              Date Sent
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="background:#02303A; color:#FAF8F5; font-size:0.68rem; font-weight:700; padding:3px 9px; border-radius:12px; letter-spacing:0.3px;">
            ${modeBadgeText}
          </span>
          <span style="font-size:0.75rem; font-weight:700; color:#1e293b;">₹${groupTotal.toLocaleString('en-IN')}</span>
        </div>
      `;
      groupWrapper.appendChild(dateHeader);

      // Render cards for this date
      groupQuotes.forEach(quote => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.style.cursor = 'default';
        card.style.marginBottom = '8px';
        if (quote.status === 'confirmed' || quote.status === 'lost') card.style.opacity = '0.75';
        
        const eventDateStr = formatQuoteEventDate(quote);
        const functionName = quote.type || 'Wedding';

        const isConfirmed = quote.status === 'confirmed';
        const isLost = quote.status === 'lost';
        const isPending = quote.status === 'pending';
        
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
              <div class="booking-meta" style="margin-top:4px;">
                ${statusBadge}
                ${quote.phone ? `<span style="font-size:0.75rem; color:#64748b; margin-left:8px; font-weight:500;">📞 ${quote.phone}</span>` : ''}
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
        groupWrapper.appendChild(card);
      });

      quoteList.appendChild(groupWrapper);
    });
  }

  // Global handlers for buttons
  window.editQuote = (id) => openQuotationDialog(id);
  window.deleteQuote = (id) => {
    if (confirm('Are you sure you want to permanently delete this quotation?')) {
      store.deleteQuotation(id);
      populateQuoteDatePopover();
      renderQuotations();
    }
  };
  window.archiveQuote = (id) => {
    if (confirm('Are you sure you want to mark this quotation as lost/archived? It will be moved to history.')) {
      store.markQuotationLost(id);
      populateQuoteDatePopover();
      renderQuotations();
    }
  };
  window.confirmQuote = (id) => {
    const quote = store.getQuotations().find(q => q.id === id);
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
      populateQuoteDatePopover();
      renderQuotations();
      
      // Auto-switch to CRM view
      document.querySelector('.drawer-nav-item[data-target="crm-view"]').click();
    });
  }
  window.exportQuote = (id) => {
    const quote = store.getQuotations().find(q => q.id === id);
    if (quote) {
      exportPDF(quote);
    }
  };

  // Initialize Date Picker & Popover
  initQuoteDatePicker();
  populateQuoteDatePopover();

  window.updateQuoteDateDisplay = updateQuoteDateDisplay;
  window.populateQuoteDatePopover = populateQuoteDatePopover;
  window.renderQuotations = renderQuotations;
  window.setQuoteDateFilter = (filter) => {
    currentQuoteDateFilter = filter;
    updateQuoteDateDisplay();
    populateQuoteDatePopover();
    renderQuotations();
  };

  window.addEventListener('storeUpdated', () => {
    populateQuoteDatePopover();
    renderQuotations();
  });
  renderQuotations();
}
