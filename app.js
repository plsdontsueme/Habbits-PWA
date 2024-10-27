const habitList = document.getElementById('habitList');
const newHabitInput = document.getElementById('newHabit');

// Load habits from localStorage when the app starts
document.addEventListener('DOMContentLoaded', loadHabits);

// Add a new habit
function addHabit() {
    const habitName = newHabitInput.value.trim();
    if (habitName) {
        const habit = { name: habitName, completed: false };
        saveHabit(habit);
        newHabitInput.value = '';
    }
}

// Save a habit to localStorage
function saveHabit(habit) {
    const habits = getHabits();
    habits.push(habit);
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
}

// Load habits from localStorage
function loadHabits() {
    renderHabits();
}

// Get habits from localStorage
function getHabits() {
    return JSON.parse(localStorage.getItem('habits')) || [];
}

// Render the list of habits
function renderHabits() {
    habitList.innerHTML = '';
    getHabits().forEach((habit, index) => {
        const habitItem = document.createElement('li');
        habitItem.className = 'habit-item';
        if (habit.completed) habitItem.classList.add('completed');
        
        habitItem.innerHTML = `
            <span>${habit.name}</span>
            <button onclick="toggleHabit(${index})">${habit.completed ? 'Undo' : 'Done'}</button>
        `;
        habitList.appendChild(habitItem);
    });
}

// Toggle habit completion
function toggleHabit(index) {
    const habits = getHabits();
    habits[index].completed = !habits[index].completed;
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
}
