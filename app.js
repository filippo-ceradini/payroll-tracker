// State management
let state = {
    currentStartDate: new Date(),
    quantities: {
        'pm-djsk': 0,
        'overtime': 0,
        'amenity': 0
    },
    daysData: {}
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadFromStorage();
    initializeDarkMode();
    renderDays();
    setupEventListeners();
});

function initializeApp() {
    // Set current start date based on day of month
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Create start date for the 15-day period
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    
    // If today is after the 15th, start from the 16th
    if (dayOfMonth > 15) {
        startDate.setDate(16);
    }
    
    state.currentStartDate = startDate;
}

function setupEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });

    // Entry buttons (for adding to selected day)
    document.querySelectorAll('.entry-btn').forEach(btn => {
        btn.addEventListener('click', handleEntryClick);
    });

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        const newDate = new Date(state.currentStartDate);
        newDate.setDate(newDate.getDate() - 15);
        state.currentStartDate = newDate;
        renderDays();
        saveToStorage();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const newDate = new Date(state.currentStartDate);
        newDate.setDate(newDate.getDate() + 15);
        state.currentStartDate = newDate;
        renderDays();
        saveToStorage();
    });

    // Send button
    document.getElementById('sendBtn').addEventListener('click', handleSend);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
}

function handleQuantityChange(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const type = btn.dataset.type;

    if (action === 'add') {
        state.quantities[type]++;
    } else if (action === 'remove' && state.quantities[type] > 0) {
        state.quantities[type]--;
    }

    updateQuantityDisplay(type);
    saveToStorage();
}

function updateQuantityDisplay(type) {
    const quantityEl = document.querySelector(`.quantity[data-type="${type}"]`);
    if (quantityEl) {
        quantityEl.textContent = state.quantities[type];
    }
}

function handleEntryClick(e) {
    const type = e.currentTarget.dataset.type;
    const quantity = state.quantities[type];
    
    if (quantity === 0) {
        alert(`Please set a quantity for ${type.toUpperCase()} first`);
        return;
    }

    // Show day selection
    showDaySelection(type, quantity);
}

function showDaySelection(type, quantity) {
    const days = getDaysArray();
    const dayOptions = days.map((day, index) => {
        const dateKey = formatDateKey(day);
        const currentValue = state.daysData[dateKey]?.[type] || 0;
        return `${index + 1}. ${formatDate(day)} (Current: ${currentValue})`;
    }).join('\n');

    const dayNum = prompt(`Select day (1-15) to add ${quantity} ${type}:\n\n${dayOptions}`);
    
    if (dayNum === null) return;
    
    const dayIndex = parseInt(dayNum) - 1;
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= days.length) {
        alert('Invalid day number');
        return;
    }

    const selectedDay = days[dayIndex];
    const dateKey = formatDateKey(selectedDay);
    
    // Initialize day data if needed
    if (!state.daysData[dateKey]) {
        state.daysData[dateKey] = {
            'pm-djsk': 0,
            'overtime': 0,
            'amenity': 0
        };
    }

    // Add quantity
    state.daysData[dateKey][type] += quantity;
    
    // Reset quantity
    state.quantities[type] = 0;
    updateQuantityDisplay(type);
    
    renderDays();
    saveToStorage();
}

function renderDays() {
    const daysGrid = document.getElementById('daysGrid');
    const days = getDaysArray();
    
    // Update date range display
    const startDate = days[0];
    const endDate = days[days.length - 1];
    document.getElementById('dateRange').textContent = 
        `${formatDate(startDate)} - ${formatDate(endDate)}`;

    daysGrid.innerHTML = '';

    days.forEach((day, index) => {
        const dateKey = formatDateKey(day);
        const dayData = state.daysData[dateKey] || {
            'pm-djsk': 0,
            'overtime': 0,
            'amenity': 0
        };

        const row = document.createElement('div');
        row.className = 'day-row';
        
        row.innerHTML = `
            <div class="day-cell day-number">${index + 1}</div>
            <div class="day-cell day-date">${formatDate(day)}</div>
            <div class="day-cell day-value">${dayData['pm-djsk']}</div>
            <div class="day-cell day-value">${dayData['overtime']}</div>
            <div class="day-cell day-value">${dayData['amenity']}</div>
            <div class="day-cell">
                <button class="apply-btn" data-date-key="${dateKey}">Apply</button>
            </div>
        `;

        // Add click handler for apply button
        const applyBtn = row.querySelector('.apply-btn');
        applyBtn.addEventListener('click', () => {
            applyToDay(dateKey);
        });

        daysGrid.appendChild(row);
    });
}

function applyToDay(dateKey) {
    // Check if any quantities are set
    const hasQuantities = Object.values(state.quantities).some(qty => qty > 0);
    
    if (!hasQuantities) {
        alert('Please set quantities first using the +1 buttons');
        return;
    }

    // Show type selection
    const types = [];
    if (state.quantities['pm-djsk'] > 0) types.push('PM DJSK');
    if (state.quantities['overtime'] > 0) types.push('Overtime');
    if (state.quantities['amenity'] > 0) types.push('Amenity');

    if (types.length === 0) return;

    // For simplicity, apply all quantities
    if (!state.daysData[dateKey]) {
        state.daysData[dateKey] = {
            'pm-djsk': 0,
            'overtime': 0,
            'amenity': 0
        };
    }

    // Apply all quantities
    Object.keys(state.quantities).forEach(type => {
        if (state.quantities[type] > 0) {
            state.daysData[dateKey][type] += state.quantities[type];
            state.quantities[type] = 0;
            updateQuantityDisplay(type);
        }
    });

    renderDays();
    saveToStorage();
}

function getDaysArray() {
    const days = [];
    const startDate = new Date(state.currentStartDate);
    
    for (let i = 0; i < 15; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
    }
    
    return days;
}

function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function handleSend() {
    const days = getDaysArray();
    const dataToSend = [];

    days.forEach((day, index) => {
        const dateKey = formatDateKey(day);
        const dayData = state.daysData[dateKey];
        
        if (dayData && Object.values(dayData).some(val => val > 0)) {
            dataToSend.push({
                day: index + 1,
                date: formatDate(day),
                fullDate: dateKey,
                pmDjsk: dayData['pm-djsk'] || 0,
                overtime: dayData['overtime'] || 0,
                amenity: dayData['amenity'] || 0
            });
        }
    });

    if (dataToSend.length === 0) {
        alert('No data to send. Please add entries first.');
        return;
    }

    // Format email
    const subject = encodeURIComponent('Payroll Report - ' + new Date().toLocaleDateString());
    
    let body = 'Payroll Report\n\n';
    body += 'Date Range: ' + document.getElementById('dateRange').textContent + '\n\n';
    body += 'Day | Date | PM DJSK | Overtime | Amenity\n';
    body += '--------------------------------------------\n';
    
    dataToSend.forEach(item => {
        body += `${item.day} | ${item.date} | ${item.pmDjsk} | ${item.overtime} | ${item.amenity}\n`;
    });
    
    body += '\n\nTotal Summary:\n';
    body += 'PM DJSK: ' + dataToSend.reduce((sum, item) => sum + item.pmDjsk, 0) + '\n';
    body += 'Overtime: ' + dataToSend.reduce((sum, item) => sum + item.overtime, 0) + '\n';
    body += 'Amenity: ' + dataToSend.reduce((sum, item) => sum + item.amenity, 0) + '\n';

    const emailBody = encodeURIComponent(body);
    
    // Create mailto link
    const mailtoLink = `mailto:?subject=${subject}&body=${emailBody}`;
    
    // Open email client
    window.location.href = mailtoLink;
}

function saveToStorage() {
    try {
        localStorage.setItem('payrollTrackerState', JSON.stringify({
            currentStartDate: state.currentStartDate.toISOString(),
            daysData: state.daysData,
            quantities: state.quantities
        }));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem('payrollTrackerState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.currentStartDate = new Date(parsed.currentStartDate);
            state.daysData = parsed.daysData || {};
            state.quantities = parsed.quantities || {
                'pm-djsk': 0,
                'overtime': 0,
                'amenity': 0
            };
            
            // Update quantity displays
            Object.keys(state.quantities).forEach(type => {
                updateQuantityDisplay(type);
            });
        }
    } catch (e) {
        console.error('Failed to load from localStorage', e);
    }
}

function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode.toString());
}

