import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../services/StorageService';

export default function Sidebar({ visible, onClose, onNavigateToNote }) {
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchSubjects = async () => {
    try {
      const notes = await StorageService.getNotes();
      const uniqueSubjects = [...new Set(notes.map(note => note.subjectName))];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.log('Error fetching subjects:', error.message);
    }
  };

  const fetchNotesForSubject = async (subjectName) => {
    try {
      const allNotes = await StorageService.getNotes();
      const subjectNotes = allNotes.filter(note => note.subjectName === subjectName);
      setNotes(subjectNotes);
      setSelectedSubject(subjectName);
    } catch (error) {
      console.log('Error fetching notes:', error.message);
    }
  };

  const handleNotePress = (note) => {
    onNavigateToNote({
      subjectName: note.subjectName,
      noteTitle: note.title,
      isNewNote: false
    });
    onClose();
  };

  const deleteNote = async (noteId, noteTitle) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await StorageService.deleteNote(noteId);
              if (success) {
                setNotes(notes.filter(note => note._id !== noteId));
              }
            } catch (error) {
              console.log('Error deleting note:', error.message);
            }
          }
        }
      ]
    );
  };

  const renderSubject = ({ item }) => (
    <TouchableOpacity 
      style={styles.subjectItem}
      onPress={() => fetchNotesForSubject(item)}
    >
      <Text style={styles.subjectText}>{item}</Text>
      <Ionicons name="chevron-forward" size={16} color="#666" />
    </TouchableOpacity>
  );

  const renderNote = ({ item }) => (
    <View style={styles.noteItem}>
      <TouchableOpacity 
        style={styles.noteContent}
        onPress={() => handleNotePress(item)}
      >
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content || 'No content'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteNote(item._id, item.title)}
      >
        <Ionicons name="trash" size={16} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Notes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {!selectedSubject ? (
            <FlatList
              data={subjects}
              renderItem={renderSubject}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>No subjects found</Text>
              )}
            />
          ) : (
            <View style={styles.noteView}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedSubject(null)}
              >
                <Ionicons name="arrow-back" size={20} color="#333" />
                <Text style={styles.backText}>Back to subjects</Text>
              </TouchableOpacity>
              <Text style={styles.subjectTitle}>{selectedSubject}</Text>
              <FlatList
                data={notes}
                renderItem={renderNote}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>No notes in this subject</Text>
                )}
              />
            </View>
          )}
        </Animated.View>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: 250,
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectText: {
    fontSize: 16,
    color: '#333',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noteContent: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  noteView: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    marginLeft: 5,
    color: '#333',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});