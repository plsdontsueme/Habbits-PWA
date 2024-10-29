// notification.js

// Initialize Notification Permissions
requestNotificationPermission();
async function requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }
  
  // Schedule a Daily Notification
  export function scheduleDailyNotification(habit) {
    if (!habit.reminder) return;
  
    const reminderTime = new Date(habit.reminder); // Assuming habit.reminder is in 'HH:MM' format
    const now = new Date();
    const firstTrigger = new Date(now);
  
    firstTrigger.setHours(reminderTime.getHours());
    firstTrigger.setMinutes(reminderTime.getMinutes());
    firstTrigger.setSeconds(0);
  
    // If the first trigger is before the current time, schedule it for the next day
    if (firstTrigger <= now) {
      firstTrigger.setDate(firstTrigger.getDate() + 1);
    }
  
    if (Notification.permission === 'granted') {
      createNotification(habit.name, firstTrigger);
    } else {
      requestNotificationPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(habit.name, firstTrigger);
        }
      });
    }
  }
  
  // Create Notification
  function createNotification(title, triggerTime) {
    // Set a daily interval (adjusts for iOS limitations using a repeating check via setTimeout)
    const now = new Date();
    const timeUntilTrigger = triggerTime - now;
  
    setTimeout(() => {
      const notification = new Notification(title, {
        body: "Don't forget to complete your habit today!",
        tag: title, // Tag for easy reference
        renotify: true,
      });
      notification.addEventListener('click', () => {
        // Redirect to the app or specific habit if possible
        window.focus();
      });
  
      // Reschedule the next notification for 24 hours later
      createNotification(title, new Date(triggerTime.getTime() + 24 * 60 * 60 * 1000));
    }, timeUntilTrigger);
  }
  
  // Cancel Notification for Completed/Deleted Habit
  export function cancelNotification(habit) {
    // Unfortunately, Notification API does not support canceling by tag, so we handle with tag uniqueness
    // In a full application, indexedDB or Service Worker Notifications could manage this better
    console.log(`Notification for "${habit}" would be canceled if supported by API.`);
  }
  
  