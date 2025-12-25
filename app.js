// State management
let state = {
    currentStartDate: new Date(),
    currentDate: new Date(), // Today's date for new entries
    pmDuskMode: 'pm', // 'pm' or 'dusk'
    quantities: {
        'pm-dusk': 0,
        'overtime': 0,
        'amenity': 0
    },
    daysData: {}
};

// currently editing dateKey
let editingDateKey = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Setup Login Form Listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    checkLoginState();
});

function checkLoginState() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        showAppView();
        initializeApp(loggedInUser);
    } else {
        showLoginView();
    }
}

function showAppView() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
}

function showLoginView() {
    document.getElementById('app-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '';
    
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('loggedInUser', data.username);
            checkLoginState();
        } else {
            errorMessage.textContent = data.message || 'Login failed.';
        }
    } catch (error) {
        errorMessage.textContent = 'Offline or server error. Please try again.';
    }
}

function initializeApp(username) {
    updateHeader(username);
    loadFromStorage();
    initializeDarkMode();
    renderDays();
    setupEventListeners();
}
function initializeToToday() {
    // Set current date and start date
    const today = new Date();
    state.currentDate = today;
    
    const dayOfMonth = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Create start date for the period
    const startDate = new Date(currentYear, currentMonth, 1);
    startDate.setHours(0, 0, 0, 0);
    
    // If today is after the 15th and the month has more than 15 days,
    // start from the 16th
    if (dayOfMonth > 15) {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        if (daysInMonth > 15) {
            startDate.setDate(16);
        }
    }
    
    state.currentStartDate = startDate;
    
    // Update the current date display
    updateCurrentDateDisplay();
}

function formatCurrentDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
}

function updateCurrentDateDisplay() {
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.textContent = formatCurrentDate(state.currentDate);
    }
}

function updateHeader(username) {
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        // Capitalize first letter for display
        const displayName = username.charAt(0).toUpperCase() + username.slice(1).replace('_', ' ');
        headerTitle.textContent = `Hello, ${displayName}`;
    }
}

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        checkLoginState();
    });

    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });

    // PM/DUSK switch buttons
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons in the switch
            e.target.parentElement.querySelectorAll('.switch-btn').forEach(b => {
                b.classList.remove('active');
            });
            // Add active class to clicked button
            e.target.classList.add('active');
            state.pmDuskMode = e.target.dataset.mode;
        });
    });

    // Add and Entry buttons
    document.querySelectorAll('.entry-btn').forEach(btn => {
        btn.addEventListener('click', handleAddClick);
    });

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        const currentDate = new Date(state.currentStartDate);
        const isCurrentlySecondHalf = currentDate.getDate() > 15;
        
        if (isCurrentlySecondHalf) {
            // Move to first half of current month
            currentDate.setDate(1);
        } else {
            // Move to second half of previous month
            currentDate.setMonth(currentDate.getMonth() - 1);
            currentDate.setDate(16);
        }
        
        state.currentStartDate = currentDate;
        renderDays();
        saveToStorage();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const currentDate = new Date(state.currentStartDate);
        const isCurrentlySecondHalf = currentDate.getDate() > 15;
        const daysInCurrentMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        
        if (isCurrentlySecondHalf) {
            // Move to first half of next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(1);
        } else {
            // Move to second half of current month if available
            if (daysInCurrentMonth > 15) {
                currentDate.setDate(16);
            } else {
                // If current month doesn't have more than 15 days, move to next month
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(1);
            }
        }
        
        state.currentStartDate = currentDate;
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

    if (type === 'pm-dusk' && action === 'add') {
        // For PM/Dusk, the first addition starts at 4
        state.quantities[type] = state.quantities[type] === 0 ? 4 : state.quantities[type] + 1;
    } else if (type === 'pm-dusk' && action === 'remove') {
        // Don't allow going below 4, but can be reset by adding to a day
        if (state.quantities[type] > 4) state.quantities[type]--;
    } else if (action === 'add') {
        state.quantities[type]++; // For other types
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

function handleAddClick(e) {
    const type = e.currentTarget.dataset.type;
    const quantity = state.quantities[type];
    
    if (quantity === 0) {
        alert('Please set a quantity first');
        return;
    }

    // Add to today's date
    const dateKey = formatDateKey(state.currentDate);
    
    // Initialize day data if needed
    if (!state.daysData[dateKey]) {
        state.daysData[dateKey] = {
            'pm-dusk': { pm: 0, dusk: 0 },
            'overtime': 0,
            'amenity': 0
        };
    }

    // Add quantity to the selected mode (pm or dusk)
    if (type === 'pm-dusk') {
        state.daysData[dateKey]['pm-dusk'][state.pmDuskMode] += quantity;
    } else {
        state.daysData[dateKey][type] += quantity;
    }

    // Reset quantity
    state.quantities[type] = 0;
    updateQuantityDisplay(type);
    
    renderDays();
    saveToStorage();
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
            'pm-dusk': { pm: 0, dusk: 0 },
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
    
    // Get today's date key for highlighting
    const todayKey = formatDateKey(new Date());

    // Update date range display
    const startDate = days[0];
    const endDate = days[days.length - 1];
    document.getElementById('dateRange').textContent = 
        `${formatDate(startDate)} - ${formatDate(endDate)}`;

    daysGrid.innerHTML = '';

    days.forEach((day, index) => {
        const dateKey = formatDateKey(day);
        const dayData = state.daysData[dateKey] || {
            'pm-dusk': { pm: 0, dusk: 0 },
            'overtime': 0,
            'amenity': 0
        };

        // Handle legacy data format
        let pmDuskDisplay = '';
        if (dayData['pm-dusk']) {
            const pmCount = dayData['pm-dusk'].pm || 0;
            const duskCount = dayData['pm-dusk'].dusk || 0;
            
            if (pmCount > 0 && duskCount > 0) {
                pmDuskDisplay = `PM ${pmCount}, DUSK ${duskCount}`;
            } else if (pmCount > 0) {
                pmDuskDisplay = `PM ${pmCount}`;
            } else if (duskCount > 0) {
                pmDuskDisplay = `DUSK ${duskCount}`;
            }
        } else if (dayData['pm-djsk']) {
            // Legacy data format
            pmDuskDisplay = `PM ${dayData['pm-djsk']}`;
        }

        const row = document.createElement('div');
        row.className = 'day-row';

        // Add a class if the row represents the current calendar day
        if (dateKey === todayKey) {
            row.classList.add('current-day');
        }
        
        row.innerHTML = `
            <div class="day-cell day-date">${formatDate(day)}</div>
            <div class="day-cell day-value">${pmDuskDisplay}</div>
            <div class="day-cell day-value">${dayData['overtime']}</div>
            <div class="day-cell day-value">${dayData['amenity']}</div>
            <div class="day-cell">
                <button class="edit-btn" data-date-key="${dateKey}">Edit</button>
            </div>
        `;

        // Add click handler for edit button
        const editBtn = row.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            showEditDialog(dateKey);
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
    
    // Default to today's date if no specific date is provided
    if (!dateKey) {
        dateKey = formatDateKey(state.currentDate);
    }

    // Show type selection
    const types = [];
    if (state.quantities['pm-dusk'] > 0) types.push('PM/DUSK');
    if (state.quantities['overtime'] > 0) types.push('Overtime');
        if (state.quantities['amenity'] > 0) types.push('Mech overtime');

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

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getDaysArray() {
    const days = [];
    const startDate = new Date(state.currentStartDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const isSecondHalf = startDate.getDate() > 15;
    const daysInMonth = getDaysInMonth(year, month);
    
    if (isSecondHalf) {
        // From 16th to end of month
        const endDay = daysInMonth;
        const startDay = 16;
        
        for (let day = startDay; day <= endDay; day++) {
            const date = new Date(year, month, day);
            days.push(date);
        }
    } else {
        // From 1st to 15th
        const endDay = Math.min(15, daysInMonth);
        
        for (let day = 1; day <= endDay; day++) {
            const date = new Date(year, month, day);
            days.push(date);
        }
    }
    
    return days;
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    // European short format: '1 Nov'
    return `${dayName} ${day} ${month}`;
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
                pmDjsk: dayData['PM-DUSK'] || 0,
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
    // Use European formatted current date in the subject
    const subject = encodeURIComponent('Payroll Report - ' + formatCurrentDate(new Date()));
    
    let body = 'Payroll Report\n\n';
    body += 'Date Range: ' + document.getElementById('dateRange').textContent + '\n\n';
    body += 'Day | Date | PM DJSK | Overtime | Mech overtime\n';
    body += '--------------------------------------------\n';
    
    dataToSend.forEach(item => {
        body += `${item.day} | ${item.date} | ${item.pmDjsk} | ${item.overtime} | ${item.amenity}\n`;
    });
    
    body += '\n\nTotal Summary:\n';
    body += 'PM DJSK: ' + dataToSend.reduce((sum, item) => sum + item.pmDjsk, 0) + '\n';
    body += 'Overtime: ' + dataToSend.reduce((sum, item) => sum + item.overtime, 0) + '\n';
    body += 'Mech overtime: ' + dataToSend.reduce((sum, item) => sum + item.amenity, 0) + '\n';

    const emailBody = encodeURIComponent(body);
    
    // Create mailto link
    const mailtoLink = `mailto:?subject=${subject}&body=${emailBody}`;
    
    // Open email client
    window.location.href = mailtoLink;
}

async function saveToStorage() {
    const username = localStorage.getItem('loggedInUser');
    if (!username) return;

    const dataToSave = {
        currentStartDate: state.currentStartDate.toISOString(),
        pmDuskMode: state.pmDuskMode,
        daysData: state.daysData,
        quantities: state.quantities
    };

    // 1. Save locally (Offline First)
    localStorage.setItem(`payroll_data_${username}`, JSON.stringify(dataToSave));

    // 2. Try to sync to server (Best Effort)
    try {
        await fetch(`/api/data/${username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
    } catch (e) {
        console.warn('Server sync failed, data saved locally:', e);
    }
}

async function loadFromStorage() {
    const username = localStorage.getItem('loggedInUser');
    if (!username) return;

    let loadedData = null;

    // 1. Try Local Storage first
    const localDataString = localStorage.getItem(`payroll_data_${username}`);
    if (localDataString) {
        loadedData = JSON.parse(localDataString);
    }

    // 2. Try Server (Sync)
    try {
        const response = await fetch(`/api/data/${username}`);
        if (response.ok) {
            const serverData = await response.json();
            // Simple sync strategy: If we have no local data, or if server data exists,
            // we might want to use server data. For now, let's assume server is truth 
            // if we are online, BUT if we have local changes that haven't synced, this is risky.
            // For this specific request "offline on a phone", local data is usually the most relevant.
            // We will use server data only if local is empty.
            if (!loadedData || Object.keys(loadedData).length === 0) {
                loadedData = serverData;
                // Cache it locally
                localStorage.setItem(`payroll_data_${username}`, JSON.stringify(serverData));
            }
        }
    } catch (e) {
        console.warn('Server load failed, using local data:', e);
    }

    initializeToToday(); // Always start with today's view

    if (loadedData && Object.keys(loadedData).length > 0) {
        state.pmDuskMode = loadedData.pmDuskMode || 'pm';
        state.daysData = loadedData.daysData || {};
        state.quantities = loadedData.quantities || { 'pm-dusk': 0, 'overtime': 0, 'amenity': 0 };
    }

    // Update quantity displays from loaded state
    Object.keys(state.quantities).forEach(type => updateQuantityDisplay(type));
    renderDays(); // Re-render with loaded data
}

function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function showEditDialog(dateKey) {
    const dialog = document.getElementById('editDialog');
    if (!dialog) return;

    // ensure day data exists
    if (!state.daysData[dateKey]) {
        state.daysData[dateKey] = { 'pm-dusk': { pm: 0, dusk: 0 }, 'overtime': 0, 'amenity': 0 };
    }

    const dayData = state.daysData[dateKey];

    // populate inputs
    const pmDuskData = dayData['pm-dusk'] || { pm: 0, dusk: 0 };
    const pmValue = pmDuskData.pm || 0;
    const duskValue = pmDuskData.dusk || 0;

    const pmDuskSwitch = dialog.querySelector('#editPmDuskControls .pm-dusk-switch');
    const pmBtn = pmDuskSwitch.querySelector('[data-mode="pm"]');
    const duskBtn = pmDuskSwitch.querySelector('[data-mode="dusk"]');
    const pmDuskInput = document.getElementById('pmDuskValue');

    // Set active button and value
    if (pmValue > 0) {
        pmBtn.classList.add('active');
        duskBtn.classList.remove('active');
        pmDuskInput.value = pmValue;
    } else { // Default to DUSK if it has a value, or just default to PM if both are 0
        duskBtn.classList.add('active');
        pmBtn.classList.remove('active');
        pmDuskInput.value = duskValue;
    }

    document.getElementById('overtimeValue').value = dayData['overtime'] || 0;
    document.getElementById('amenityValue').value = dayData['amenity'] || 0;

    // Add event listeners for the switch
    pmBtn.onclick = () => { pmBtn.classList.add('active'); duskBtn.classList.remove('active'); };
    duskBtn.onclick = () => { duskBtn.classList.add('active'); pmBtn.classList.remove('active'); };

    // track editing key
    editingDateKey = dateKey;

    // wire up number input controls
    setupNumberInputs(dialog);

    // open
    dialog.classList.add('open');

    // close/cancel handlers
    dialog.querySelector('.close-dialog').onclick = closeEditDialog;
    dialog.querySelector('.cancel-btn').onclick = closeEditDialog;

    dialog.querySelector('.save-btn').onclick = () => {
        saveEditDialog(editingDateKey);
        closeEditDialog();
    };
}

function setupNumberInputs(container) {
    const inputs = container.querySelectorAll('.number-input');
    inputs.forEach(group => {
        const input = group.querySelector('input');
        const minus = group.querySelector('.minus');
        const plus = group.querySelector('.plus');

        const isPmDuskInput = input.id === 'pmDuskValue';

        minus.onclick = () => {
            const v = parseInt(input.value) || 0;
            if (isPmDuskInput) {
                // For PM/Dusk, don't go below 4 unless setting to 0
                input.value = v > 4 ? v - 1 : 0;
            } else {
                input.value = Math.max(0, v - 1);
            }
        };
        plus.onclick = () => {
            const v = parseInt(input.value) || 0;
            if (isPmDuskInput) {
                // For PM/Dusk, jump from 0 to 4
                input.value = v === 0 ? 4 : v + 1;
            } else {
                input.value = v + 1;
            }
        };

        input.oninput = () => {
            let v = parseInt(input.value) || 0;
            if (v < 0) v = 0;
            input.value = v;
        };
    });
}

function closeEditDialog() {
    const dialog = document.getElementById('editDialog');
    if (!dialog) return;
    dialog.classList.remove('open');
    editingDateKey = null;
}

function saveEditDialog(dateKey) {
    if (!dateKey) return;

    const pmDuskSwitch = document.querySelector('#editPmDuskControls .pm-dusk-switch');
    const activeMode = pmDuskSwitch.querySelector('.active').dataset.mode;
    const pmDuskValue = parseInt(document.getElementById('pmDuskValue').value) || 0;

    const overtimeValue = parseInt(document.getElementById('overtimeValue').value) || 0;
    const amenityValue = parseInt(document.getElementById('amenityValue').value) || 0;

    state.daysData[dateKey] = {
        'pm-dusk': {
            pm: activeMode === 'pm' ? pmDuskValue : 0,
            dusk: activeMode === 'dusk' ? pmDuskValue : 0
        },
        'overtime': overtimeValue,
        'amenity': amenityValue
    };

    saveToStorage();
    renderDays();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode.toString());
}
