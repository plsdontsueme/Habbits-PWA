// storage.js

const DB_NAME = 'HabitTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'habits';

export default class StorageHandler {
  constructor() {
    this.dbPromise = this.initDB();
  }

  // Initialize the IndexedDB database
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Handle upgrades
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      // Resolve on success
      request.onsuccess = (event) => resolve(event.target.result);

      // Reject on error
      request.onerror = (event) => reject(`Error opening database: ${event.target.errorCode}`);
    });
  }

  // Add a new habit
  async addHabit(habit) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(habit);

      request.onsuccess = () => resolve(request.result); // habit ID
      request.onerror = (event) => reject(`Error adding habit: ${event.target.errorCode}`);
    });
  }

  // Get all habits
  async getAllHabits() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(`Error fetching habits: ${event.target.errorCode}`);
    });
  }

  // Get a habit by ID
  async getHabitById(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(`Error fetching habit: ${event.target.errorCode}`);
    });
  }

  // Update a habit
  async updateHabit(habit) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(habit);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(`Error updating habit: ${event.target.errorCode}`);
    });
  }

  // Delete a habit by ID
  async deleteHabit(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(`Habit ${id} deleted`);
      request.onerror = (event) => reject(`Error deleting habit: ${event.target.errorCode}`);
    });
  }
}