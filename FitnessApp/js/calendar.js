// Calendar.js - Interactive Calendar Functionality

// Global variables
let currentDate = new Date();
let events = [];
let selectedEvent = null;

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
    
    // Edit and delete event
    document.getElementById('editEventBtn').addEventListener('click', handleEditEvent);
    document.getElementById('deleteEventBtn').addEventListener('click', handleDeleteSingleEvent);
    
    // Add another event from view modal
    document.getElementById('addAnotherEventBtn').addEventListener('click', handleAddAnotherEvent);
    
    // Complete event checkbox
    document.getElementById('completeEventCheckbox').addEventListener('change', handleCompleteEvent);
    
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
            if (event.completed) {
                eventItem.style.background = 'rgba(76, 175, 80, 0.2)';
                eventItem.style.textDecoration = 'line-through';
                eventItem.style.color = '#4caf50';
            }
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
    const form = document.getElementById('eventForm');
    form.reset();
    
    // Reset edit mode
    form.dataset.editMode = 'false';
    form.querySelector('button[type="submit"]').textContent = 'Add Event';
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    const form = document.getElementById('eventForm');
    form.reset();
    form.dataset.editMode = 'false';
    form.querySelector('button[type="submit"]').textContent = 'Add Event';
}

// Handle add event form submission
function handleAddEvent(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    
    if (isEditMode) {
        // Edit existing event
        const editId = parseInt(form.dataset.editId);
        const eventIndex = events.findIndex(e => e.id === editId);
        
        if (eventIndex !== -1) {
            events[eventIndex] = {
                id: editId,
                title: document.getElementById('eventTitle').value,
                type: document.getElementById('eventType').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                notes: document.getElementById('eventNotes').value,
                completed: events[eventIndex].completed || false
            };
        }
        
        // Reset form mode
        form.dataset.editMode = 'false';
        form.querySelector('button[type="submit"]').textContent = 'Add Event';
    } else {
        // Add new event
        const newEvent = {
            id: Date.now(),
            title: document.getElementById('eventTitle').value,
            type: document.getElementById('eventType').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            notes: document.getElementById('eventNotes').value,
            completed: false
        };
        
        events.push(newEvent);
    }
    
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
        eventDiv.style.cursor = 'pointer';
        eventDiv.style.transition = 'background 0.3s';

        eventDiv.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; font-weight: 300; text-transform: uppercase; letter-spacing: 2px; ${event.completed ? 'text-decoration: line-through; color: #4caf50;' : ''}">${event.title}</h3>
            <p><strong>Type:</strong> ${event.type}</p>
            ${event.time ? `<p><strong>Time:</strong> ${formatTime(event.time)}</p>` : ''}
            ${event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : ''}
            ${event.completed ? '<p style="color: #4caf50; font-weight: 400;">✓ Completed</p>' : ''}
        `;

        // Make event clickable for editing
        eventDiv.addEventListener('click', () => {
            selectEventForEdit(event);
        });
        
        // Add completed styling
        if (event.completed) {
            eventDiv.style.background = 'rgba(76, 175, 80, 0.1)';
        }
        
        eventDiv.addEventListener('mouseenter', () => {
            eventDiv.style.background = event.completed ? 'rgba(76, 175, 80, 0.15)' : '#f5f5f5';
        });
        
        eventDiv.addEventListener('mouseleave', () => {
            eventDiv.style.background = event.completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent';
        });
        
        details.appendChild(eventDiv);
    });
    
    modal.classList.add('active');
}

// Close view event modal
function closeViewEventModal() {
    const modal = document.getElementById('viewEventModal');
    modal.classList.remove('active');
    selectedEvent = null;
}

// Select an event for editing
function selectEventForEdit(event) {
    selectedEvent = event;
    
    // Update the modal title to show which event is selected
    document.getElementById('viewEventTitle').style.borderLeft = '4px solid #000';
    document.getElementById('viewEventTitle').style.paddingLeft = '1rem';
    
    // Set the checkbox state
    const checkbox = document.getElementById('completeEventCheckbox');
    if (checkbox) {
        checkbox.checked = event.completed || false;
    }
}

// Handle edit event button click
function handleEditEvent() {
    if (!selectedEvent) {
        alert('Please select an event to edit');
        return;
    }
    
    // Close view modal
    closeViewEventModal();
    
    // Open add event modal with pre-filled data
    const modal = document.getElementById('eventModal');
    modal.classList.add('active');
    
    // Pre-fill the form with existing event data
    document.getElementById('eventTitle').value = selectedEvent.title;
    document.getElementById('eventType').value = selectedEvent.type;
    document.getElementById('eventDate').value = selectedEvent.date;
    document.getElementById('eventTime').value = selectedEvent.time || '';
    document.getElementById('eventNotes').value = selectedEvent.notes || '';
    
    // Change the form to edit mode
    const form = document.getElementById('eventForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = selectedEvent.id;
    
    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Event';
}

// Handle delete single event
function handleDeleteSingleEvent() {
    if (!selectedEvent) {
        alert('Please select an event to delete');
        return;
    }
    
    if (confirm(`Delete "${selectedEvent.title}"?`)) {
        events = events.filter(event => event.id !== selectedEvent.id);
        saveEvents();
        closeViewEventModal();
        renderCalendar();
        displayUpcomingEvents();
        selectedEvent = null;
    }
}

// Handle marking event as complete
function handleCompleteEvent() {
    if (!selectedEvent) {
        return;
    }
    
    const checkbox = document.getElementById('completeEventCheckbox');
    const isCompleted = checkbox.checked;
    
    // Update the event in the events array
    const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
    if (eventIndex !== -1) {
        events[eventIndex].completed = isCompleted;
        selectedEvent.completed = isCompleted;
        saveEvents();
        
        // Refresh the display
        renderCalendar();
        displayUpcomingEvents();
        
        // Update the current modal view
        const dateString = selectedEvent.date;
        const dayEvents = events.filter(event => event.date === dateString);
        
        // Re-render the event details
        const details = document.getElementById('viewEventDetails');
        details.innerHTML = '';
        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.style.marginBottom = '1.5rem';
            eventDiv.style.paddingBottom = '1rem';
            eventDiv.style.borderBottom = '1px solid #ddd';
            eventDiv.style.cursor = 'pointer';
            eventDiv.style.transition = 'background 0.3s';

            eventDiv.innerHTML = `
                <h3 style="margin-bottom: 0.5rem; font-weight: 300; text-transform: uppercase; letter-spacing: 2px; ${event.completed ? 'text-decoration: line-through; color: #4caf50;' : ''}">${event.title}</h3>
                <p><strong>Type:</strong> ${event.type}</p>
                ${event.time ? `<p><strong>Time:</strong> ${formatTime(event.time)}</p>` : ''}
                ${event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : ''}
                ${event.completed ? '<p style="color: #4caf50; font-weight: 400;">✓ Completed</p>' : ''}
            `;

            eventDiv.addEventListener('click', () => {
                selectEventForEdit(event);
            });
            
            if (event.completed) {
                eventDiv.style.background = 'rgba(76, 175, 80, 0.1)';
            }
            
            eventDiv.addEventListener('mouseenter', () => {
                eventDiv.style.background = event.completed ? 'rgba(76, 175, 80, 0.15)' : '#f5f5f5';
            });
            
            eventDiv.addEventListener('mouseleave', () => {
                eventDiv.style.background = event.completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent';
            });
            
            details.appendChild(eventDiv);
        });
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
        
        if (event.completed) {
            eventDiv.style.background = 'rgba(76, 175, 80, 0.05)';
            eventDiv.style.borderColor = '#4caf50';
        }
        
        const date = new Date(event.date + 'T00:00:00');
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);
        
        eventDiv.innerHTML = `
            <h3 style="${event.completed ? 'text-decoration: line-through; color: #4caf50;' : ''}">${event.title}</h3>
            <div class="event-type" style="${event.completed ? 'background: rgba(76, 175, 80, 0.2); color: #4caf50;' : ''}">${event.type}</div>
            <div class="event-date">${dateString}${event.time ? ' at ' + formatTime(event.time) : ''}</div>
            ${event.notes ? `<p>${event.notes}</p>` : ''}
            ${event.completed ? '<p style="color: #4caf50; font-weight: 400;">✓ Completed</p>' : ''}
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

// Handle add another event from the view modal
function handleAddAnotherEvent() {
    // Get the current date being viewed
    let currentDate = null;
    if (selectedEvent) {
        currentDate = selectedEvent.date;
    }
    
    // Close the view modal
    closeViewEventModal();
    
    // Open the add event modal with the same date
    openAddEventModal(currentDate);
}