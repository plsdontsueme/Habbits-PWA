// dashboard.js

import StorageHandler from './storage.js';

const storage = new StorageHandler();
const habitList = document.getElementById('habits-list');
const habitCreationModal = document.getElementById('habit-creation');

// Show Dashboard content by loading habits
export async function showDashboard() {
  await loadHabits();
}

// Load habits from storage and display them
async function loadHabits() {
  habitList.innerHTML = ''; // Clear existing list
  const habits = await storage.getAllHabits();
  
  // Render each habit
  habits.forEach(habit => {
    const habitElement = document.createElement('div');
    habitElement.classList.add('habit-item');
    habitElement.style.backgroundColor = habit.color;
    habitElement.textContent = habit.name;
    habitElement.onclick = () => showHabitDetail(habit);
    habitList.appendChild(habitElement);
  });
}

// Open the habit creation modal
document.getElementById('add-habit-btn').addEventListener('click', () => {
  habitCreationModal.style.display = 'block';
});

// Create a new habit from the form input
window.createHabit = async function () {
  const name = document.getElementById('habit-name').value;
  const color = document.getElementById('habit-color').value;
  const reminder = document.getElementById('reminder-toggle').checked;
  const reminderTime = document.getElementById('reminder-time').value;
  const interval = document.getElementById('interval').value;

  const newHabit = {
    name,
    color,
    reminder,
    reminderTime,
    interval,
    createdDate: new Date().toISOString(),
    status: 'incomplete',
  };

  await storage.addHabit(newHabit);
  closeModal();
  loadHabits();
};

// Close the habit creation modal
window.closeModal = function () {
  habitCreationModal.style.display = 'none';
};

// Display habit details in a modal
window.showHabitDetail = function (habit) {
  const detailModal = document.getElementById('habit-detail');
  document.getElementById('habit-detail-title').textContent = habit.name;
  detailModal.style.display = 'block';
};

// Close the habit detail modal
window.closeHabitDetail = function () {
  document.getElementById('habit-detail').style.display = 'none';
};
