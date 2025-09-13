import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '../utils/constants';
import ErrorHandler from '../utils/errorHandler';

// Create the context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// Provider component
export const AppContextProvider = ({ children }) => {
  const [people, setPeople] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load saved data from localStorage on initial render
  useEffect(() => {
    try {
      // Check both old and new storage keys for backward compatibility
      const savedPeople = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE)) || [];
      const meetingPeople = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE)) || [];
      
      // Combine both lists and remove duplicates by name
      const allPeople = [...savedPeople, ...meetingPeople];
      const uniquePeople = allPeople.filter((person, index, arr) => 
        arr.findIndex(p => p === person || (typeof p === 'object' && typeof person === 'object' && p.name === person.name)) === index
      );
      setPeople(uniquePeople);
      
      // Migrate old data to new storage key and clean up
      if (meetingPeople.length > 0) {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(uniquePeople));
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE);
      }
      
      const savedMeetings = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS)) || [];
      setMeetings(savedMeetings);
      
      const currentMeetingInfo = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_MEETING));
      setCurrentMeeting(currentMeetingInfo);
      
      setLoading(false);
    } catch (error) {
      ErrorHandler.logError(error, 'Context initialization');
      setError('Failed to load saved data');
      setLoading(false);
    }
  }, []);
  
  // Save people to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(people));
      } catch (error) {
        ErrorHandler.logError(error, 'Saving people data');
      }
    }
  }, [people, loading]);
  
  // Save meetings to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS, JSON.stringify(meetings));
      } catch (error) {
        ErrorHandler.logError(error, 'Saving meetings data');
      }
    }
  }, [meetings, loading]);
  
  // Save current meeting to localStorage whenever it changes
  useEffect(() => {
    if (!loading && currentMeeting) {
      try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_MEETING, JSON.stringify(currentMeeting));
      } catch (error) {
        ErrorHandler.logError(error, 'Saving current meeting data');
      }
    }
  }, [currentMeeting, loading]);

  // Clear error function
  const clearError = () => setError(null);

  // Context value
  const value = {
    people,
    setPeople,
    meetings,
    setMeetings,
    currentMeeting,
    setCurrentMeeting,
    loading,
    error,
    clearError
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
