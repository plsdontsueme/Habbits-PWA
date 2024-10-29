// storage.js

const STORAGE_KEY = "myLargeObjectArray";

// Save an array of objects to localStorage
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

// Get the array of objects from localStorage
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

// Clear the array of objects from localStorage
export function clearArray() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear array from localStorage:", error);
    }
}
