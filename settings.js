// settings.js

import { getBoolParameter, setParameter } from "./storage.js";

let KEEP_CALENDAR_DAY_ORDER;

export function showSettings() {
    console.log("showSettings");

    KEEP_CALENDAR_DAY_ORDER = getBoolParameter("KEEP_CALENDAR_DAY_ORDER");
    document.getElementById("calendar-order-toggle").checked = KEEP_CALENDAR_DAY_ORDER;
}

export function onUnloadSettings() {
  setParameter("KEEP_CALENDAR_DAY_ORDER", KEEP_CALENDAR_DAY_ORDER.toString());
}

//#region User Interface
document.getElementById("calendar-order-toggle").addEventListener("change", (event) => {
  KEEP_CALENDAR_DAY_ORDER = event.target.checked;
});
//#endregion

  