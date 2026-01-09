import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Sidebar({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(-250)).current;

  useEffect(() => {
    if (visible) {
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
});