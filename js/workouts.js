// Workouts.js - Workout Program Management with Tab-based Workspace

// Global variables
let programs = [];
let activeProgram = null;
let currentDayIndex = null;
let currentExerciseIndex = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPrograms();
    initializeEventListeners();
    renderTabs();
    renderWorkspace();
});

// Load programs from localStorage
function loadPrograms() {
    const storedPrograms = localStorage.getItem('workoutPrograms');
    if (storedPrograms) {
        programs = JSON.parse(storedPrograms);
        if (programs.length > 0) {
            activeProgram = programs[0];
        }
    }
}

// Save programs to localStorage
function savePrograms() {
    localStorage.setItem('workoutPrograms', JSON.stringify(programs));
}

// Initialize all event listeners
function initializeEventListeners() {
    // New program tab button
    document.getElementById('newProgramTab').addEventListener('click', openProgramModal);
    
    // Program modal
    document.getElementById('cancelProgramBtn').addEventListener('click', closeProgramModal);
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            closeProgramModal();
            closeExerciseModal();
        });
    });
    
    // Program form submission
    document.getElementById('programForm').addEventListener('submit', handleSaveProgram);
    
    // Exercise modal
    document.querySelector('.exercise-cancel-btn').addEventListener('click', closeExerciseModal);
    document.querySelector('.exercise-close').addEventListener('click', closeExerciseModal);
    document.getElementById('exerciseForm').addEventListener('submit', handleSaveExercise);
    
    // Setup day selector
    setupDaySelector();
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeProgramModal();
            closeExerciseModal();
        }
    });
}

// Render tabs
function renderTabs() {
    const tabsContainer = document.getElementById('programTabs');
    const newProgramTab = document.getElementById('newProgramTab');
    
    // Clear existing program tabs (keep new program button)
    const existingTabs = tabsContainer.querySelectorAll('.tab-btn:not(.new-program-tab)');
    existingTabs.forEach(tab => tab.remove());
    
    // Add tabs for each program
    programs.forEach((program, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn';
        tab.textContent = program.name;
        tab.dataset.programId = program.id;
        
        if (activeProgram && activeProgram.id === program.id) {
            tab.classList.add('active');
        }
        
        tab.addEventListener('click', () => switchProgram(program.id));
        
        // Insert before the new program tab
        tabsContainer.insertBefore(tab, newProgramTab);
    });
}

// Switch to a different program
function switchProgram(programId) {
    const program = programs.find(p => p.id === programId);
    if (program) {
        activeProgram = program;
        renderTabs();
        renderWorkspace();
    }
}

// Render workspace
function renderWorkspace() {
    const workspace = document.getElementById('workspace');
    
    if (!activeProgram) {
        workspace.innerHTML = `
            <div class="no-programs-message">
                <p>No workout programs yet.</p>
                <p>Click the <strong>+</strong> button above to create your first program.</p>
            </div>
        `;
        return;
    }
    
    // Build workspace HTML
    let workspaceHTML = `
        <div class="program-workspace-header">
            <div class="program-title-section">
                <h2>${activeProgram.name}</h2>
                <div>
                    <button class="print-program-btn" onclick="printProgram()">Print</button>
                    <button class="edit-program-btn" onclick="handleEditProgram()">Edit Program</button>
                    <button class="delete-program-btn" onclick="handleDeleteProgram()">Delete</button>
                </div>
            </div>
            ${activeProgram.description ? `<p class="program-description">${activeProgram.description}</p>` : ''}
            ${activeProgram.notes ? `<p class="program-notes">${activeProgram.notes}</p>` : ''}
        </div>
    `;
    
    // Render each workout day
    if (activeProgram.workoutDays && activeProgram.workoutDays.length > 0) {
        activeProgram.workoutDays.forEach((day, dayIndex) => {
            workspaceHTML += `
                <div class="workout-day-section">
                    <div class="workout-day-header">
                        <h3>Day ${day.dayNumber}: ${day.name}</h3>
                    </div>
                    <div class="exercise-list">
            `;
            
            // Render exercises for this day
            if (day.exercises && day.exercises.length > 0) {
                day.exercises.forEach((exercise, exerciseIndex) => {
                    workspaceHTML += createExerciseHTML(exercise, dayIndex, exerciseIndex);
                });
            }
            
            workspaceHTML += `
                    </div>
                    <button class="add-exercise-btn" onclick="openAddExerciseModal(${dayIndex})">+ Add Exercise</button>
                </div>
            `;
        });
    }
    
    workspace.innerHTML = workspaceHTML;
}

// Create exercise HTML
function createExerciseHTML(exercise, dayIndex, exerciseIndex) {
    return `
        <div class="exercise-item" onclick="openEditExerciseModal(${dayIndex}, ${exerciseIndex})">
            <div class="exercise-item-header">
                <h4>${exercise.name}</h4>
                <button class="remove-exercise-btn" onclick="event.stopPropagation(); removeExercise(${dayIndex}, ${exerciseIndex})">×</button>
            </div>
            <div class="exercise-details">
                ${exercise.sets ? `<div class="exercise-detail"><strong>Sets</strong>${exercise.sets}</div>` : ''}
                ${exercise.reps ? `<div class="exercise-detail"><strong>Reps</strong>${exercise.reps}</div>` : ''}
                ${exercise.weight ? `<div class="exercise-detail"><strong>Weight</strong>${exercise.weight}</div>` : ''}
            </div>
            ${exercise.notes ? `<p class="exercise-notes-display">${exercise.notes}</p>` : ''}
        </div>
    `;
}

// Print program
function printProgram() {
    window.print();
}

// Open program modal
function openProgramModal() {
    const modal = document.getElementById('programModal');
    modal.classList.add('active');
    
    // Reset form
    document.getElementById('programForm').reset();
    document.getElementById('programForm').dataset.editMode = 'false';
    document.getElementById('dayNamesList').innerHTML = '';
    document.getElementById('dayNamesSection').style.display = 'none';
    
    // Remove active class from day buttons
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Close program modal
function closeProgramModal() {
    const modal = document.getElementById('programModal');
    modal.classList.remove('active');
}

// Setup day selector
function setupDaySelector() {
    const dayButtons = document.querySelectorAll('.day-btn');
    
    dayButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all buttons
            dayButtons.forEach(b => b.classList.remove('active'));
            
            // Add active to clicked button
            this.classList.add('active');
            
            // Get number of days
            const numDays = parseInt(this.dataset.days);
            
            // Show and populate day names section
            showDayNamesInputs(numDays);
        });
    });
}

// Show day name input fields
function showDayNamesInputs(numDays) {
    const dayNamesSection = document.getElementById('dayNamesSection');
    const dayNamesList = document.getElementById('dayNamesList');
    
    // Clear existing inputs
    dayNamesList.innerHTML = '';
    
    // Create input for each day
    for (let i = 1; i <= numDays; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'day-name-input-wrapper';
        
        wrapper.innerHTML = `
            <label>Day ${i}:</label>
            <input type="text" class="day-name-input" placeholder="e.g., Push Day, Leg Day, Upper Body" required>
        `;
        
        dayNamesList.appendChild(wrapper);
    }
    
    // Show the section
    dayNamesSection.style.display = 'block';
}

// Handle save program
function handleSaveProgram(e) {
    e.preventDefault();
    
    // Check if days were selected
    const activeDayBtn = document.querySelector('.day-btn.active');
    if (!activeDayBtn) {
        alert('Please select the number of workout days per week');
        return;
    }
    
    // Collect day names
    const workoutDays = [];
    const dayNameInputs = document.querySelectorAll('.day-name-input');
    
    dayNameInputs.forEach((input, index) => {
        workoutDays.push({
            dayNumber: index + 1,
            name: input.value,
            exercises: []
        });
    });
    
    const form = document.getElementById('programForm');
    const isEditMode = form.dataset.editMode === 'true';
    
    if (isEditMode && activeProgram) {
        // Edit existing program
        const programIndex = programs.findIndex(p => p.id === activeProgram.id);
        
        if (programIndex !== -1) {
            // Preserve existing exercises if day count matches
            const oldWorkoutDays = programs[programIndex].workoutDays || [];
            workoutDays.forEach((day, index) => {
                if (oldWorkoutDays[index]) {
                    day.exercises = oldWorkoutDays[index].exercises || [];
                }
            });
            
            programs[programIndex] = {
                id: activeProgram.id,
                name: document.getElementById('programName').value,
                description: document.getElementById('programDescription').value,
                numDays: parseInt(activeDayBtn.dataset.days),
                workoutDays: workoutDays,
                notes: document.getElementById('programNotes').value
            };
            
            activeProgram = programs[programIndex];
        }
        
        form.dataset.editMode = 'false';
    } else {
        // Create new program
        const newProgram = {
            id: Date.now(),
            name: document.getElementById('programName').value,
            description: document.getElementById('programDescription').value,
            numDays: parseInt(activeDayBtn.dataset.days),
            workoutDays: workoutDays,
            notes: document.getElementById('programNotes').value
        };
        
        programs.push(newProgram);
        activeProgram = newProgram;
    }
    
    savePrograms();
    closeProgramModal();
    renderTabs();
    renderWorkspace();
}

// Handle edit program
function handleEditProgram() {
    if (!activeProgram) return;
    
    const modal = document.getElementById('programModal');
    modal.classList.add('active');
    
    // Pre-fill form
    document.getElementById('programName').value = activeProgram.name;
    document.getElementById('programDescription').value = activeProgram.description || '';
    document.getElementById('programNotes').value = activeProgram.notes || '';
    
    // Set the day button active
    const dayBtn = document.querySelector(`[data-days="${activeProgram.numDays}"]`);
    if (dayBtn) {
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        dayBtn.classList.add('active');
        showDayNamesInputs(activeProgram.numDays);
        
        // Pre-fill day names
        const dayNameInputs = document.querySelectorAll('.day-name-input');
        activeProgram.workoutDays.forEach((day, index) => {
            if (dayNameInputs[index]) {
                dayNameInputs[index].value = day.name;
            }
        });
    }
    
    // Set edit mode
    document.getElementById('programForm').dataset.editMode = 'true';
}

// Handle delete program
function handleDeleteProgram() {
    if (!activeProgram) return;
    
    if (confirm(`Delete "${activeProgram.name}"?`)) {
        programs = programs.filter(p => p.id !== activeProgram.id);
        
        // Set new active program
        if (programs.length > 0) {
            activeProgram = programs[0];
        } else {
            activeProgram = null;
        }
        
        savePrograms();
        renderTabs();
        renderWorkspace();
    }
}

// Open add exercise modal
function openAddExerciseModal(dayIndex) {
    currentDayIndex = dayIndex;
    currentExerciseIndex = null;
    
    const modal = document.getElementById('exerciseModal');
    const form = document.getElementById('exerciseForm');
    
    form.reset();
    modal.querySelector('h2').textContent = 'Add Exercise';
    form.querySelector('.btn-primary').textContent = 'Add Exercise';
    
    modal.classList.add('active');
}

// Open edit exercise modal
function openEditExerciseModal(dayIndex, exerciseIndex) {
    currentDayIndex = dayIndex;
    currentExerciseIndex = exerciseIndex;
    
    const exercise = activeProgram.workoutDays[dayIndex].exercises[exerciseIndex];
    
    const modal = document.getElementById('exerciseModal');
    modal.querySelector('h2').textContent = 'Edit Exercise';
    
    // Pre-fill form
    document.getElementById('exerciseName').value = exercise.name || '';
    document.getElementById('exerciseSets').value = exercise.sets || '';
    document.getElementById('exerciseReps').value = exercise.reps || '';
    document.getElementById('exerciseWeight').value = exercise.weight || '';
    document.getElementById('exerciseNotes').value = exercise.notes || '';
    
    document.getElementById('exerciseForm').querySelector('.btn-primary').textContent = 'Save Changes';
    
    modal.classList.add('active');
}

// Close exercise modal
function closeExerciseModal() {
    const modal = document.getElementById('exerciseModal');
    modal.classList.remove('active');
    document.getElementById('exerciseForm').reset();
    currentDayIndex = null;
    currentExerciseIndex = null;
}

// Handle save exercise
function handleSaveExercise(e) {
    e.preventDefault();
    
    if (!activeProgram || currentDayIndex === null) return;
    
    const exercise = {
        name: document.getElementById('exerciseName').value,
        sets: document.getElementById('exerciseSets').value,
        reps: document.getElementById('exerciseReps').value,
        weight: document.getElementById('exerciseWeight').value,
        notes: document.getElementById('exerciseNotes').value
    };
    
    if (currentExerciseIndex !== null) {
        // Edit existing exercise
        activeProgram.workoutDays[currentDayIndex].exercises[currentExerciseIndex] = exercise;
    } else {
        // Add new exercise
        if (!activeProgram.workoutDays[currentDayIndex].exercises) {
            activeProgram.workoutDays[currentDayIndex].exercises = [];
        }
        activeProgram.workoutDays[currentDayIndex].exercises.push(exercise);
    }
    
    // Update in programs array
    const programIndex = programs.findIndex(p => p.id === activeProgram.id);
    if (programIndex !== -1) {
        programs[programIndex] = activeProgram;
    }
    
    savePrograms();
    closeExerciseModal();
    renderWorkspace();
}

// Remove exercise
function removeExercise(dayIndex, exerciseIndex) {
    if (!activeProgram) return;
    
    if (confirm('Delete this exercise?')) {
        activeProgram.workoutDays[dayIndex].exercises.splice(exerciseIndex, 1);
        
        // Update in programs array
        const programIndex = programs.findIndex(p => p.id === activeProgram.id);
        if (programIndex !== -1) {
            programs[programIndex] = activeProgram;
        }
        
        savePrograms();
        renderWorkspace();
    }
}