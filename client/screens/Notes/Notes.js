import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../../services/StorageService';

export default function Notes({ route, navigation }) {
  const { subjectName, noteTitle, isNewNote } = route.params || {};
  const [currentNoteTitle, setCurrentNoteTitle] = useState(noteTitle || "");
  const [noteContent, setNoteContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  useEffect(() => {
    if (!isNewNote && subjectName && noteTitle) {
      loadNote();
    }
  }, [isNewNote, subjectName, noteTitle]);

  const loadNote = async () => {
    try {
      const data = await StorageService.getNote(subjectName, noteTitle);
      if (data) {
        setCurrentNoteTitle(data.title || "");
        setNoteContent(data.content || "");
        setOriginalTitle(data.title || "");
        setOriginalContent(data.content || "");
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const saveNote = async () => {
    if (!subjectName) {
      Alert.alert("Error", "Subject name is required");
      return;
    }
    
    try {
      const noteData = {
        subjectName,
        title: currentNoteTitle.trim() || "Untitled",
        content: noteContent,
      };
      
      await StorageService.saveNote(noteData);
      setOriginalTitle(currentNoteTitle);
      setOriginalContent(noteContent);
      Alert.alert("Success", "Note saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", `Failed to save note: ${error.message}`);
    }
  };

  const handleBack = () => {
    if (currentNoteTitle !== originalTitle || noteContent !== originalContent) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          { text: "Don't Save", onPress: () => navigation.goBack() },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: () => { saveNote(); navigation.goBack(); } },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.titleInput}
        placeholder="Note title..."
        placeholderTextColor="#999"
        value={currentNoteTitle}
        onChangeText={setCurrentNoteTitle}
      />
      
      <TextInput
        style={styles.noteInput}
        multiline
        placeholder="Start typing your notes here..."
        placeholderTextColor="#999"
        value={noteContent}
        onChangeText={setNoteContent}
        textAlignVertical="top"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  titleInput: {
    padding: 20,
    paddingBottom: 10,
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    color: "#333",
  },
  noteInput: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});