// State
let currentDate = new Date();
let currentMealType = '';
let selectedFood = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initializeDatePicker();
    await loadFoodLogs();
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelectorAll('.add-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMealType = e.target.closest('.add-food-btn').dataset.meal;
            openFoodModal();
        });
    });

    document.getElementById('prevDateBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDatePicker();
        loadFoodLogs();
    });

    document.getElementById('nextDateBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDatePicker();
        loadFoodLogs();
    });

    document.getElementById('nutritionDatePicker').addEventListener('change', (e) => {
        currentDate = new Date(e.target.value + 'T00:00:00');
        loadFoodLogs();
    });

    document.getElementById('searchBtn').addEventListener('click', searchFoods);
    document.getElementById('foodSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchFoods();
    });

    document.getElementById('closeModal').addEventListener('click', closeFoodModal);
    document.getElementById('closeFoodDetailsModal').addEventListener('click', closeFoodDetailsModal);
    document.getElementById('logFoodBtn').addEventListener('click', logFood);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeFoodModal();
            closeFoodDetailsModal();
        }
    });
}

// Date Picker
function initializeDatePicker() {
    document.getElementById('nutritionDatePicker').valueAsDate = currentDate;
}

function updateDatePicker() {
    document.getElementById('nutritionDatePicker').valueAsDate = currentDate;
}

function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

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

    document.getElementById('selectedFoodInfo').innerHTML = `
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

// Food Search
async function searchFoods() {
    const query = document.getElementById('foodSearchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsDiv.innerHTML = '<p class="search-hint">Type at least 2 characters to search</p>';
        return;
    }

    resultsDiv.innerHTML = '<p class="loading">Searching...</p>';

    const { data: foods, error } = await supabaseClient
        .from('foods')
        .select('id, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size, serving_unit')
        .ilike('description', `%${query}%`)
        .limit(20);

    if (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<p class="error">Error searching foods. Please try again.</p>';
        return;
    }

    if (!foods.length) {
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
}

function selectFood(food) {
    openFoodDetailsModal(food);
}

// Log Food
async function logFood() {
    const grams = parseFloat(document.getElementById('foodAmountInput').value);

    if (!grams || grams <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error } = await supabaseClient.from('food_logs').insert({
        user_id: user ? user.id : null,
        food_id: selectedFood.id,
        grams,
        meal_type: currentMealType,
        log_date: formatDateForAPI(currentDate)
    });

    if (error) {
        console.error('Log error:', error);
        alert('Error logging food. Please try again.');
        return;
    }

    closeFoodDetailsModal();
    loadFoodLogs();
}

// Load Food Logs
async function loadFoodLogs() {
    const dateStr = formatDateForAPI(currentDate);
    const { data: { user } } = await supabaseClient.auth.getUser();

    let query = supabaseClient
        .from('food_logs')
        .select('*, foods(description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)')
        .eq('log_date', dateStr);

    if (user) {
        query = query.eq('user_id', user.id);
    }

    const { data: logs, error } = await query;

    if (error) {
        console.error('Load error:', error);
        return;
    }

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
        document.getElementById(`${meal}-foods`).innerHTML = '';
    });

    logs.forEach(log => displayFoodLog(log));
    calculateTotals();
}

function displayFoodLog(log) {
    const food = log.foods;
    const mealBody = document.getElementById(`${log.meal_type}-foods`);

    const calories = (log.grams / 100) * parseFloat(food.calories_per_100g);
    const protein = (log.grams / 100) * parseFloat(food.protein_per_100g);
    const carbs = (log.grams / 100) * parseFloat(food.carbs_per_100g);
    const fat = (log.grams / 100) * parseFloat(food.fat_per_100g);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${food.description} <small>(${log.grams}g)</small></td>
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

        document.getElementById(`${meal}-calories`).textContent = Math.round(mealTotals.calories);
        document.getElementById(`${meal}-carbs`).textContent = Math.round(mealTotals.carbs);
        document.getElementById(`${meal}-fat`).textContent = Math.round(mealTotals.fat);
        document.getElementById(`${meal}-protein`).textContent = Math.round(mealTotals.protein);

        dailyTotals.calories += mealTotals.calories;
        dailyTotals.protein += mealTotals.protein;
        dailyTotals.carbs += mealTotals.carbs;
        dailyTotals.fat += mealTotals.fat;
    });

    document.getElementById('daily-calories').textContent = Math.round(dailyTotals.calories);
    document.getElementById('daily-carbs').textContent = Math.round(dailyTotals.carbs);
    document.getElementById('daily-fat').textContent = Math.round(dailyTotals.fat);
    document.getElementById('daily-protein').textContent = Math.round(dailyTotals.protein);

    const goalCalories = parseInt(document.getElementById('goal-calories').textContent);
    const goalCarbs = parseInt(document.getElementById('goal-carbs').textContent);
    const goalFat = parseInt(document.getElementById('goal-fat').textContent);
    const goalProtein = parseInt(document.getElementById('goal-protein').textContent);

    document.getElementById('remaining-calories').textContent = goalCalories - Math.round(dailyTotals.calories);
    document.getElementById('remaining-carbs').textContent = goalCarbs - Math.round(dailyTotals.carbs);
    document.getElementById('remaining-fat').textContent = goalFat - Math.round(dailyTotals.fat);
    document.getElementById('remaining-protein').textContent = goalProtein - Math.round(dailyTotals.protein);
}

// Delete Log
async function deleteLog(logId) {
    if (!confirm('Delete this food log?')) return;

    const { error } = await supabaseClient.from('food_logs').delete().eq('id', logId);

    if (error) {
        console.error('Delete error:', error);
        alert('Error deleting log');
        return;
    }

    loadFoodLogs();
}
