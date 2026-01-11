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

const API_URL = "http://192.168.1.14:3001/api";

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
      const response = await fetch(`${API_URL}/notes/${encodeURIComponent(subjectName)}/${encodeURIComponent(noteTitle)}`);
      if (response.ok) {
        const data = await response.json();
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
      console.log('Saving note:', { subjectName, title: currentNoteTitle.trim() || "Untitled", content: noteContent });
      
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectName,
          title: currentNoteTitle.trim() || "Untitled",
          content: noteContent,
        }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const savedNote = await response.json();
        console.log('Note saved:', savedNote);
        setOriginalTitle(currentNoteTitle);
        setOriginalContent(noteContent);
        Alert.alert("Success", "Note saved successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorText = await response.text();
        console.error('Save failed:', response.status, errorText);
        Alert.alert("Error", `Failed to save note: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", `Network error: ${error.message}`);
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
        value={currentNoteTitle}
        onChangeText={setCurrentNoteTitle}
      />
      
      <TextInput
        style={styles.noteInput}
        multiline
        placeholder="Start typing your notes here..."
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
  },
  noteInput: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },
});