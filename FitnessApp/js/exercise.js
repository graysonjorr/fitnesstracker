// Exercise page functionality

// Check authentication
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// Set current date
function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// Set today's date as default in the form
function setDefaultFormDate() {
    const dateInput = document.getElementById('activityDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Initialize localStorage for activities if it doesn't exist
function initializeStorage() {
    if (!localStorage.getItem('activities')) {
        localStorage.setItem('activities', JSON.stringify([]));
    }
}

// Get all activities
function getActivities() {
    return JSON.parse(localStorage.getItem('activities')) || [];
}

// Save activities
function saveActivities(activities) {
    localStorage.setItem('activities', JSON.stringify(activities));
}

// Get today's activities
function getTodayActivities() {
    const activities = getActivities();
    const today = new Date().toISOString().split('T')[0];
    return activities.filter(activity => activity.date === today);
}

// Calculate today's stats
function calculateTodayStats() {
    const todayActivities = getTodayActivities();
    
    let stats = {
        steps: 0,
        caloriesBurned: 0,
        activeMinutes: 0,
        distance: 0
    };

    todayActivities.forEach(activity => {
        stats.caloriesBurned += parseInt(activity.calories) || 0;
        stats.activeMinutes += parseInt(activity.duration) || 0;
        stats.distance += parseFloat(activity.distance) || 0;
        
        // Estimate steps based on activity type and duration
        if (activity.type === 'walking') {
            stats.steps += parseInt(activity.duration) * 100; // ~100 steps per minute walking
        } else if (activity.type === 'running') {
            stats.steps += parseInt(activity.duration) * 150; // ~150 steps per minute running
        } else if (activity.type === 'hiking') {
            stats.steps += parseInt(activity.duration) * 80; // ~80 steps per minute hiking
        }
    });

    return stats;
}

// Update daily stats display
function updateDailyStats() {
    const stats = calculateTodayStats();
    
    // Update steps
    document.getElementById('stepsCount').textContent = stats.steps.toLocaleString();
    const stepsProgress = Math.min((stats.steps / 10000) * 100, 100);
    document.getElementById('stepsProgress').style.width = `${stepsProgress}%`;
    
    // Update calories
    document.getElementById('caloriesBurned').textContent = stats.caloriesBurned.toLocaleString();
    const caloriesProgress = Math.min((stats.caloriesBurned / 500) * 100, 100);
    document.getElementById('caloriesProgress').style.width = `${caloriesProgress}%`;
    
    // Update active minutes
    document.getElementById('activeMinutes').textContent = stats.activeMinutes;
    const minutesProgress = Math.min((stats.activeMinutes / 30) * 100, 100);
    document.getElementById('minutesProgress').style.width = `${minutesProgress}%`;
    
    // Update distance (changed to miles)
    document.getElementById('totalDistance').innerHTML = `${stats.distance.toFixed(1)} <span style="font-size: 1.2rem;">mi</span>`;
    const distanceProgress = Math.min((stats.distance / 5) * 100, 100);
    document.getElementById('distanceProgress').style.width = `${distanceProgress}%`;
}

// Format activity type for display
function formatActivityType(type) {
    const typeMap = {
        'running': 'Running',
        'walking': 'Walking',
        'cycling': 'Cycling',
        'swimming': 'Swimming',
        'hiking': 'Hiking',
        'yoga': 'Yoga',
        'strength': 'Strength Training',
        'sports': 'Sports',
        'other': 'Other'
    };
    return typeMap[type] || type;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);
    
    if (activityDate.getTime() === today.getTime()) {
        return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (activityDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Display activity history
function displayActivityHistory() {
    const activities = getActivities();
    const container = document.getElementById('activityLogContainer');
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="no-activity">No activities logged yet. Start by logging your first activity above!</p>';
        return;
    }
    
    // Sort activities by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    
    activities.forEach((activity, index) => {
        html += `
            <div class="activity-item">
                <div class="activity-main-info">
                    <div class="activity-type">${formatActivityType(activity.type)}</div>
                    <div class="activity-meta">
                        ${activity.duration ? `
                            <div class="activity-meta-item">
                                <span class="icon">Time:</span>
                                <span>${activity.duration} min</span>
                            </div>
                        ` : ''}
                        ${activity.distance ? `
                            <div class="activity-meta-item">
                                <span class="icon">Distance:</span>
                                <span>${activity.distance} mi</span>
                            </div>
                        ` : ''}
                        ${activity.calories ? `
                            <div class="activity-meta-item">
                                <span class="icon">Calories:</span>
                                <span>${activity.calories} cal</span>
                            </div>
                        ` : ''}
                        <div class="activity-meta-item">
                            <span class="icon">Intensity:</span>
                            <span>${activity.intensity.charAt(0).toUpperCase() + activity.intensity.slice(1)}</span>
                        </div>
                    </div>
                    ${activity.notes ? `<div class="activity-notes">"${activity.notes}"</div>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <div class="activity-date-badge">${formatDate(activity.date)}</div>
                    <button class="delete-activity-btn" onclick="deleteActivity(${index})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Delete activity
function deleteActivity(index) {
    if (confirm('Are you sure you want to delete this activity?')) {
        const activities = getActivities();
        activities.splice(index, 1);
        saveActivities(activities);
        displayActivityHistory();
        updateDailyStats();
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const activity = {
        type: document.getElementById('activityType').value,
        date: document.getElementById('activityDate').value,
        duration: document.getElementById('activityDuration').value,
        distance: document.getElementById('activityDistance').value || '',
        calories: document.getElementById('activityCalories').value || '',
        intensity: document.getElementById('activityIntensity').value,
        notes: document.getElementById('activityNotes').value || '',
        timestamp: new Date().toISOString()
    };
    
    const activities = getActivities();
    activities.push(activity);
    saveActivities(activities);
    
    // Reset form
    document.getElementById('activityForm').reset();
    setDefaultFormDate();
    
    // Update displays
    displayActivityHistory();
    updateDailyStats();
    
    // Show success message (optional)
    alert('Activity logged successfully!');
}

// Logout function
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    setDefaultFormDate();
    initializeStorage();
    updateDailyStats();
    displayActivityHistory();
    
    // Add form submit listener
    document.getElementById('activityForm').addEventListener('submit', handleFormSubmit);
    
    // Add logout button listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});