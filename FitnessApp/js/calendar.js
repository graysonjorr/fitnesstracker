// Calendar.js - Interactive Calendar Functionality

// Global variables
let currentDate = new Date();
let events = [];

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    renderCalendar();
    initializeEventListeners();
    displayUpcomingEvents();
});

// Load events from localStorage
function loadEvents() {
    const storedEvents = localStorage.getItem('calendarEvents');
    if (storedEvents) {
        events = JSON.parse(storedEvents);
    }
}

// Save events to localStorage
function saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

// Initialize all event listeners
function initializeEventListeners() {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Add event modal
    document.getElementById('addEventBtn').addEventListener('click', openAddEventModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAddEventModal);
    
    // Close modal buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelector('.view-close-btn').addEventListener('click', closeViewEventModal);
    
    // Form submission
    document.getElementById('eventForm').addEventListener('submit', handleAddEvent);
    
    // Delete event
    document.getElementById('deleteEventBtn').addEventListener('click', handleDeleteEvent);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Render the calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Clear previous calendar
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayDiv = createDayElement(day, month - 1, year, true);
        calendarDays.appendChild(dayDiv);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = createDayElement(day, month, year, false);
        calendarDays.appendChild(dayDiv);
    }
    
    // Add next month's leading days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows x 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, month + 1, year, true);
        calendarDays.appendChild(dayDiv);
    }
}

// Create a day element
function createDayElement(day, month, year, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    // Check if it's today
    const today = new Date();
    if (day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear()) {
        dayDiv.classList.add('today');
    }
    
    // Add day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);
    
    // Get events for this day
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(event => event.date === dateString);
    
    if (dayEvents.length > 0) {
        dayDiv.classList.add('has-events');
        
        // Add event list
        const eventList = document.createElement('div');
        eventList.className = 'event-list';
        
        dayEvents.slice(0, 3).forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.textContent = event.title;
            eventList.appendChild(eventItem);
        });
        
        if (dayEvents.length > 3) {
            const moreEvents = document.createElement('div');
            moreEvents.className = 'event-item';
            moreEvents.textContent = `+${dayEvents.length - 3} more`;
            eventList.appendChild(moreEvents);
        }
        
        dayDiv.appendChild(eventList);
    }
    
    // Add click handler to view events
    dayDiv.addEventListener('click', () => {
        if (dayEvents.length > 0) {
            showDayEvents(dateString, dayEvents);
        } else {
            openAddEventModal(dateString);
        }
    });
    
    return dayDiv;
}

// Open add event modal
function openAddEventModal(presetDate = null) {
    const modal = document.getElementById('eventModal');
    modal.classList.add('active');
    
    // Set date to clicked date if provided
    if (presetDate) {
        document.getElementById('eventDate').value = presetDate;
    } else {
        // Set to today's date
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        document.getElementById('eventDate').value = dateString;
    }
}

// Close add event modal
function closeAddEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    document.getElementById('eventForm').reset();
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('eventForm').reset();
}

// Handle add event form submission
function handleAddEvent(e) {
    e.preventDefault();
    
    const newEvent = {
        id: Date.now(),
        title: document.getElementById('eventTitle').value,
        type: document.getElementById('eventType').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        notes: document.getElementById('eventNotes').value
    };
    
    events.push(newEvent);
    saveEvents();
    closeAddEventModal();
    renderCalendar();
    displayUpcomingEvents();
}

// Show events for a specific day
function showDayEvents(dateString, dayEvents) {
    const modal = document.getElementById('viewEventModal');
    const title = document.getElementById('viewEventTitle');
    const details = document.getElementById('viewEventDetails');
    
    // Format date nicely
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    title.textContent = date.toLocaleDateString('en-US', options);
    
    // Display events
    details.innerHTML = '';
    dayEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.style.marginBottom = '1.5rem';
        eventDiv.style.paddingBottom = '1rem';
        eventDiv.style.borderBottom = '1px solid #ddd';
        
        eventDiv.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; font-weight: 700; text-transform: uppercase;">${event.title}</h3>
            <p><strong>Type:</strong> ${event.type}</p>
            ${event.time ? `<p><strong>Time:</strong> ${formatTime(event.time)}</p>` : ''}
            ${event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : ''}
        `;
        
        details.appendChild(eventDiv);
    });
    
    // Store current event ID for deletion
    modal.dataset.eventIds = JSON.stringify(dayEvents.map(e => e.id));
    
    modal.classList.add('active');
}

// Close view event modal
function closeViewEventModal() {
    const modal = document.getElementById('viewEventModal');
    modal.classList.remove('active');
}

// Handle delete event
function handleDeleteEvent() {
    const modal = document.getElementById('viewEventModal');
    const eventIds = JSON.parse(modal.dataset.eventIds || '[]');
    
    if (confirm('Delete all events for this day?')) {
        events = events.filter(event => !eventIds.includes(event.id));
        saveEvents();
        closeViewEventModal();
        renderCalendar();
        displayUpcomingEvents();
    }
}

// Display upcoming events
function displayUpcomingEvents() {
    const upcomingList = document.getElementById('upcomingEventsList');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter and sort upcoming events
    const upcomingEvents = events
        .filter(event => new Date(event.date + 'T00:00:00') >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcomingEvents.length === 0) {
        upcomingList.innerHTML = '<p class="no-events">No upcoming events</p>';
        return;
    }
    
    upcomingList.innerHTML = '';
    upcomingEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'upcoming-event-item';
        
        const date = new Date(event.date + 'T00:00:00');
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);
        
        eventDiv.innerHTML = `
            <h3>${event.title}</h3>
            <div class="event-type">${event.type}</div>
            <div class="event-date">${dateString}${event.time ? ' at ' + formatTime(event.time) : ''}</div>
            ${event.notes ? `<p>${event.notes}</p>` : ''}
        `;
        
        upcomingList.appendChild(eventDiv);
    });
}

// Format time from 24hr to 12hr
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}