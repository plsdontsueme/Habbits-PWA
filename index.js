import { showHabitTracker, onUnloadHabitTracker } from './habitTracker.js';
import { showSettings, onUnloadSettings } from './settings.js';
import { showWorkoutManager, onUnloadWorkoutManager } from './workoutManager.js';


window.addEventListener("beforeunload", () => {
  onUnloadActiveTab();
});

window.addEventListener("pagehide", () => {
  onUnloadActiveTab();
});

// Use visibilitychange for background/foreground detection
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "hidden") {
    onUnloadActiveTab(); // Save data when tab goes into background
  }
  if (document.visibilityState === "visible") {
    showTab("habit-tracker");  // Load data when tab returns to foreground
  }
});

window.showTab = showTab;

function showTab(tabId) {
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

function onUnloadActiveTab() {
  if (document.getElementById('settings').classList.contains('active')) {
    onUnloadSettings();
  }
  else if (document.getElementById('habit-tracker').classList.contains('active')) {
    onUnloadHabitTracker();
  }
  else if (document.getElementById('workout-manager').classList.contains('active')) {
    onUnloadWorkoutManager();
  }
}

// Initial tab to show
showTab('habit-tracker');
