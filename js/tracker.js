// Dom Elements
const ledgerList = document.getElementById('tracker-ledger-list');
const filterType = document.getElementById('tracker-filter-type');
const filterTime = document.getElementById('tracker-filter-time');
const trackerSearch = document.getElementById('tracker-search');
const btnNewTransaction = document.getElementById('btn-new-transaction');
const btnExportPdf = document.getElementById('btn-export-ledger-pdf');

let currentFilteredTransactions = [];

// Summary indicators
const trRevenue = document.getElementById('tr-revenue');
const trExpenses = document.getElementById('tr-expenses');

// Dialog elements for Transactions
const transactionDialog = document.getElementById('transaction-dialog');
const transactionForm = document.getElementById('transaction-form');
const tfType = document.getElementById('tf-type');
const tfAmount = document.getElementById('tf-amount');
const tfDate = document.getElementById('tf-date');
const tfBookingSelect = document.getElementById('tf-booking-id');
const tfCategorySelect = document.getElementById('tf-category');
const tfDesc = document.getElementById('tf-desc');

// Invoice view elements
const invoiceSheet = document.getElementById('invoice-sheet');

// Constants for transaction options
const CATEGORIES = {
  income: ['Retainer Deposit', 'Final Balance', 'Installment', 'Extra / Add-on'],
  expense: ['Second Shooter', 'Assistant Fee', 'Gear Rental', 'Travel', 'Props', 'Marketing', 'Software', 'Printing', 'Other']
};

function initTracker() {
  // New transaction click
  btnNewTransaction.addEventListener('click', () => openTransactionForm());
  
  // Transaction type toggle changes the categories list and booking link options
  tfType.addEventListener('change', updateFormCategories);

  // Form cancel / close handlers
  document.getElementById('transaction-dialog-cancel').addEventListener('click', () => transactionDialog.close());
  document.getElementById('transaction-dialog-close').addEventListener('click', () => transactionDialog.close());

  transactionForm.addEventListener('submit', handleSaveTransaction);
  
  filterType.addEventListener('change', renderLedger);
  if (filterTime) filterTime.addEventListener('change', renderLedger);
  if (trackerSearch) trackerSearch.addEventListener('input', renderLedger);
  if (btnExportPdf) btnExportPdf.addEventListener('click', exportLedgerPDF);

  // Listen for custom trigger event (e.g. from CRM client details sheet)
  window.addEventListener('openTransactionForm', (e) => {
    openTransactionForm(e.detail.type, e.detail.bookingId);
  });

  window.addEventListener('openInvoiceView', (e) => {
    generateInvoice(e.detail.bookingId);
  });

  // Watch for state updates
  window.addEventListener('storeUpdated', () => {
    updateFinanceMetrics();
    renderLedger();
    drawAnalyticsChart();
  });

  // Initial draw
  updateFinanceMetrics();
  renderLedger();
  drawAnalyticsChart();
}

// Update dashboard metrics boxes
function updateFinanceMetrics() {
  const data = store.getFinancialSummary();
  
  // Update Tracker tab metrics
  if (trRevenue) trRevenue.textContent = `₹${data.totalRevenue.toLocaleString()}`;
  if (trExpenses) trExpenses.textContent = `₹${data.totalExpenses.toLocaleString()}`;

  // Update Dashboard tab metrics
  const dbRev = document.getElementById('db-revenue');
  const dbProf = document.getElementById('db-profit');
  const dbMarg = document.getElementById('db-margin');
  const dbRem = document.getElementById('db-remaining');

  if (dbRev) dbRev.textContent = `₹${data.totalRevenue.toLocaleString()}`;
  if (dbProf) {
    dbProf.textContent = `₹${data.netProfit.toLocaleString()}`;
    dbProf.style.color = data.netProfit >= 0 ? 'var(--text-primary)' : 'var(--danger)';
  }
  if (dbMarg) dbMarg.textContent = `${Math.round(data.profitMargin)}%`;
  if (dbRem) dbRem.textContent = `₹${data.remainingToCollect.toLocaleString()}`;
}

// Render ledger list
function renderLedger() {
  const payments = store.getPayments();
  const expenses = store.getExpenses();
  const bookings = store.getBookings();
  const filter = filterType.value;

  ledgerList.innerHTML = '';

  // Combine into unified transaction array
  let transactions = [];

  if (filter === 'all' || filter === 'income') {
    payments.forEach(p => {
      const bName = bookings.find(b => b.id === p.bookingId)?.clientName || 'General Client';
      transactions.push({
        id: p.id,
        rawId: p.id,
        type: 'income',
        date: p.date,
        amount: p.amount,
        desc: p.notes,
        category: p.bookingId ? 'Booking Payment' : 'Other Income',
        bookingName: bName
      });
    });
  }

  if (filter === 'all' || filter === 'expense') {
    expenses.forEach(e => {
      const bName = e.bookingId ? (bookings.find(b => b.id === e.bookingId)?.clientName || 'Linked Shoot') : 'General Studio';
      transactions.push({
        id: e.id,
        rawId: e.id,
        type: 'expense',
        date: e.date,
        amount: e.amount,
        desc: e.description,
        category: e.category,
        bookingName: bName
      });
    });
  }

  if (transactions.length === 0) {
    const isFiltered = filter !== 'all';
    ledgerList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-illustration" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="24" class="gold-stroke" />
          <line x1="32" y1="18" x2="32" y2="46" class="gold-stroke" />
          <path d="M40 24H27.5c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5h9c2 0 3.5 1.5 3.5 3.5S34.5 38 32.5 38H20" class="gold-stroke" />
          <circle cx="48" cy="48" r="4" class="white-stroke" />
          <circle cx="16" cy="16" r="4" class="white-stroke" />
        </svg>
        <h4 class="empty-state-title">${isFiltered ? 'No Matches Found' : 'Ledger is Empty'}</h4>
        <p class="empty-state-text">${isFiltered ? 'Try changing your ledger type filter.' : 'Record client payments or studio costs to calculate your net profits and margin trends.'}</p>
        ${isFiltered ? '' : '<button class="btn btn-sm" id="btn-empty-add-trans">Record Transaction</button>'}
      </div>`;
    
    if (!isFiltered) {
      document.getElementById('btn-empty-add-trans').addEventListener('click', () => openTransactionForm());
    }
    return;
  }

  // Sort descending by date
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply time period filter
  const timeFilter = filterTime ? filterTime.value : 'all';
  if (timeFilter !== 'all') {
    const today = new Date();
    transactions = transactions.filter(t => {
      const d = new Date(t.date);
      if (timeFilter === 'month') {
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      } else if (timeFilter === 'quarter') {
        const tQ = Math.floor(d.getMonth() / 3);
        const curQ = Math.floor(today.getMonth() / 3);
        return tQ === curQ && d.getFullYear() === today.getFullYear();
      } else if (timeFilter === 'year') {
        return d.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }

  // Apply text search filter
  const searchQuery = trackerSearch ? trackerSearch.value.toLowerCase() : '';
  if (searchQuery) {
    transactions = transactions.filter(t => 
      t.bookingName.toLowerCase().includes(searchQuery) || 
      t.desc.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery)
    );
  }

  currentFilteredTransactions = transactions;

  transactions.forEach(t => {
    const item = document.createElement('div');
    item.className = 'ledger-item';

    const isIncome = t.type === 'income';
    const amountFormatted = (isIncome ? '+' : '-') + ` ₹${t.amount.toLocaleString()}`;
    const dateFormatted = formatDate(t.date);

    item.innerHTML = `
      <div class="ledger-item-left">
        <span class="ledger-desc">${t.desc}</span>
        <span class="ledger-sub">${t.category} • ${t.bookingName} • ${dateFormatted}</span>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="ledger-amount ${t.type}">${amountFormatted}</span>
        <button class="header-action delete-trans-btn" data-id="${t.rawId}" data-type="${t.type}" title="Delete Record" style="width:26px; height:26px; font-size:0.65rem; border-color:transparent; color:var(--text-muted);">
          ✕
        </button>
      </div>
    `;

    // Hook up delete record handler
    item.querySelector('.delete-trans-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Remove this transaction record?`)) {
        if (t.type === 'income') {
          store.deletePayment(t.rawId);
        } else {
          store.deleteExpense(t.rawId);
        }
      }
    });

    ledgerList.appendChild(item);
  });
}

// Open Form Modal
function openTransactionForm(type = 'income', bookingId = null) {
  transactionForm.reset();
  
  // Populate current date
  tfDate.value = new Date().toISOString().split('T')[0];

  // Configure options based on input type
  tfType.value = type;
  updateFormCategories();

  // Populate booking selector
  const bookings = store.getBookings();
  tfBookingSelect.innerHTML = '';

  if (type === 'income') {
    // Income MUST be linked to a booking in this flow
    bookings.forEach(b => {
      const selectedAttr = b.id === bookingId ? 'selected' : '';
      tfBookingSelect.innerHTML += `<option value="${b.id}" ${selectedAttr}>${b.clientName} (${b.type})</option>`;
    });
  } else {
    // Expense can be general (None) or linked
    tfBookingSelect.innerHTML = '<option value="">None (General Studio Expense)</option>';
    bookings.forEach(b => {
      const selectedAttr = b.id === bookingId ? 'selected' : '';
      tfBookingSelect.innerHTML += `<option value="${b.id}" ${selectedAttr}>Link to: ${b.clientName}</option>`;
    });
  }

  transactionDialog.showModal();
}

// Update categories selection list depending on transaction type
function updateFormCategories() {
  const type = tfType.value;
  const categoriesList = CATEGORIES[type];
  
  tfCategorySelect.innerHTML = '';
  categoriesList.forEach(c => {
    tfCategorySelect.innerHTML += `<option value="${c}">${c}</option>`;
  });

  const bookingGroup = document.getElementById('tf-booking-group');
  const bookings = store.getBookings();

  // Dynamically re-populate booking select if type was clicked in form
  if (type === 'income') {
    tfBookingSelect.innerHTML = '';
    bookings.forEach(b => {
      tfBookingSelect.innerHTML += `<option value="${b.id}">${b.clientName} (${b.type})</option>`;
    });
    tfDesc.placeholder = 'e.g. Deposit Retainer payment';
  } else {
    tfBookingSelect.innerHTML = '<option value="">None (General Studio Expense)</option>';
    bookings.forEach(b => {
      tfBookingSelect.innerHTML += `<option value="${b.id}">Link to: ${b.clientName}</option>`;
    });
    tfDesc.placeholder = 'e.g. Gas & Meals, Gear rental';
  }
}

// Handle Form Submission Save
function handleSaveTransaction(e) {
  e.preventDefault();

  const type = tfType.value;
  const amount = parseFloat(tfAmount.value) || 0;
  const date = tfDate.value;
  const bookingId = tfBookingSelect.value || null;
  const category = tfCategorySelect.value;
  const desc = tfDesc.value;

  if (type === 'income') {
    store.addPayment({
      bookingId,
      amount,
      date,
      paymentMethod: 'Bank Transfer',
      notes: desc
    });
  } else {
    store.addExpense({
      bookingId,
      amount,
      date,
      category,
      description: desc
    });
  }

  transactionDialog.close();
}

// Draw a beautiful custom SVG monthly bar chart
function drawAnalyticsChart() {
  const mount = document.getElementById('chart-mount');
  if (!mount) return;

  const data = store.getFinancialSummary().monthlyChartData;

  if (data.length === 0) {
    mount.innerHTML = `
      <div style="height:120px; display:flex; align-items:center; justify-content:center; font-size:0.8rem; color:var(--text-secondary);">
        Awaiting transaction history to draw chart...
      </div>`;
    return;
  }

  // Dimensions
  const w = 400;
  const h = 150;
  const padBottom = 20;
  const padLeft = 30;
  const chartW = w - padLeft - 10;
  const chartH = h - padBottom - 10;

  // Max value to scale
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);

  // Compute grid line metrics
  const gridLines = [];
  const divisions = 3;
  for (let i = 0; i <= divisions; i++) {
    const val = Math.round((maxVal / divisions) * i);
    const y = 10 + chartH - (chartH * (i / divisions));
    gridLines.push({ y, val });
  }

  // Create SVG string
  let svg = `<svg viewBox="0 0 ${w} ${h}" class="chart-svg">`;

  // Draw Grid Lines & Y Labels
  gridLines.forEach(line => {
    svg += `
      <line x1="${padLeft}" y1="${line.y}" x2="${w - 10}" y2="${line.y}" class="chart-grid-line" />
      <text x="${padLeft - 5}" y="${line.y + 3}" class="chart-text" text-anchor="end">₹${line.val >= 1000 ? (line.val / 1000) + 'k' : line.val}</text>
    `;
  });

  // Draw Base Axis
  svg += `<line x1="${padLeft}" y1="${10 + chartH}" x2="${w - 10}" y2="${10 + chartH}" class="chart-axis-line" />`;

  // Compute columns layout
  const colCount = data.length;
  const colWidth = chartW / colCount;
  const barWidth = Math.max(4, (colWidth - 16) / 2); // 2 bars (income & expense)

  data.forEach((d, idx) => {
    const colX = padLeft + (idx * colWidth);
    const midX = colX + (colWidth / 2);

    const incH = (d.income / maxVal) * chartH;
    const expH = (d.expense / maxVal) * chartH;

    const incY = 10 + chartH - incH;
    const expY = 10 + chartH - expH;

    // Draw Income Bar (Champagne gold)
    svg += `
      <rect x="${midX - barWidth - 2}" y="${incY}" width="${barWidth}" height="${incH}" rx="2" class="chart-bar-income">
        <title>Income: ₹${d.income.toLocaleString()}</title>
      </rect>
    `;

    // Draw Expense Bar (Rose red)
    svg += `
      <rect x="${midX + 2}" y="${expY}" width="${barWidth}" height="${expH}" rx="2" class="chart-bar-expense">
        <title>Expense: ₹${d.expense.toLocaleString()}</title>
      </rect>
    `;

    // Draw X Axis labels (Months)
    svg += `
      <text x="${midX}" y="${h - 4}" class="chart-text" text-anchor="middle">${d.month}</text>
    `;
  });

  svg += `</svg>`;
  mount.innerHTML = svg;
}

// Generate print-friendly HTML Invoice & trigger system print
function generateInvoice(bookingId) {
  const b = store.getBooking(bookingId);
  if (!b) return;

  const payments = store.getPaymentsForBooking(bookingId);
  const paid = store.getBookingPaidAmount(bookingId);
  const balance = Math.max(0, b.packagePrice - paid);
  const invoiceYear = b.date.split('-')[0] || new Date().getFullYear();
  const invoiceNum = `INV-${invoiceYear}-${b.id.split('-')[1]}`;

  let paymentsListHtml = '';
  if (payments.length === 0) {
    paymentsListHtml = '<tr><td colspan="3" style="text-align:center; padding:10px 0; color:#64748b;">No payments received yet.</td></tr>';
  } else {
    payments.forEach((p, idx) => {
      let paymentLabel = `Payment #${idx + 1}`;
      if (idx === 0) paymentLabel = "Advance";
      else if (idx === 1) paymentLabel = "2nd Payment";
      else if (idx === 2) paymentLabel = "Final Payment";
      else paymentLabel = `${idx + 1}th Payment`;

      paymentsListHtml += `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid rgba(2, 48, 58, 0.15); font-family:'Outfit', sans-serif; color: #02303A;">${paymentLabel} (${p.paymentMethod || 'Transfer'})</td>
          <td style="padding:10px 0; border-bottom:1px solid rgba(2, 48, 58, 0.15); text-align:right; font-family:'Outfit', sans-serif; color: #02303A;">${formatDate(p.date)}</td>
          <td style="padding:10px 0; border-bottom:1px solid rgba(2, 48, 58, 0.15); text-align:right; font-weight:600; font-family:'Outfit', sans-serif; color: #02303A;">₹${p.amount.toLocaleString()}</td>
        </tr>`;
    });
  }

  invoiceSheet.innerHTML = `
    <!-- Control Header for User (Hidden during print) -->
    <div style="display:flex; justify-content:space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom:2px solid #e2e8f0;" class="no-print">
      <button onclick="document.getElementById('invoice-sheet').style.display='none'" style="background:#64748b; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:600; cursor:pointer;">
        ✕ Close Invoice View
      </button>
      <div style="display:flex; gap:10px;">
        <button onclick="window.print()" style="background:#e2e8f0; color:#1e293b; border:none; padding:10px 20px; border-radius:6px; font-weight:600; cursor:pointer;">
          🖨️ Print
        </button>
        <button onclick="window.exportInvoicePDF('${bookingId}')" style="background:#c5a880; color:#1e293b; border:none; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer; box-shadow: 0 4px 6px rgba(197,168,128,0.2);">
          ⬇️ Export PDF
        </button>
      </div>
    </div>

    <div style="background-color: #EBE6DA; padding: 40px; min-height: 1123px; display: flex; flex-direction: column; box-sizing: border-box;">
    <!-- Official Invoice Layout -->
    <div style="display:flex; justify-content:space-between; margin-bottom: 40px;">
      <div>
        <h2 style="font-family: 'Cormorant Garamond', serif; font-size:2.4rem; letter-spacing:2px; color:#02303A; margin:0; font-weight:700;">Wedding Nest</h2>
        <p style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#02303A; opacity: 0.8; margin-top:4px; font-weight:600;">Wedding Photography Studio</p>
        
        <p style="font-size:0.85rem; color:#02303A; margin-top:16px; line-height:1.6; opacity: 0.8;">
          218, ANGLE BUSINESS CENTER<br>
          NEAR ABC CIRCLE, MOTA VARACHHA, SURAT<br>
          WEDDINGNEST01@GMAIL.COM | +91 8140298239
        </p>
      </div>
      <div style="text-align:right;">
        <h1 style="font-size: 2.2rem; font-weight:300; margin:0; text-transform:uppercase; color:#02303A;">Invoice</h1>
        <p style="font-size:0.9rem; margin-top:10px; color:#02303A;"><strong>Invoice No:</strong> ${invoiceNum}</p>
        <p style="font-size:0.9rem; color:#02303A;"><strong>Date Issued:</strong> ${formatDate(new Date().toISOString().split('T')[0])}</p>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; margin-bottom: 40px; border-top: 1px solid rgba(2, 48, 58, 0.15); border-bottom: 1px solid rgba(2, 48, 58, 0.15); padding: 20px 0;">
      <div>
        <h3 style="font-size:0.75rem; text-transform:uppercase; color:#02303A; margin:0 0 6px 0;">Billed To</h3>
        <p style="font-size:1.1rem; font-weight:600; margin:0; color:#02303A;">${b.clientName}</p>
        <p style="font-size:0.9rem; color:#02303A; opacity: 0.8; margin-top:4px;">${b.email}</p>
        <p style="font-size:0.9rem; color:#02303A; opacity: 0.8;">${b.phone}</p>
      </div>
      <div style="text-align:right;">
        <h3 style="font-size:0.75rem; text-transform:uppercase; color:#02303A; margin:0 0 6px 0;">Shoot Specifications</h3>
        <p style="font-size:1rem; font-weight:600; margin:0; color:#02303A;">${b.type} Coverage</p>
        <p style="font-size:0.9rem; color:#02303A; opacity: 0.8; margin-top:4px;"><strong>Date:</strong> ${formatDate(b.date)}</p>
        <p style="font-size:0.9rem; color:#02303A; opacity: 0.8;"><strong>Venue:</strong> ${b.venue}</p>
      </div>
    </div>

    <!-- Package Summary -->
    <table style="width:100%; border-collapse:collapse; margin-bottom: 40px;">
      <thead>
        <tr style="border-bottom:2px solid rgba(2, 48, 58, 0.2);">
          <th style="text-align:left; padding-bottom:10px; font-size:0.85rem; text-transform:uppercase; color:#02303A;">Description</th>
          <th style="text-align:right; padding-bottom:10px; font-size:0.85rem; text-transform:uppercase; color:#02303A;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:15px 0; border-bottom:1px solid rgba(2, 48, 58, 0.15);">
            <p style="font-weight:600; margin:0; color:#02303A;">${b.type} Photography</p>
          </td>
          <td style="text-align:right; padding:15px 0; border-bottom:1px solid rgba(2, 48, 58, 0.15); font-weight:600; color:#02303A;">₹${b.packagePrice.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <!-- Payments Ledger -->
    <div style="margin-bottom: 40px;">
      <h3 style="font-size:1.1rem; border-bottom:1.5px solid rgba(2, 48, 58, 0.2); padding-bottom:6px; margin-bottom:10px; color:#02303A;">Payment Ledger</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tbody>
          ${paymentsListHtml}
        </tbody>
      </table>
    </div>

    <!-- Final Summary Balance -->
    <div style="display:flex; justify-content:flex-end;">
      <div style="width:300px; background:rgba(255,255,255,0.4); padding:20px; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.95rem;">
          <span style="color:#02303A;">Subtotal:</span>
          <span style="font-weight:600; color:#02303A;">₹${b.packagePrice.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.95rem; color:#02303A;">
          <span>Paid-to-Date:</span>
          <span style="font-weight:600;">- ₹${paid.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1.5px solid rgba(2, 48, 58, 0.2); padding-top:10px; font-size:1.1rem; font-weight:700;">
          <span style="color:#02303A;">Balance Due:</span>
          <span style="color:#02303A;">₹${balance.toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(2, 48, 58, 0.15);">
        <div style="font-family: 'Open Sauce One', sans-serif; display: flex; justify-content: center; gap: 15px; font-size: 10px; color: #02303A; font-weight: bold; align-items: center; flex-wrap: wrap;">
          <div>+91 8140298239</div>
          <div style="width: 2px; height: 16px; background-color: #02303A;"></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            weddingnest_studio
          </div>
          <div style="width: 2px; height: 16px; background-color: #02303A;"></div>
          <div style="display: flex; align-items: center; gap: 4px; text-align: left;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div style="max-width: 250px;">218, ANGLE BUSINESS CENTER, NEAR ABC CIRCLE, SURAT</div>
          </div>
          <div style="width: 100%; text-align: center; margin-top: 5px;">WEDDINGNEST01@GMAIL.COM</div>
        </div>
    </div>
    </div>

    <!-- Print styling block inject -->
    <style>
      @media print {
        .no-print {
          display: none !important;
        }
      }
    </style>
  `;

  // Display the sheet
  invoiceSheet.style.display = 'block';
}

function exportLedgerPDF() {
  if (typeof html2pdf === 'undefined') {
    alert("PDF generator not loaded.");
    return;
  }

  const container = document.createElement('div');
  container.style.width = '794px';
  container.style.padding = '40px';
  container.style.fontFamily = "'Outfit', sans-serif";
  container.style.color = '#0A0906';
  container.style.backgroundColor = '#ffffff';

  // Header
  const dateRangeStr = (document.getElementById('tracker-filter-time') ? document.getElementById('tracker-filter-time').options[document.getElementById('tracker-filter-time').selectedIndex].text : 'All Time');
  const typeStr = (document.getElementById('tracker-filter-type') ? document.getElementById('tracker-filter-type').options[document.getElementById('tracker-filter-type').selectedIndex].text : 'All Transactions');
  
  let headerHtml = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 5px;">Financial Ledger</h1>
      <p style="color: #5e5a52; font-size: 1rem; margin-bottom: 5px;">${typeStr} • ${dateRangeStr}</p>
      <p style="color: #8e8a80; font-size: 0.85rem;">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  `;

  // Build rows
  let rowsHtml = '';
  let totalIncome = 0;
  let totalExpense = 0;

  if (currentFilteredTransactions.length === 0) {
    rowsHtml = `<tr><td colspan="4" style="text-align: center; padding: 20px;">No transactions found for this period.</td></tr>`;
  } else {
    currentFilteredTransactions.forEach(t => {
      const isIncome = t.type === 'income';
      if (isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;
      
      const amountColor = isIncome ? '#1b7a5a' : '#b91c1c';
      const amountStr = (isIncome ? '+' : '-') + ` ₹${t.amount.toLocaleString()}`;
      
      rowsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">${formatDate(t.date)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">
            <div style="font-weight: 500;">${t.desc || '-'}</div>
            <div style="font-size: 0.75rem; color: #8e8a80;">${t.category}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">${t.bookingName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${amountColor};">${amountStr}</td>
        </tr>
      `;
    });
  }

  // Calculate Net
  const netTotal = totalIncome - totalExpense;
  const netColor = netTotal >= 0 ? '#1b7a5a' : '#b91c1c';

  let tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: rgba(204, 192, 163, 0.2); text-align: left;">
          <th style="padding: 12px 10px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
          <th style="padding: 12px 10px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Description / Category</th>
          <th style="padding: 12px 10px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Linked Client</th>
          <th style="padding: 12px 10px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // Summary footer
  let summaryHtml = `
    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 300px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem;">
          <span>Total Income:</span>
          <span style="font-weight: 600; color: #1b7a5a;">₹${totalIncome.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem;">
          <span>Total Expenses:</span>
          <span style="font-weight: 600; color: #b91c1c;">₹${totalExpense.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1.5px solid #cbd5e1; padding-top: 10px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total:</span>
          <span style="color: ${netColor};">₹${netTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = headerHtml + tableHtml + summaryHtml;
  document.body.appendChild(container);

  const opt = {
    margin:       [10, 0, 10, 0],
    filename:     `Ledger_${dateRangeStr.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    pagebreak:    { mode: 'css', before: '.html2pdf__page-break' },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).outputPdf('blob').then((pdfBlob) => {
    document.body.removeChild(container);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = opt.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  });
}

window.exportInvoicePDF = function(bookingId) {
  if (typeof html2pdf === 'undefined') {
    alert("PDF generator not loaded.");
    return;
  }
  const b = store.getBooking(bookingId);
  if (!b) return;

  const invoiceSheet = document.getElementById('invoice-sheet');
  const clone = invoiceSheet.cloneNode(true);
  
  // Remove no-print elements
  const noPrint = clone.querySelectorAll('.no-print');
  noPrint.forEach(el => el.remove());

  const container = document.createElement('div');
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "'Outfit', sans-serif";
  container.style.color = '#02303A';
  container.style.backgroundColor = '#EBE6DA';
  
  // Need to append the cloned inner content, avoiding another invoice-sheet wrapping 
  container.innerHTML = clone.innerHTML;
  
  document.body.appendChild(container);
  
  const invoiceYear = b.date.split('-')[0] || new Date().getFullYear();
  const invoiceNum = `INV-${invoiceYear}-${b.id.split('-')[1]}`;
  
  const opt = {
    margin:       0,
    filename:     `Invoice_${b.clientName.replace(/\\s+/g, '_')}_${invoiceNum}.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 3, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).outputPdf('blob').then((pdfBlob) => {
    document.body.removeChild(container);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = opt.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  });
};
