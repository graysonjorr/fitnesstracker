// Goals.js - Goals and Progress Management

// Global variables
let goals = [];
let currentGoalId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadGoals();
    initializeEventListeners();
    renderGoals();
});

// Load goals from localStorage
function loadGoals() {
    const storedGoals = localStorage.getItem('fitnessGoals');
    if (storedGoals) {
        goals = JSON.parse(storedGoals);
    }
}

// Save goals to localStorage
function saveGoals() {
    localStorage.setItem('fitnessGoals', JSON.stringify(goals));
}

// Initialize all event listeners
function initializeEventListeners() {
    // Add goal button
    document.getElementById('addGoalBtn').addEventListener('click', openAddGoalModal);
    
    // Goal modal
    document.getElementById('cancelGoalBtn').addEventListener('click', closeGoalModal);
    document.querySelector('.close').addEventListener('click', closeGoalModal);
    document.getElementById('goalForm').addEventListener('submit', handleSaveGoal);
    
    // Step modal
    document.querySelector('.step-close').addEventListener('click', closeStepModal);
    document.querySelector('.step-cancel-btn').addEventListener('click', closeStepModal);
    document.getElementById('stepForm').addEventListener('submit', handleSaveStep);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeGoalModal();
            closeStepModal();
        }
    });
}

// Render all goals
function renderGoals() {
    const container = document.getElementById('goalsContainer');
    
    if (goals.length === 0) {
        container.innerHTML = `
            <div class="no-goals-message">
                <p>No goals yet.</p>
                <p>Click <strong>+ New Goal</strong> to get started.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    goals.forEach(goal => {
        const card = createGoalCard(goal);
        container.appendChild(card);
    });
}

// Create a goal card
function createGoalCard(goal) {
    const card = document.createElement('div');
    card.className = 'goal-card';
    
    // Format target date if it exists
    let targetDateHTML = '';
    if (goal.targetDate) {
        const date = new Date(goal.targetDate + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);
        targetDateHTML = `<p class="goal-target-date">Target: ${dateString}</p>`;
    }
    
    // Count completed steps
    const totalSteps = goal.steps ? goal.steps.length : 0;
    const completedSteps = goal.steps ? goal.steps.filter(s => s.completed).length : 0;
    
    card.innerHTML = `
        <div class="goal-card-header">
            <div class="goal-card-title">
                <h2>${goal.title}</h2>
                ${targetDateHTML}
            </div>
            <div class="goal-actions">
                <button class="edit-goal-btn" onclick="openEditGoalModal(${goal.id})">Edit</button>
                <button class="delete-goal-btn" onclick="deleteGoal(${goal.id})">Delete</button>
            </div>
        </div>
        
        ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
        
        <div class="steps-section">
            <div class="steps-header">
                <h3>Action Steps (${completedSteps}/${totalSteps})</h3>
                <button class="add-step-btn" onclick="openAddStepModal(${goal.id})">+ Add Step</button>
            </div>
            <div class="steps-list" id="steps-${goal.id}">
                ${renderSteps(goal)}
            </div>
        </div>
    `;
    
    return card;
}

// Render steps for a goal
function renderSteps(goal) {
    if (!goal.steps || goal.steps.length === 0) {
        return '<p class="no-steps">No action steps yet. Add your first step to get started.</p>';
    }
    
    return goal.steps.map((step, index) => `
        <div class="step-item ${step.completed ? 'completed' : ''}">
            <input type="checkbox" class="step-checkbox" 
                   ${step.completed ? 'checked' : ''} 
                   onchange="toggleStep(${goal.id}, ${index})">
            <p class="step-content">${step.description}</p>
            <button class="remove-step-btn" onclick="removeStep(${goal.id}, ${index})">×</button>
        </div>
    `).join('');
}

// Open add goal modal
function openAddGoalModal() {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    
    form.reset();
    form.dataset.editMode = 'false';
    document.getElementById('goalModalTitle').textContent = 'Create New Goal';
    
    modal.classList.add('active');
}

// Open edit goal modal
function openEditGoalModal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    
    // Pre-fill form
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDescription').value = goal.description || '';
    document.getElementById('goalTargetDate').value = goal.targetDate || '';
    
    form.dataset.editMode = 'true';
    form.dataset.goalId = goalId;
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    
    modal.classList.add('active');
}

// Close goal modal
function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    modal.classList.remove('active');
    document.getElementById('goalForm').reset();
}

// Handle save goal
function handleSaveGoal(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    
    if (isEditMode) {
        // Edit existing goal
        const goalId = parseInt(form.dataset.goalId);
        const goalIndex = goals.findIndex(g => g.id === goalId);
        
        if (goalIndex !== -1) {
            goals[goalIndex].title = document.getElementById('goalTitle').value;
            goals[goalIndex].description = document.getElementById('goalDescription').value;
            goals[goalIndex].targetDate = document.getElementById('goalTargetDate').value;
        }
    } else {
        // Create new goal
        const newGoal = {
            id: Date.now(),
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            targetDate: document.getElementById('goalTargetDate').value,
            steps: [],
            createdAt: new Date().toISOString()
        };
        
        goals.push(newGoal);
    }
    
    saveGoals();
    closeGoalModal();
    renderGoals();
}

// Delete goal
function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    if (confirm(`Delete "${goal.title}"?`)) {
        goals = goals.filter(g => g.id !== goalId);
        saveGoals();
        renderGoals();
    }
}

// Open add step modal
function openAddStepModal(goalId) {
    currentGoalId = goalId;
    
    const modal = document.getElementById('stepModal');
    const form = document.getElementById('stepForm');
    
    form.reset();
    modal.classList.add('active');
}

// Close step modal
function closeStepModal() {
    const modal = document.getElementById('stepModal');
    modal.classList.remove('active');
    document.getElementById('stepForm').reset();
    currentGoalId = null;
}

// Handle save step
function handleSaveStep(e) {
    e.preventDefault();
    
    if (!currentGoalId) return;
    
    const goalIndex = goals.findIndex(g => g.id === currentGoalId);
    if (goalIndex === -1) return;
    
    const newStep = {
        description: document.getElementById('stepDescription').value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    if (!goals[goalIndex].steps) {
        goals[goalIndex].steps = [];
    }
    
    goals[goalIndex].steps.push(newStep);
    
    saveGoals();
    closeStepModal();
    renderGoals();
}

// Toggle step completion
function toggleStep(goalId, stepIndex) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    if (goals[goalIndex].steps && goals[goalIndex].steps[stepIndex]) {
        goals[goalIndex].steps[stepIndex].completed = !goals[goalIndex].steps[stepIndex].completed;
        saveGoals();
        renderGoals();
    }
}

// Remove step
function removeStep(goalId, stepIndex) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    if (confirm('Delete this action step?')) {
        goals[goalIndex].steps.splice(stepIndex, 1);
        saveGoals();
        renderGoals();
    }
}