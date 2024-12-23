
import { scheduleDailyNotification, cancelNotification, requestNotificationPermission } from './notification.js';
import { saveArray, getArray, getBoolParameter, getIntParameter, setParameter } from './storage.js';

let KEEP_CALENDAR_DAY_ORDER;
let ANALYTICS_TIME_FRAME;
let ALTERNATE_PROGRESS_BUTTON;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const daysSingle = ["M", "T", "W", "T", "F", "S", "S"];
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Initialize Pickr
const pickr = Pickr.create({
  el: '#hidden-color-picker',
  theme: 'monolith', // Available themes: 'classic', 'monolith', 'nano'
  default: '#fff',
  components: {
    preview: true,
    opacity: false,
    hue: true,
    interaction: {
      input: true,
      clear: false,
      save: true
    }
  }
});

let Habits;
let todayDate;
let todayString;

export function showHabitTracker() {
  console.log('showHabitTracker');

  todayDate = new Date();
  todayString = todayDate.toLocaleDateString('en-CA');

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = todayDate.toLocaleDateString('de-DE', options);

  KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");
  if (KEEP_CALENDAR_DAY_ORDER === null) {
    KEEP_CALENDAR_DAY_ORDER = false;
    setParameter("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER);
  }
  ANALYTICS_TIME_FRAME = getIntParameter("ANALYTICS_TIME_FRAME");
  if (ANALYTICS_TIME_FRAME === null) {
    ANALYTICS_TIME_FRAME = 20;
    setParameter("ANALYTICS_TIME_FRAME", ANALYTICS_TIME_FRAME);
  }
  document.getElementById("habit-progress-chart-title").textContent = `Last ${ANALYTICS_TIME_FRAME} days`;

  ALTERNATE_PROGRESS_BUTTON = getBoolParameter("ALTERNATE_PROGRESS_BUTTON");
  if (ALTERNATE_PROGRESS_BUTTON === null) {
    ALTERNATE_PROGRESS_BUTTON = true;
    setParameter("ALTERNATE_PROGRESS_BUTTON", ALTERNATE_PROGRESS_BUTTON);
  }

  loadHabitsAsLocal();
  renderHabits();
}
export function onUnloadHabitTracker() {
  saveHabitsAsUTC();
}

//#region Habit Saving / Loading
function saveHabitsAsUTC() {
  let utcHabits = {uncategorized: [], categories: []};
  utcHabits.uncategorized = toUTC(Habits.uncategorized);
  Habits.categories.forEach(category => {
    const utcCategory = {name: category.name, color: category.color, renderContents: category.renderContents, habits: toUTC(category.habits)};
    utcHabits.categories.push(utcCategory);
  });
  const dataArray = [utcHabits];
  saveArray(dataArray);
}

function loadHabitsAsLocal() {
  Habits = {uncategorized: [], categories: []};
  let utcHabits = getArray();
  if(utcHabits) {
    utcHabits = utcHabits[0];
    Habits.uncategorized = toLocal(utcHabits.uncategorized);
    utcHabits.categories.forEach(category => {
      const localCategory = {name: category.name, color: category.color, renderContents: category.renderContents, habits: toLocal(category.habits)};
      Habits.categories.push(localCategory);
    });
  }
}

function toUTC(habitsArray) {
  const utcHabits = habitsArray.map(habit => {
    if (habit.completion) {
      habit.completion = habit.completion.map(entry => ({
        ...entry,
        date: new Date(entry.date).toISOString().split('T')[0] // Convert to UTC YYYY-MM-DD
      }));
    }
    return habit;
  });
  return utcHabits;
}
function toLocal(habitsArray) {
  const localHabits = habitsArray.map(habit => {
    if (habit.completion) {
      habit.completion = habit.completion.map(entry => ({
        ...entry,
        date: new Date(entry.date).toLocaleDateString('en-CA') // Convert to local time YYYY-MM-DD
      }));
    }
    return habit;
  });
  return localHabits;
}
//#endregion

//#region Habit Array Manipulation
function addCategory(name, color) {
  Habits.categories.push({name: name, color: color, renderContents: true, habits: []});
}
function removeCategory(category) {
  category.habits.forEach(habit => {
    cancelNotification(habit)
  });
  Habits.categories = Habits.categories.filter(c => c !== category);
}

function addHabit(habit) {
  if (!habit.category) Habits.uncategorized.push(habit);
  else {
    const category = Habits.categories.find(c => c.name === habit.category);
    if (!category) throw new Error(`Category not found ${habit.category}`);
    category.habits.push(habit);
  }
}
function removeHabit(habit) {
  cancelNotification(habit)
  if (!habit.category) Habits.uncategorized = Habits.uncategorized.filter(h => h !== habit);
  else {
    const category = Habits.categories.find(c => c.name === habit.category);
    category.habits = category.habits.filter(h => h !== habit);
  }
}
function updateHabit(habit) {
  if (!habit.category) {
    const index = Habits.uncategorized.findIndex(h => h === habit);
    if (index !== -1) {
      Habits.uncategorized[index] = habit;
    } else {
      throw new Error(`Habit not found ${habit}`);
    }
  }
  else {
    const category = Habits.categories.find(c => c.name === habit.category);
    const index = category.habits.findIndex(h => h === habit);
    if (index !== -1) {
      category.habits[index] = habit;
    } else {
      throw new Error(`Habit not found ${habit}`);
    }
  }
}
//#endregion

//#region Category Creation Modal
window.openCategoryCreationModal = openCategoryCreationModal;
function openCategoryCreationModal() {
  resetCategoryCreationModal();
  categoryCreationModal.style.display = 'flex';
}
function closeCategoryCreationModal() {
  categoryCreationModal.style.display = 'none';
}
function resetCategoryCreationModal() {
  categoryNameInput.value = '';
  categorySelectedColor = '#fff'
  categoryCustomColorTrigger.style.setProperty('--before-bg-color', categorySelectedColor);
  document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
}

const categoryCreationModal = document.getElementById('category-creation');
const categoryCreationCancelButton = document.getElementById('category-creation-cancel-button');
const categoryCreationSubmitButton = document.getElementById('category-creation-submit-button');
const categoryNameInput = document.getElementById('category-name');
// Color Selection
let categorySelectedColor;
const categoryColorSelection = document.getElementById('category-color-selection');
const categoryCustomColorTrigger = document.getElementById('category-custom-color-trigger');
// Listen for color changes and save them
pickr.on('save', (color) => {
  const pickedColor = color.toHEXA().toString();
  categoryCustomColorTrigger.style.setProperty('--before-bg-color', pickedColor);
  categorySelectedColor = pickedColor;
  pickr.hide(); // Hide the picker after selection
});
// Event listener for color selection
categoryColorSelection.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {
    // Remove 'selected' class from other options
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));

    if (e.target === categoryCustomColorTrigger) {
      // Trigger Pickr if custom color option is clicked
      categorySelectedColor = categoryCustomColorTrigger.style.getPropertyValue('--before-bg-color');
      pickr.setColor(categorySelectedColor);
      pickr.show();
    } else {
      // Standard color option was clicked
      e.target.classList.add('selected');
      categorySelectedColor = e.target.style.backgroundColor;
      categoryCustomColorTrigger.style.setProperty('--before-bg-color', categorySelectedColor);
    }
  }
});

categoryCreationCancelButton.addEventListener('click', closeCategoryCreationModal);
categoryCreationSubmitButton.addEventListener('click', (e) => {
  addCategory(categoryNameInput.value || 'My New Category', categorySelectedColor);
  renderHabits();
  closeCategoryCreationModal();
});
//#endregion

//#region Habit Creation Modal
window.openHabitCreationModal = openHabitCreationModal;

const primaryInputGroup = document.getElementById('primary-creation-input-group');
const secondaryInputGroup = document.getElementById('secondary-creation-input-group');
let activeInputGroup; 
let targetCategory;
function setActiveInputGroup(group) {
  if (group === secondaryInputGroup) {
    activeInputGroup = secondaryInputGroup;
    primaryInputGroup.style.display = 'none';
    secondaryInputGroup.style.display = 'block';
    habitCreationSubmitButton.textContent = 'Create Habit';
  }
  else if (group === primaryInputGroup) {
    activeInputGroup = primaryInputGroup;
    primaryInputGroup.style.display = 'block';
    secondaryInputGroup.style.display = 'none';
    habitCreationSubmitButton.textContent = 'Next';
  }
}

const habitCreationCancelButton = document.getElementById('habit-creation-cancel-button');
const habitCreationSubmitButton = document.getElementById('habit-creation-submit-button');
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
    if (enableReminderToggle.checked) {
      requestNotificationPermission();
    }
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
// Listen for color changes and save them
pickr.on('save', (color) => {
  const pickedColor = color.toHEXA().toString();
  customColorTrigger.style.setProperty('--before-bg-color', pickedColor);
  selectedColor = pickedColor;
  pickr.hide(); // Hide the picker after selection
});
// Event listener for color selection
colorSelection.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {
    // Remove 'selected' class from other options
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));

    if (e.target === customColorTrigger) {
      // Trigger Pickr if custom color option is clicked
      selectedColor = customColorTrigger.style.getPropertyValue('--before-bg-color');
      pickr.setColor(selectedColor);
      pickr.show();
    } else {
      // Standard color option was clicked
      e.target.classList.add('selected');
      selectedColor = e.target.style.backgroundColor;
      customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
    }
  }
});

function openHabitCreationModal(creationTargetCategory = null) {
  resetHabitCreationModal();
  targetCategory = creationTargetCategory;
  habitCreationModal.style.display = 'flex';
}
function closeHabitCreationModal() {
  habitCreationModal.style.display = 'none';
}
function resetHabitCreationModal() {
  setActiveInputGroup(primaryInputGroup);

  habitNameInput.value = '';
  habitDescriptionInput.value = '';
  habitIconInput.value = '';
  iconOptions.forEach(opt => opt.classList.remove('selected'));
  selectedColor = '#fff'
  customColorTrigger.style.setProperty('--before-bg-color', selectedColor);
  document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
  enableGoalToggle.checked = false;
  goalInputGroup.style.display = 'none';
  habitCompletionGoalInput.value = '';
  goalMinimumToggle.checked = false;
  enableReminderToggle.checked = false;
  reminderTimeGroup.style.display = 'none';
  habitReminderInput.value = '';
}

habitCreationCancelButton.addEventListener('click', () => {
  if(activeInputGroup === primaryInputGroup) {
    closeHabitCreationModal();
  }
  else if (activeInputGroup === secondaryInputGroup) {
    setActiveInputGroup(primaryInputGroup);
  }
})
habitCreationSubmitButton.addEventListener('click', (e) => {
  e.preventDefault();

  if (activeInputGroup === primaryInputGroup) {
    setActiveInputGroup(secondaryInputGroup);
  }
  else if (activeInputGroup === secondaryInputGroup) {
    const name = habitNameInput.value || 'My New Habit';
    const description = habitDescriptionInput.value;
    const color = selectedColor;
    const icon = habitIconInput.value || '🌎';
    const completionGoal = enableGoalToggle.checked ? (parseInt(habitCompletionGoalInput.value) || 1) : 1;
    const infiniteCounter = goalMinimumToggle.checked;
    const reminder = habitReminderInput.value;
    const id = Date.now().toString();
    const category = targetCategory;

    const newHabit = { id, category, name, description, infiniteCounter, color, icon, completionGoal, reminder, completion: [], completedDays: 0, longestStreak: 0 };
    addHabit(newHabit);

    if (reminder) {
      scheduleDailyNotification(newHabit);
    }
    
    closeHabitCreationModal();
    habitCreationSubmitButton.textContent = 'Next';
    renderHabits();
  }
});
//#endregion

//#region Habit List
const habitList = document.getElementById('habit-list');

const DELETE_SWIPE_THRESHOLD = 80;

function renderHabits() {
  clearHabitList();

  Habits.uncategorized.forEach((habit) => {
    createHabitInList(habit);
  });

  const addUncategorizedDiv = document.createElement('div');
  addUncategorizedDiv.classList.add('add-uncategorized-container');

  const addHabitButton = document.createElement('button');
  addHabitButton.classList.add('add-list-element-btn');
  addHabitButton.onclick = () => openHabitCreationModal();
  addHabitButton.textContent = '+';
  addUncategorizedDiv.appendChild(addHabitButton);

  const addCategoryButton = document.createElement('button');
  addCategoryButton.classList.add('add-list-element-btn');
  addCategoryButton.onclick = () => openCategoryCreationModal();
  addCategoryButton.textContent = '{+}';
  addUncategorizedDiv.appendChild(addCategoryButton);

  habitList.appendChild(addUncategorizedDiv);

  Habits.categories.forEach((category) => {
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('category-container');
    categoryContainer.style.borderColor = category.renderContents;

    const delButton = document.createElement('button');
    delButton.classList.add('delete-button');
    delButton.textContent = 'X';
    delButton.style.display = 'none'; // Initially hidden

    delButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCategory(category);
      renderHabits();
    });
    setupSwipeToDeleteEvents(categoryContainer, delButton);
    setupOutsideClickSwipeCancel(categoryContainer, delButton);

    const showElementButton = document.createElement('h2');
    showElementButton.classList.add('category-show-button');
    showElementButton.style.color = category.color;
    showElementButton.textContent = category.renderContents ? '^' : 'v';
    showElementButton.addEventListener('click', () => {
      category.renderContents = !category.renderContents;
      renderHabits();
    });

    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = category.name;
    categoryTitle.classList.add('category-title');
    categoryTitle.style.color = category.color;

    categoryContainer.append(showElementButton, categoryTitle, delButton);
    habitList.appendChild(categoryContainer);

    if (category.renderContents) {
      category.habits.forEach(habit => {
        createHabitInList(habit);
      });
      const addButton = document.createElement('button');
      addButton.classList.add('add-list-element-btn');
      addButton.onclick = () => openHabitCreationModal(category.name);
      addButton.textContent = '+';
      habitList.appendChild(addButton);
    }
  })
}

function clearHabitList() {
  habitList.innerHTML = '';
}

function removeHabitInList(habit) {
  const habitContainer = document.querySelector(`[habit-id="${habit.id}"]`);
  habitContainer.remove();
}
function createHabitInList(habit) {
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
}
function createHabitContainer(habit) {
  const container = document.createElement('div');
  container.classList.add('habit-container');
  container.setAttribute('habit-id', habit.id);
  container.style.borderColor = habit.color;
  return container;
}
function createDeleteButton(habit) {
  const button = document.createElement('button');
  button.classList.add('delete-button');
  button.textContent = 'X';
  button.style.display = 'none'; // Initially hidden

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    removeHabit(habit);
    removeHabitInList(habit);
  });
  
  return button;
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
  name.onclick = () => openHabitDetail(habit);
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
  progressContainer.classList.add(ALTERNATE_PROGRESS_BUTTON ? 'habit-progress-container-circular' : 'habit-progress-container');
  progressContainer.style.color = habit.color;

  const progressBar = document.createElement('div');
  progressBar.classList.add(ALTERNATE_PROGRESS_BUTTON ? 'habit-progress-bar-circular' : 'habit-progress-bar');
  progressBar.setAttribute('habit-id', habit.id);
  progressContainer.appendChild(progressBar);

  const checkIcon = document.createElement('span');
  checkIcon.classList.add('check-icon');
  checkIcon.setAttribute('habit-id', habit.id);
  progressContainer.appendChild(checkIcon);

  addProgressButtonPressEvents(todayString, habit, progressContainer, progressBar, 'dashboard-habit', checkIcon);
  updateDaysProgress(todayString, habit, progressBar, 'dashboard-habit', checkIcon, 0);

  return progressContainer;
}
//#endregion

//#region Progression Logic
const LONG_PRESS_THRESHOLD = 320; // Time in ms for a long press
const EXTENDED_LONG_PRESS_THRESHOLD = 1020; // Time in ms for an extended long press

function addProgressButtonPressEvents(targetDate, habit, buttonContainer, progressIndicatorElement, indicatorType, statusSymbol) {
  let longPressTimer;
  let longerPressTimer;
  let isLongPressTriggered = false;
  let isLongerPressTriggered = false;

  buttonContainer.addEventListener("mousedown", startPress);
  buttonContainer.addEventListener("touchstart", startPress);

  buttonContainer.addEventListener("mouseup", endPress);
  buttonContainer.addEventListener("touchend", endPress);

  // Starts the press timer
  function startPress(e) {
      e.preventDefault(); // Prevents multiple events from triggering
      
      // Reset flags
      isLongPressTriggered = false;
      isLongerPressTriggered = false;

      // Set a timer for long press (500ms)
      longPressTimer = setTimeout(() => {
          console.log("Long Press Detected!");
          updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, -1);
          isLongPressTriggered = true;
      }, LONG_PRESS_THRESHOLD);

      // Set a timer for longer press (1500ms)
      longerPressTimer = setTimeout(() => {
          console.log("Longer Press Detected!");
          updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, -1000);
          isLongerPressTriggered = true;
      }, EXTENDED_LONG_PRESS_THRESHOLD);
  }

  // Ends the press and determines if it was a short press
  function endPress(e) {
      e.preventDefault();
      
      // If long or longer press was triggered, do nothing
      if (isLongPressTriggered || isLongerPressTriggered) {
          clearTimers();
          return;
      }
      
      // If neither long nor longer press triggered, it's a short press
      console.log("Short Press Detected!");
      updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, 1);
      clearTimers();
  }

  // Clears all timers
  function clearTimers() {
      clearTimeout(longPressTimer);
      clearTimeout(longerPressTimer);
  }
}

function updateDaysProgress(targetDate, habit, progressIndicatorElement, indicatorType, statusSymbol, increment) {
  let dayProgressEntry = habit.completion.find(entry => entry.date === targetDate);

  if (!dayProgressEntry) {
    dayProgressEntry = { date: targetDate, count: 0 };
  }
  
  const newCount = calculateNewCount(habit, dayProgressEntry.count, increment);
  const valueChanged = newCount !== dayProgressEntry.count;

  if (valueChanged) {
    habit.completion.push(dayProgressEntry);

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
        const progressBarInList = ALTERNATE_PROGRESS_BUTTON ? document.querySelector(`.habit-progress-bar-circular[habit-id="${habit.id}"]`) : document.querySelector(`.habit-progress-bar[habit-id="${habit.id}"]`);
        const checkIconInList = document.querySelector(`.check-icon[habit-id="${habit.id}"]`);
        updateProgressBar(habit, progressBarInList, 'dashboard-habit', checkIconInList, dayProgressEntry.count);
      }
      updateProgressAnalytics();
      updateProgressChartValues();
    }
  }

  // render progress indicator
  updateProgressBar(habit, progressIndicatorElement, indicatorType, statusSymbol, newCount, valueChanged);
}

function calculateNewCount(habit, currentCount, increment) {
  const newCount = Math.max(currentCount + increment, 0);
  return habit.infiniteCounter ? newCount : Math.min(newCount, habit.completionGoal);
}

function updateProgressBar(habit, progressBar, indicatorType, statusSymbol, completionCount, valueChanged = true) {
  const completionRatio = completionCount / habit.completionGoal;

  let completionMarker = '';

  const completionPercentage = Math.min(completionRatio * 100, 100);
  if (indicatorType === 'calendar-day') {
    progressBar.style.height = `${completionPercentage}%`;
  }
  else if (indicatorType === 'dashboard-habit') {
    completionMarker = completionRatio === 1 ? '✔' : '+';

    if (ALTERNATE_PROGRESS_BUTTON) 
      animateProgress(progressBar, completionPercentage, valueChanged ? 0.05 : 10);
    else 
    {
      progressBar.style.width = `${completionPercentage}%`;
    }
  }
  else {
    throw new Error('Invalid indicator type');
  }

  statusSymbol.textContent = habit.infiniteCounter && completionRatio > 1 ? completionCount : completionMarker;
}

function animateProgress(progressRing, targetProgress, easeFactor) {
  let currentProgress = new Number(progressRing.style.getPropertyValue('--progress-angle').slice(0, -3)) / 360 * 100;
  const positiveChange = targetProgress > currentProgress;

  function step() {
    // Calculate the difference between the current and target progress
    const progressDifference = targetProgress - currentProgress;

    // Apply easing by updating current progress based on the difference
    currentProgress += progressDifference * easeFactor;
    currentProgress = positiveChange ? Math.min(currentProgress, targetProgress) : Math.max(currentProgress, targetProgress);

    // Update the CSS custom property for the current angle
    const angle = (currentProgress / 100) * 360;
    progressRing.style.setProperty('--progress-angle', `${angle}deg`);

    // If the difference is small enough, stop the animation
    if (Math.abs(progressDifference) < 0.5) {
      currentProgress = targetProgress;
      progressRing.style.setProperty('--progress-angle', `${(targetProgress / 100) * 360}deg`);
      return; // Stop the animation
    }

    // Request the next animation frame
    requestAnimationFrame(step);
  }

  // Start the animation
  requestAnimationFrame(step);
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
    else addProgressButtonPressEvents(dateString, detailHabit, dayElement, dayElementProgressBar, 'calendar-day', checkIcon);
    updateProgressBar(detailHabit, dayElementProgressBar, 'calendar-day', checkIcon, completion.count);
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
