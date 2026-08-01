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

  function renderQuotations() {
    if (!quoteList) return;
    let quotes = store.getQuotations() || [];
    
    // Ensure backwards compatibility
    quotes.forEach(q => { if (!q.status) q.status = 'pending'; });
    
    // Apply Filter
    const filterVal = document.getElementById('quotation-filter') ? document.getElementById('quotation-filter').value : 'all';

    // Calculate metrics
    const total = quotes.length;
    const pending = quotes.filter(q => q.status === 'pending').length;
    const confirmed = quotes.filter(q => q.status === 'confirmed').length;

    const metricsContainer = document.getElementById('quotation-metrics');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-gold); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${total}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--warning); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--warning);">${pending}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Pending</div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--success); text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--success);">${confirmed}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Confirmed</div>
        </div>
      `;
    }
    
    if (filterVal !== 'all') {
      quotes = quotes.filter(q => q.status === filterVal);
    }
    
    if (quotes.length === 0) {
      quoteList.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--text-secondary);">
          <div style="font-size:3rem; margin-bottom:10px; opacity:0.5;">📄</div>
          <h3>No Quotations Found</h3>
          <p style="font-size:0.85rem; margin-top:8px;">${filterVal !== 'all' ? 'No quotes match this filter.' : 'Create your first quote for a client!'}</p>
        </div>
      `;
      return;
    }

    quoteList.innerHTML = '';
    
    // Sort descending by created date
    quotes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    quotes.forEach(quote => {
      const card = document.createElement('div');
      card.className = 'booking-card';
      card.style.cursor = 'default';
      if (quote.status === 'confirmed' || quote.status === 'lost') card.style.opacity = '0.75';
      
      const dateStr = new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const createdStr = new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
            <div class="booking-meta">
              ${statusBadge}
              <span style="font-size:0.75rem; color:var(--text-primary); font-weight:600; margin-left:8px;">Sent: ${createdStr}</span>
            </div>
            <div style="font-size:0.8rem; margin-top:8px;">
              <strong>${quote.type}</strong> • ${dateStr}<br>
              <span style="color:var(--text-secondary);">${quote.venue}</span>
            </div>
          </div>
          <div style="font-size:1.1rem; font-weight:600; text-align:right;">
            ₹${quote.packagePrice.toLocaleString('en-IN')}
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
      renderQuotations();
    }
  };
  window.archiveQuote = (id) => {
    if (confirm('Are you sure you want to mark this quotation as lost/archived? It will be moved to history.')) {
      store.markQuotationLost(id);
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

  // Setup filter listener
  const filterSelect = document.getElementById('quotation-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderQuotations();
    });
  }

  window.addEventListener('storeUpdated', renderQuotations);
  renderQuotations();
}
