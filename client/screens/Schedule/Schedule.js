import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarPicker from '../components/CalendarPicker';
import TimePicker from '../components/TimePicker';
import NotificationService from '../../services/NotificationService';

// switch url depending on environment
const API_URL = "http://192.168.1.100:3001/api";

// const API_URL = "http://localhost:3001/api";

export default function Schedule({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [originalClasses, setOriginalClasses] = useState([]);
  const [showCellModal, setShowCellModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [classes, setClasses] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderData, setReminderData] = useState({
    title: "",
    deadlineDate: null,
    deadlineTime: "",
    reminderDays: [],
    reminderTime: "",
    notificationIds: [],
    subjectName: ""
  });
  const [reminderError, setReminderError] = useState("");
  const [formData, setFormData] = useState({
    subjectName: "",
    instructor: "",
    isLecture: false,
    isLab: false,
    roomNumber: "",
    startTime: "",
    endTime: "",
    day: "",
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule`, {
        timeout: 10000,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClasses(data);
      setOriginalClasses(data);
    } catch (error) {
      console.error("Error loading schedule:", error);
      setErrorMessage("Failed to connect to server. Check your network connection.");
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const reminderDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeSlots = [
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
  ];

  const handleAddClass = async () => {
    console.log("Save button clicked");
    // Validation
    if (
      !formData.subjectName ||
      !formData.instructor ||
      !formData.roomNumber ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.day
    ) {
      console.log("Missing fields error");
      setErrorMessage("Please fill all fields");
      return;
    }

    if (!formData.isLecture && !formData.isLab) {
      console.log("Class type error");
      setErrorMessage("Please select class type (LEC or LAB)");
      return;
    }

    // Check for existing class of same type (exclude current class if editing)
    const existingClass = classes.find(
      (cls) =>
        cls.subjectName &&
        cls.subjectName.toUpperCase() === formData.subjectName.toUpperCase() &&
        ((formData.isLecture && cls.isLecture) ||
          (formData.isLab && cls.isLab)) &&
        (!editingClass || cls._id !== editingClass._id)
    );

    if (existingClass) {
      console.log("Duplicate class error");
      setErrorMessage(
        `${
          formData.isLecture ? "Lecture" : "Laboratory"
        } class for ${formData.subjectName.toUpperCase()} already exists`
      );
      return;
    }

    // Check time conflict (skip current class if editing)
    const startIndex = timeSlots.indexOf(formData.startTime);
    const endIndex = timeSlots.indexOf(formData.endTime);

    if (startIndex >= endIndex) {
      setErrorMessage("End time must be after start time");
      return;
    }

    for (let i = startIndex; i < endIndex; i++) {
      const conflict = classes.find(
        (cls) =>
          cls.day === formData.day &&
          cls.timeSlots.includes(timeSlots[i]) &&
          (!editingClass || cls._id !== editingClass._id)
      );
      if (conflict) {
        setErrorMessage(
          `Time conflict with ${conflict.subjectName} at ${timeSlots[i]}`
        );
        return;
      }
    }

    const classData = {
      ...formData,
      subjectName: formData.subjectName.toUpperCase(),
      instructor: formData.instructor.toUpperCase(),
      timeSlots: timeSlots.slice(startIndex, endIndex),
      roomPrefix: formData.isLecture ? "ITC" : "CCL",
    };

    try {
      const url = editingClass ? `${API_URL}/schedule/${editingClass._id}` : `${API_URL}/schedule`;
      const method = editingClass ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
        timeout: 10000,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const savedClass = await response.json();
      
      if (editingClass) {
        setClasses(classes.map((cls) => cls._id === editingClass._id ? savedClass : cls));
      } else {
        setClasses([...classes, savedClass]);
      }

      setFormData({
        subjectName: "",
        instructor: "",
        isLecture: false,
        isLab: false,
        roomNumber: "",
        startTime: "",
        endTime: "",
        day: "",
      });
      setEditingClass(null);
      setShowAddModal(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Error saving class:", error);
      setErrorMessage(error.message || "Failed to connect to server. Check your network connection.");
    }
  };

  const scheduleReminder = async () => {
    if (!reminderData.title || !reminderData.deadlineDate || !reminderData.deadlineTime) {
      setReminderError("Please fill all required fields");
      return;
    }

    if (reminderData.reminderDays.length === 0) {
      setReminderError("Please select at least one reminder day");
      return;
    }

    const notificationIds = [];
    
    for (const day of reminderData.reminderDays) {
      const [hours, minutes] = reminderData.reminderTime.split(':');
      const triggerDate = new Date();
      
      // Find next occurrence of the selected day
      const dayIndex = reminderDays.indexOf(day);
      const today = new Date().getDay();
      let daysUntil = dayIndex - today;
      
      // If the day is today but the time has passed, or if it's in the past, schedule for next week
      if (daysUntil < 0 || (daysUntil === 0 && new Date().getHours() * 60 + new Date().getMinutes() >= parseInt(hours) * 60 + parseInt(minutes))) {
        daysUntil += 7;
      }
      
      triggerDate.setDate(triggerDate.getDate() + daysUntil);
      triggerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log(`Scheduling notification for ${day} at ${reminderData.reminderTime}, trigger date: ${triggerDate}`);
      
      const notificationId = await NotificationService.scheduleReminderNotification(
        reminderData.title,
        `Reminder: ${reminderData.title} - Due ${reminderData.deadlineDate.toDateString()} at ${reminderData.deadlineTime}`,
        triggerDate
      );
      
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }
    
    // Save reminder to database
    try {
      // Test immediate notification
      const testNotificationId = await NotificationService.scheduleReminderNotification(
        "Test Notification",
        "This is a test to see if notifications work",
        new Date(Date.now() + 5000) // 5 seconds from now
      );
      
      const reminderPayload = {
        title: reminderData.title,
        deadlineDate: reminderData.deadlineDate.toISOString(),
        deadlineTime: reminderData.deadlineTime,
        reminderDays: reminderData.reminderDays,
        reminderTime: reminderData.reminderTime,
        notificationIds: notificationIds,
        subject: reminderData.subjectName
      };

      const response = await fetch(`${API_URL}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save reminder: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      setReminderError("Failed to save reminder to database");
      return;
    }
    
    setReminderData({
      title: "",
      deadlineDate: null,
      deadlineTime: "",
      reminderDays: [],
      reminderTime: "",
      notificationIds: [],
      subjectName: ""
    });
    setShowReminderModal(false);
    setReminderError("");
    
    alert(`Reminder scheduled! You'll receive ${notificationIds.length} notifications.`);
  };

  const handleDonePress = () => {
    // If no classes added, exit directly without confirmation
    if (classes.length === 0) {
      setIsEditing(false);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleCellPress = (classData) => {
    if (classData) {
      setSelectedClass(classData);
      setShowCellModal(true);
    }
  };

  const handleDeleteClass = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/${selectedClass._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setClasses(classes.filter((cls) => cls._id !== selectedClass._id));
        setShowCellModal(false);
        setSelectedClass(null);
      }
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  const getClassForCell = (day, time) => {
    return classes.find(
      (cls) => cls.day === day && cls.timeSlots.includes(time)
    );
  };

  const shouldShowClassDetails = (day, time) => {
    const classData = getClassForCell(day, time);
    if (!classData) return false;
    // Show details only at the middle slot of the class
    const middleIndex = Math.floor(classData.timeSlots.length / 2);
    return classData.timeSlots[middleIndex] === time;
  };

  const isFirstSlot = (day, time) => {
    const classData = getClassForCell(day, time);
    return classData && classData.timeSlots[0] === time;
  };

  const isLastSlot = (day, time) => {
    const classData = getClassForCell(day, time);
    return (
      classData && classData.timeSlots[classData.timeSlots.length - 1] === time
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isEditing ? (
        <View style={styles.editModeButtons}>
          <TouchableOpacity
            style={styles.editModeCancelButton}
            onPress={() => setShowDiscardModal(true)}
          >
            <Text style={styles.editModeCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editModeDoneButton}
            onPress={handleDonePress}
          >
            <Text style={styles.editButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setOriginalClasses([...classes]);
            setIsEditing(true);
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setErrorMessage("");
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      )}
      <View style={styles.daysHeader}>
        <View style={styles.timeColumn}></View>
        {days.map((day, index) => (
          <Text key={index} style={styles.dayText}>
            {day}
          </Text>
        ))}
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {timeSlots.map((time, index) => (
          <View key={index} style={styles.timeRow}>
            <Text style={styles.timeText}>{time}</Text>
            {days.map((day, dayIndex) => {
              const classData = getClassForCell(day, time);
              const showDetails = shouldShowClassDetails(day, time);
              const isFirst = isFirstSlot(day, time);
              const isLast = isLastSlot(day, time);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.timeCell,
                    classData && styles.occupiedCell,
                    isFirst && styles.firstSlot,
                    isLast && styles.lastSlot,
                  ]}
                  onPress={() => handleCellPress(classData)}
                  disabled={!classData}
                >
                  {showDetails ? (
                    <View style={styles.classInfo}>
                      <Text style={styles.subjectText}>
                        {classData.subjectName}
                      </Text>
                      <Text style={styles.instructorText}>
                        {classData.instructor}
                      </Text>
                      <Text style={styles.roomText}>
                        {classData.roomPrefix} {classData.roomNumber}
                      </Text>
                    </View>
                  ) : classData ? null : (
                    <Text style={styles.taskPlaceholder}>-</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Class</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  onPress={() => setErrorMessage("")}
                  style={styles.errorClose}
                >
                  <Text style={styles.errorCloseText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Subject Name"
              value={formData.subjectName}
              onChangeText={(text) =>
                setFormData({ ...formData, subjectName: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Instructor Display Name"
              value={formData.instructor}
              onChangeText={(text) =>
                setFormData({ ...formData, instructor: text })
              }
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  formData.isLecture && styles.checkboxSelected,
                ]}
                onPress={() =>
                  setFormData({
                    ...formData,
                    isLecture: !formData.isLecture,
                    isLab: false,
                  })
                }
              >
                <Text style={styles.checkboxText}>LEC</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  formData.isLab && styles.checkboxSelected,
                ]}
                onPress={() =>
                  setFormData({
                    ...formData,
                    isLab: !formData.isLab,
                    isLecture: false,
                  })
                }
              >
                <Text style={styles.checkboxText}>LAB</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Room Number"
              value={formData.roomNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, roomNumber: text })
              }
            />

            <View style={styles.dropdownContainer}>
              <Text>Day:</Text>
              <ScrollView horizontal style={styles.daySelector}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      formData.day === day && styles.daySelected,
                    ]}
                    onPress={() => setFormData({ ...formData, day })}
                  >
                    <Text>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timeContainer}>
              <View style={styles.timeSelector}>
                <Text>Start Time:</Text>
                <ScrollView style={styles.timeDropdown}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        formData.startTime === time && styles.timeSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, startTime: time })
                      }
                    >
                      <Text>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSelector}>
                <Text>End Time:</Text>
                <ScrollView style={styles.timeDropdown}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        formData.endTime === time && styles.timeSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, endTime: time })
                      }
                    >
                      <Text>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddClass}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCellModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>
              {selectedClass?.subjectName}
            </Text>
            {isEditing ? (
              <View style={styles.verticalButtons}>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    { backgroundColor: "#007AFF" },
                  ]}
                  onPress={() => {
                    setEditingClass(selectedClass);
                    setFormData({
                      subjectName: selectedClass.subjectName,
                      instructor: selectedClass.instructor,
                      isLecture: selectedClass.isLecture,
                      isLab: selectedClass.isLab,
                      roomNumber: selectedClass.roomNumber,
                      startTime: selectedClass.timeSlots[0],
                      endTime:
                        timeSlots[
                          timeSlots.indexOf(
                            selectedClass.timeSlots[
                              selectedClass.timeSlots.length - 1
                            ]
                          ) + 1
                        ],
                      day: selectedClass.day,
                    });
                    setShowCellModal(false);
                    setShowAddModal(true);
                  }}
                >
                  <Text style={styles.confirmSaveText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    { backgroundColor: "#dc3545" },
                  ]}
                  onPress={handleDeleteClass}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    {
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#ddd",
                    },
                  ]}
                  onPress={() => setShowCellModal(false)}
                >
                  <Text style={{ color: "#333", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.verticalButtons}>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    { backgroundColor: "#007AFF" },
                  ]}
                  onPress={() => {
                    console.log(
                      "Add Notes clicked with subject:",
                      selectedClass.subjectName
                    );
                    navigation.navigate({
                      subjectName: selectedClass.subjectName,
                      isNewNote: true,
                    });
                    setShowCellModal(false);
                  }}
                >
                  <Text style={styles.confirmSaveText}>Add Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    { backgroundColor: "#28a745" },
                  ]}
                  onPress={() => {
                    setShowCellModal(false);
                    setReminderData(prev => ({...prev, subjectName: selectedClass.subjectName}));
                    setShowReminderModal(true);
                  }}
                >
                  <Text style={styles.confirmSaveText}>Add Reminder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verticalButton,
                    {
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#ddd",
                    },
                  ]}
                  onPress={() => setShowCellModal(false)}
                >
                  <Text style={{ color: "#333", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Save changes?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSave}
                onPress={() => {
                  setShowConfirmModal(false);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.confirmSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDiscardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Discard changes?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSave}
                onPress={() => {
                  setClasses(originalClasses);
                  setShowDiscardModal(false);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.confirmSaveText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReminderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            
            {reminderError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{reminderError}</Text>
                <TouchableOpacity
                  onPress={() => setReminderError("")}
                  style={styles.errorClose}
                >
                  <Text style={styles.errorCloseText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            
            <ScrollView style={styles.modalScrollView}>
              <TextInput
                style={styles.input}
                placeholder="Reminder Title"
                value={reminderData.title}
                onChangeText={(text) => setReminderData({...reminderData, title: text})}
              />
              
              <Text style={styles.sectionLabel}>Task Deadline:</Text>
              <View style={styles.reminderTimeContainer}>
                <CalendarPicker
                  selectedDate={reminderData.deadlineDate}
                  onDateSelect={(date) => setReminderData({...reminderData, deadlineDate: date})}
                />
                <View style={styles.reminderTimeSelector}>
                  <Text>Time:</Text>
                  <Text style={styles.selectedTimeDisplay}>
                    {reminderData.deadlineTime || "Not selected"}
                  </Text>
                  <TimePicker
                    selectedTime={reminderData.deadlineTime}
                    onTimeSelect={(time) => setReminderData({...reminderData, deadlineTime: time})}
                  />
                </View>
              </View>
              
              <Text style={styles.sectionLabel}>Remind me at:</Text>
              <View style={styles.reminderTimeContainer}>
                <View style={styles.reminderTimeSelector}>
                  <Text>Days:</Text>
                  <ScrollView horizontal style={styles.daySelector}>
                    {reminderDays.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayOption,
                          reminderData.reminderDays.includes(day) && styles.daySelected,
                        ]}
                        onPress={() => {
                          const updatedDays = reminderData.reminderDays.includes(day)
                            ? reminderData.reminderDays.filter(d => d !== day)
                            : [...reminderData.reminderDays, day];
                          setReminderData({...reminderData, reminderDays: updatedDays});
                        }}
                      >
                        <Text>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.reminderTimeSelector}>
                  <Text>Time:</Text>
                  <Text style={styles.selectedTimeDisplay}>
                    {reminderData.reminderTime || "Not selected"}
                  </Text>
                  <TimePicker
                    selectedTime={reminderData.reminderTime}
                    onTimeSelect={(time) => setReminderData({...reminderData, reminderTime: time})}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowReminderModal(false);
                  setReminderData({title: "", deadlineDate: null, deadlineTime: "", reminderDays: [], reminderTime: "", notificationIds: [], subjectName: ""});
                  setReminderError("");
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={scheduleReminder}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  editButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 1,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  daysHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  timeColumn: {
    width: 60,
  },
  dayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  scheduleContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 50,
  },
  timeText: {
    width: 60,
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    paddingVertical: 15,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  timeCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#eee",
    paddingVertical: 15,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  occupiedCell: {
    backgroundColor: "#f0f8ff",
  },
  firstSlot: {
    borderTopWidth: 2,
    borderTopColor: "#007AFF",
  },
  lastSlot: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 1,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  classInfo: {
    alignItems: "center",
  },
  subjectText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  instructorText: {
    fontSize: 9,
    color: "#666",
  },
  roomText: {
    fontSize: 9,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  checkbox: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
  },
  checkboxText: {
    color: "#333",
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  daySelector: {
    flexDirection: "row",
    marginTop: 5,
  },
  dayOption: {
    padding: 8,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  daySelected: {
    backgroundColor: "#007AFF",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  timeSelector: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeDropdown: {
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginTop: 5,
  },
  timeOption: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  timeSelected: {
    backgroundColor: "#007AFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  saveButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  taskPlaceholder: {
    fontSize: 12,
    color: "#ccc",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#c62828",
    flex: 1,
  },
  errorClose: {
    padding: 5,
  },
  errorCloseText: {
    color: "#c62828",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmModal: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    width: "60%",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmCancel: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmSave: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  confirmSaveText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 10,
    backgroundColor: "#dc3545",
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  editModeButtons: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    zIndex: 1,
  },
  editModeCancelButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editModeDoneButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editModeCancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  verticalButtons: {
    flexDirection: "column",
  },
  verticalButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  reminderTimeContainer: {
    marginBottom: 15,
  },
  reminderTimeSelector: {
    marginBottom: 10,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  selectedTimeDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
    marginVertical: 5,
  },
});
