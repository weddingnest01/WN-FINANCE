
// DOM Elements
let calMonthSelect, calYearSelect, btnCalNewQuote;
let calendarDaysGrid;
let statInquiries, statBooked, statCompleted;

let currentYear, currentMonth; // 0-indexed month (0 = Jan, 11 = Dec)
let selectedDateStr = null;    // Format: YYYY-MM-DD

function initCalendar() {
  calMonthSelect = document.getElementById('cal-month-select');
  calYearSelect = document.getElementById('cal-year-select');
  btnCalNewQuote = document.getElementById('btn-cal-new-quote');
  calendarDaysGrid = document.getElementById('calendar-days-grid');
  statInquiries = document.getElementById('stat-inquiries');
  statBooked = document.getElementById('stat-booked');
  statCompleted = document.getElementById('stat-completed');

  // Initialize dates to today
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDateStr = getYYYYMMDD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Bind Event Listeners
  calMonthSelect.addEventListener('change', (e) => {
    currentMonth = parseInt(e.target.value, 10);
    renderCalendar();
  });

  calYearSelect.addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value, 10);
    renderCalendar();
  });

  btnCalNewQuote.addEventListener('click', () => {
    if (typeof window.editQuote === 'function') {
      window.editQuote(null);
    }
  });

  // Watch for state updates (e.g., if a booking is added/edited/deleted, we redraw)
  window.addEventListener('storeUpdated', () => {
    renderCalendar();
    updateStats();
  });

  // Initial Draw
  renderCalendar();
  updateStats();
}

// Format YYYY-MM-DD helper
function getYYYYMMDD(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function updateStats() {
  const quotes = typeof store.getQuotations === 'function' ? store.getQuotations().length : 0;
  const bookings = store.getBookings();
  
  const today = new Date();
  today.setHours(0,0,0,0);

  let bookedCount = 0;
  let completedCount = 0;

  bookings.forEach(b => {
    const bDate = new Date(b.date);
    bDate.setHours(0,0,0,0);
    if (bDate < today) {
      completedCount++;
    } else {
      bookedCount++;
    }
  });

  if (statInquiries) statInquiries.textContent = quotes;
  if (statBooked) statBooked.textContent = bookedCount;
  if (statCompleted) statCompleted.textContent = completedCount;
}

// Render Calendar Grid
function renderCalendar() {
  // Update select titles to match current state
  calMonthSelect.value = currentMonth;
  calYearSelect.value = currentYear;

  calendarDaysGrid.innerHTML = '';

  // Get first day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 6 = Sat

  // Get number of days in current month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get number of days in previous month (for padding)
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const bookings = store.getBookings();

  // 1. Render Previous Month Padding Days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
    const cellDate = getYYYYMMDD(prevYearVal, prevMonthIdx + 1, dayNum);

    const cell = document.createElement('div');
    cell.className = 'calendar-cell other-month';
    cell.textContent = dayNum;
    calendarDaysGrid.appendChild(cell);
  }

  // 2. Render Current Month Days
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const cellDate = getYYYYMMDD(currentYear, currentMonth + 1, dayNum);
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.textContent = dayNum;

    // Helper to check if a cellDate falls within a booking's date range
    const isDateInBooking = (b, dateStr) => {
      if (b.date === dateStr) return true;
      if (b.endDate) {
        const check = new Date(dateStr);
        const start = new Date(b.date);
        const end = new Date(b.endDate);
        return check >= start && check <= end;
      }
      return false;
    };

    // Check if it has active bookings
    const dayBookings = bookings.filter(b => isDateInBooking(b, cellDate));
    const hasShoot = dayBookings.length > 0;
    if (hasShoot) {
      cell.classList.add('has-shoot');
      const badge = document.createElement('span');
      badge.className = 'shoot-count-badge';
      badge.textContent = dayBookings.length;
      cell.appendChild(badge);
    }

    // Check if selected
    if (cellDate === selectedDateStr) {
      cell.classList.add('selected');
    }

    // Click to select
    cell.addEventListener('click', () => {
      // Remove selected class from previous selected cell
      const prevSelected = calendarDaysGrid.querySelector('.calendar-cell.selected');
      if (prevSelected) prevSelected.classList.remove('selected');

      // Add selected class to this cell
      cell.classList.add('selected');
      selectedDateStr = cellDate;

      // If it has a shoot, open the detail modal directly
      if (hasShoot) {
        const currentDayBookings = bookings.filter(b => isDateInBooking(b, cellDate));
        if (currentDayBookings.length > 0) {
          window.dispatchEvent(new CustomEvent('openBookingDetail', {
            detail: { id: currentDayBookings[0].id }
          }));
        }
      } else {
        // If empty date clicked, open new quote modal
        if (typeof window.editQuote === 'function') {
          window.editQuote(null);
        }
      }
    });

    // Double click to add a booking
    cell.addEventListener('dblclick', () => {
      window.dispatchEvent(new CustomEvent('openBookingForm', {
        detail: { date: cellDate }
      }));
    });

    calendarDaysGrid.appendChild(cell);
  }

  // 3. Render Next Month Padding Days to complete the grid (usually 35 or 42 cells)
  const totalCellsRendered = startDayOfWeek + totalDays;
  const remainingCells = totalCellsRendered % 7 === 0 ? 0 : 7 - (totalCellsRendered % 7);
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell other-month';
    cell.textContent = dayNum;
    calendarDaysGrid.appendChild(cell);
  }
}
