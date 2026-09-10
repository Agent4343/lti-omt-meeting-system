/**
 * Hybrid Storage Provider
 * Uses SharePoint as primary storage with localStorage as fallback/cache
 *
 * This provider solves the critical issue where localStorage data is:
 * - NOT shared between users (each user has their own data)
 * - Lost when browser cache is cleared
 * - Not accessible from different computers
 *
 * Architecture:
 * - SharePoint Document Library: Primary storage (JSON files, shared across all users)
 * - localStorage: Cache/fallback for offline access and performance
 *
 * Storage Mode: Document Library (simpler than Lists - no columns to configure!)
 *
 * @version 2.0.0
 */

import sharePointDocumentStorage from './sharepoint-document-storage';
import { APP_CONFIG } from '../utils/constants';

class HybridStorageProvider {
  constructor() {
    this.isSharePointAvailable = sharePointDocumentStorage.isAvailable();
    this.useSharePointPrimary = true;
    this.storageService = sharePointDocumentStorage;
    this.syncStatus = {
      lastSync: null,
      pendingChanges: [],
      syncInProgress: false
    };

    // Initialize sync status from localStorage
    this._loadSyncStatus();

    // Log storage mode
    console.log(`HybridStorageProvider initialized. SharePoint mode: ${this.isSharePointAvailable}`);
  }

  // ========================================
  // CONFIGURATION
  // ========================================

  /**
   * Check if SharePoint is available
   * @returns {boolean}
   */
  isSharePointEnabled() {
    return this.isSharePointAvailable && this.useSharePointPrimary;
  }

  /**
   * Enable or disable SharePoint storage
   * @param {boolean} enabled
   */
  setSharePointEnabled(enabled) {
    this.useSharePointPrimary = enabled;
  }

  /**
   * Get current storage mode description
   * @returns {string}
   */
  getStorageMode() {
    if (this.isSharePointEnabled()) {
      return 'SharePoint Document Library (Centralized) with localStorage cache';
    }
    return 'localStorage only (Data not shared between users)';
  }

  /**
   * Set the SharePoint document library name
   * @param {string} libraryName
   */
  setLibraryName(libraryName) {
    this.storageService.setLibraryName(libraryName);
  }

  // ========================================
  // MEETINGS
  // ========================================

  /**
   * Get all meetings
   * @returns {Promise<Array>}
   */
  async getMeetings() {
    if (this.isSharePointEnabled()) {
      try {
        const meetings = await this.storageService.getMeetings();
        // Update localStorage cache
        this._setLocalStorage('savedMeetings', meetings);
        return meetings;
      } catch (error) {
        console.warn('SharePoint unavailable, using localStorage cache:', error.message);
        // Fallback to localStorage
        return this._getLocalStorage('savedMeetings', []);
      }
    }

    return this._getLocalStorage('savedMeetings', []);
  }

  /**
   * Save a meeting
   * @param {Object} meetingData - Meeting data object
   * @returns {Promise<Object>}
   */
  async saveMeeting(meetingData) {
    // Always save to localStorage first (immediate, offline support)
    const localMeetings = this._getLocalStorage('savedMeetings', []);

    // Add timestamp if not present
    if (!meetingData.timestamp) {
      meetingData.timestamp = new Date().toISOString();
    }

    localMeetings.push(meetingData);
    this._setLocalStorage('savedMeetings', localMeetings);

    // Sync to SharePoint Document Library if available
    if (this.isSharePointEnabled()) {
      try {
        // Save all meetings to the JSON file
        const result = await this.storageService.saveMeetings(localMeetings);
        if (result.success) {
          return {
            success: true,
            savedTo: 'SharePoint Document Library',
            data: meetingData
          };
        } else {
          // Mark as pending sync
          this._addPendingChange('meeting', 'create', meetingData);
          return {
            success: true,
            savedTo: 'localStorage',
            pendingSync: true,
            error: result.error
          };
        }
      } catch (error) {
        console.warn('Failed to save to SharePoint, saved to localStorage:', error.message);
        this._addPendingChange('meeting', 'create', meetingData);
        return {
          success: true,
          savedTo: 'localStorage',
          pendingSync: true,
          error: error.message
        };
      }
    }

    return {
      success: true,
      savedTo: 'localStorage'
    };
  }

  /**
   * Update a meeting
   * @param {string|number} meetingId - Meeting identifier (timestamp or id)
   * @param {Object} meetingData - Updated meeting data
   * @returns {Promise<Object>}
   */
  async updateMeeting(meetingId, meetingData) {
    // Update localStorage
    const localMeetings = this._getLocalStorage('savedMeetings', []);
    const index = localMeetings.findIndex(m =>
      m.id === meetingId || m.timestamp === meetingId
    );

    if (index === -1) {
      // Nothing to update - reporting success here would hide a bad meetingId.
      return {
        success: false,
        error: `No meeting found with id ${meetingId}`
      };
    }

    localMeetings[index] = { ...localMeetings[index], ...meetingData };
    this._setLocalStorage('savedMeetings', localMeetings);

    // Sync to SharePoint Document Library if available
    if (this.isSharePointEnabled()) {
      try {
        // Save entire meetings array to JSON file
        const result = await this.storageService.saveMeetings(localMeetings);
        return {
          success: result.success,
          savedTo: 'SharePoint Document Library',
          error: result.error
        };
      } catch (error) {
        this._addPendingChange('meeting', 'update', { id: meetingId, data: meetingData });
        return {
          success: true,
          savedTo: 'localStorage',
          pendingSync: true,
          error: error.message
        };
      }
    }

    return { success: true, savedTo: 'localStorage' };
  }

  /**
   * Delete a meeting
   * @param {string|number} meetingId - Meeting identifier (timestamp or id)
   * @returns {Promise<Object>}
   */
  async deleteMeeting(meetingId) {
    // Remove from localStorage
    const localMeetings = this._getLocalStorage('savedMeetings', []);
    const filtered = localMeetings.filter(m =>
      m.id !== meetingId && m.timestamp !== meetingId
    );
    this._setLocalStorage('savedMeetings', filtered);

    // Save updated list to SharePoint Document Library if available
    if (this.isSharePointEnabled()) {
      try {
        // Save the filtered meetings array (without deleted meeting)
        const result = await this.storageService.saveMeetings(filtered);
        return {
          success: result.success,
          deletedFrom: 'SharePoint Document Library',
          error: result.error
        };
      } catch (error) {
        this._addPendingChange('meeting', 'delete', { id: meetingId });
        return {
          success: true,
          deletedFrom: 'localStorage',
          pendingSync: true,
          error: error.message
        };
      }
    }

    return { success: true, deletedFrom: 'localStorage' };
  }

  // ========================================
  // ATTENDEES (PEOPLE)
  // ========================================

  /**
   * Get all people/attendees
   * @returns {Promise<Array>}
   */
  async getPeople() {
    if (this.isSharePointEnabled()) {
      try {
        const people = await this.storageService.getAttendees();
        // Update localStorage cache
        this._setLocalStorage('savedPeople', people);
        return people;
      } catch (error) {
        console.warn('SharePoint unavailable, using localStorage cache:', error.message);
        return this._getLocalStorage('savedPeople', []);
      }
    }

    return this._getLocalStorage('savedPeople', []);
  }

  /**
   * Add a new person/attendee
   * @param {Object|string} personData - Person data or name string
   * @returns {Promise<Object>}
   */
  async addPerson(personData) {
    // Normalize input
    const person = typeof personData === 'string'
      ? { name: personData }
      : personData;

    // Save to localStorage
    const localPeople = this._getLocalStorage('savedPeople', []);

    // Check for duplicate
    const exists = localPeople.some(p =>
      (typeof p === 'string' && p === person.name) ||
      (typeof p === 'object' && p.name === person.name)
    );

    if (!exists) {
      localPeople.push(person);
      this._setLocalStorage('savedPeople', localPeople);
    }

    // Sync to SharePoint Document Library
    if (this.isSharePointEnabled() && !exists) {
      try {
        // Save all attendees to the JSON file
        const result = await this.storageService.saveAttendees(localPeople);
        if (result.success) {
          return {
            success: true,
            savedTo: 'SharePoint Document Library',
            data: person
          };
        }

        // Resolved but unsuccessful - queue it like the thrown-error path does,
        // otherwise the attendee never reaches SharePoint.
        console.warn('Failed to save to SharePoint:', result.error);
        this._addPendingChange('attendee', 'create', person);
        return {
          success: true,
          savedTo: 'localStorage',
          pendingSync: true,
          data: person
        };
      } catch (error) {
        console.warn('Failed to save to SharePoint:', error.message);
        this._addPendingChange('attendee', 'create', person);
        return {
          success: true,
          savedTo: 'localStorage',
          pendingSync: true
        };
      }
    }

    return {
      success: true,
      savedTo: 'localStorage',
      duplicate: exists
    };
  }

  /**
   * Remove a person/attendee
   * @param {string} personId - Person identifier (name)
   * @returns {Promise<Object>}
   */
  async removePerson(personId) {
    // Remove from localStorage
    const localPeople = this._getLocalStorage('savedPeople', []);
    const filtered = localPeople.filter(p =>
      (typeof p === 'string' && p !== personId) ||
      (typeof p === 'object' && p.name !== personId)
    );
    this._setLocalStorage('savedPeople', filtered);

    // Save updated list to SharePoint Document Library
    if (this.isSharePointEnabled()) {
      try {
        // Save the filtered attendees array (without removed person)
        const result = await this.storageService.saveAttendees(filtered);
        return {
          success: result.success,
          removedFrom: 'SharePoint Document Library'
        };
      } catch (error) {
        this._addPendingChange('attendee', 'delete', { id: personId });
        return {
          success: true,
          removedFrom: 'localStorage',
          pendingSync: true
        };
      }
    }

    return { success: true, removedFrom: 'localStorage' };
  }

  // ========================================
  // ISOLATIONS
  // ========================================

  /**
   * Get isolations
   * @returns {Promise<Array>}
   */
  async getIsolations() {
    if (this.isSharePointEnabled()) {
      try {
        const isolations = await this.storageService.getIsolations();
        // Cache locally
        this._setLocalStorage('currentMeetingIsolations', isolations);
        return isolations;
      } catch (error) {
        console.warn('SharePoint unavailable, using localStorage cache:', error.message);
      }
    }

    return this._getLocalStorage('currentMeetingIsolations', []);
  }

  /**
   * Save isolations for a meeting
   * @param {Array} isolations - Array of isolation data
   * @returns {Promise<Object>}
   */
  async saveIsolations(isolations) {
    // Save to localStorage
    this._setLocalStorage('currentMeetingIsolations', isolations);

    // Sync to SharePoint Document Library
    if (this.isSharePointEnabled()) {
      try {
        const result = await this.storageService.saveIsolations(isolations);
        return {
          success: result.success,
          savedTo: 'SharePoint Document Library',
          error: result.error
        };
      } catch (error) {
        console.warn('Failed to save isolations to SharePoint:', error.message);
        this._addPendingChange('isolations', 'create', { isolations });
        return {
          success: true,
          savedTo: 'localStorage',
          pendingSync: true
        };
      }
    }

    return { success: true, savedTo: 'localStorage' };
  }

  // ========================================
  // CURRENT MEETING
  // ========================================

  /**
   * Get current meeting info
   * @returns {Promise<Object|null>}
   */
  async getCurrentMeeting() {
    if (this.isSharePointEnabled()) {
      try {
        const meeting = await this.storageService.getCurrentMeeting();
        if (meeting) {
          this._setLocalStorage('currentMeetingInfo', meeting);
        }
        return meeting;
      } catch (error) {
        console.warn('SharePoint unavailable, using localStorage cache:', error.message);
      }
    }
    return this._getLocalStorage('currentMeetingInfo', null);
  }

  /**
   * Set current meeting info
   * @param {Object} meetingInfo - Current meeting data
   * @returns {Promise<Object>}
   */
  async setCurrentMeeting(meetingInfo) {
    this._setLocalStorage('currentMeetingInfo', meetingInfo);

    if (this.isSharePointEnabled()) {
      try {
        const result = await this.storageService.saveCurrentMeeting(meetingInfo);
        return { success: result.success, savedTo: 'SharePoint Document Library' };
      } catch (error) {
        console.warn('Failed to save current meeting to SharePoint:', error.message);
        return { success: true, savedTo: 'localStorage', pendingSync: true };
      }
    }
    return { success: true, savedTo: 'localStorage' };
  }

  /**
   * Clear current meeting from localStorage and SharePoint
   * Both have to be cleared: leaving the SharePoint current-* files in place
   * would let the next sync restore a finalized meeting as the active one.
   * @returns {Promise<Object>}
   */
  async clearCurrentMeeting() {
    localStorage.removeItem('currentMeetingInfo');
    localStorage.removeItem('currentMeetingIsolations');
    localStorage.removeItem('currentMeetingResponses');
    localStorage.removeItem('currentMeetingPosition');

    if (this.isSharePointEnabled()) {
      try {
        const result = await this.storageService.clearCurrentMeeting();
        return { success: result.success, clearedFrom: 'SharePoint Document Library' };
      } catch (error) {
        console.warn('Failed to clear current meeting on SharePoint:', error.message);
        return { success: false, clearedFrom: 'localStorage', error: error.message };
      }
    }

    return { success: true, clearedFrom: 'localStorage' };
  }

  // ========================================
  // RESPONSES
  // ========================================

  /**
   * Get meeting responses
   * @returns {Promise<Object>}
   */
  async getResponses() {
    if (this.isSharePointEnabled()) {
      try {
        const responses = await this.storageService.getResponses();
        if (responses && Object.keys(responses).length > 0) {
          this._setLocalStorage('currentMeetingResponses', responses);
        }
        return responses;
      } catch (error) {
        console.warn('SharePoint unavailable, using localStorage cache:', error.message);
      }
    }
    return this._getLocalStorage('currentMeetingResponses', {});
  }

  /**
   * Save response for an isolation
   * @param {string} isolationId - Isolation identifier
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>}
   */
  async saveResponse(isolationId, responseData) {
    const responses = this._getLocalStorage('currentMeetingResponses', {});
    responses[isolationId] = {
      ...responseData,
      timestamp: new Date().toISOString()
    };
    this._setLocalStorage('currentMeetingResponses', responses);

    if (this.isSharePointEnabled()) {
      try {
        const result = await this.storageService.saveResponses(responses);
        return { success: result.success, savedTo: 'SharePoint Document Library' };
      } catch (error) {
        console.warn('Failed to save responses to SharePoint:', error.message);
        return { success: true, savedTo: 'localStorage', pendingSync: true };
      }
    }
    return { success: true, savedTo: 'localStorage' };
  }

  /**
   * Clear all responses
   */
  clearResponses() {
    localStorage.removeItem('currentMeetingResponses');
  }

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  /**
   * Sync all local data to SharePoint Document Library
   * Uses the built-in syncFromLocalStorage method of the document storage service
   * @returns {Promise<Object>}
   */
  async syncToSharePoint() {
    if (!this.isSharePointEnabled()) {
      return { success: false, message: 'SharePoint not available' };
    }

    if (this.syncStatus.syncInProgress) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncStatus.syncInProgress = true;

    try {
      // Use the document storage service's built-in sync method
      const result = await this.storageService.syncFromLocalStorage();

      this.syncStatus.lastSync = new Date().toISOString();
      // Clear pending changes since we synced everything
      this.syncStatus.pendingChanges = [];
      this._saveSyncStatus();

      return {
        success: result.success,
        synced: result.synced,
        message: result.success
          ? `Synced ${result.synced?.meetings || 0} meetings and ${result.synced?.attendees || 0} attendees`
          : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * Force refresh from SharePoint Document Library (overwrites local cache)
   * Uses the built-in syncToLocalStorage method of the document storage service
   * @returns {Promise<Object>}
   */
  async refreshFromSharePoint() {
    if (!this.isSharePointEnabled()) {
      return { success: false, message: 'SharePoint not available' };
    }

    try {
      // Use the document storage service's built-in sync method
      const result = await this.storageService.syncToLocalStorage();

      const meetings = result.synced?.savedMeetings || 0;
      const people = result.synced?.savedPeople || 0;

      return {
        success: result.success,
        meetings,
        people,
        message: result.success
          ? `Loaded ${meetings} meetings and ${people} attendees from SharePoint`
          : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get sync status
   * @returns {Object}
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      pendingCount: this.syncStatus.pendingChanges.length,
      sharePointAvailable: this.isSharePointAvailable
    };
  }

  // ========================================
  // BACKUP & RESTORE
  // ========================================

  /**
   * Create a backup of all data
   * @param {boolean} saveToSharePoint - Also save backup to SharePoint document library
   * @returns {Promise<Object>}
   */
  async createBackup(saveToSharePoint = true) {
    const backup = {
      timestamp: new Date().toISOString(),
      version: APP_CONFIG?.VERSION || '4.0.0',
      storageMode: this.getStorageMode(),
      data: {
        savedPeople: this._getLocalStorage('savedPeople', []),
        savedMeetings: this._getLocalStorage('savedMeetings', []),
        currentMeetingInfo: this._getLocalStorage('currentMeetingInfo', null),
        currentMeetingIsolations: this._getLocalStorage('currentMeetingIsolations', []),
        currentMeetingResponses: this._getLocalStorage('currentMeetingResponses', {}),
        pastMeetings: this._getLocalStorage('pastMeetings', []),
        masterIsolations: this._getLocalStorage('masterIsolations', [])
      }
    };

    // Also save backup to SharePoint Document Library
    if (saveToSharePoint && this.isSharePointEnabled()) {
      try {
        const result = await this.storageService.createBackup();
        backup.sharePointBackup = {
          success: result.success,
          fileName: result.backupFileName
        };
      } catch (error) {
        backup.sharePointBackup = {
          success: false,
          error: error.message
        };
      }
    }

    return backup;
  }

  /**
   * Restore from a backup
   * @param {Object} backupData - Backup data object
   * @param {boolean} syncToSharePoint - Also restore to SharePoint document library
   * @returns {Promise<Object>}
   */
  async restoreBackup(backupData, syncToSharePoint = true) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup format');
      }

      const { data } = backupData;

      // Restore to localStorage
      if (data.savedPeople) {
        this._setLocalStorage('savedPeople', data.savedPeople);
      }
      if (data.savedMeetings) {
        this._setLocalStorage('savedMeetings', data.savedMeetings);
      }
      if (data.currentMeetingInfo) {
        this._setLocalStorage('currentMeetingInfo', data.currentMeetingInfo);
      }
      if (data.currentMeetingIsolations) {
        this._setLocalStorage('currentMeetingIsolations', data.currentMeetingIsolations);
      }
      if (data.currentMeetingResponses) {
        this._setLocalStorage('currentMeetingResponses', data.currentMeetingResponses);
      }
      if (data.pastMeetings) {
        this._setLocalStorage('pastMeetings', data.pastMeetings);
      }
      if (data.masterIsolations) {
        this._setLocalStorage('masterIsolations', data.masterIsolations);
      }

      const result = {
        success: true,
        message: 'Backup restored to localStorage',
        restoredAt: new Date().toISOString()
      };

      // Also restore to SharePoint Document Library
      if (syncToSharePoint && this.isSharePointEnabled()) {
        try {
          const spResult = await this.storageService.restoreBackup(backupData);
          result.sharePointRestore = {
            success: spResult.success,
            error: spResult.error
          };
          if (spResult.success) {
            result.message = 'Backup restored to localStorage and SharePoint';
          }
        } catch (error) {
          result.sharePointRestore = {
            success: false,
            error: error.message
          };
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  _getLocalStorage(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  _setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }

  _addPendingChange(type, action, data) {
    this.syncStatus.pendingChanges.push({
      id: Date.now(),
      type,
      action,
      data,
      createdAt: new Date().toISOString()
    });
    this._saveSyncStatus();
  }

  _removePendingChange(change) {
    this.syncStatus.pendingChanges = this.syncStatus.pendingChanges.filter(
      c => c.id !== change.id
    );
    this._saveSyncStatus();
  }

  _loadSyncStatus() {
    try {
      const saved = localStorage.getItem('_hybridStorageSyncStatus');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.syncStatus.lastSync = parsed.lastSync;
        this.syncStatus.pendingChanges = parsed.pendingChanges || [];
      }
    } catch (error) {
      console.warn('Error loading sync status:', error);
    }
  }

  _saveSyncStatus() {
    try {
      localStorage.setItem('_hybridStorageSyncStatus', JSON.stringify({
        lastSync: this.syncStatus.lastSync,
        pendingChanges: this.syncStatus.pendingChanges
      }));
    } catch (error) {
      console.warn('Error saving sync status:', error);
    }
  }
}

// Export singleton instance
const hybridStorageProvider = new HybridStorageProvider();
export default hybridStorageProvider;

// Also export the class for testing
export { HybridStorageProvider };
