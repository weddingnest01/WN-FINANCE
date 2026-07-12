// Data Store using LocalStorage for persistence

const STORAGE_KEY = 'wedding_photography_crm_state_clean_v1';

const SUPABASE_URL = 'https://yldqnbrjqixjpxvqglpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZHFuYnJqcWl4anB4dnFnbHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjI2OTQsImV4cCI6MjA5OTQzODY5NH0.4ecZ3Sg9owOtc9CoVO2Fml7oU8QI13C135wjFvHVxD0';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Initialize with a clean, empty state
const DEFAULT_STATE = {
  bookings: [],
  team: [],
  expenses: [],
  payments: [],
  feedback: [],
  unavailability: {}, // { memberId: ['YYYY-MM-DD', ...] }
  notifications: [],
  quotations: []
};

class DataStore {
  constructor() {
    this.state = this.loadState();
    this.syncFromCloud();
  }

  async syncFromCloud() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('app_state').select('state').eq('id', 'global').single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      if (data && data.state && Object.keys(data.state).length > 0) {
        this.state = data.state;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('storeUpdated'));
      }
    } catch (e) {
      console.error('Failed to sync from cloud', e);
    }
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Migrate existing state to include new properties
        if (!parsed.feedback) parsed.feedback = [];
        if (!parsed.unavailability) parsed.unavailability = {};
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.quotations) parsed.quotations = [];

        // Migrate existing bookings that were converted before the endDate fix
        let migrated = false;
        if (parsed.bookings && parsed.quotations) {
          parsed.bookings.forEach(b => {
            if (!b.endDate) {
              const quote = parsed.quotations.find(q => q.clientName === b.clientName);
              if (quote && quote.endDate) {
                b.endDate = quote.endDate;
                if (quote.servicesBooked) b.servicesBooked = quote.servicesBooked;
                migrated = true;
              }
            }
          });
        }
        
        if (migrated) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch(e) {}
        }

        return parsed;
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    // Initialize default state if not found
    this.saveStateToStorage(DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    this.saveStateToStorage(this.state);
    // Dispatch custom event to trigger UI updates automatically
    window.dispatchEvent(new CustomEvent('storeUpdated'));
  }

  saveStateToStorage(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    if (supabase) {
      supabase.from('app_state').upsert({ id: 'global', state: state }).then(({error}) => {
        if (error) console.error('Failed to sync state to cloud', error);
      });
    }
  }

  // --- Quotations CRUD ---
  getQuotations() {
    return this.state.quotations;
  }

  addQuotation(quote) {
    const newQuote = {
      id: 'q-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      items: [], // Array of { description, amount }
      ...quote,
      packagePrice: parseFloat(quote.packagePrice) || 0
    };
    this.state.quotations.push(newQuote);
    this.saveState();
    return newQuote;
  }

  updateQuotation(id, updatedFields) {
    const index = this.state.quotations.findIndex(q => q.id === id);
    if (index !== -1) {
      this.state.quotations[index] = {
        ...this.state.quotations[index],
        ...updatedFields,
        packagePrice: parseFloat(updatedFields.packagePrice ?? this.state.quotations[index].packagePrice) || 0
      };
      this.saveState();
    }
  }

  deleteQuotation(id) {
    this.state.quotations = this.state.quotations.filter(q => q.id !== id);
    this.saveState();
  }

  markQuotationLost(id) {
    const index = this.state.quotations.findIndex(q => q.id === id);
    if (index !== -1) {
      this.state.quotations[index].status = 'lost';
      this.saveState();
    }
  }

  confirmQuotation(id, finalPrice = null) {
    const index = this.state.quotations.findIndex(q => q.id === id);
    if (index !== -1) {
      const quote = this.state.quotations[index];
      // Move to bookings
      const newBooking = this.addBooking({
        clientName: quote.clientName,
        date: quote.date,
        endDate: quote.endDate || null,
        venue: quote.venue,
        type: quote.type,
        phone: quote.phone || '',
        email: quote.email || '',
        packagePrice: finalPrice !== null ? finalPrice : quote.packagePrice,
        servicesQuantities: quote.servicesQuantities,
        servicesBooked: (quote.servicesBooked || ['raw', 'edited', 'reels', 'video']).map(s => s === 'album' ? 'reels' : s),
        notes: `Converted from Quotation.\nItems:\n${quote.items?.map(i => '- ' + i.description + ': ' + i.amount).join('\n') || ''}`
      });
      // Mark quote as confirmed
      this.state.quotations[index].status = 'confirmed';
      this.state.quotations[index].bookingId = newBooking.id;
      this.saveState();
    }
  }

  // --- CRM Bookings CRUD ---
  getBookings() {
    return this.state.bookings;
  }

  getBooking(id) {
    return this.state.bookings.find(b => b.id === id);
  }

  addBooking(booking) {
    const newBooking = {
      id: 'b-' + Date.now(),
      assignedTeam: [],
      notes: '',
      ...booking,
      packagePrice: parseFloat(booking.packagePrice) || 0
    };
    this.state.bookings.push(newBooking);
    this.saveState();
    return newBooking;
  }

  updateBooking(id, updatedFields) {
    const index = this.state.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      const oldBooking = this.state.bookings[index];
      const newBooking = {
        ...oldBooking,
        ...updatedFields,
        packagePrice: parseFloat(updatedFields.packagePrice ?? oldBooking.packagePrice) || 0
      };
      this.state.bookings[index] = newBooking;

      // Reconcile Crew Payout Expenses
      const assigned = newBooking.assignedTeam || [];
      const fees = newBooking.crewFees || {};
      const paidStatus = newBooking.crewPaidStatus || {};

      // 1. Process active assigned crew
      assigned.forEach(memberId => {
        const status = paidStatus[memberId] || 'Unpaid';
        const fee = parseFloat(fees[memberId]) || 0;
        const expId = `e-payout-${newBooking.id}-${memberId}`;
        const existingIdx = this.state.expenses.findIndex(e => e.id === expId);

        if (status === 'Paid') {
          const member = this.state.team.find(t => t.id === memberId);
          const memberName = member ? member.name : 'Crew';
          const expData = {
            id: expId,
            category: 'Staff Salary',
            description: `Payout: ${memberName} (${newBooking.clientName})`,
            amount: fee,
            date: newBooking.date,
            bookingId: newBooking.id,
            payoutMemberId: memberId
          };

          if (existingIdx !== -1) {
            this.state.expenses[existingIdx] = expData;
          } else {
            this.state.expenses.push(expData);
          }
        } else {
          // If status is Unpaid, remove expense if exists
          if (existingIdx !== -1) {
            this.state.expenses.splice(existingIdx, 1);
          }
        }
      });

      // 2. Process removed crew members (in case they were unassigned)
      this.state.expenses = this.state.expenses.filter(e => {
        if (e.bookingId === newBooking.id && e.payoutMemberId) {
          return assigned.includes(e.payoutMemberId);
        }
        return true;
      });

      this.saveState();
      return newBooking;
    }
    return null;
  }

  deleteBooking(id) {
    this.state.bookings = this.state.bookings.filter(b => b.id !== id);
    // Cascade delete payments and linked expenses or detach them
    this.state.payments = this.state.payments.filter(p => p.bookingId !== id);
    this.state.expenses = this.state.expenses.map(e => e.bookingId === id ? { ...e, bookingId: null } : e);
    this.saveState();
  }

  // --- Team Management CRUD ---
  getTeam() {
    return this.state.team;
  }

  getTeamMember(id) {
    return this.state.team.find(t => t.id === id);
  }

  addTeamMember(member) {
    const newMember = {
      id: 't-' + Date.now(),
      status: 'Available',
      ...member
    };
    this.state.team.push(newMember);
    this.saveState();
    return newMember;
  }

  updateTeamMember(id, updatedFields) {
    const index = this.state.team.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.team[index] = {
        ...this.state.team[index],
        ...updatedFields
      };
      this.saveState();
      return this.state.team[index];
    }
    return null;
  }

  deleteTeamMember(id) {
    this.state.team = this.state.team.filter(t => t.id !== id);
    // Unassign from bookings and trigger expense updates
    this.state.bookings.forEach(b => {
      if (b.assignedTeam.includes(id)) {
        const updatedAssigned = b.assignedTeam.filter(tid => tid !== id);
        this.updateBooking(b.id, { assignedTeam: updatedAssigned });
      }
    });
    // Also remove any stray expenses for this member ID
    this.state.expenses = this.state.expenses.filter(e => e.payoutMemberId !== id);
    this.saveState();
  }

  // --- Expenses CRUD ---
  getExpenses() {
    return this.state.expenses;
  }

  addExpense(expense) {
    const newExpense = {
      id: 'e-' + Date.now(),
      ...expense,
      amount: parseFloat(expense.amount) || 0
    };
    this.state.expenses.push(newExpense);
    this.saveState();
    return newExpense;
  }

  deleteExpense(id) {
    // If it's a payout expense, sync back to booking
    const match = id.match(/^e-payout-(.+)-([^-]+)$/);
    if (match) {
      const bookingId = match[1];
      const memberId = match[2];
      const booking = this.state.bookings.find(b => b.id === bookingId);
      if (booking && booking.crewPaidStatus && booking.crewPaidStatus[memberId] === 'Paid') {
        booking.crewPaidStatus[memberId] = 'Unpaid';
      }
    }
    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    this.saveState();
  }

  // --- Payments (Income) CRUD ---
  getPayments() {
    return this.state.payments;
  }

  addPayment(payment) {
    const newPayment = {
      id: 'p-' + Date.now(),
      ...payment,
      amount: parseFloat(payment.amount) || 0
    };
    this.state.payments.push(newPayment);
    this.saveState();
    return newPayment;
  }

  deletePayment(id) {
    this.state.payments = this.state.payments.filter(p => p.id !== id);
    this.saveState();
  }

  // Helper payment selectors
  getPaymentsForBooking(bookingId) {
    return this.state.payments.filter(p => p.bookingId === bookingId);
  }

  getBookingPaidAmount(bookingId) {
    return this.getPaymentsForBooking(bookingId)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  // --- Financial Analytics ---
  getFinancialSummary() {
    const totalRevenue = this.state.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = this.state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Projected revenue = sum of package prices of confirmed (booked & completed) shoots
    const activeBookings = this.state.bookings.filter(b => b.status === 'booked' || b.status === 'completed');
    const totalProjected = activeBookings.reduce((sum, b) => sum + b.packagePrice, 0);
    const remainingToCollect = Math.max(0, totalProjected - totalRevenue);

    // Grouping by Month for chart visualization
    // Key format: "YYYY-MM" (e.g. "2026-05")
    const monthlyData = {};

    // Helper to format date string to "YYYY-MM"
    const getMonthKey = (dateStr) => {
      if (!dateStr) return 'Unknown';
      const parts = dateStr.split('-');
      if (parts.length < 2) return 'Unknown';
      return `${parts[0]}-${parts[1]}`; // returns "YYYY-MM"
    };

    // Aggregate Payments
    this.state.payments.forEach(p => {
      const key = getMonthKey(p.date);
      if (!monthlyData[key]) monthlyData[key] = { key, income: 0, expense: 0 };
      monthlyData[key].income += p.amount;
    });

    // Aggregate Expenses
    this.state.expenses.forEach(e => {
      const key = getMonthKey(e.date);
      if (!monthlyData[key]) monthlyData[key] = { key, income: 0, expense: 0 };
      monthlyData[key].expense += e.amount;
    });

    // Helper to convert "YYYY-MM" key to "MMM YY" (e.g. "May 26")
    const formatMonthDisplay = (key) => {
      if (key === 'Unknown') return 'Unknown';
      const [yStr, mStr] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(mStr, 10) - 1;
      if (monthIdx < 0 || monthIdx > 11) return 'Unknown';
      const yearShort = yStr.substring(2);
      return `${monthNames[monthIdx]} ${yearShort}`;
    };

    // Sort keys alphabetically (chronological sorting since it's "YYYY-MM")
    const sortedKeys = Object.keys(monthlyData).sort();
    const sortedMonthly = sortedKeys.map(key => {
      const d = monthlyData[key];
      return {
        month: formatMonthDisplay(key),
        income: d.income,
        expense: d.expense
      };
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      remainingToCollect,
      monthlyChartData: sortedMonthly
    };
  }

  // --- Feedback CRUD ---
  getFeedback() {
    return this.state.feedback || [];
  }

  addFeedback(feedback) {
    if (!this.state.feedback) this.state.feedback = [];
    const newFeedback = {
      id: 'f-' + Date.now(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...feedback
    };
    this.state.feedback.push(newFeedback);
    this.saveState();
    return newFeedback;
  }

  resolveFeedback(id) {
    if (!this.state.feedback) return;
    const index = this.state.feedback.findIndex(f => f.id === id);
    if (index !== -1) {
      this.state.feedback[index].status = 'Resolved';
      this.saveState();
    }
  }

  // --- Unavailability CRUD ---
  getUnavailability(memberId) {
    if (!this.state.unavailability) return [];
    return this.state.unavailability[memberId] || [];
  }

  getAllUnavailability() {
    return this.state.unavailability || {};
  }

  toggleUnavailability(memberId, dateStr) {
    if (!this.state.unavailability) this.state.unavailability = {};
    if (!this.state.unavailability[memberId]) {
      this.state.unavailability[memberId] = [];
    }
    const dates = this.state.unavailability[memberId];
    const index = dates.indexOf(dateStr);
    if (index !== -1) {
      dates.splice(index, 1);
    } else {
      dates.push(dateStr);
    }
    this.saveState();
  }

  // --- Notifications CRUD ---
  getNotifications(memberId) {
    if (!this.state.notifications) return [];
    return this.state.notifications.filter(n => n.memberId === memberId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addNotification(memberId, message) {
    if (!this.state.notifications) this.state.notifications = [];
    const newNotification = {
      id: 'n-' + Date.now(),
      memberId,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.state.notifications.push(newNotification);
    this.saveState();
    return newNotification;
  }

  markNotificationRead(id) {
    if (!this.state.notifications) return;
    const index = this.state.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.state.notifications[index].read = true;
      this.saveState();
    }
  }
}

const store = new DataStore();
