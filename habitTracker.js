
import { scheduleDailyNotification, cancelNotification } from './notification.js';
import { saveArray, getArray, getBoolParameter } from './storage.js';

let KEEP_CALENDAR_DAY_ORDER;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const daysSingle = ["M", "T", "W", "T", "F", "S", "S"];
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let Habits = [];

export async function showHabitTracker() {
  console.log('showHabitTracker');

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = today.toLocaleDateString('de-DE', options);

  KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");

  await loadHabitsAsLocal();
  renderHabits();
}
export async function onUnloadHabitTracker() {
  await saveHabitsAsUTC();
}

//#region Habit Saving / Loading
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

//#region Habit Array Manipulation
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
//#endregion

//#region Habit Creation Modal
window.openHabitCreationModal = openHabitCreationModal;
window.closeHabitCreationModal = closeHabitCreationModal;

const habitNameInput = document.getElementById('habit-name');
const habitDescriptionInput = document.getElementById('habit-description');
const habitSymbolInput = document.getElementById('habit-symbol');
const habitFrequencyInput = document.getElementById('habit-frequency');
const habitReminderInput = document.getElementById('habit-reminder');
const habitTypeSelection = document.getElementById('habit-type');
const habitCreationModal = document.getElementById('habit-creation');
let selectedColor = '#ffadad';
  //#region Color Selection
const colorSelection = document.getElementById('color-selection');
const customColorTrigger = document.getElementById('custom-color-trigger');
const hiddenCustomColorPicker = document.getElementById('custom-color-picker');

hiddenCustomColorPicker.addEventListener('input', (e) => {
  const pickedColor = e.target.value;
  customColorTrigger.style.setProperty('--before-bg-color', pickedColor);
  selectedColor = pickedColor;
});

colorSelection.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {

    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
    e.target.classList.add('selected');
       
    if (e.target === customColorTrigger) {
      selectedColor = customColorTrigger.style.getPropertyValue('--before-bg-color');
      hiddenCustomColorPicker.click();
    } else {
      selectedColor = e.target.style.backgroundColor;
    }
  }
});
  //#endregion

function openHabitCreationModal() {
  resetHabitCreationModal();
  habitCreationModal.style.display = 'flex';
}
function closeHabitCreationModal() {
  habitCreationModal.style.display = 'none';
}
function resetHabitCreationModal() {
  habitNameInput.value = '';
  habitDescriptionInput.value = '';
  habitSymbolInput.value = '';
  habitFrequencyInput.value = '';
  habitReminderInput.value = '';
  habitTypeSelection.selectedIndex = 0;
  selectedColor = '#03fcc6'
  customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
  document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
  customColorTrigger.classList.add('selected');
}
habitCreationModal.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = habitNameInput.value || habitNameInput.placeholder;
  const description = habitDescriptionInput.value;
  const color = selectedColor;
  const symbol = habitSymbolInput.value || habitSymbolInput.placeholder;
  const frequency = parseInt(habitFrequencyInput.value) || parseInt(habitFrequencyInput.placeholder);
  const reminder = habitReminderInput.value;
  const infiniteCounter = habitTypeSelection.value === '1';
  const id = Date.now().toString();

  const newHabit = { id, name, description, infiniteCounter, color, symbol, frequency, reminder, completion: [] };
  addHabit(newHabit);

  if (reminder) {
    scheduleDailyNotification(newHabit);
  }
  
  closeHabitCreationModal();
  renderHabits();
});
//#endregion

//#region Habit List
const habitList = document.getElementById('habit-list');

const SWIPE_THRESHOLD = 50;

function renderHabits() {
  clearHabitList();

  Habits.forEach((habit) => {
    const habitContainer = createHabitContainer(habit);

    const deleteButton = createDeleteButton(habit, habitContainer);
    setupSwipeToDeleteEvents(habitContainer, deleteButton);
    setupOutsideClickSwipeCancel(habitContainer, deleteButton);

    const habitSymbol = createHabitSymbol(habit);
    const habitName = createHabitName(habit);
    const habitProgressButton = createHabitProgressButton(habit);

    habitContainer.append(habitSymbol, habitName, habitProgressButton, deleteButton);
    habitList.appendChild(habitContainer);
  });
}

function clearHabitList() {
  habitList.innerHTML = '';
}
function createHabitContainer(habit) {
  const container = document.createElement('div');
  container.classList.add('habit-container');
  container.style.borderColor = habit.color;
  return container;
}
function createDeleteButton(habit, habitContainer) {
  const button = document.createElement('button');
  button.classList.add('delete-button');
  button.textContent = 'X';
  button.style.display = 'none'; // Initially hidden

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    removeHabit(habit);
    renderHabits();
  });
  
  return button;
}
function createHabitSymbol(habit) {
  const symbol = document.createElement('span');
  symbol.classList.add('habit-symbol');
  symbol.textContent = habit.symbol;
  symbol.onclick = () => openHabitDetail(habit);
  return symbol;
}
function createHabitName(habit) {
  const name = document.createElement('span');
  name.classList.add('habit-name');
  name.textContent = habit.name;
  name.style.color = habit.color;
  return name;
}
function createHabitProgressButton(habit) {
  const progressContainer = document.createElement('div');
  progressContainer.classList.add('habit-progress');
  progressContainer.style.color = habit.color;

  const progressBar = document.createElement('div');
  progressBar.classList.add('habit-progress-bar');
  progressBar.setAttribute('habit-id', habit.id);
  progressContainer.appendChild(progressBar);

  const checkIcon = document.createElement('span');
  checkIcon.classList.add('check-icon');
  checkIcon.setAttribute('habit-id', habit.id);
  progressContainer.appendChild(checkIcon);

  const today = new Date().toLocaleDateString('en-CA');
  addProgressButtonPressEvents(today, habit, progressContainer, progressBar, 'bar-horizontal', checkIcon);
  updateDaysProgress(today, habit, progressBar, 'bar-horizontal', checkIcon, 0);

  return progressContainer;
}
function setupSwipeToDeleteEvents(habitContainer, deleteButton) {
  let startX, currentX, isSwiping = false;
  // Swipe Events for Mobile
  habitContainer.addEventListener('touchstart', (e) => startSwipe(e.touches[0].clientX));
  habitContainer.addEventListener('touchmove', (e) => handleSwipeMove(e.touches[0].clientX, habitContainer, deleteButton));
  habitContainer.addEventListener('touchend', endSwipe);
  // Swipe Events for Desktop
  habitContainer.addEventListener('mousedown', (e) => startSwipe(e.clientX));
  habitContainer.addEventListener('mousemove', (e) => handleSwipeMove(e.clientX, habitContainer, deleteButton));
  habitContainer.addEventListener('mouseup', endSwipe);

  function startSwipe(x) {
    startX = x;
    isSwiping = true;
  }
  function handleSwipeMove(x, container, button) {
    if (!isSwiping) return;
    currentX = x;
    const diffX = currentX - startX;
    if (diffX < -SWIPE_THRESHOLD) {
      container.classList.add('swiped');
      button.style.display = 'block'; // Show delete button
    } else if (diffX > 0) {
      container.classList.remove('swiped');
      button.style.display = 'none'; // Hide delete button
    }
  }
  function endSwipe() {
    isSwiping = false;
  }
}
function setupOutsideClickSwipeCancel(habitContainer, deleteButton) {
  document.addEventListener('click', (e) => {
    if (!habitContainer.contains(e.target)) {
      habitContainer.classList.remove('swiped');
      deleteButton.style.display = 'none';
    }
  });
}
//#endregion

//#region Progress Button Logic
const LONG_PRESS_THRESHOLD = 350;

let isLongPressed = false;

function addProgressButtonPressEvents(targetDate, habit, buttonContainer, progressIndicatorElement, indicatorType, statusSymbol) {
  let pressTimer;

  // Mouse events
  buttonContainer.addEventListener('mousedown', handlePressStart);
  buttonContainer.addEventListener('mouseup', () => handlePressEnd('short'));
  buttonContainer.addEventListener('mouseleave', clearPressTimer);
  // Touch events for mobile
  buttonContainer.addEventListener('touchstart', handlePressStart);
  buttonContainer.addEventListener('touchend', () => handlePressEnd('short'));
  buttonContainer.addEventListener('touchcancel', clearPressTimer);

  function handlePressStart() {
    isLongPressed = false;
    pressTimer = setTimeout(() => handlePressEnd('long'), LONG_PRESS_THRESHOLD);
  }
  function handlePressEnd(pressType) {
    clearPressTimer();

    if (pressType === 'short' && !isLongPressed) {
      console.log('onProgressShortPress');
      updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, 1);
    } else if (pressType === 'long') {
      isLongPressed = true;
      console.log('onProgressLongPress');
      updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, -1);
    }
  }
  function clearPressTimer() {
    clearTimeout(pressTimer);
  }
}

function updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, satusSymbol, increment) {
  let daysProgression = habit.completion.find(entry => entry.date === targetDate);

  if (!daysProgression) {
    daysProgression = { date: targetDate, count: 0 };
    habit.completion.push(daysProgression);
  }

  daysProgression.count = calculateNewCount(habit, daysProgression.count, increment);

  updateHabit(habit);
  if (indicatorType === 'bar-horizontal') {
    updateProgressBar(habit, progressIndicatorElement, true, satusSymbol, daysProgression.count);
  }
  else if (indicatorType === 'bar-vertical') {
    updateProgressBar(habit, progressIndicatorElement, false, satusSymbol, daysProgression.count);
  }
  else {
    throw new Error('Invalid indicator type');
  }

  if (detailViewActive) {
    const progressBarInList = document.querySelector(`.habit-progress-bar[habit-id="${habit.id}"]`);
    const checkIconInList = document.querySelector(`.check-icon[habit-id="${habit.id}"]`);
    updateProgressBar(habit, progressBarInList, true, checkIconInList, daysProgression.count);
    updateProgressChartValues();
  }
}

function calculateNewCount(habit, currentCount, increment) {
  const newCount = Math.max(currentCount + increment, 0);
  return habit.infiniteCounter ? newCount : Math.min(newCount, habit.frequency);
}

function updateProgressBar(habit, progressBar, isHorizontal, statusSymbol, completionCount) {
  const completionRatio = completionCount / habit.frequency;

  const completionMarker = completionRatio === 1 ? '✔' : '🞬';
  statusSymbol.textContent = habit.infiniteCounter && completionRatio > 1 ? completionCount : completionMarker;

  const completionPercentage = Math.min(completionRatio * 100, 100);
  if (isHorizontal) {
    progressBar.style.width = `${completionPercentage}%`;
  } else {
    progressBar.style.height = `${completionPercentage}%`;
  }
}
//#endregion

//#region Habit Detail View
const detailName = document.getElementById('habit-detail-name');
const detailDescription = document.getElementById('habit-detail-description');
const calendar = document.getElementById('completion-calendar');
const habitDetail = document.getElementById('habit-detail');
const calendarMonthName = document.getElementById('calendar-month-name');
const progressChart = document.getElementById('habit-progress-chart');

window.closeHabitDetail = closeHabitDetail;

let detailViewActive = false;

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

  detailViewActive = true;
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
  detailViewActive = false;
  habitDetail.style.display = 'none';
}

function renderCompletionCalendar() { 
  calendarMonthName.textContent = `${calendarYear} - ${months[calendarMonth]}`;

  calendar.innerHTML = '';

  let daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate(); // The 0th day of the next month gives the last day of the target month
  const today = new Date();

  if (!KEEP_CALENDAR_DAY_ORDER) {
    const dayOfTheWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    
    for (let day = dayOfTheWeek; day < dayOfTheWeek + 7; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      const dayNumber = document.createElement('span');
      let dayIndex = day
      if (day >= daysShort.length) {
        dayIndex = day - daysShort.length
      }
      dayNumber.textContent = daysShort[dayIndex];
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

    for (let day = 0; day < dayOfTheWeek + 7; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      const dayNumber = document.createElement('span');
      let dayText;
      if (day >= daysSingle.length) {
        dayText = '';
      }
      else dayText = daysSingle[day];
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

    const dateString = date.toLocaleDateString('en-CA');
    if (date > today) dayElement.classList.add('in-future');
    else addProgressButtonPressEvents(dateString, detailHabit, dayElement, dayElementProgressBar, 'bar-vertical', checkIcon);
    updateDaysProgress(dateString, detailHabit, dayElementProgressBar, 'bar-vertical', checkIcon, completion.count);
    calendar.appendChild(dayElement);
  }
}

let progressChartInstance;
function renderProgressChart() {
  const ctx = progressChart.getContext('2d');
  const dates = Array.from({ length: 20 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-CA');
  }).reverse();

  const completions = dates.map(date => {
    const entry = detailHabit.completion.find(e => e.date === date);
    return entry ? entry.count : 0;
  });

  if (progressChartInstance) {
    progressChartInstance.destroy();
  }

  progressChartInstance = new Chart(ctx, {
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
function updateProgressChartValues() {
  const completions = progressChartInstance.data.labels.map(date => {
    const entry = detailHabit.completion.find(e => e.date === date);
    return entry ? entry.count : 0;
  });
  progressChartInstance.data.datasets[0].data = completions;
  progressChartInstance.update();
}
//#endregion
