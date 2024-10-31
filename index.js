import { showHabitTracker, onUnloadHabitTracker } from './habitTracker.js';
import { showSettings, onUnloadSettings } from './settings.js';
import { showWorkoutManager, onUnloadWorkoutManager } from './workoutManager.js';


window.addEventListener("beforeunload", async () => {
  await onUnloadActiveTab();
});

window.showTab = showTab;

async function showTab(tabId) {
  onUnloadActiveTab();

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  if (tabId === 'habit-tracker') {
    showHabitTracker();
  } 
  else if (tabId === 'workout-manager') {
    showWorkoutManager();
  } 
  else if (tabId === 'settings') {
    showSettings();
  } 
  else {
    console.warn(`No handler found for tab: ${tabId}`);
  }
}

async function onUnloadActiveTab() {
  if (document.getElementById('settings').classList.contains('active')) {
    await onUnloadSettings();
  }
  else if (document.getElementById('habit-tracker').classList.contains('active')) {
    await onUnloadHabitTracker();
  }
  else if (document.getElementById('workout-manager').classList.contains('active')) {
    await onUnloadWorkoutManager();
  }
}

// Initial tab to show
showTab('habit-tracker');
