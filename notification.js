// notification.js

// Request notification permission from the user
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted.");
  } else {
    console.log("Notification permission denied.");
  }
}

// Schedule a daily notification
export function scheduleDailyNotification(habit) {
  if (!habit.reminder) return;

  const reminderTime = habit.reminder.split(':');
  const reminderHour = parseInt(reminderTime[0], 10);
  const reminderMinute = parseInt(reminderTime[1], 10);

  const now = new Date();
  const notificationTime = new Date();

  notificationTime.setHours(reminderHour);
  notificationTime.setMinutes(reminderMinute);
  notificationTime.setSeconds(0);

  // If the time has already passed today, schedule for the next day
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }

  const timeUntilNotification = notificationTime - now;

  setTimeout(() => {
    new Notification("Daily Reminder", {
      body: `${habit.icon} Remember to complete ${habit.name}!`,
    });

    // Recursively schedule the next notification for the same time tomorrow
    setTimeout(() => scheduleDailyNotification(habit), 24 * 60 * 60 * 1000);
  }, timeUntilNotification);
}

// Cancel a scheduled notification (note: only works within the session for web PWAs)
export function cancelNotification(habit) {
  // For PWAs, there's limited control over canceling individual notifications.
  // This placeholder demonstrates where you'd integrate cancel logic if possible.

  // Example of clearing all notifications in this session
  if ("Notification" in window) {
    Notification.close(); // Doesn't fully cancel scheduled notifications but closes any open ones.
    console.log("All notifications have been cleared.");
  }
}
