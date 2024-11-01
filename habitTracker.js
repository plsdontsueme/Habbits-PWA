
import { scheduleDailyNotification, cancelNotification } from './notification.js';
import { saveArray, getArray, getBoolParameter, getIntParameter, setParameter } from './storage.js';

let KEEP_CALENDAR_DAY_ORDER;
let ANALYTICS_TIME_FRAME; 

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const daysSingle = ["M", "T", "W", "T", "F", "S", "S"];
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let Habits = [];
let todayDate;
let todayString;

export async function showHabitTracker() {
  console.log('showHabitTracker');

  todayDate = new Date();
  todayString = todayDate.toLocaleDateString('en-CA');

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = todayDate.toLocaleDateString('de-DE', options);

  KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");
  if (!KEEP_CALENDAR_DAY_ORDER) {
    KEEP_CALENDAR_DAY_ORDER = false;
    setParameter("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER);
  }
  ANALYTICS_TIME_FRAME = getIntParameter("ANALYTICS_TIME_FRAME");
  if (!ANALYTICS_TIME_FRAME) {
    ANALYTICS_TIME_FRAME = 20;
    setParameter("ANALYTICS_TIME_FRAME", ANALYTICS_TIME_FRAME);
  }
  document.getElementById("habit-progress-chart-title").textContent = `Last ${ANALYTICS_TIME_FRAME} days`;

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

const primaryInputGroup = document.getElementById('primary-creation-input-group');
const secondaryInputGroup = document.getElementById('secondary-creation-input-group');
let activeInputGroup; 

const habitNameInput = document.getElementById('habit-name');
const habitDescriptionInput = document.getElementById('habit-description');
const habitIconInput = document.getElementById('habit-icon');
const habitCompletionGoalInput = document.getElementById('habit-completion-goal');
const goalMinimumToggle = document.getElementById('goal-minimum-toggle');
const habitReminderInput = document.getElementById('habit-reminder-time');
const habitCreationModal = document.getElementById('habit-creation');
const enableGoalToggle = document.getElementById('enable-goal');
const enableReminderToggle = document.getElementById('enable-reminder');
let selectedColor = '#ffadad';
// Toggle Goal Input
const goalInputGroup = document.getElementById('goal-input-group');
enableGoalToggle.addEventListener('change', () => {
    goalInputGroup.style.display = enableGoalToggle.checked ? 'block' : 'none';
});
// Toggle Reminder Time Input
const reminderTimeGroup = document.getElementById('reminder-time-group');
enableReminderToggle.addEventListener('change', () => {
    reminderTimeGroup.style.display = enableReminderToggle.checked ? 'block' : 'none';
});
// Icon Selection
const iconOptions = document.querySelectorAll('.icon-option');
iconOptions.forEach(option => {
    option.addEventListener('click', () => {
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        habitIconInput.value = option.textContent.trim();
    });
});
habitIconInput.addEventListener('input', () => {
  iconOptions.forEach(opt => opt.classList.remove('selected'));
});
// Color Selection
const colorSelection = document.getElementById('color-selection');
const customColorTrigger = document.getElementById('custom-color-trigger');
const hiddenColorPicker = document.getElementById('hidden-color-picker');
hiddenColorPicker.addEventListener('input', (e) => {
  const pickedColor = e.target.value;
  customColorTrigger.style.setProperty('--before-bg-color', pickedColor);
  selectedColor = pickedColor;
});
colorSelection.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {

    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
       
    if (e.target === customColorTrigger) {
      selectedColor = customColorTrigger.style.getPropertyValue('--before-bg-color');
      hiddenColorPicker.click();
    } else {
      e.target.classList.add('selected');
      selectedColor = e.target.style.backgroundColor;
      customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
    }
  }
});

function openHabitCreationModal() {
  resetHabitCreationModal();
  habitCreationModal.style.display = 'flex';
}
function closeHabitCreationModal() {
  habitCreationModal.style.display = 'none';
}
function resetHabitCreationModal() {
  activeInputGroup = primaryInputGroup;
  primaryInputGroup.style.display = 'block';
  secondaryInputGroup.style.display = 'none';

  habitNameInput.value = '';
  habitDescriptionInput.value = '';
  habitIconInput.value = '';
  selectedColor = '#fff'
  customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
  document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
  enableGoalToggle.checked = false;
  habitCompletionGoalInput.value = '';
  goalMinimumToggle.checked = false;
  enableReminderToggle.checked = false;
  habitReminderInput.value = '';
}
habitCreationModal.addEventListener('submit', (e) => {
  e.preventDefault();

  if (activeInputGroup === primaryInputGroup) {
    activeInputGroup = secondaryInputGroup;
    primaryInputGroup.style.display = 'none';
    secondaryInputGroup.style.display = 'block';
    e.submitter.textContent = 'Create Habit';
  }
  else if (activeInputGroup === secondaryInputGroup) {
    const name = habitNameInput.value || 'My New Habit';
    const description = habitDescriptionInput.value;
    const color = selectedColor;
    const icon = habitIconInput.value || '☺️';
    const completionGoal = enableGoalToggle.checked ? (parseInt(habitCompletionGoalInput.value) || 1) : 1;
    const infiniteCounter = goalMinimumToggle.checked;
    const reminder = habitReminderInput.value;
    const id = Date.now().toString();

    const newHabit = { id, name, description, infiniteCounter, color, icon, completionGoal, reminder, completion: [], completedDays: 0, longestStreak: 0 };
    addHabit(newHabit);

    if (reminder) {
      scheduleDailyNotification(newHabit);
    }
    
    closeHabitCreationModal();
    e.submitter.textContent = 'Next';
    renderHabits();
  }
});
//#endregion

//#region Habit List
const habitList = document.getElementById('habit-list');

const DELETE_SWIPE_THRESHOLD = 80;

function renderHabits() {
  clearHabitList();

  Habits.forEach((habit) => {
    const habitContainer = createHabitContainer(habit);

    const deleteButton = createDeleteButton(habit, habitContainer);
    setupSwipeToDeleteEvents(habitContainer, deleteButton);
    setupOutsideClickSwipeCancel(habitContainer, deleteButton);

    const habitIcon = createHabitIcon(habit);
    const habitName = createHabitName(habit);
    const habitStreak = createHabitStreak(habit);
    const habitProgressButton = createHabitProgressButton(habit);

    habitContainer.append(habitIcon, habitName, habitStreak, habitProgressButton, deleteButton);
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
function createHabitIcon(habit) {
  const icon = document.createElement('span');
  icon.classList.add('habit-icon');
  icon.textContent = habit.icon;
  icon.onclick = () => openHabitDetail(habit);
  return icon;
}
function createHabitName(habit) {
  const name = document.createElement('span');
  name.classList.add('habit-name');
  name.textContent = habit.name;
  name.style.color = habit.color;
  return name;
}
function createHabitStreak(habit) {
  const streak = document.createElement('span');
  streak.classList.add('habit-streak');
  streak.setAttribute('habit-id', habit.id);
  streak.textContent = calculateCurrentStreak(habit);
  streak.style.color = habit.color;
  return streak;
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

  addProgressButtonPressEvents(todayString, habit, progressContainer, progressBar, 'bar-horizontal', checkIcon);
  updateDaysProgress(todayString, habit, progressBar, 'bar-horizontal', checkIcon, 0);

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
    if (diffX < -DELETE_SWIPE_THRESHOLD) {
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

//#region Progression Logic
const LONG_PRESS_THRESHOLD = 350; // Time in ms for a long press
const EXTENDED_LONG_PRESS_THRESHOLD = 700; // Time in ms for an extended long press

let isLongPressed = false;

function addProgressButtonPressEvents(targetDate, habit, buttonContainer, progressIndicatorElement, indicatorType, statusSymbol) {
  let pressTimer;
  let extendedPressTimer;

  // Mouse events
  buttonContainer.addEventListener('mousedown', handlePressStart);
  buttonContainer.addEventListener('mouseup', () => handlePressEnd('short'));
  buttonContainer.addEventListener('mouseleave', clearPressTimers);
  
  // Touch events for mobile
  buttonContainer.addEventListener('touchstart', handlePressStart);
  buttonContainer.addEventListener('touchend', () => handlePressEnd('short'));
  buttonContainer.addEventListener('touchcancel', clearPressTimers);

  function handlePressStart() {
    isLongPressed = false;
    pressTimer = setTimeout(() => handleLongPress(), LONG_PRESS_THRESHOLD);
  }

  function handleLongPress() {
    isLongPressed = true;
    console.log('onProgressLongPress');
    updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, -1);

    // Start timer for extended long press
    extendedPressTimer = setTimeout(() => handleExtendedLongPress(), EXTENDED_LONG_PRESS_THRESHOLD);
  }

  function handleExtendedLongPress() {
    console.log('onProgressExtendedLongPress');
    updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, -1000);
  }

  function handlePressEnd(pressType) {
    clearPressTimers();

    if (pressType === 'short' && !isLongPressed) {
      console.log('onProgressShortPress');
      updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, 1);
    }
  }

  function clearPressTimers() {
    clearTimeout(pressTimer);
    clearTimeout(extendedPressTimer);
  }
}

function updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, increment) {
  let dayProgressEntry = habit.completion.find(entry => entry.date === targetDate);

  if (!dayProgressEntry) {
    dayProgressEntry = { date: targetDate, count: 0 };
    habit.completion.push(dayProgressEntry);
  }
  
  const newCount = calculateNewCount(habit, dayProgressEntry.count, increment);
  const valueChanged = newCount !== dayProgressEntry.count;

  if (valueChanged) {
    if(newCount >= habit.completionGoal && dayProgressEntry.count < habit.completionGoal) {
      habit.completedDays++;
    }
    else if (newCount < habit.completionGoal && dayProgressEntry.count >= habit.completionGoal) {
      habit.completedDays--;
    }

    dayProgressEntry.count = newCount;
    updateHabit(habit);

    if (detailViewActive) {
      if(targetDate === todayString) {
        const progressBarInList = document.querySelector(`.habit-progress-bar[habit-id="${habit.id}"]`);
        const checkIconInList = document.querySelector(`.check-icon[habit-id="${habit.id}"]`);
        updateProgressBar(habit, progressBarInList, true, checkIconInList, dayProgressEntry.count);
      }
      updateProgressAnalytics();
      updateProgressChartValues();
    }
  }

  // render progress indicator
  if (indicatorType === 'bar-horizontal') {
    updateProgressBar(habit, progressIndicatorElement, true, statusSymbol, newCount);
  }
  else if (indicatorType === 'bar-vertical') {
    updateProgressBar(habit, progressIndicatorElement, false, statusSymbol, newCount);
  }
  else {
    throw new Error('Invalid indicator type');
  }
}

function calculateNewCount(habit, currentCount, increment) {
  const newCount = Math.max(currentCount + increment, 0);
  return habit.infiniteCounter ? newCount : Math.min(newCount, habit.completionGoal);
}

function updateProgressBar(habit, progressBar, isHorizontal, statusSymbol, completionCount) {
  const completionRatio = completionCount / habit.completionGoal;

  const completionMarker = completionRatio === 1 ? '✔' : '+';
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
const habitCompletedDays = document.getElementById('habit-completed-days');
const habitCurrentStreak = document.getElementById('habit-current-streak');
const habitLongestStreak = document.getElementById('habit-longest-streak');

window.closeHabitDetail = closeHabitDetail;

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

let detailViewActive = false;

let calendarYear;
let calendarMonth;

let detailHabit;

function openHabitDetail(habit) {
  detailName.style.color = habit.color;
  habitCurrentStreak.style.color = habit.color;
  habitLongestStreak.style.color = habit.color;
  habitCompletedDays.style.color = habit.color;
  detailName.textContent = `${habit.icon} ${habit.name}`;
  detailDescription.textContent = habit.description;

  detailHabit = habit;
  calendarYear = todayDate.getFullYear();
  calendarMonth = todayDate.getMonth();

  updateProgressAnalytics()
  renderCompletionCalendar();
  renderProgressChart();

  detailViewActive = true;
  habitDetail.style.display = 'flex';
}

function closeHabitDetail() {
  detailViewActive = false;
  habitDetail.style.display = 'none';
}

function updateProgressAnalytics() {
  const currentStreak = calculateCurrentStreak(detailHabit);
  document.querySelector(`.habit-streak[habit-id="${detailHabit.id}"]`).textContent = currentStreak;
  habitCurrentStreak.textContent = currentStreak || 0;
  habitLongestStreak.textContent = detailHabit.longestStreak;
  habitCompletedDays.textContent = detailHabit.completedDays;
}
function calculateCurrentStreak(habit) {
  let currentStreak = 0;
  let testDate = new Date(todayDate);
  while (true) {
    testDate.setDate(testDate.getDate() - 1);
    const entry = habit.completion.find(entry => entry.date === testDate.toLocaleDateString('en-CA'))
    if (!entry) break;
    if (entry.count < habit.completionGoal) break;
    currentStreak++;
  }
  if (currentStreak > habit.longestStreak) habit.longestStreak = currentStreak;
  return currentStreak > 0 ? `${currentStreak}🔥` : null;
}

function renderCompletionCalendar() { 
  calendarMonthName.textContent = `${calendarYear} - ${months[calendarMonth]}`;

  calendar.innerHTML = '';

  let daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate(); // The 0th day of the next month gives the last day of the target month

  if (!KEEP_CALENDAR_DAY_ORDER) {
    const dayOfTheWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    
    for (let day = dayOfTheWeek; day < dayOfTheWeek + 7; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-week-day');
      const dayNumber = document.createElement('span');
      let dayIndex = day
      if (day >= daysShort.length) {
        dayIndex = day - daysShort.length
      }
      dayNumber.textContent = daysShort[dayIndex];
      dayNumber.classList.add('calendar-week-day-text');
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
      dayElement.classList.add('calendar-week-day');
      const dayNumber = document.createElement('span');
      let dayText;
      if (day >= daysSingle.length) {
        dayText = '';
      }
      else dayText = daysSingle[day];
      dayNumber.textContent = dayText;
      dayNumber.classList.add('calendar-week-day-text');
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
    if (date > todayDate) dayElement.classList.add('in-future');
    else addProgressButtonPressEvents(dateString, detailHabit, dayElement, dayElementProgressBar, 'bar-vertical', checkIcon);
    updateProgressBar(detailHabit, dayElementProgressBar, false, checkIcon, completion.count);
    calendar.appendChild(dayElement);
  }
}

let progressChartInstance;
function renderProgressChart() {
  const ctx = progressChart.getContext('2d');
  const dates = Array.from({ length: ANALYTICS_TIME_FRAME }, (_, i) => {
    const d = new Date(todayDate);
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
        y: { beginAtZero: true, max: detailHabit.completionGoal + 1, grid: { color: '#555' } },
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
