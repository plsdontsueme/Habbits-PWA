import { showHabitTracker, onUnloadHabitTracker } from './habitTracker.js';
import { showSettings, onUnloadSettings } from './settings.js';
import { showWorkoutManager } from './workoutManager.js';

// Attach to the global scope
window.showTab = showTab;

// Function to show specific tabs based on the ID
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  const habitTrackerLoaded = document.getElementById('habit-tracker').classList.contains('active');
  const settingsLoaded = document.getElementById('settings').classList.contains('active');
  tabs.forEach(tab => tab.classList.remove('active'));
  const selectedTab = document.getElementById(tabId);

  // Check if the tab exists before proceeding
  if (selectedTab) {
    selectedTab.classList.add('active');

    // Call the appropriate function based on the tab
    if (tabId === 'habit-tracker') {
      if (settingsLoaded) onUnloadSettings();
      showHabitTracker();
    } else if (tabId === 'workout-manager') {
      if (habitTrackerLoaded) onUnloadHabitTracker();
      else if (settingsLoaded) onUnloadSettings();
      showWorkoutManager();
    } else if (tabId === 'settings') {
      if (habitTrackerLoaded) onUnloadHabitTracker();
      showSettings();
    } else {
      console.warn(`No handler found for tab: ${tabId}`);
    }
  } else {
    console.error(`Tab with ID '${tabId}' does not exist.`);
  }
}

// Initial tab to show
showTab('habit-tracker');

window.addEventListener("beforeunload", async () => {
  if (document.getElementById('settings').classList.contains('active'))
    await onUnloadSettings();
  else if (document.getElementById('habit-tracker').classList.contains('active'))
    await onUnloadHabitTracker();
});
