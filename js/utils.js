// utils.js - Utility Functions for Data Management

// Commented out for GitHub Pages deployment (no backend authentication)
// function checkAuth() {
//     if (!sessionStorage.getItem('isLoggedIn')) {
//         window.location.href = 'login.html';
//     }
// }

// if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
//     checkAuth();
// }

// Initialize app data with a default logged-in user
window.appData = {
    currentUser: {
        id: 1,
        email: 'demo@fitness.com',
        name: 'Demo User',
        profile: {
            weight: 257,
            weightGoal: 220,
            calorieGoal: 1800,
            proteinGoal: 175,
            workoutGoal: 5
        }
    },
    users: [],
    nutrition: [],
    workouts: [],
    weightLog: []
};

// Get today's date as string (YYYY-MM-DD)
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Get this week's start date
function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
}

// Nutrition Functions
function addFood(foodData) {
    const entry = {
        id: Date.now(),
        userId: window.appData.currentUser.id,
        date: getTodayDate(),
        ...foodData
    };
    window.appData.nutrition.push(entry);
    return entry;
}

function getTodayNutrition() {
    const today = getTodayDate();
    const userId = window.appData.currentUser.id;
    return window.appData.nutrition.filter(n => 
        n.date === today && n.userId === userId
    );
}

function getTodayCalories() {
    const todayFood = getTodayNutrition();
    return todayFood.reduce((sum, food) => sum + (food.calories || 0), 0);
}

function getTodayProtein() {
    const todayFood = getTodayNutrition();
    return todayFood.reduce((sum, food) => sum + (food.protein || 0), 0);
}

function deleteFood(foodId) {
    const index = window.appData.nutrition.findIndex(n => n.id === foodId);
    if (index > -1) {
        window.appData.nutrition.splice(index, 1);
        return true;
    }
    return false;
}

// Workout Functions
function addWorkout(workoutData) {
    const entry = {
        id: Date.now(),
        userId: window.appData.currentUser.id,
        date: getTodayDate(),
        ...workoutData
    };
    window.appData.workouts.push(entry);
    return entry;
}

function getWeekWorkouts() {
    const weekStart = getWeekStart();
    const userId = window.appData.currentUser.id;
    return window.appData.workouts.filter(w => 
        w.date >= weekStart && w.userId === userId
    );
}

function deleteWorkout(workoutId) {
    const index = window.appData.workouts.findIndex(w => w.id === workoutId);
    if (index > -1) {
        window.appData.workouts.splice(index, 1);
        return true;
    }
    return false;
}

// Weight Log Functions
function addWeightEntry(weight) {
    const entry = {
        id: Date.now(),
        userId: window.appData.currentUser.id,
        date: getTodayDate(),
        weight: parseFloat(weight)
    };
    window.appData.weightLog.push(entry);
    return entry;
}

function getWeightHistory() {
    const userId = window.appData.currentUser.id;
    return window.appData.weightLog
        .filter(w => w.userId === userId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getCurrentWeight() {
    const history = getWeightHistory();
    return history.length > 0 ? history[history.length - 1].weight : null;
}

// Streak calculation
function calculateStreak() {
    const userId = window.appData.currentUser.id;
    const userWorkouts = window.appData.workouts
        .filter(w => w.userId === userId)
        .map(w => w.date)
        .sort()
        .reverse();
    
    if (userWorkouts.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < userWorkouts.length; i++) {
        const workoutDate = new Date(userWorkouts[i]);
        workoutDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
            streak++;
        } else if (daysDiff > streak) {
            break;
        }
    }
    
    return streak;
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}