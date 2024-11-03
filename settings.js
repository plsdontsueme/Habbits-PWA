// settings.js

import { getBoolParameter, getIntParameter, setParameter } from "./storage.js";

let ALTERNATE_PROGRESS_BUTTON
let KEEP_CALENDAR_DAY_ORDER;
let ANALYTICS_TIME_FRAME;

export function showSettings() {
    console.log("showSettings");

    ALTERNATE_PROGRESS_BUTTON = getBoolParameter("ALTERNATE_PROGRESS_BUTTON");
    document.getElementById("alternate-progress-button-toggle").checked = ALTERNATE_PROGRESS_BUTTON;

    KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");
    document.getElementById("calendar-order-toggle").checked = KEEP_CALENDAR_DAY_ORDER;

    ANALYTICS_TIME_FRAME = getIntParameter("ANALYTICS_TIME_FRAME");
    document.getElementById("analytics-time-frame").value = ANALYTICS_TIME_FRAME;
}

export function onUnloadSettings() {
  setParameter("ALTERNATE_PROGRESS_BUTTON", ALTERNATE_PROGRESS_BUTTON);
  setParameter("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER);
  setParameter("ANALYTICS_TIME_FRAME", ANALYTICS_TIME_FRAME);
}

//#region User Interface
document.getElementById("alternate-progress-button-toggle").addEventListener("change", (event) => {
  ALTERNATE_PROGRESS_BUTTON = event.target.checked;
})
document.getElementById("calendar-order-toggle").addEventListener("change", (event) => {
  KEEP_CALENDAR_DAY_ORDER = event.target.checked;
});
document.getElementById("analytics-time-frame").addEventListener("change", (event) => {
  ANALYTICS_TIME_FRAME = event.target.value;
});
//#endregion

  