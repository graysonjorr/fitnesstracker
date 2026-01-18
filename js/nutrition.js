// API Configuration
const API_URL = 'http://localhost:5000/api';
const USER_ID = 1; // Hardcoded for now - you'll replace this with actual auth later

// State
let currentDate = new Date();
let currentMealType = '';
let selectedFood = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDatePicker();
    // loadFoodLogs(); // COMMENTED OUT - Coming Soon
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Add food buttons - COMING SOON ALERT
    document.querySelectorAll('.add-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Coming Soon: Food logging with database integration');
            // COMMENTED OUT - Will be enabled after database integration
            // currentMealType = e.target.closest('.add-food-btn').dataset.meal;
            // openFoodModal();
        });
    });

    // Date navigation
    document.getElementById('prevDateBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDatePicker();
        // loadFoodLogs(); // COMMENTED OUT - Coming Soon
    });

    document.getElementById('nextDateBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDatePicker();
        // loadFoodLogs(); // COMMENTED OUT - Coming Soon
    });

    document.getElementById('nutritionDatePicker').addEventListener('change', (e) => {
        currentDate = new Date(e.target.value);
        // loadFoodLogs(); // COMMENTED OUT - Coming Soon
    });

    /* COMMENTED OUT - Coming Soon: Search functionality
    // Search
    document.getElementById('searchBtn').addEventListener('click', searchFoods);
    document.getElementById('foodSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchFoods();
    });
    */

    /* COMMENTED OUT - Coming Soon: Modal functionality
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeFoodModal);
    document.getElementById('closeFoodDetailsModal').addEventListener('click', closeFoodDetailsModal);

    // Log food button
    document.getElementById('logFoodBtn').addEventListener('click', logFood);

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeFoodModal();
            closeFoodDetailsModal();
        }
    });
    */
}

// Date Picker Functions
function initializeDatePicker() {
    const dateInput = document.getElementById('nutritionDatePicker');
    dateInput.valueAsDate = currentDate;
}

function updateDatePicker() {
    const dateInput = document.getElementById('nutritionDatePicker');
    dateInput.valueAsDate = currentDate;
}

function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

/* COMMENTED OUT - Coming Soon: All modal and API functions below
// Modal Functions
function openFoodModal() {
    document.getElementById('modalMealType').textContent = currentMealType;
    document.getElementById('foodModal').style.display = 'block';
    document.getElementById('foodSearchInput').value = '';
    document.getElementById('searchResults').innerHTML = '<p class="search-hint">Type at least 2 characters to search</p>';
}

function closeFoodModal() {
    document.getElementById('foodModal').style.display = 'none';
}

function openFoodDetailsModal(food) {
    selectedFood = food;
    
    const infoDiv = document.getElementById('selectedFoodInfo');
    infoDiv.innerHTML = `
        <h3>${food.description}</h3>
        <p><strong>Per 100g:</strong> ${Math.round(food.calories_per_100g)} cal, 
           ${Math.round(food.protein_per_100g)}g protein, 
           ${Math.round(food.carbs_per_100g)}g carbs, 
           ${Math.round(food.fat_per_100g)}g fat</p>
    `;

    const servingHint = document.getElementById('servingHint');
    if (food.serving_size && food.serving_unit) {
        servingHint.textContent = `Suggested serving: ${food.serving_size}g (${food.serving_unit})`;
        document.getElementById('foodAmountInput').value = food.serving_size;
    } else {
        servingHint.textContent = 'Suggested: 100g';
        document.getElementById('foodAmountInput').value = 100;
    }

    closeFoodModal();
    document.getElementById('foodDetailsModal').style.display = 'block';
}

function closeFoodDetailsModal() {
    document.getElementById('foodDetailsModal').style.display = 'none';
    selectedFood = null;
}

// API Functions
async function searchFoods() {
    const query = document.getElementById('foodSearchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsDiv.innerHTML = '<p class="search-hint">Type at least 2 characters to search</p>';
        return;
    }

    resultsDiv.innerHTML = '<p class="loading">Searching...</p>';

    try {
        const response = await fetch(`${API_URL}/foods/search?q=${encodeURIComponent(query)}`);
        const foods = await response.json();

        if (foods.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No foods found. Try a different search term.</p>';
            return;
        }

        resultsDiv.innerHTML = foods.map(food => `
            <div class="food-result" onclick='selectFood(${JSON.stringify(food)})'>
                <div class="food-name">${food.description}</div>
                <div class="food-macros">
                    ${Math.round(food.calories_per_100g)} cal | 
                    P: ${Math.round(food.protein_per_100g)}g | 
                    C: ${Math.round(food.carbs_per_100g)}g | 
                    F: ${Math.round(food.fat_per_100g)}g
                    ${food.serving_size ? `<br><small>(${food.serving_size}g per ${food.serving_unit})</small>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<p class="error">Error searching foods. Please try again.</p>';
    }
}

function selectFood(food) {
    openFoodDetailsModal(food);
}

async function logFood() {
    const grams = parseFloat(document.getElementById('foodAmountInput').value);

    if (!grams || grams <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const logData = {
        user_id: USER_ID,
        food_id: selectedFood.id,
        grams: grams,
        meal_type: currentMealType,
        log_date: formatDateForAPI(currentDate)
    };

    try {
        const response = await fetch(`${API_URL}/food_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });

        if (response.ok) {
            closeFoodDetailsModal();
            loadFoodLogs();
        } else {
            alert('Error logging food. Please try again.');
        }
    } catch (error) {
        console.error('Log error:', error);
        alert('Error logging food. Please try again.');
    }
}

async function loadFoodLogs() {
    const dateStr = formatDateForAPI(currentDate);

    try {
        const response = await fetch(`${API_URL}/food_logs?user_id=${USER_ID}&date=${dateStr}`);
        const logs = await response.json();

        // Clear all meal sections
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
            document.getElementById(`${meal}-foods`).innerHTML = '';
        });

        // Display logs
        logs.forEach(log => {
            displayFoodLog(log);
        });

        // Calculate totals
        calculateTotals();
    } catch (error) {
        console.error('Load error:', error);
    }
}

function displayFoodLog(log) {
    const mealBody = document.getElementById(`${log.meal_type}-foods`);
    
    const calories = (log.grams / 100) * parseFloat(log.calories_per_100g);
    const protein = (log.grams / 100) * parseFloat(log.protein_per_100g);
    const carbs = (log.grams / 100) * parseFloat(log.carbs_per_100g);
    const fat = (log.grams / 100) * parseFloat(log.fat_per_100g);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${log.description} <small>(${log.grams}g)</small></td>
        <td>${Math.round(calories)}</td>
        <td>${Math.round(carbs)}</td>
        <td>${Math.round(fat)}</td>
        <td>${Math.round(protein)}</td>
        <td><button class="delete-btn" onclick="deleteLog(${log.id})"><i class="fa-solid fa-trash"></i></button></td>
    `;

    mealBody.appendChild(row);
}

function calculateTotals() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    let dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    meals.forEach(meal => {
        const mealBody = document.getElementById(`${meal}-foods`);
        const rows = mealBody.querySelectorAll('tr');
        
        let mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            mealTotals.calories += parseInt(cells[1].textContent) || 0;
            mealTotals.carbs += parseInt(cells[2].textContent) || 0;
            mealTotals.fat += parseInt(cells[3].textContent) || 0;
            mealTotals.protein += parseInt(cells[4].textContent) || 0;
        });

        // Update meal totals
        document.getElementById(`${meal}-calories`).textContent = Math.round(mealTotals.calories);
        document.getElementById(`${meal}-carbs`).textContent = Math.round(mealTotals.carbs);
        document.getElementById(`${meal}-fat`).textContent = Math.round(mealTotals.fat);
        document.getElementById(`${meal}-protein`).textContent = Math.round(mealTotals.protein);

        // Add to daily totals
        dailyTotals.calories += mealTotals.calories;
        dailyTotals.protein += mealTotals.protein;
        dailyTotals.carbs += mealTotals.carbs;
        dailyTotals.fat += mealTotals.fat;
    });

    // Update daily totals
    document.getElementById('daily-calories').textContent = Math.round(dailyTotals.calories);
    document.getElementById('daily-carbs').textContent = Math.round(dailyTotals.carbs);
    document.getElementById('daily-fat').textContent = Math.round(dailyTotals.fat);
    document.getElementById('daily-protein').textContent = Math.round(dailyTotals.protein);

    // Calculate remaining
    const goalCalories = parseInt(document.getElementById('goal-calories').textContent);
    const goalCarbs = parseInt(document.getElementById('goal-carbs').textContent);
    const goalFat = parseInt(document.getElementById('goal-fat').textContent);
    const goalProtein = parseInt(document.getElementById('goal-protein').textContent);

    document.getElementById('remaining-calories').textContent = goalCalories - Math.round(dailyTotals.calories);
    document.getElementById('remaining-carbs').textContent = goalCarbs - Math.round(dailyTotals.carbs);
    document.getElementById('remaining-fat').textContent = goalFat - Math.round(dailyTotals.fat);
    document.getElementById('remaining-protein').textContent = goalProtein - Math.round(dailyTotals.protein);
}

async function deleteLog(logId) {
    if (!confirm('Delete this food log?')) return;

    try {
        const response = await fetch(`${API_URL}/food_logs/${logId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadFoodLogs();
        } else {
            alert('Error deleting log');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting log');
    }
}
*/ // END OF COMMENTED OUT SECTION