import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SCHEDULE: 'schedule',
  REMINDERS: 'reminders',
  NOTES: 'notes',
};

class StorageService {
  // Schedule methods
  async getSchedule() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCHEDULE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting schedule:', error);
      return [];
    }
  }

  async saveSchedule(schedule) {
    try {
      await AsyncStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
      return true;
    } catch (error) {
      console.error('Error saving schedule:', error);
      return false;
    }
  }

  async addScheduleItem(item) {
    try {
      const schedule = await this.getSchedule();
      const newItem = { ...item, _id: Date.now().toString() };
      schedule.push(newItem);
      await this.saveSchedule(schedule);
      return newItem;
    } catch (error) {
      console.error('Error adding schedule item:', error);
      throw error;
    }
  }

  async updateScheduleItem(id, updatedItem) {
    try {
      const schedule = await this.getSchedule();
      const index = schedule.findIndex(item => item._id === id);
      if (index !== -1) {
        schedule[index] = { ...updatedItem, _id: id };
        await this.saveSchedule(schedule);
        return schedule[index];
      }
      throw new Error('Item not found');
    } catch (error) {
      console.error('Error updating schedule item:', error);
      throw error;
    }
  }

  async deleteScheduleItem(id) {
    try {
      const schedule = await this.getSchedule();
      const filtered = schedule.filter(item => item._id !== id);
      await this.saveSchedule(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      return false;
    }
  }

  // Reminders methods
  async getReminders() {
    try {
      const data = await AsyncStorage.getItem(KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async addReminder(reminder) {
    try {
      const reminders = await this.getReminders();
      const newReminder = { ...reminder, _id: Date.now().toString() };
      reminders.push(newReminder);
      await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
      return newReminder;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id) {
    try {
      const reminders = await this.getReminders();
      const filtered = reminders.filter(item => item._id !== id);
      await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  }

  // Notes methods
  async getNotes() {
    try {
      const data = await AsyncStorage.getItem(KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  async getNote(subjectName, title) {
    try {
      const notes = await this.getNotes();
      return notes.find(note => note.subjectName === subjectName && note.title === title);
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }

  async saveNote(note) {
    try {
      const notes = await this.getNotes();
      const existingIndex = notes.findIndex(n => n.subjectName === note.subjectName && n.title === note.title);
      
      if (existingIndex !== -1) {
        notes[existingIndex] = { ...note, _id: notes[existingIndex]._id };
      } else {
        notes.push({ ...note, _id: Date.now().toString() });
      }
      
      await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
      return note;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  async deleteNote(noteId) {
    try {
      const notes = await this.getNotes();
      const filtered = notes.filter(note => note._id !== noteId);
      await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }
}

export default new StorageService();