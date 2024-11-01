// settings.js

import { getBoolParameter, getIntParameter, setParameter } from "./storage.js";

let KEEP_CALENDAR_DAY_ORDER;
let ANALYTICS_TIME_FRAME;

export function showSettings() {
    console.log("showSettings");

    KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");
    document.getElementById("calendar-order-toggle").checked = KEEP_CALENDAR_DAY_ORDER;

    ANALYTICS_TIME_FRAME = getIntParameter("ANALYTICS_TIME_FRAME");
    document.getElementById("analytics-time-frame").value = ANALYTICS_TIME_FRAME;
}

export function onUnloadSettings() {
  setParameter("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER);
  setParameter("ANALYTICS_TIME_FRAME", ANALYTICS_TIME_FRAME);
}

//#region User Interface
document.getElementById("calendar-order-toggle").addEventListener("change", (event) => {
  KEEP_CALENDAR_DAY_ORDER = event.target.checked;
});
document.getElementById("analytics-time-frame").addEventListener("change", (event) => {
  ANALYTICS_TIME_FRAME = event.target.value;
});
//#endregion

  