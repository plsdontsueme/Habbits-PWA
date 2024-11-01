// Request Notification Permission
export function requestNotificationPermission() {
  if (Notification && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      } else {
        console.log('Notification permission denied.');
      }
    });
  }
}

// Schedule a Daily Notification
export function scheduleDailyNotification(habit) {
  if (!habit.reminder) return;

  // Check if notifications are allowed
  if (Notification.permission !== 'granted') {
    console.log('Notification permission is not granted.');
    return;
  }

  const reminderTime = new Date();
  const [hours, minutes] = habit.reminder.split(':').map(Number);
  reminderTime.setHours(hours, minutes, 0, 0);

  // If the time is in the past, set for the next day
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delay = reminderTime.getTime() - Date.now();

  // Schedule the notification using setTimeout
  setTimeout(() => {
    new Notification('Habit Reminder', {
      body: `${habit.icon} Don't forget to complete your habits ${habit.name}`,
      icon: '/images/notification-icon.png',
    });

    // Reschedule for the next day
    scheduleDailyNotification(habit);
  }, delay);
}

// Cancel Notification (for single notification setup)
export function cancelNotification(habit) {
  // In browsers, there is no direct way to cancel setTimeout.
  // This would need a more complex setup if notifications are scheduled individually.
  // For a more complex setup, we could use indexedDB to track and cancel schedules
  // based on identifiers if multiple notifications need to be handled.
}
