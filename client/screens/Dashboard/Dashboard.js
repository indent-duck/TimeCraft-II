import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../../ThemeContext';
import Sidebar from '../../components/Sidebar';

//const API_URL = 'http://localhost:3001/api';
const API_URL = 'http://192.168.1.101:3001/api';

export default function Dashboard() {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.log('Error fetching tasks:', error.message);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/tasks`, {
        title: newTask,
        completed: false
      });
      setTasks([...tasks, response.data]);
      setNewTask('');
    } catch (error) {
      console.log('Error adding task:', error.message);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      const response = await axios.put(`${API_URL}/tasks/${id}`, { completed: !completed });
      setTasks(tasks.map(task => task._id === id ? response.data : task));
    } catch (error) {
      console.log('Error updating task:', error.message);
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity 
      style={[styles.task, item.completed && styles.completedTask]}
      onPress={() => toggleTask(item._id, item.completed)}
    >
      <Text style={[styles.taskText, item.completed && styles.completedText]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    addButton: {
      backgroundColor: theme.primary,
      padding: 10,
      borderRadius: 5,
      justifyContent: 'center',
    },
    menuButton: {
      backgroundColor: theme.primary,
      padding: 8,
      borderRadius: 5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={dynamicStyles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>TimeCraft Tasks</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add new task..."
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={dynamicStyles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item._id}
        style={styles.taskList}
      />

      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskList: {
    flex: 1,
  },
  task: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 5,
  },
  completedTask: {
    backgroundColor: '#e8f5e8',
  },
  taskText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
});