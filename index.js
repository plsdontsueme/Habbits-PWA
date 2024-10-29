import { showHabitTracker } from './habitTracker.js';
import { showSettings } from './settings.js';
import { showWorkoutManager } from './workoutManager.js';

// Attach to the global scope
window.showTab = showTab;

// Function to show specific tabs based on the ID
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  const selectedTab = document.getElementById(tabId);

  // Check if the tab exists before proceeding
  if (selectedTab) {
    selectedTab.classList.add('active');

    // Call the appropriate function based on the tab
    if (tabId === 'habit-tracker') {
      showHabitTracker();
    } else if (tabId === 'workout-manager') {
      showWorkoutManager();
    } else if (tabId === 'settings') {
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
