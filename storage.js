// storage.js

//#region Parameter Storage
export function getBoolParameter(name) {
    const savedSetting = localStorage.getItem(name);
    if (savedSetting !== null) {
        return savedSetting === "true";
    }
    else return null;
}
export function getIntParameter(name) {
    const savedSetting = localStorage.getItem(name);
    if (savedSetting !== null) {
        return parseInt(savedSetting);
    }
    else return null;
}
export function setParameter(name, value) {
    localStorage.setItem(name, value.toString());
}
//#endregion

//#region Array Storage
const STORAGE_KEY = "myLargeObjectArray";

export function saveArray(array) {
  console.log("saveArray...");
    if (!Array.isArray(array)) {
        console.error("The provided data is not an array.");
        return;
    }
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
        console.error("Failed to save array to localStorage:", error);
    }
}

export function getArray() {
  console.log("getArray...");
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to retrieve array from localStorage:", error);
        return [];
    }
}

export function clearArray() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear array from localStorage:", error);
    }
}
//#endregion
