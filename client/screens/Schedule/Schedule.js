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
import StorageService from '../../services/StorageService';

export default function Schedule({ navigation }) {
  const colorPalette = [
    '#FF4444', '#00AA00', '#0066FF', '#FF8800', '#8800FF',
    '#FF0088', '#00FFAA', '#FFAA00', '#AA0088', '#0088FF'
  ];
  
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
  const [subjectColors, setSubjectColors] = useState({});
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
      const data = await StorageService.getSchedule();
      
      // Build subject colors map first
      const newSubjectColors = {...subjectColors};
      const usedColors = new Set(Object.values(newSubjectColors));
      let colorIndex = 0;
      
      // Assign colors to existing classes that don't have them
      const updatedClasses = data.map(cls => {
        if (!cls.color) {
          const subjectKey = cls.subjectName;
          let subjectColor = newSubjectColors[subjectKey];
          
          if (!subjectColor) {
            // Find next available color
            while (usedColors.has(colorPalette[colorIndex % colorPalette.length])) {
              colorIndex++;
            }
            subjectColor = colorPalette[colorIndex % colorPalette.length];
            usedColors.add(subjectColor);
            newSubjectColors[subjectKey] = subjectColor;
            colorIndex++;
          }
          
          return { ...cls, color: subjectColor };
        }
        return cls;
      });
      
      setSubjectColors(newSubjectColors);
      setClasses(updatedClasses);
      setOriginalClasses(updatedClasses);
    } catch (error) {
      console.error("Error loading schedule:", error);
      setErrorMessage("Failed to load schedule from storage.");
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

    const subjectKey = formData.subjectName.toUpperCase();
    let subjectColor = subjectColors[subjectKey];
    
    if (!subjectColor) {
      const usedColors = new Set(Object.values(subjectColors));
      let colorIndex = 0;
      while (usedColors.has(colorPalette[colorIndex % colorPalette.length])) {
        colorIndex++;
      }
      subjectColor = colorPalette[colorIndex % colorPalette.length];
      setSubjectColors(prev => ({...prev, [subjectKey]: subjectColor}));
    }
    
    const classData = {
      ...formData,
      subjectName: subjectKey,
      instructor: formData.instructor.toUpperCase(),
      timeSlots: timeSlots.slice(startIndex, endIndex),
      roomPrefix: formData.isLecture ? "ITC" : "CCL",
      color: subjectColor,
    };

    try {
      let savedClass;
      
      if (editingClass) {
        savedClass = await StorageService.updateScheduleItem(editingClass._id, classData);
        setClasses(classes.map((cls) => cls._id === editingClass._id ? savedClass : cls));
      } else {
        savedClass = await StorageService.addScheduleItem(classData);
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
      setErrorMessage(error.message || "Failed to save class to storage.");
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

    // Check if deadline is in the past
    const deadlineDateTime = new Date(reminderData.deadlineDate);
    const [time, period] = reminderData.deadlineTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    deadlineDateTime.setHours(hour24, parseInt(minutes), 0, 0);
    
    if (deadlineDateTime <= new Date()) {
      setReminderError("Deadline must be in the future");
      return;
    }

    const notificationIds = [];
    
    for (const day of reminderData.reminderDays) {
      const [time, period] = reminderData.reminderTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      // Convert to 24-hour format
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const triggerDate = new Date();
      
      // Find next occurrence of the selected day
      const dayIndex = reminderDays.indexOf(day);
      const today = new Date().getDay();
      let daysUntil = dayIndex - today;
      
      // If the day is today but the time has passed, or if it's in the past, schedule for next week
      if (daysUntil < 0 || (daysUntil === 0 && new Date().getHours() * 60 + new Date().getMinutes() >= hour24 * 60 + parseInt(minutes))) {
        daysUntil += 7;
      }
      
      triggerDate.setDate(triggerDate.getDate() + daysUntil);
      triggerDate.setHours(hour24, parseInt(minutes), 0, 0);
      
      // If deadline is in the future and trigger date is before deadline, schedule it
      const deadlineDateTime = new Date(reminderData.deadlineDate);
      if (triggerDate < deadlineDateTime) {
        // Schedule weekly reminders until deadline
        let currentTrigger = new Date(triggerDate);
        while (currentTrigger < deadlineDateTime) {
          const notificationId = await NotificationService.scheduleReminderNotification(
            reminderData.title,
            `Reminder: ${reminderData.title} - Due ${reminderData.deadlineDate.toDateString()} at ${reminderData.deadlineTime}`,
            new Date(currentTrigger)
          );
          
          if (notificationId) {
            notificationIds.push(notificationId);
          }
          
          currentTrigger.setDate(currentTrigger.getDate() + 7);
        }
        continue;
      }
      
      // If deadline is in the future, schedule reminders for each week until deadline
      const deadlineDate = new Date(reminderData.deadlineDate);
      const currentTrigger = new Date(triggerDate);
      
      while (currentTrigger <= deadlineDate) {
        if (currentTrigger > new Date()) { // Only schedule future notifications
          const notificationId = await NotificationService.scheduleReminderNotification(
            reminderData.title,
            `Reminder: ${reminderData.title} - Due ${reminderData.deadlineDate.toDateString()} at ${reminderData.deadlineTime}`,
            new Date(currentTrigger)
          );
          
          if (notificationId) {
            notificationIds.push(notificationId);
          }
        }
        currentTrigger.setDate(currentTrigger.getDate() + 7); // Next week
      }
    }
    
    // Save reminder to storage
    try {
      const reminderPayload = {
        title: reminderData.title,
        deadlineDate: reminderData.deadlineDate.toISOString(),
        deadlineTime: reminderData.deadlineTime,
        reminderDays: reminderData.reminderDays,
        reminderTime: reminderData.reminderTime,
        notificationIds: notificationIds,
        subject: reminderData.subjectName
      };

      await StorageService.addReminder(reminderPayload);
    } catch (error) {
      console.error("Error saving reminder:", error);
      setReminderError("Failed to save reminder to storage");
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
      const success = await StorageService.deleteScheduleItem(selectedClass._id);
      if (success) {
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
                    classData && [styles.occupiedCell, { backgroundColor: classData.color + '40' }],
                    isFirst && [styles.firstSlot, classData && { borderTopColor: classData.color }],
                    isLast && [styles.lastSlot, classData && { borderBottomColor: classData.color }],
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
              placeholderTextColor="#999"
              value={formData.subjectName}
              onChangeText={(text) =>
                setFormData({ ...formData, subjectName: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Instructor Display Name"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
            
            <ScrollView style={styles.modalScrollView} nestedScrollEnabled={true}>
              <TextInput
                style={styles.input}
                placeholder="Reminder Title"
                placeholderTextColor="#999"
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
    color: "#333",
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
