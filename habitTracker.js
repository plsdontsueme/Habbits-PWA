
export async function showHabitTracker() {
  console.log('showHabitTracker');
  const savedSetting = localStorage.getItem("KEEP_CALENDAR_DAY_ORDER");
  if (savedSetting !== null) {
    KEEP_CALENDAR_DAY_ORDER = savedSetting === "true";
    document.getElementById("calendar-order-toggle").checked = KEEP_CALENDAR_DAY_ORDER;
  }

  await loadHabitsAsLocal();
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = today.toLocaleDateString('de-DE', options);
  renderHabits(); // load from storage and render
}

export async function onUnloadHabitTracker() {
  await saveHabitsAsUTC();
}


//#region Constants
import { scheduleDailyNotification, cancelNotification } from './notification.js';

const SWIPE_THRESHOLD = 50;
const LONG_PRESS_THRESHOLD = 500;

let KEEP_CALENDAR_DAY_ORDER;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
//#endregion


//#region Habit Storage
let Habits = [];

function addHabit(habit) {
  Habits.push(habit);
}
function removeHabit(habit) {
  cancelNotification(habit)
  Habits = Habits.filter(h => h !== habit);
}
function updateHabit(habit) {
  const index = Habits.findIndex(h => h === habit);
  if (index !== -1) {
    Habits[index] = habit;
  } else {
    throw new Error(`Habit not found ${habit}`);
  }
}

import { saveArray, getArray } from './storage.js';

async function saveHabitsAsUTC() {
  const utcHabits = Habits.map(habit => {
    if (habit.completion) {
      habit.completion = habit.completion.map(entry => ({
        ...entry,
        date: new Date(entry.date).toISOString().split('T')[0] // Convert to UTC YYYY-MM-DD
      }));
    }
    return habit;
  });
  await saveArray(utcHabits);
}
async function loadHabitsAsLocal() {
  const habits = await getArray();
  Habits = habits.map(habit => {
    if (habit.completion) {
      habit.completion = habit.completion.map(entry => ({
        ...entry,
        date: new Date(entry.date).toLocaleDateString('en-CA') // Convert to local time YYYY-MM-DD
      }));
    }
    return habit;
  });
}
//#endregion


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

habitCreationModal.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = habitNameInput.value || habitNameInput.placeholder;
  const description = habitDescriptionInput.value;
  const color = selectedColor;
  const symbol = habitSymbolInput.value || habitSymbolInput.placeholder;
  const frequency = parseInt(habitFrequencyInput.value) || parseInt(habitFrequencyInput.placeholder);
  const reminder = habitReminderInput.value;

  const newHabit = { name, description, color, symbol, frequency, reminder, completion: [] };
  addHabit(newHabit);

  // Schedule a daily notification if reminder time is set
  if (reminder) {
    scheduleDailyNotification(newHabit);
  }

  closeHabitCreationModal();
  renderHabits();
});

//#endregion

//#region Habit List
function renderHabits() {
  const habitList = document.getElementById('habit-list');
  habitList.innerHTML = '';

  Habits.forEach((habit) => {
    const habitContainer = document.createElement('div');
    habitContainer.classList.add('habit-container');
    habitContainer.style.borderColor = habit.color;

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'X';
    deleteButton.style.display = 'none'; // Hidden initially

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeHabit(habit);
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
      if (diffX < -SWIPE_THRESHOLD) { // Swiping left threshold
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
      if (diffX < -SWIPE_THRESHOLD) {
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
    habitSymbol.onclick = () => openHabitDetail(habit);

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
  const currentDate = new Date().toLocaleDateString('en-CA');;

  let todayCompletion = habit.completion.find(entry => entry.date === currentDate);
  if (!todayCompletion) {
    todayCompletion = { date: currentDate, count: 0 };
    habit.completion.push(todayCompletion);
  }

  let newCount = Math.min(Math.max(todayCompletion.count + increment, 0), habit.frequency);

  if (newCount !== todayCompletion.count) {
    todayCompletion.count = newCount;
    updateHabit(habit);
  }
    
  updateProgressBar(habit, progressBar, checkIcon, todayCompletion.count);
}

function updateProgressBar(habit, progressBar, checkIcon, completionCount) {
  const completionRatio = completionCount / habit.frequency;
  const progressWidth = Math.min(completionRatio * 100, 100); // Limit width to 100%
  checkIcon.textContent = progressWidth == 100 ? '✔' : '🞬';
  progressBar.style.width = `${progressWidth}%`;
}
//#endregion

//#region Habit Detail View
const detailName = document.getElementById('habit-detail-name');
const detailDescription = document.getElementById('habit-detail-description');
const calendar = document.getElementById('completion-calendar');
const habitDetail = document.getElementById('habit-detail');
const calendarMonthName = document.getElementById('calendar-month-name');

window.closeHabitDetail = closeHabitDetail;

let calendarYear;
let calendarMonth;

let detailHabit;

function openHabitDetail(habit) {
  detailName.textContent = habit.name;
  detailDescription.textContent = habit.description;

  detailHabit = habit;
  const today = new Date();
  calendarYear = today.getFullYear();
  calendarMonth = today.getMonth();

  renderCompletionCalendar();
  renderProgressChart();

  habitDetail.style.display = 'flex';
}

document.getElementById('next-month').addEventListener('click', () => {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCompletionCalendar();
});
document.getElementById('prev-month').addEventListener('click', () => {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCompletionCalendar();
});

function closeHabitDetail() {
  habitDetail.style.display = 'none';
}

function renderCompletionCalendar() { 
  calendarMonthName.textContent = `${calendarYear} - ${months[calendarMonth]}`;

  calendar.innerHTML = '';

  let daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate(); // The 0th day of the next month gives the last day of the target month
  const today = new Date();

  if (!KEEP_CALENDAR_DAY_ORDER) {
    const dayOfTheWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let day = dayOfTheWeek; day < dayOfTheWeek + 7; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      const dayNumber = document.createElement('span');
      let dayIndex = day
      if (day >= days.length) {
        dayIndex = day - days.length
      }
      dayNumber.textContent = days[dayIndex];
      dayNumber.classList.add('calendar-day-text');
      dayElement.appendChild(dayNumber);
      dayElement.classList.add('in-future')
      calendar.appendChild(dayElement);
    }
  }
  else {
    let dayOfTheWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    if (dayOfTheWeek == 0) dayOfTheWeek = 6
    else dayOfTheWeek--;
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    for (let day = 0; day < dayOfTheWeek + 7; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      const dayNumber = document.createElement('span');
      let dayText;
      if (day >= days.length) {
        dayText = '';
      }
      else dayText = days[day];
      dayNumber.textContent = dayText;
      dayNumber.classList.add('calendar-day-text');
      dayElement.appendChild(dayNumber);
      dayElement.classList.add('in-future')
      calendar.appendChild(dayElement);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(calendarYear, calendarMonth, day);
    const completion = detailHabit.completion.find(entry => entry.date === date.toLocaleDateString('en-CA')) || { count: 0 };

    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    const dayNumber = document.createElement('span');

    dayNumber.textContent = day;
    dayNumber.classList.add('calendar-day-text');
    dayElement.appendChild(dayNumber);

    const dayElementProgressBar = document.createElement('div');
    dayElementProgressBar.classList.add('calendar-day-progress-bar');
    dayElementProgressBar.style.backgroundColor = detailHabit.color;
    dayElement.appendChild(dayElementProgressBar);

    const checkIcon = document.createElement('span');
    checkIcon.classList.add('calendar-day-check-icon');
    dayElement.appendChild(checkIcon);

    if (date > today) dayElement.classList.add('in-future');
    else addCalendarDayPressEvents(detailHabit, date, dayElement, dayElementProgressBar, checkIcon);
    updateCalendarDayProgressBar(detailHabit, dayElementProgressBar, checkIcon, completion.count);
    calendar.appendChild(dayElement);
  }
}

function addCalendarDayPressEvents(habit, date, progressContainer, progressBar, checkIcon) {
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
      changeCompletion(habit, date, progressBar, checkIcon, 1);
    } else if (pressType === 'long') {
      longPressed = true;
      console.log('onProgressLongPress');
      changeCompletion(habit, date, progressBar, checkIcon, -1);
    }
  }
}

function changeCompletion(habit, date, progressBar, checkIcon, increment) {
  const dateString = date.toLocaleDateString('en-CA');
  let entry = habit.completion.find(entry => entry.date === dateString);
  if (!entry) {
    habit.completion.push({ date: dateString, count: 0 });
    entry = habit.completion.find(entry => entry.date === dateString);
  }

  entry.count = Math.max(Math.min(entry.count + increment, habit.frequency), 0);

  updateCalendarDayProgressBar(habit, progressBar, checkIcon, entry.count);
  updateHabit(habit);
  renderHabits(); // not all must
  //#region update progress chart
  const completions = habitChartInstance.data.labels.map(date => {
    const entry = habit.completion.find(e => e.date === date);
    return entry ? entry.count : 0;
  });
  habitChartInstance.data.datasets[0].data = completions;
  habitChartInstance.update();
  //#endregion
}
function updateCalendarDayProgressBar(habit, progressBar, checkIcon, completionCount) {
  const completionRatio = completionCount / habit.frequency;
  const barHeight = Math.min(completionRatio * 100, 100); // Limit width to 100%
  checkIcon.textContent = barHeight == 100 ? '✔' : '🞬';
  progressBar.style.height = `${barHeight}%`;
}
//#endregion

//#region Progress Chart
let habitChartInstance;
function renderProgressChart() {
  const ctx = document.getElementById('habit-progress-chart').getContext('2d');
  const dates = Array.from({ length: 20 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-CA');
  }).reverse();

  const completions = dates.map(date => {
    const entry = detailHabit.completion.find(e => e.date === date);
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
        backgroundColor: detailHabit.color,
        borderColor: detailHabit.color,
        fill: false,
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: detailHabit.frequency + 1, grid: { color: '#555' } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}
//#endregion

//#endregion

