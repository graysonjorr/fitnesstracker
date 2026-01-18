// dashboard.js - Dashboard Page Logic

document.addEventListener('DOMContentLoaded', function() {
    // Display user name
    const userNameNav = document.getElementById('userNameNav');
    if (userNameNav && window.appData.currentUser) {
        userNameNav.textContent = window.appData.currentUser.name;
    }
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Load recent activity
    loadRecentActivity();
    
    // Setup logout button (optional - you can remove this if you want)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
});

function updateDashboardStats() {
    const user = window.appData.currentUser;
    
    // Calories
    const caloriesConsumed = getTodayCalories();
    const caloriesElement = document.getElementById('caloriesConsumed');
    if (caloriesElement) {
        caloriesElement.textContent = caloriesConsumed;
    }
    
    // Update goal display
    const caloriesCard = document.querySelector('.stat-card:nth-child(1) .stat-goal');
    if (caloriesCard && user.profile) {
        caloriesCard.textContent = `Goal: ${user.profile.calorieGoal}`;
    }
    
    // Protein
    const proteinConsumed = getTodayProtein();
    const proteinElement = document.getElementById('proteinConsumed');
    if (proteinElement) {
        proteinElement.textContent = proteinConsumed + 'g';
    }
    
    // Update protein goal
    const proteinCard = document.querySelector('.stat-card:nth-child(2) .stat-goal');
    if (proteinCard && user.profile) {
        proteinCard.textContent = `Goal: ${user.profile.proteinGoal}g`;
    }
    
    // Workouts this week
    const weekWorkouts = getWeekWorkouts();
    const workoutsElement = document.getElementById('weeklyWorkouts');
    if (workoutsElement) {
        workoutsElement.textContent = weekWorkouts.length;
    }
    
    // Update workout goal
    const workoutCard = document.querySelector('.stat-card:nth-child(3) .stat-goal');
    if (workoutCard && user.profile) {
        workoutCard.textContent = `Goal: ${user.profile.workoutGoal}`;
    }
    
    // Weight
    const currentWeight = getCurrentWeight();
    const weightElement = document.getElementById('currentWeight');
    if (weightElement) {
        if (currentWeight) {
            weightElement.textContent = currentWeight + ' lbs';
        } else if (user.profile && user.profile.weight) {
            weightElement.textContent = user.profile.weight + ' lbs';
        } else {
            weightElement.textContent = '--';
        }
    }
}

function loadRecentActivity() {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;
    
    const userId = window.appData.currentUser.id;
    
    // Get recent items
    const recentNutrition = window.appData.nutrition
        .filter(n => n.userId === userId)
        .sort((a, b) => b.id - a.id)
        .slice(0, 3);
    
    const recentWorkouts = window.appData.workouts
        .filter(w => w.userId === userId)
        .sort((a, b) => b.id - a.id)
        .slice(0, 3);
    
    // Combine and sort
    const allActivity = [...recentNutrition, ...recentWorkouts]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);
    
    if (allActivity.length === 0) {
        activityFeed.innerHTML = '<p class="no-activity">No recent activity. Start logging to see your progress!</p>';
        return;
    }
    
    // Build activity HTML
    let html = '<div class="activity-list">';
    
    allActivity.forEach(item => {
        if (item.calories !== undefined) {
            // It's a nutrition entry
            html += `
                <div class="activity-item">
                    <span class="activity-icon">🍎</span>
                    <div class="activity-details">
                        <strong>${item.name}</strong>
                        <span>${item.calories} cal, ${item.protein}g protein</span>
                        <span class="activity-date">${formatDate(item.date)}</span>
                    </div>
                </div>
            `;
        } else {
            // It's a workout entry
            html += `
                <div class="activity-item">
                    <span class="activity-icon">💪</span>
                    <div class="activity-details">
                        <strong>${item.name}</strong>
                        <span>${item.duration} minutes, ${item.caloriesBurned || 0} cal burned</span>
                        <span class="activity-date">${formatDate(item.date)}</span>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    activityFeed.innerHTML = html;
}

// Refresh dashboard when page becomes visible (for navigation)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.appData.currentUser) {
        updateDashboardStats();
        loadRecentActivity();
    }
});