import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../utils/constants';
import ErrorHandler from '../utils/errorHandler';
import hybridStorageProvider from '../services/hybrid-storage-provider';

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

  // Storage status for SharePoint integration
  const [storageStatus, setStorageStatus] = useState({
    mode: 'localStorage',
    sharePointAvailable: false,
    pendingSync: 0,
    lastSync: null
  });

  // Load saved data using HybridStorageProvider on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Update storage status
        const syncStatus = hybridStorageProvider.getSyncStatus();
        const isSharePointAvailable = hybridStorageProvider.isSharePointEnabled();

        setStorageStatus({
          mode: hybridStorageProvider.getStorageMode(),
          sharePointAvailable: isSharePointAvailable,
          pendingSync: syncStatus.pendingCount,
          lastSync: syncStatus.lastSync
        });

        // If SharePoint is available, auto-load data from SharePoint first
        if (isSharePointAvailable) {
          console.log('📥 SharePoint detected - Loading data from SharePoint...');
          try {
            const refreshResult = await hybridStorageProvider.refreshFromSharePoint();
            if (refreshResult.success) {
              console.log('✅ Data loaded from SharePoint:', refreshResult);
            } else {
              console.log('⚠️ SharePoint refresh failed, using localStorage:', refreshResult.error);
            }
          } catch (spError) {
            console.log('⚠️ SharePoint load error, using localStorage:', spError.message);
          }
        }

        // Load data from HybridStorageProvider (now updated from SharePoint if available)
        const [loadedPeople, loadedMeetings] = await Promise.all([
          hybridStorageProvider.getPeople(),
          hybridStorageProvider.getMeetings()
        ]);

        // Handle backward compatibility - migrate old meetingPeople data
        const meetingPeople = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE)) || [];

        if (meetingPeople.length > 0) {
          // Combine and deduplicate
          const allPeople = [...loadedPeople, ...meetingPeople];
          const uniquePeople = allPeople.filter((person, index, arr) =>
            arr.findIndex(p => p === person || (typeof p === 'object' && typeof person === 'object' && p.name === person.name)) === index
          );
          setPeople(uniquePeople);

          // Migrate old data and clean up
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(uniquePeople));
          localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE);
        } else {
          setPeople(loadedPeople);
        }

        setMeetings(loadedMeetings);

        // Load current meeting (always from localStorage for active session)
        const currentMeetingInfo = await hybridStorageProvider.getCurrentMeeting();
        setCurrentMeeting(currentMeetingInfo);

        setLoading(false);
      } catch (error) {
        ErrorHandler.logError(error, 'Context initialization');
        setError('Failed to load saved data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save people to storage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        // Always save to localStorage for immediate persistence
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(people));
      } catch (error) {
        ErrorHandler.logError(error, 'Saving people data');
      }
    }
  }, [people, loading]);

  // Save meetings to storage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        // Always save to localStorage for immediate persistence
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS, JSON.stringify(meetings));
      } catch (error) {
        ErrorHandler.logError(error, 'Saving meetings data');
      }
    }
  }, [meetings, loading]);

  // Save current meeting to storage whenever it changes
  useEffect(() => {
    if (!loading && currentMeeting) {
      // setCurrentMeeting is async; a try/catch would not see a rejected
      // promise, so attach a handler instead.
      Promise.resolve(hybridStorageProvider.setCurrentMeeting(currentMeeting))
        .catch(error => ErrorHandler.logError(error, 'Saving current meeting data'));
    }
  }, [currentMeeting, loading]);

  // Clear error function
  const clearError = () => setError(null);

  // Sync data to SharePoint
  const syncToSharePoint = useCallback(async () => {
    if (!hybridStorageProvider.isSharePointEnabled()) {
      return { success: false, message: 'SharePoint not available' };
    }

    try {
      const result = await hybridStorageProvider.syncToSharePoint();

      // Update storage status
      const syncStatus = hybridStorageProvider.getSyncStatus();
      setStorageStatus(prev => ({
        ...prev,
        pendingSync: syncStatus.pendingCount,
        lastSync: syncStatus.lastSync
      }));

      return result;
    } catch (error) {
      ErrorHandler.logError(error, 'SharePoint sync');
      return { success: false, error: error.message };
    }
  }, []);

  // Refresh data from SharePoint
  const refreshFromSharePoint = useCallback(async () => {
    if (!hybridStorageProvider.isSharePointEnabled()) {
      return { success: false, message: 'SharePoint not available' };
    }

    try {
      setLoading(true);
      const result = await hybridStorageProvider.refreshFromSharePoint();

      if (result.success) {
        // Reload data into state
        const [loadedPeople, loadedMeetings] = await Promise.all([
          hybridStorageProvider.getPeople(),
          hybridStorageProvider.getMeetings()
        ]);

        setPeople(loadedPeople);
        setMeetings(loadedMeetings);
      }

      setLoading(false);
      return result;
    } catch (error) {
      ErrorHandler.logError(error, 'SharePoint refresh');
      setLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Add a person using HybridStorageProvider
  const addPerson = useCallback(async (personData) => {
    try {
      const result = await hybridStorageProvider.addPerson(personData);

      if (result.success && !result.duplicate) {
        // Update local state
        setPeople(prev => {
          const person = typeof personData === 'string' ? { name: personData } : personData;
          const exists = prev.some(p =>
            (typeof p === 'string' && p === person.name) ||
            (typeof p === 'object' && p.name === person.name)
          );
          if (!exists) {
            return [...prev, person];
          }
          return prev;
        });
      }

      // Update sync status
      const syncStatus = hybridStorageProvider.getSyncStatus();
      setStorageStatus(prev => ({
        ...prev,
        pendingSync: syncStatus.pendingCount
      }));

      return result;
    } catch (error) {
      ErrorHandler.logError(error, 'Adding person');
      return { success: false, error: error.message };
    }
  }, []);

  // Save a meeting using HybridStorageProvider
  const saveMeeting = useCallback(async (meetingData) => {
    try {
      const result = await hybridStorageProvider.saveMeeting(meetingData);

      if (result.success) {
        // Update local state
        setMeetings(prev => [...prev, meetingData]);
      }

      // Update sync status
      const syncStatus = hybridStorageProvider.getSyncStatus();
      setStorageStatus(prev => ({
        ...prev,
        pendingSync: syncStatus.pendingCount
      }));

      return result;
    } catch (error) {
      ErrorHandler.logError(error, 'Saving meeting');
      return { success: false, error: error.message };
    }
  }, []);

  // Create data backup
  const createBackup = useCallback(() => {
    return hybridStorageProvider.createBackup();
  }, []);

  // Clear the active meeting from every storage layer
  const clearCurrentMeeting = useCallback(async () => {
    const result = await hybridStorageProvider.clearCurrentMeeting();
    setCurrentMeeting(null);
    return result;
  }, []);

  // Restore from backup
  const restoreBackup = useCallback(async (backupData) => {
    const result = await hybridStorageProvider.restoreBackup(backupData);

    if (result.success) {
      // Reload data into state
      const loadedPeople = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE) || '[]');
      const loadedMeetings = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS) || '[]');
      const currentMeetingInfo = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_MEETING) || 'null');

      setPeople(loadedPeople);
      setMeetings(loadedMeetings);
      setCurrentMeeting(currentMeetingInfo);
    }

    return result;
  }, []);

  // Context value
  const value = {
    // State
    people,
    setPeople,
    meetings,
    setMeetings,
    currentMeeting,
    setCurrentMeeting,
    loading,
    error,
    clearError,

    // Storage status (SharePoint integration)
    storageStatus,

    // Enhanced methods with SharePoint support
    addPerson,
    saveMeeting,
    syncToSharePoint,
    refreshFromSharePoint,
    createBackup,
    restoreBackup,
    clearCurrentMeeting,

    // Storage provider access for advanced use
    storageProvider: hybridStorageProvider
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
