// settings.js

export function showSettings() {
    console.log("showSettings");

    const savedSetting = localStorage.getItem("KEEP_CALENDAR_DAY_ORDER");
    if (savedSetting !== null) {
      KEEP_CALENDAR_DAY_ORDER = savedSetting === "true";
      document.getElementById("calendar-order-toggle").checked = KEEP_CALENDAR_DAY_ORDER;
    }
}

export function onUnloadSettings() {
  localStorage.setItem("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER.toString());
}


// Variable to store the setting
let KEEP_CALENDAR_DAY_ORDER = true;

// Event listener for the toggle switch
document.getElementById("calendar-order-toggle").addEventListener("change", (event) => {
  KEEP_CALENDAR_DAY_ORDER = event.target.checked;
});

  