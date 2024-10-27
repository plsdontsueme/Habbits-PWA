// index.js

import { showDashboard } from './dashboard.js';

// Function to show specific tabs based on the ID
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  // Call the appropriate function based on the tab
  if (tabId === 'dashboard') showDashboard();
  // More tab loading functions can be added as other tabs get content
}

// Tab switcher button event listeners
document.querySelectorAll('.tab-button').forEach((button, index) => {
  button.addEventListener('click', () => showTab(button.getAttribute('onclick').split("'")[1]));
});

// Initial tab to show
showTab('dashboard');
