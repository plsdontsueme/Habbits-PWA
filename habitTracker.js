import StorageHandler from './storage.js';
const storage = new StorageHandler();

export async function showHabitTracker() {
  console.log('showHabitTracker');
  await renderHabits(); // load from storage and render
}


//#region Habit Creation
const habitNameInput = document.getElementById('habit-name');
const habitDescriptionInput = document.getElementById('habit-description');
const habitSymbolInput = document.getElementById('habit-symbol');
const habitFrequencyInput = document.getElementById('habit-frequency');
const habitReminderInput = document.getElementById('habit-reminder');
const habitCreationModal = document.getElementById('habit-creation');

window.openHabitCreationModal = openHabitCreationModal;
window.closeHabitCreationModal = closeHabitCreationModal;

function openHabitCreationModal() {
  habitNameInput.value = '';
  habitDescriptionInput.value = '';
  habitSymbolInput.value = '';
  habitFrequencyInput.value = '';
  habitReminderInput.value = '';
  selectedColor = '#03fcc6'
  customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
  document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
  customColorTrigger.classList.add('selected');
  // set visible
  habitCreationModal.style.display = 'flex';
}
function closeHabitCreationModal() {
  habitCreationModal.style.display = 'none';
}

//#region Color Selection
const colorSelection = document.getElementById('color-selection');
const customColorTrigger = document.getElementById('custom-color-trigger');
const customColorPicker = document.getElementById('custom-color-picker');

let selectedColor = '#ffadad';

colorSelection.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {
    // Remove previous selection
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
    e.target.classList.add('selected');
    
    if (e.target === customColorTrigger) {
      // Trigger the hidden color picker
      customColorPicker.click();
    } else {
      // Set the selected color to the background color of the clicked option
      selectedColor = e.target.style.backgroundColor;
    }
  }
});

customColorPicker.addEventListener('input', (e) => {
  const customColor = e.target.value;
  customColorTrigger.style.setProperty('--before-bg-color', customColor);
  selectedColor = customColor;
});
//#endregion

habitCreationModal.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = habitNameInput.value || habitNameInput.placeholder;
  const description = habitDescriptionInput.value;
  const color = selectedColor;
  const symbol = habitSymbolInput.value || habitSymbolInput.placeholder;
  const frequency = parseInt(habitFrequencyInput.value) || parseInt(habitFrequencyInput.placeholder);
  const reminder = habitReminderInput.value;

  const newHabit = { name, description, color, symbol, frequency, reminder, completion: [] };
  await storage.addHabit(newHabit);
  closeHabitCreationModal();
  renderHabits();
});

//#endregion

//#region Habit List
async function renderHabits() {
  const habits = await storage.getAllHabits();
  const habitList = document.getElementById('habit-list');
  habitList.innerHTML = '';

  habits.forEach((habit) => {
    const habitContainer = document.createElement('div');
    habitContainer.classList.add('habit-container');
    habitContainer.style.borderColor = habit.color;

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'X';
    deleteButton.style.display = 'none'; // Hidden initially

    deleteButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      await storage.deleteHabit(habit.id);
      renderHabits(); // Re-render habits
    });

    //#region Swipe Events
    let startX, currentX, isSwiping = false;

    //#region For mobile
    habitContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    });
    habitContainer.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      if (diffX < -50) { // Swiping left threshold
        habitContainer.classList.add('swiped');
        deleteButton.style.display = 'block'; // Show delete button
      } else if (diffX > 0) { // Swiping back right
        habitContainer.classList.remove('swiped');
        deleteButton.style.display = 'none'; // Hide delete button
      }
    });
    habitContainer.addEventListener('touchend', () => {
      isSwiping = false;
    });
    //#endregion
    //#region For desktop
    habitContainer.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isSwiping = true;
    });
    habitContainer.addEventListener('mousemove', (e) => {
      if (!isSwiping) return;
      currentX = e.clientX;
      const diffX = currentX - startX;
      if (diffX < -50) {
        habitContainer.classList.add('swiped');
        deleteButton.style.display = 'block';
      } else if (diffX > 0) {
        habitContainer.classList.remove('swiped');
        deleteButton.style.display = 'none';
      }
    });
    habitContainer.addEventListener('mouseup', () => {
      isSwiping = false;
    });
    //#endregion

    // If clicked outside the delete button or habit, reset swipe
    document.addEventListener('click', (e) => {
      if (!habitContainer.contains(e.target)) {
        habitContainer.classList.remove('swiped');
        deleteButton.style.display = 'none';
      }
    });
    //#endregion

    const habitSymbol = document.createElement('span');
    habitSymbol.classList.add('habit-symbol');
    habitSymbol.textContent = habit.symbol;
    habitSymbol.onclick = () => openHabitDetail(habit.id);

    const habitName = document.createElement('span');
    habitName.classList.add('habit-name');
    habitName.textContent = habit.name;
    habitName.style.color = habit.color;

    const habitProgress = document.createElement('div');
    habitProgress.classList.add('habit-progress');
    habitProgress.style.color = habit.color;

    const habitProgressBar = document.createElement('div');
    habitProgressBar.classList.add('habit-progress-bar');
    habitProgress.appendChild(habitProgressBar);

    const checkIcon = document.createElement('span');
    checkIcon.classList.add('check-icon');
    habitProgress.appendChild(checkIcon);

    addProgressPressEvents(habit, habitProgress, habitProgressBar, checkIcon);
    updateCurrentDayProgress(habit, habitProgressBar, checkIcon, 0);

    habitContainer.append(habitSymbol, habitName, habitProgress, deleteButton);
    habitList.appendChild(habitContainer);
  });
}
//#endregion

//#region Progress Tracking
const LONG_PRESS_THRESHOLD = 500;
let longPressed = false;

function addProgressPressEvents(habit, progressContainer, progressBar, checkIcon) {
  let pressTimer;

  // Handle short and long press events on the progress bar
  progressContainer.addEventListener('mousedown', () => startPressTimer(habit, progressBar, checkIcon));
  progressContainer.addEventListener('mouseup', () => clearPressTimer(habit, progressBar, checkIcon, 'short'));
  progressContainer.addEventListener('mouseleave', () => clearPressTimer()); // Clear if the pointer leaves
  
  // Mobile touch equivalent
  progressContainer.addEventListener('touchstart', () => startPressTimer(habit, progressBar, checkIcon));
  progressContainer.addEventListener('touchend', () => clearPressTimer(habit, progressBar, checkIcon, 'short'));
  progressContainer.addEventListener('touchcancel', () => clearPressTimer()); // Clear if touch is interrupted

  // Function to start the press timer for long press detection
  function startPressTimer(habit, progressBar, checkIcon) {
    longPressed = false;
    pressTimer = setTimeout(() => {
      clearPressTimer(habit, progressBar, checkIcon, 'long');
    }, LONG_PRESS_THRESHOLD);
  }

  // Function to clear the timer and trigger respective event based on press type
  function clearPressTimer(habit, progressBar, checkIcon, pressType = null) {
    clearTimeout(pressTimer);

    if (pressType === 'short') {
      if (longPressed) return;
      console.log('onProgressShortPress');
      updateCurrentDayProgress(habit, progressBar, checkIcon, 1);
    } else if (pressType === 'long') {
      longPressed = true;
      console.log('onProgressLongPress');
      updateCurrentDayProgress(habit, progressBar, checkIcon, -1);
    }
  }
}

function updateCurrentDayProgress(habit, progressBar, checkIcon, increment) {
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

  let todayCompletion = habit.completion.find(entry => entry.date === currentDate);
  if (!todayCompletion) {
    todayCompletion = { date: currentDate, count: 0 };
    habit.completion.push(todayCompletion);
  }

  let newCount = Math.min(Math.max(todayCompletion.count + increment, 0), habit.frequency);

  if (newCount !== todayCompletion.count) {
    todayCompletion.count = newCount;
    storage.updateHabit(habit);
  }
    
  updateProgressBar(habit, progressBar, checkIcon, todayCompletion.count);
}

function updateProgressBar(habit, progressBar, checkIcon, completionCount) {
  const completionRatio = completionCount / habit.frequency;
  const progressWidth = Math.min(completionRatio * 100, 100); // Limit width to 100%
  checkIcon.innerHTML = progressWidth == 100 ? '✔' : '🞬';
  progressBar.style.width = `${progressWidth}%`;
}
//#endregion

//#region Habit Detail View
const detailName = document.getElementById('habit-detail-name');
const detailDescription = document.getElementById('habit-detail-description');
const calendar = document.getElementById('completion-calendar');
const habitDetail = document.getElementById('habit-detail');

window.closeHabitDetail = closeHabitDetail;

async function openHabitDetail(habitId) {
  const habit = await storage.getHabitById(habitId);
  
  detailName.textContent = habit.name;
  detailDescription.textContent = habit.description;

  renderCompletionCalendar(habit, calendar);
  renderProgressChart(habit);

  habitDetail.style.display = 'flex';
}

function closeHabitDetail() {
  habitDetail.style.display = 'none';
}

function renderCompletionCalendar(habit, calendarElement) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  calendarElement.innerHTML = ''; // Clear previous content

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day).toISOString().split('T')[0];
    const completion = habit.completion.find(entry => entry.date === date) || { count: 0 };
    const isCompleted = completion.count >= habit.frequency;

    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    dayElement.textContent = day;
    dayElement.classList.add(isCompleted ? 'completed' : 'missed');
    dayElement.onclick = () => toggleCompletion(habit, date, dayElement);
    calendarElement.appendChild(dayElement);
  }
}

async function toggleCompletion(habit, date, dayElement) {
  const entry = habit.completion.find(entry => entry.date === date);
  if (entry) {
    entry.count = entry.count >= habit.frequency ? 0 : habit.frequency;
  } else {
    habit.completion.push({ date, count: habit.frequency });
  }
  await storage.updateHabit(habit);

  dayElement.classList.toggle('completed');
  dayElement.classList.toggle('missed');
}

let habitChartInstance;
function renderProgressChart(habit) {
  const ctx = document.getElementById('habit-progress-chart').getContext('2d');
  const today = new Date();
  const dates = Array.from({ length: 20 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const completions = dates.map(date => {
    const entry = habit.completion.find(e => e.date === date);
    return entry ? entry.count : 0;
  });

  if (habitChartInstance) {
    habitChartInstance.destroy();
  }

  habitChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Daily Completion',
        data: completions,
        backgroundColor: habit.color,
        borderColor: habit.color,
        fill: false,
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: habit.frequency * 1.2, grid: { color: '#555' } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}
//#endregion
