// Dom Elements
const ledgerList = document.getElementById('tracker-ledger-list');
const trackerSearch = document.getElementById('tracker-search');
const btnNewTransaction = document.getElementById('btn-new-transaction');
const btnExportPdf = document.getElementById('btn-export-ledger-pdf');

let currentFilteredTransactions = [];

// Summary indicators
const trRevenue = document.getElementById('tr-revenue');
const trExpenses = document.getElementById('tr-expenses');

// Running Month & Period Helpers
function getTrackerRunningMonth() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { ym, label };
}

function getAvailableFinancialYears() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curFyStart = curMonth >= 4 ? curYear : curYear - 1;

  return [
    {
      code: `${curFyStart}-${curFyStart + 1}`,
      label: `FY ${curFyStart}-${String(curFyStart + 1).slice(-2)} (1 Apr ${curFyStart} – 31 Mar ${curFyStart + 1})`,
      shortLabel: `FY ${curFyStart}-${String(curFyStart + 1).slice(-2)}`,
      start: `${curFyStart}-04-01`,
      end: `${curFyStart + 1}-03-31`
    },
    {
      code: `${curFyStart - 1}-${curFyStart}`,
      label: `FY ${curFyStart - 1}-${String(curFyStart).slice(-2)} (1 Apr ${curFyStart - 1} – 31 Mar ${curFyStart})`,
      shortLabel: `FY ${curFyStart - 1}-${String(curFyStart).slice(-2)}`,
      start: `${curFyStart - 1}-04-01`,
      end: `${curFyStart}-03-31`
    },
    {
      code: `${curFyStart + 1}-${curFyStart + 2}`,
      label: `FY ${curFyStart + 1}-${String(curFyStart + 2).slice(-2)} (1 Apr ${curFyStart + 1} – 31 Mar ${curFyStart + 2})`,
      shortLabel: `FY ${curFyStart + 1}-${String(curFyStart + 2).slice(-2)}`,
      start: `${curFyStart + 1}-04-01`,
      end: `${curFyStart + 2}-03-31`
    }
  ];
}

function getAllTransactions() {
  const payments = store.getPayments() || [];
  const expenses = store.getExpenses() || [];
  const bookings = store.getBookings() || [];
  const transactions = [];

  payments.forEach(p => {
    const bName = bookings.find(b => b.id === p.bookingId)?.clientName || 'General Client';
    transactions.push({
      id: p.id,
      rawId: p.id,
      type: 'income',
      date: p.date,
      amount: parseFloat(p.amount) || 0,
      desc: p.notes || 'Payment Received',
      category: p.bookingId ? 'Booking Payment' : 'Other Income',
      bookingName: bName
    });
  });

  expenses.forEach(e => {
    const bName = e.bookingId ? (bookings.find(b => b.id === e.bookingId)?.clientName || 'Linked Shoot') : 'General Studio';
    transactions.push({
      id: e.id,
      rawId: e.id,
      type: 'expense',
      date: e.date,
      amount: parseFloat(e.amount) || 0,
      desc: e.description || 'Studio Expense',
      category: e.category || 'General Expense',
      bookingName: bName
    });
  });

  return transactions;
}

function getAvailableTrackerMonths() {
  const transactions = getAllTransactions();
  const monthMap = new Map();
  const now = new Date();
  const runningYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const runningLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Ensure running month is always present
  monthMap.set(runningYm, { ym: runningYm, label: runningLabel, income: 0, expense: 0, count: 0, isRunning: true });

  transactions.forEach(t => {
    if (!t.date) return;
    const ym = t.date.substring(0, 7);
    if (!monthMap.has(ym)) {
      const parts = ym.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      monthMap.set(ym, { ym, label, income: 0, expense: 0, count: 0, isRunning: ym === runningYm });
    }
    const item = monthMap.get(ym);
    item.count++;
    if (t.type === 'income') item.income += t.amount;
    else item.expense += t.amount;
  });

  return Array.from(monthMap.values()).sort((a, b) => b.ym.localeCompare(a.ym));
}

const initialTrackerRunning = getTrackerRunningMonth();
let currentTrackerDateFilter = {
  type: 'month',
  ym: initialTrackerRunning.ym,
  start: null,
  end: null,
  label: initialTrackerRunning.label
};
let currentTrackerTypeFilter = 'all'; // 'all', 'income', 'expense'

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
  if (btnNewTransaction) btnNewTransaction.addEventListener('click', () => openTransactionForm());
  
  // Transaction type toggle changes the categories list and booking link options
  if (tfType) tfType.addEventListener('change', updateFormCategories);

  // Form cancel / close handlers
  const btnCancelTrans = document.getElementById('transaction-dialog-cancel');
  const btnCloseTrans = document.getElementById('transaction-dialog-close');
  if (btnCancelTrans) btnCancelTrans.addEventListener('click', () => transactionDialog.close());
  if (btnCloseTrans) btnCloseTrans.addEventListener('click', () => transactionDialog.close());

  if (transactionForm) transactionForm.addEventListener('submit', handleSaveTransaction);
  
  if (trackerSearch) trackerSearch.addEventListener('input', renderLedger);

  // Initialize Tracker Date Picker & Filter Pills
  initTrackerDatePicker();

  // Initialize Export Dialog (Month-wise, FY, Custom Range)
  initExportDialog();

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
    populateTrackerDatePopover();
    renderLedger();
    drawAnalyticsChart();
  });

  // Initial draw
  updateFinanceMetrics();
  populateTrackerDatePopover();
  renderLedger();
  drawAnalyticsChart();
}

function initTrackerDatePicker() {
  const btn = document.getElementById('tracker-date-picker-btn');
  const popover = document.getElementById('tracker-date-popover');
  const customStart = document.getElementById('tracker-custom-start');
  const customEnd = document.getElementById('tracker-custom-end');
  const btnApply = document.getElementById('tracker-btn-apply-custom-range');

  if (btn && popover) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      // Close other popovers
      const crmPop = document.getElementById('crm-date-popover');
      const opsPop = document.getElementById('ops-date-popover');
      if (crmPop) crmPop.style.display = 'none';
      if (opsPop) opsPop.style.display = 'none';
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
      currentTrackerDateFilter = {
        type: 'range',
        ym: null,
        start: s,
        end: eVal,
        label: `${formatDate(s)} — ${formatDate(eVal)}`
      };
      if (popover) popover.style.display = 'none';
      updateTrackerDateDisplay();
      populateTrackerDatePopover();
      renderLedger();
    });
  }

  // Type Pills: All, + Income, - Expense
  const typePills = document.querySelectorAll('.tracker-type-pill');
  typePills.forEach(pill => {
    pill.addEventListener('click', () => {
      typePills.forEach(p => {
        p.classList.remove('active');
        p.style.background = '#fff';
        p.style.color = p.dataset.type === 'income' ? '#16a34a' : (p.dataset.type === 'expense' ? '#dc2626' : 'var(--text-secondary)');
        p.style.borderColor = p.dataset.type === 'income' ? 'rgba(22,163,74,0.35)' : (p.dataset.type === 'expense' ? 'rgba(220,38,38,0.35)' : 'rgba(204,192,163,0.5)');
      });
      pill.classList.add('active');
      pill.style.background = 'var(--text-primary)';
      pill.style.color = '#fff';
      pill.style.borderColor = 'var(--text-primary)';

      currentTrackerTypeFilter = pill.dataset.type;
      renderLedger();
    });
  });
}

function populateTrackerDatePopover() {
  const container = document.getElementById('tracker-month-pills-list');
  const fyContainer = document.getElementById('tracker-fy-list');
  if (!container) return;

  const months = getAvailableTrackerMonths();
  const now = new Date();
  const runningYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  container.innerHTML = '';

  // 1. All Time button
  const allBtn = document.createElement('div');
  const isAllActive = currentTrackerDateFilter.type === 'all';
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
  const allSummary = store.getFinancialSummary();
  allBtn.innerHTML = `<span>All Time</span> <span style="font-size:0.7rem; opacity:0.85;">₹${allSummary.totalRevenue.toLocaleString()} Inflow</span>`;
  allBtn.addEventListener('click', () => {
    currentTrackerDateFilter = { type: 'all', ym: 'all', start: null, end: null, label: 'All Time' };
    const pop = document.getElementById('tracker-date-popover');
    if (pop) pop.style.display = 'none';
    updateTrackerDateDisplay();
    populateTrackerDatePopover();
    renderLedger();
  });
  container.appendChild(allBtn);

  // 2. Month buttons
  months.forEach(m => {
    const isActive = currentTrackerDateFilter.type === 'month' && currentTrackerDateFilter.ym === m.ym;
    const isRunning = m.ym === runningYm;
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

    const net = m.income - m.expense;
    const netFormatted = (net >= 0 ? '+' : '-') + `₹${Math.abs(net).toLocaleString()}`;
    const runningTag = isRunning ? `<span style="font-size:0.62rem; background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(217,119,6,0.15)'}; color:${isActive ? '#fff' : '#d97706'}; padding:1px 5px; border-radius:4px; margin-left:4px;">Running Month</span>` : '';

    btn.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span>${m.label}</span>
        ${runningTag}
      </div>
      <span style="font-size:0.68rem; font-weight:700; opacity:0.9;">${m.count} txns • ${netFormatted}</span>
    `;

    btn.addEventListener('click', () => {
      currentTrackerDateFilter = {
        type: 'month',
        ym: m.ym,
        start: null,
        end: null,
        label: isRunning ? `${m.label} (Running Month)` : m.label
      };
      const pop = document.getElementById('tracker-date-popover');
      if (pop) pop.style.display = 'none';
      updateTrackerDateDisplay();
      populateTrackerDatePopover();
      renderLedger();
    });

    container.appendChild(btn);
  });

  // 3. Financial Years (FY)
  if (fyContainer) {
    fyContainer.innerHTML = '';
    const fyList = getAvailableFinancialYears();
    fyList.forEach(fy => {
      const isActive = currentTrackerDateFilter.type === 'range' && currentTrackerDateFilter.start === fy.start && currentTrackerDateFilter.end === fy.end;
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

      btn.innerHTML = `
        <span>${fy.shortLabel}</span>
        <span style="font-size:0.68rem; opacity:0.85;">1 Apr — 31 Mar</span>
      `;

      btn.addEventListener('click', () => {
        currentTrackerDateFilter = {
          type: 'range',
          ym: null,
          start: fy.start,
          end: fy.end,
          label: fy.shortLabel
        };
        const pop = document.getElementById('tracker-date-popover');
        if (pop) pop.style.display = 'none';
        updateTrackerDateDisplay();
        populateTrackerDatePopover();
        renderLedger();
      });

      fyContainer.appendChild(btn);
    });
  }

  updateTrackerDateDisplay();
}

function updateTrackerDateDisplay() {
  const display = document.getElementById('tracker-date-display');
  if (!display) return;
  display.textContent = currentTrackerDateFilter.label || 'All Time';
}

// Update dashboard metrics boxes
function updateFinanceMetrics() {
  const data = store.getFinancialSummary();

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

// Render ledger list (Month-wise & Period filtered)
function renderLedger() {
  if (!ledgerList) return;
  ledgerList.innerHTML = '';

  const allTransactions = getAllTransactions();

  // 1. Filter by Date / Month / FY / Range
  let periodTransactions = allTransactions.filter(t => {
    if (!t.date) return false;
    if (currentTrackerDateFilter.type === 'month') {
      return t.date.startsWith(currentTrackerDateFilter.ym);
    } else if (currentTrackerDateFilter.type === 'range') {
      const s = currentTrackerDateFilter.start;
      const e = currentTrackerDateFilter.end;
      return t.date >= s && t.date <= e;
    }
    return true; // 'all'
  });

  // Calculate Period Revenue & Expenses
  let periodRevenue = 0;
  let periodExpenses = 0;
  periodTransactions.forEach(t => {
    if (t.type === 'income') periodRevenue += t.amount;
    else if (t.type === 'expense') periodExpenses += t.amount;
  });
  const periodProfit = periodRevenue - periodExpenses;

  // Update Tracker Metrics Cards
  if (trRevenue) trRevenue.textContent = `₹${periodRevenue.toLocaleString()}`;
  if (trExpenses) trExpenses.textContent = `₹${periodExpenses.toLocaleString()}`;
  const trProfit = document.getElementById('tr-profit');
  if (trProfit) {
    trProfit.textContent = (periodProfit >= 0 ? '+' : '-') + `₹${Math.abs(periodProfit).toLocaleString()}`;
    trProfit.style.color = periodProfit >= 0 ? '#16a34a' : '#dc2626';
  }
  const trSubtitle = document.getElementById('tr-period-subtitle');
  if (trSubtitle) {
    const isRunning = currentTrackerDateFilter.type === 'month' && currentTrackerDateFilter.ym === getTrackerRunningMonth().ym;
    trSubtitle.textContent = `Period: ${currentTrackerDateFilter.label}${isRunning ? ' (Running Month)' : ''}`;
  }

  // 2. Filter by Transaction Type (All, Income, Expense)
  let displayTransactions = periodTransactions;
  if (currentTrackerTypeFilter !== 'all') {
    displayTransactions = displayTransactions.filter(t => t.type === currentTrackerTypeFilter);
  }

  // 3. Filter by Search Query
  const searchQuery = trackerSearch ? trackerSearch.value.toLowerCase().trim() : '';
  if (searchQuery) {
    displayTransactions = displayTransactions.filter(t => 
      t.bookingName.toLowerCase().includes(searchQuery) || 
      t.desc.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery)
    );
  }

  // 4. Sort descending by date
  displayTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  currentFilteredTransactions = displayTransactions;

  if (displayTransactions.length === 0) {
    const isRunning = currentTrackerDateFilter.type === 'month' && currentTrackerDateFilter.ym === getTrackerRunningMonth().ym;
    ledgerList.innerHTML = `
      <div class="empty-state" style="padding: 28px 20px; text-align: center; background: #fff; border-radius: 14px; border: 1px dashed rgba(204,192,163,0.6); margin-top: 8px;">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">💳</div>
        <h4 style="margin: 0 0 6px 0; color: #02303A; font-size: 1rem;">No Transactions Recorded in ${currentTrackerDateFilter.label}</h4>
        <p style="margin: 0 0 14px 0; color: #64748b; font-size: 0.8rem;">${isRunning ? 'Currently viewing running month. Click below to view all historical transactions.' : 'No records match the current filter.'}</p>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button type="button" class="btn btn-sm" id="tr-btn-show-all" style="background: #02303A; color: #FAF8F5; padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; border: none;">View All Transactions</button>
          <button type="button" class="btn btn-sm btn-secondary" id="tr-btn-record-empty" style="padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; cursor: pointer;">+ Record New</button>
        </div>
      </div>
    `;
    const btnShowAll = document.getElementById('tr-btn-show-all');
    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        currentTrackerDateFilter = { type: 'all', ym: 'all', start: null, end: null, label: 'All Time' };
        updateTrackerDateDisplay();
        populateTrackerDatePopover();
        renderLedger();
      });
    }
    const btnRecordEmpty = document.getElementById('tr-btn-record-empty');
    if (btnRecordEmpty) {
      btnRecordEmpty.addEventListener('click', () => openTransactionForm());
    }
    return;
  }

  displayTransactions.forEach(t => {
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

const STUDIO_LOGO_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB7AAAAZTCAYAAAB1jK3LAADVyElEQVR42uzdwZXqxtaAUa+KgBAUgsZvRAgKQSGw1ktAGSgEQlAIhEAIhEAINmUKN25zb6NukEqlPdiTf/J7cRHqp0/n1B+h/t8fd/68+P+n/xsAAAAAAAAAvJ0PAQAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAHbhwAAAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAArYPAQAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAHbhwAAAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAAD4EAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAELABAAAAAAAAELABAAAAAAAAQMAGAAAAAAAAQMAGAAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABCwAQAAAAAAABCwAQAAAAAAAEDABgAAAAAAAEDABgAAAAAAAAABGwAAAAAAAAABGwAAAAAAAAAEbAAAAAAAAAAEbAAAAAAAAAAQsAEAAAAAAAAQsAEAAAAAAABAwAYAAAAAAABAwAYAAAAAAAAAARsAAAAAAAAAARsAAAAAAAAABGwAAAAAAAAABGwfAgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAIGADAAAAAAAAIGADAAAAAAAAgIANAAAAAAAAgIANAAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACBgAwAAAAAAACBgAwAAAAAAAICADQAAAAAAAICADQAAAAAAAAACNgAAAAAAAAACNgAAAAAAAAAI2AAAAAAAAAAI2AAAAAAAAAAgYAMAAAAAAAAgYAMAAAAAAACAgA0AAAAAAACAgA0AAAAAAAAAAjYAAAAAAAAAAjYAAAAAAAAACNgAAAAA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";

// Generate print-friendly HTML Invoice & trigger system print
function generateInvoice(bookingId) {
  const b = store.getBooking(bookingId);
  if (!b) return;

  const payments = store.getPaymentsForBooking(bookingId);
  const paid = store.getBookingPaidAmount(bookingId);
  const balance = Math.max(0, b.packagePrice - paid);
  const invoiceYear = (b.date && b.date.split('-')[0]) || new Date().getFullYear();
  const invoiceNum = `INV-${invoiceYear}-${b.id.split('-')[1] || Date.now()}`;

  // Find linked quotation if available
  let quote = null;
  if (b.quotationId) {
    quote = store.getQuotations().find(q => q.id === b.quotationId);
  }
  if (!quote) {
    quote = store.getQuotations().find(q => q.bookingId === b.id);
  }
  if (!quote && b.clientName) {
    const cleanBName = b.clientName.trim().toLowerCase();
    quote = store.getQuotations().find(q => {
      if (!q.clientName) return false;
      const cleanQName = q.clientName.trim().toLowerCase();
      return cleanQName === cleanBName || cleanBName.includes(cleanQName) || cleanQName.includes(cleanBName);
    });
  }

  // 1. Resolve Requirements / Days
  let days = [];
  if (Array.isArray(b.days) && b.days.length > 0) {
    days = b.days;
  } else if (quote && Array.isArray(quote.days) && quote.days.length > 0) {
    days = quote.days;
  } else if (b.servicesQuantities) {
    const sq = b.servicesQuantities;
    const hasAnyQty = Object.values(sq).some(v => v > 0);
    if (hasAnyQty) {
      days = [{
        badge: 'EVENT',
        title: `${b.type || 'Wedding'} Coverage`,
        tradPhoto: sq.traditionalPhotographer || sq.tradPhoto || 0,
        tradVideo: sq.traditionalVideographer || sq.tradVideo || 0,
        candPhoto: sq.candidPhotographer || sq.candPhoto || 0,
        cinema: sq.cinematographer || sq.cinema || 0,
        drone: sq.drone || 0,
        famPhoto: sq.familyPhotographer || sq.famPhoto || 0,
        ledScreen: sq.ledScreen || 0,
        plasmaTv: sq.plasmaTv || 0
      }];
    }
  }

  // 2. Resolve Deliverables
  let deliverables = [];
  if (Array.isArray(b.deliverables) && b.deliverables.length > 0) {
    deliverables = b.deliverables;
  } else if (quote && Array.isArray(quote.deliverables) && quote.deliverables.length > 0) {
    deliverables = quote.deliverables;
  } else {
    deliverables = [
      { label: 'Same Day Couple Photo Edited for Social Media', checked: true },
      { label: 'Wedding Couple Photo Edited', checked: true },
      { label: 'Bride & Groom Solo Pictures Edited', checked: true },
      { label: 'Couple Social Media Post Edited', checked: true },
      { label: 'Wedding Highlights', count: 2, hasCount: true, checked: true },
      { label: 'Cinematic Reels (Extra Reels: ₹1,500/reel)', count: 5, hasCount: true, checked: true },
      { label: 'Full Wedding Part on Pen Drive', checked: true }
    ];
  }

  const activeDeliverables = deliverables.filter(d => {
    if (typeof d === 'string') return true;
    return d.checked !== false;
  }).map(d => {
    if (typeof d === 'string') return d;
    if (d.hasCount && d.count) return `<strong>${d.count}</strong> ${d.label}`;
    return d.label;
  });

  // Build Integrated Scope Card (Option B layout with Option A Deliverables bullets)
  let scopeSectionHtml = '';
  const hasDays = days.length > 0;
  const hasDelivs = activeDeliverables.length > 0;

  if (hasDays || hasDelivs) {
    let daysRowsHtml = '';
    if (hasDays) {
      daysRowsHtml = days.map((day, idx) => {
        const dayLabel = day.badge || `Day ${idx + 1}`;
        const dayTitle = day.title || `${b.type || 'Wedding'} Function`;

        const crewParts = [];
        const photoParts = [];
        if (day.tradPhoto > 0) photoParts.push(`${day.tradPhoto} Trad`);
        if (day.candPhoto > 0) photoParts.push(`${day.candPhoto} Candid`);
        if (day.famPhoto > 0) photoParts.push(`${day.famPhoto} Family`);
        if (photoParts.length > 0) {
          const totalP = (day.tradPhoto || 0) + (day.candPhoto || 0) + (day.famPhoto || 0);
          crewParts.push(`${totalP} Photo (${photoParts.join(', ')})`);
        }

        const videoParts = [];
        if (day.tradVideo > 0) videoParts.push(`${day.tradVideo} Trad Video`);
        if (day.cinema > 0) videoParts.push(`${day.cinema} Cinema`);
        if (videoParts.length > 0) {
          const totalV = (day.tradVideo || 0) + (day.cinema || 0);
          crewParts.push(`${totalV} Cinema (${videoParts.join(', ')})`);
        }

        const specialParts = [];
        if (day.drone > 0) specialParts.push(`${day.drone} Drone`);
        if (day.ledScreen > 0) specialParts.push(`${day.ledScreen} LED`);
        if (day.plasmaTv > 0) specialParts.push(`${day.plasmaTv} Plasma`);
        if (specialParts.length > 0) {
          crewParts.push(specialParts.join(', '));
        }

        const crewDesc = crewParts.length > 0 ? crewParts.join(' &bull; ') : 'Standard Coverage';
        const borderStyle = idx > 0 ? 'border-top: 1px dashed rgba(2,48,58,0.12); padding-top: 7px;' : '';

        return `
          <div style="display: flex; justify-content: space-between; align-items: baseline; ${borderStyle}">
            <span style="font-weight: 700; color: #02303A;">${dayLabel} &bull; ${dayTitle}</span>
            <span style="color: #475569; font-size: 0.79rem;">${crewDesc}</span>
          </div>
        `;
      }).join('');
    }

    let delivSectionHtml = '';
    if (hasDelivs) {
      const delivItems = activeDeliverables.map(item => `
        <div style="display: flex; gap: 7px; align-items: baseline; font-size: 0.77rem; color: #02303A; line-height: 1.35;">
          <span style="color: #b89358; font-size: 0.85rem;">&bull;</span>
          <span>${item}</span>
        </div>
      `).join('');

      const topBorder = hasDays ? 'border-top: 1px solid rgba(2,48,58,0.12); margin-top: 13px; padding-top: 11px;' : '';

      delivSectionHtml = `
        <div style="${topBorder}">
          <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b89358; margin-bottom: 8px;">
            Deliverables Included
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 20px;">
            ${delivItems}
          </div>
        </div>
      `;
    }

    scopeSectionHtml = `
      <div style="margin-bottom: 22px;">
        <div style="background: rgba(255,255,255,0.4); border-radius: 8px; padding: 14px 18px; border: 1px solid rgba(2,48,58,0.12);">
          ${hasDays ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b89358;">
                Scope of Coverage & Crew
              </div>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 500;">${days.length} ${days.length === 1 ? 'Function' : 'Functions'}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 7px; font-size: 0.81rem; color: #02303A;">
              ${daysRowsHtml}
            </div>
          ` : ''}
          ${delivSectionHtml}
        </div>
      </div>
    `;
  }

  // Date formatted range
  const shootDateStr = (b.endDate && b.endDate !== b.date)
    ? `${formatDate(b.date)} - ${formatDate(b.endDate)}`
    : formatDate(b.date);

  // Payments List
  let paymentsListHtml = '';
  if (payments && payments.length > 0) {
    paymentsListHtml = payments.map(p => `
      <tr>
        <td style="padding:6px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12); font-size:0.82rem; color: #02303A;">${p.stage || 'Payment'} (${p.mode || 'Bank Transfer'})</td>
        <td style="padding:6px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12); text-align:right; font-size:0.82rem; color: #02303A;">${formatDate(p.date)}</td>
        <td style="padding:6px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12); text-align:right; font-weight:700; font-size:0.85rem; color: #02303A;">₹${p.amount.toLocaleString()}</td>
      </tr>
    `).join('');
  } else {
    paymentsListHtml = `
      <tr>
        <td colspan="3" style="padding:6px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12); color:#64748b; font-style:italic; font-size:0.82rem;">No payments recorded yet</td>
      </tr>
    `;
  }

  const invoiceSheet = document.getElementById('invoiceSheet');
  invoiceSheet.innerHTML = `
    <!-- Action Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
      <button onclick="document.getElementById('invoiceSheet').style.display='none'" style="background:none; border:none; font-size:1rem; cursor:pointer; font-weight:600; color:#64748b; display:flex; align-items:center; gap:5px;">
        ← Back to Booking
      </button>
      <div style="display:flex; gap:10px;">
        <button onclick="window.print()" style="background:#02303A; color:#EBE6DA; border:none; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer; box-shadow: 0 4px 6px rgba(2,48,58,0.2);">
          🖨️ Print Invoice
        </button>
        <button onclick="window.exportInvoicePDF('${bookingId}')" style="background:#c5a880; color:#1e293b; border:none; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer; box-shadow: 0 4px 6px rgba(197,168,128,0.2);">
          ⬇️ Export PDF
        </button>
      </div>
    </div>

    <div style="background-color: #EBE6DA; padding: 30px 38px; min-height: 1123px; display: flex; flex-direction: column; box-sizing: border-box;">
      <!-- Header: Astrid Design Luxury Layout -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px;">
        
        <!-- Left: Bigger Logo & Studio Details Stacked -->
        <div style="text-align: left;">
          <img src="${STUDIO_LOGO_DATA_URL}" alt="Wedding Nest Logo" style="height: 68px; width: auto; object-fit: contain; display: block; margin-bottom: 8px;" />
          
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 1.95rem; letter-spacing: 2.5px; color: #02303A; margin: 0; font-weight: 700; text-transform: uppercase; line-height: 1;">
            Wedding Nest
          </h2>
          <p style="font-size: 0.66rem; text-transform: uppercase; letter-spacing: 2.5px; color: #02303A; opacity: 0.75; margin: 4px 0 0 0; font-weight: 600;">
            Wedding Photography Studio
          </p>

          <div style="font-size: 0.76rem; color: #02303A; opacity: 0.82; margin-top: 10px; line-height: 1.42;">
            218, Angle Business Center, Near ABC Circle<br>
            Mota Varachha, Surat - 394101<br>
            <span style="font-weight: 600;">+91 81402 98239</span> &bull; <span style="font-weight: 600;">weddingnest01@gmail.com</span>
          </div>
        </div>

        <!-- Right: INVOICE & Stacked Metadata (Like Astrid Design photo) -->
        <div style="text-align: right;">
          <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 2.7rem; font-weight: 400; text-transform: uppercase; color: #02303A; letter-spacing: 3.5px; margin: 0 0 14px 0; line-height: 0.95;">
            Invoice
          </h1>

          <div style="margin-bottom: 10px;">
            <div style="font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">
              Invoice No.
            </div>
            <div style="font-size: 0.86rem; font-weight: 600; color: #02303A; margin-top: 1px;">
              ${invoiceNum}
            </div>
          </div>

          <div>
            <div style="font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">
              Date
            </div>
            <div style="font-size: 0.86rem; font-weight: 600; color: #02303A; margin-top: 1px;">
              ${formatDate(new Date().toISOString().split('T')[0])}
            </div>
          </div>
        </div>

      </div>

      <!-- Billed To & Shoot Specifications -->
      <div style="display:flex; justify-content:space-between; margin-bottom: 20px; border-top: 1px solid rgba(2, 48, 58, 0.15); border-bottom: 1px solid rgba(2, 48, 58, 0.15); padding: 14px 0;">
        <div>
          <h3 style="font-size:0.72rem; text-transform:uppercase; color:#02303A; margin:0 0 4px 0; letter-spacing: 1px;">Billed To</h3>
          <p style="font-size:1.05rem; font-weight:700; margin:0; color:#02303A;">${b.clientName}</p>
          <p style="font-size:0.85rem; color:#02303A; opacity: 0.85; margin:3px 0 0 0;">${b.email || '—'}</p>
          <p style="font-size:0.85rem; color:#02303A; opacity: 0.85; margin:2px 0 0 0;">${b.phone || '—'}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:0.72rem; text-transform:uppercase; color:#02303A; margin:0 0 4px 0; letter-spacing: 1px;">Shoot Specifications</h3>
          <p style="font-size:1rem; font-weight:700; margin:0; color:#02303A;">${b.type} Coverage</p>
          <p style="font-size:0.85rem; color:#02303A; opacity: 0.85; margin:3px 0 0 0;"><strong>Date:</strong> ${shootDateStr}</p>
          <p style="font-size:0.85rem; color:#02303A; opacity: 0.85; margin:2px 0 0 0;"><strong>Venue:</strong> ${b.venue}</p>
        </div>
      </div>

      <!-- Package Summary -->
      <table style="width:100%; border-collapse:collapse; margin-bottom: 18px;">
        <thead>
          <tr style="border-bottom:1.5px solid rgba(2, 48, 58, 0.2);">
            <th style="text-align:left; padding-bottom:6px; font-size:0.8rem; text-transform:uppercase; letter-spacing: 1px; color:#02303A;">Description</th>
            <th style="text-align:right; padding-bottom:6px; font-size:0.8rem; text-transform:uppercase; letter-spacing: 1px; color:#02303A;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12);">
              <p style="font-weight:600; margin:0; color:#02303A; font-size:0.95rem;">${b.type} Photography & Cinematography Coverage</p>
            </td>
            <td style="text-align:right; padding:10px 0; border-bottom:1px solid rgba(2, 48, 58, 0.12); font-weight:700; font-size:1.05rem; color:#02303A;">₹${b.packagePrice.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Integrated Scope Card (Option B layout with Option A Deliverables bullets) -->
      ${scopeSectionHtml}

      <!-- Payments Ledger & Final Summary Balance -->
      <div style="display:flex; justify-content:space-between; gap: 24px; align-items: flex-start; margin-bottom: 20px;">
        <div style="flex: 1;">
          <h3 style="font-size:0.88rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; border-bottom:1.5px solid rgba(2, 48, 58, 0.2); padding-bottom:5px; margin:0 0 8px 0; color:#02303A;">Payment Ledger</h3>
          <table style="width:100%; border-collapse:collapse;">
            <tbody>
              ${paymentsListHtml}
            </tbody>
          </table>
        </div>

        <div style="width:260px; background:rgba(255,255,255,0.45); border: 1px solid rgba(2, 48, 58, 0.12); padding:12px 16px; border-radius:8px; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem;">
            <span style="color:#02303A;">Subtotal:</span>
            <span style="font-weight:600; color:#02303A;">₹${b.packagePrice.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem; color:#02303A;">
            <span>Paid-to-Date:</span>
            <span style="font-weight:600; color: #166534;">- ₹${paid.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1.5px solid rgba(2, 48, 58, 0.2); padding-top:6px; font-size:1rem; font-weight:700;">
            <span style="color:#02303A;">Balance Due:</span>
            <span style="color:#02303A;">₹${balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(2, 48, 58, 0.15);">
        <div style="font-family: 'Open Sauce One', sans-serif; display: flex; justify-content: center; gap: 16px; font-size: 9.5px; color: #02303A; font-weight: 600; align-items: center; flex-wrap: wrap;">
          <div>+91 81402 98239</div>
          <div style="width: 2px; height: 12px; background-color: rgba(2, 48, 58, 0.3);"></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            @weddingnest_studio
          </div>
          <div style="width: 2px; height: 12px; background-color: rgba(2, 48, 58, 0.3);"></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>218, Angle Business Center, Mota Varachha, Surat</span>
          </div>
          <div style="width: 2px; height: 12px; background-color: rgba(2, 48, 58, 0.3);"></div>
          <div>weddingnest01@gmail.com</div>
        </div>
      </div>
    </div>
  `;

  // Display the sheet
  invoiceSheet.style.display = 'block';
}

function initExportDialog() {
  const dialog = document.getElementById('ledger-export-dialog');
  if (!dialog) return;

  const btnClose = document.getElementById('ledger-export-dialog-close');
  const btnCancel = document.getElementById('ledger-export-dialog-cancel');
  const btnPdf = document.getElementById('btn-do-export-pdf');
  const btnCsv = document.getElementById('btn-do-export-csv');

  const monthSelect = document.getElementById('export-month-select');
  const fySelect = document.getElementById('export-fy-select');
  const rangeStart = document.getElementById('export-range-start');
  const rangeEnd = document.getElementById('export-range-end');
  const typeSelect = document.getElementById('export-type-select');
  const scopeRadios = document.querySelectorAll('input[name="export-scope"]');

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => openExportDialog());
  }

  if (btnClose) btnClose.addEventListener('click', () => dialog.close());
  if (btnCancel) btnCancel.addEventListener('click', () => dialog.close());

  // Listen to scope radio changes
  scopeRadios.forEach(r => r.addEventListener('change', updateExportPreview));
  if (monthSelect) monthSelect.addEventListener('change', updateExportPreview);
  if (fySelect) fySelect.addEventListener('change', updateExportPreview);
  if (rangeStart) rangeStart.addEventListener('input', updateExportPreview);
  if (rangeEnd) rangeEnd.addEventListener('input', updateExportPreview);
  if (typeSelect) typeSelect.addEventListener('change', updateExportPreview);

  if (btnPdf) btnPdf.addEventListener('click', handleExportPDF);
  if (btnCsv) btnCsv.addEventListener('click', handleExportCSV);
}

function openExportDialog() {
  const dialog = document.getElementById('ledger-export-dialog');
  if (!dialog) return;

  const monthSelect = document.getElementById('export-month-select');
  const fySelect = document.getElementById('export-fy-select');
  const rangeStart = document.getElementById('export-range-start');
  const rangeEnd = document.getElementById('export-range-end');

  // Populate Month Options
  if (monthSelect) {
    monthSelect.innerHTML = '';
    const months = getAvailableTrackerMonths();
    const runningYm = getTrackerRunningMonth().ym;
    months.forEach(m => {
      const isSelected = currentTrackerDateFilter.type === 'month' && currentTrackerDateFilter.ym === m.ym;
      const runningTag = m.ym === runningYm ? ' (Running Month)' : '';
      monthSelect.innerHTML += `<option value="${m.ym}" ${isSelected ? 'selected' : ''}>${m.label}${runningTag}</option>`;
    });
  }

  // Populate FY Options
  if (fySelect) {
    fySelect.innerHTML = '';
    const fyList = getAvailableFinancialYears();
    fyList.forEach(fy => {
      const isSelected = currentTrackerDateFilter.type === 'range' && currentTrackerDateFilter.start === fy.start;
      fySelect.innerHTML += `<option value="${fy.code}" data-start="${fy.start}" data-end="${fy.end}" ${isSelected ? 'selected' : ''}>${fy.label}</option>`;
    });
  }

  // Default dates for Custom Range
  const todayStr = new Date().toISOString().split('T')[0];
  if (rangeStart && !rangeStart.value) {
    rangeStart.value = currentTrackerDateFilter.type === 'range' && currentTrackerDateFilter.start ? currentTrackerDateFilter.start : todayStr;
  }
  if (rangeEnd && !rangeEnd.value) {
    rangeEnd.value = currentTrackerDateFilter.type === 'range' && currentTrackerDateFilter.end ? currentTrackerDateFilter.end : todayStr;
  }

  // Auto-select scope radio based on current view
  const scopeRadios = document.querySelectorAll('input[name="export-scope"]');
  scopeRadios.forEach(r => {
    if (currentTrackerDateFilter.type === 'month' && r.value === 'month') r.checked = true;
    else if (currentTrackerDateFilter.type === 'range') {
      const isFy = Array.from(document.querySelectorAll('#export-fy-select option')).some(o => o.dataset.start === currentTrackerDateFilter.start);
      if (isFy && r.value === 'fy') r.checked = true;
      else if (!isFy && r.value === 'range') r.checked = true;
    } else if (currentTrackerDateFilter.type === 'all' && r.value === 'all') r.checked = true;
  });

  updateExportPreview();
  dialog.showModal();
}

function getExportTransactionsAndMeta() {
  const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
  const scope = scopeRadio ? scopeRadio.value : 'month';
  const typeSelect = document.getElementById('export-type-select');
  const transType = typeSelect ? typeSelect.value : 'all';

  let scopeLabel = '';
  let startDate = null;
  let endDate = null;
  let filterYm = null;

  if (scope === 'month') {
    const monthSelect = document.getElementById('export-month-select');
    filterYm = monthSelect ? monthSelect.value : getTrackerRunningMonth().ym;
    const opt = monthSelect && monthSelect.selectedIndex >= 0 ? monthSelect.options[monthSelect.selectedIndex] : null;
    scopeLabel = opt ? opt.text : filterYm;
  } else if (scope === 'fy') {
    const fySelect = document.getElementById('export-fy-select');
    const opt = fySelect && fySelect.selectedIndex >= 0 ? fySelect.options[fySelect.selectedIndex] : null;
    if (opt) {
      startDate = opt.dataset.start;
      endDate = opt.dataset.end;
      scopeLabel = opt.text;
    }
  } else if (scope === 'range') {
    const s = document.getElementById('export-range-start')?.value || '';
    const e = document.getElementById('export-range-end')?.value || '';
    startDate = s;
    endDate = e;
    scopeLabel = `${formatDate(s)} to ${formatDate(e)}`;
  } else {
    scopeLabel = 'All Time Historical';
  }

  const all = getAllTransactions();
  let filtered = all.filter(t => {
    if (!t.date) return false;
    if (scope === 'month' && filterYm) {
      return t.date.startsWith(filterYm);
    } else if ((scope === 'fy' || scope === 'range') && startDate && endDate) {
      return t.date >= startDate && t.date <= endDate;
    }
    return true; // all
  });

  if (transType !== 'all') {
    filtered = filtered.filter(t => t.type === transType);
  }

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else if (t.type === 'expense') totalExpense += t.amount;
  });
  const net = totalIncome - totalExpense;

  return {
    transactions: filtered,
    totalIncome,
    totalExpense,
    net,
    scopeLabel,
    transType
  };
}

function updateExportPreview() {
  const meta = getExportTransactionsAndMeta();
  const expCount = document.getElementById('exp-prev-count');
  const expIncome = document.getElementById('exp-prev-income');
  const expExpense = document.getElementById('exp-prev-expense');
  const expNet = document.getElementById('exp-prev-net');

  if (expCount) expCount.textContent = meta.transactions.length;
  if (expIncome) expIncome.textContent = `₹${meta.totalIncome.toLocaleString()}`;
  if (expExpense) expExpense.textContent = `₹${meta.totalExpense.toLocaleString()}`;
  if (expNet) {
    expNet.textContent = (meta.net >= 0 ? '+' : '-') + `₹${Math.abs(meta.net).toLocaleString()}`;
    expNet.style.color = meta.net >= 0 ? '#1b7a5a' : '#b91c1c';
  }
}

function handleExportCSV() {
  const meta = getExportTransactionsAndMeta();
  if (meta.transactions.length === 0) {
    alert("No transactions found for the selected export period.");
    return;
  }
  let csv = 'Date,Type,Description,Category,Linked Client / Shoot,Amount (INR)\n';
  meta.transactions.forEach(t => {
    const isIncome = t.type === 'income';
    const amountVal = isIncome ? t.amount : -t.amount;
    const cleanDesc = (t.desc || '').replace(/"/g, '""');
    const cleanCat = (t.category || '').replace(/"/g, '""');
    const cleanClient = (t.bookingName || '').replace(/"/g, '""');
    csv += `"${t.date}","${t.type.toUpperCase()}","${cleanDesc}","${cleanCat}","${cleanClient}",${amountVal}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanFilename = `WeddingNest_Ledger_${meta.scopeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleExportPDF() {
  if (typeof html2pdf === 'undefined') {
    alert("PDF generator not loaded yet. Please try again in a few moments.");
    return;
  }

  const meta = getExportTransactionsAndMeta();
  if (meta.transactions.length === 0) {
    alert("No transactions found for the selected export period.");
    return;
  }

  const dialog = document.getElementById('ledger-export-dialog');
  if (dialog) dialog.close();

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.width = '0';
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';

  const container = document.createElement('div');
  container.style.width = '794px';
  container.style.padding = '40px';
  container.style.fontFamily = "'Outfit', sans-serif";
  container.style.color = '#0A0906';
  container.style.backgroundColor = '#ffffff';

  const typeLabel = meta.transType === 'income' ? 'Income Transactions' : (meta.transType === 'expense' ? 'Expense Transactions' : 'All Transactions');

  let headerHtml = `
    <div style="text-align: center; margin-bottom: 26px; border-bottom: 2px solid #02303A; padding-bottom: 16px;">
      <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; color: #02303A; margin: 0 0 4px 0; letter-spacing: 1px;">Wedding Nest Studio</h1>
      <div style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #5e5a52; margin-bottom: 6px;">Financial Statement &amp; Audit Ledger</div>
      <p style="color: #02303A; font-weight: 600; font-size: 0.95rem; margin: 0 0 4px 0;">${meta.scopeLabel} • ${typeLabel}</p>
      <p style="color: #8e8a80; font-size: 0.8rem; margin: 0;">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  `;

  // Summary Overview Cards in PDF
  let summaryCardsHtml = `
    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; text-align: center;">
        <div style="font-size: 0.72rem; font-weight: 600; color: #166534; text-transform: uppercase;">Total Inflow (Income)</div>
        <div style="font-size: 1.35rem; font-weight: 700; color: #16a34a; margin-top: 2px;">₹${meta.totalIncome.toLocaleString()}</div>
      </div>
      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; text-align: center;">
        <div style="font-size: 0.72rem; font-weight: 600; color: #991b1b; text-transform: uppercase;">Total Outflow (Expenses)</div>
        <div style="font-size: 1.35rem; font-weight: 700; color: #dc2626; margin-top: 2px;">₹${meta.totalExpense.toLocaleString()}</div>
      </div>
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; text-align: center;">
        <div style="font-size: 0.72rem; font-weight: 600; color: #334155; text-transform: uppercase;">Net Profit / Balance</div>
        <div style="font-size: 1.35rem; font-weight: 700; color: ${meta.net >= 0 ? '#16a34a' : '#dc2626'}; margin-top: 2px;">${meta.net >= 0 ? '+' : '-'}₹${Math.abs(meta.net).toLocaleString()}</div>
      </div>
    </div>
  `;

  // Rows HTML
  let rowsHtml = '';
  meta.transactions.forEach(t => {
    const isIncome = t.type === 'income';
    const amountColor = isIncome ? '#16a34a' : '#dc2626';
    const amountStr = (isIncome ? '+' : '-') + ` ₹${t.amount.toLocaleString()}`;

    rowsHtml += `
      <tr>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; white-space: nowrap;">${formatDate(t.date)}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem;">
          <div style="font-weight: 600; color: #02303A;">${t.desc || '-'}</div>
          <div style="font-size: 0.72rem; color: #64748b;">${t.category}</div>
        </td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #334155;">${t.bookingName}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 0.88rem; color: ${amountColor};">${amountStr}</td>
      </tr>
    `;
  });

  let tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: rgba(2, 48, 58, 0.06); text-align: left; border-bottom: 2px solid rgba(2, 48, 58, 0.2);">
          <th style="padding: 10px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; color: #02303A; letter-spacing: 0.5px;">Date</th>
          <th style="padding: 10px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; color: #02303A; letter-spacing: 0.5px;">Particulars / Description</th>
          <th style="padding: 10px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; color: #02303A; letter-spacing: 0.5px;">Linked Client</th>
          <th style="padding: 10px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; color: #02303A; letter-spacing: 0.5px; text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  let footerHtml = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 0.78rem; color: #64748b;">
      <div>
        <p style="margin: 0 0 3px 0;">This statement is an official internal ledger export generated by Wedding Nest Studio Manager.</p>
        <p style="margin: 0;">Verified for Accounts, GST &amp; CA Audit compliance.</p>
      </div>
      <div style="text-align: center; width: 180px;">
        <div style="border-bottom: 1px solid #94a3b8; height: 32px; margin-bottom: 4px;"></div>
        <div style="font-weight: 600; color: #02303A;">Authorized Signatory</div>
      </div>
    </div>
  `;

  container.innerHTML = headerHtml + summaryCardsHtml + tableHtml + footerHtml;
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  const cleanFilename = `WeddingNest_Ledger_${meta.scopeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const opt = {
    margin:       [10, 0, 10, 0],
    filename:     cleanFilename,
    image:        { type: 'jpeg', quality: 1.0 },
    pagebreak:    { mode: 'css', before: '.html2pdf__page-break' },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).outputPdf('blob').then((pdfBlob) => {
    document.body.removeChild(wrapper);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = opt.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }).catch(err => {
    console.error(err);
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
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

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.width = '0';
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';

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
  
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);
  
  const invoiceYear = b.date.split('-')[0] || new Date().getFullYear();
  const invoiceNum = `INV-${invoiceYear}-${b.id.split('-')[1]}`;
  
  const opt = {
    margin:       0,
    filename:     `Invoice_${b.clientName.replace(/\\s+/g, '_')}_${invoiceNum}.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 3, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).outputPdf('blob').then((pdfBlob) => {
    document.body.removeChild(wrapper);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = opt.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }).catch(err => {
    console.error(err);
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  });
};
