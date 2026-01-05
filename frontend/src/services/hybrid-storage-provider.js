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
 * - SharePoint Lists: Primary storage (shared across all users)
 * - localStorage: Cache/fallback for offline access and performance
 *
 * @version 1.0.0
 */

import sharePoint2013DataService from './sharepoint2013-data-service';
import { APP_CONFIG } from '../utils/constants';

class HybridStorageProvider {
  constructor() {
    this.isSharePointAvailable = sharePoint2013DataService.isAvailable();
    this.useSharePointPrimary = true;
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
      return 'SharePoint (Centralized) with localStorage cache';
    }
    return 'localStorage only (Data not shared between users)';
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
        const meetings = await sharePoint2013DataService.getMeetings();
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

    // Sync to SharePoint if available
    if (this.isSharePointEnabled()) {
      try {
        const result = await sharePoint2013DataService.saveMeeting(meetingData);
        if (result.success) {
          // Update local copy with SharePoint ID
          const index = localMeetings.findIndex(m =>
            m.timestamp === meetingData.timestamp
          );
          if (index !== -1) {
            localMeetings[index].sharePointId = result.id;
            this._setLocalStorage('savedMeetings', localMeetings);
          }
          return {
            success: true,
            id: result.id,
            savedTo: 'SharePoint',
            data: result.data
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
   * @param {string|number} meetingId - Meeting identifier
   * @param {Object} meetingData - Updated meeting data
   * @returns {Promise<Object>}
   */
  async updateMeeting(meetingId, meetingData) {
    // Update localStorage
    const localMeetings = this._getLocalStorage('savedMeetings', []);
    const index = localMeetings.findIndex(m =>
      m.sharePointId === meetingId || m.id === meetingId || m.timestamp === meetingId
    );

    if (index !== -1) {
      localMeetings[index] = { ...localMeetings[index], ...meetingData };
      this._setLocalStorage('savedMeetings', localMeetings);
    }

    // Sync to SharePoint if available
    if (this.isSharePointEnabled() && typeof meetingId === 'number') {
      try {
        const result = await sharePoint2013DataService.updateMeeting(meetingId, meetingData);
        return {
          success: result.success,
          savedTo: 'SharePoint',
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
   * @param {string|number} meetingId - Meeting identifier
   * @returns {Promise<Object>}
   */
  async deleteMeeting(meetingId) {
    // Remove from localStorage
    const localMeetings = this._getLocalStorage('savedMeetings', []);
    const filtered = localMeetings.filter(m =>
      m.sharePointId !== meetingId && m.id !== meetingId && m.timestamp !== meetingId
    );
    this._setLocalStorage('savedMeetings', filtered);

    // Delete from SharePoint if available
    if (this.isSharePointEnabled() && typeof meetingId === 'number') {
      try {
        const result = await sharePoint2013DataService.deleteMeeting(meetingId);
        return {
          success: result.success,
          deletedFrom: 'SharePoint',
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
        const people = await sharePoint2013DataService.getAttendees();
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

    // Sync to SharePoint
    if (this.isSharePointEnabled() && !exists) {
      try {
        const result = await sharePoint2013DataService.addAttendee(person);
        if (result.success) {
          // Update local copy with SharePoint ID
          const index = localPeople.findIndex(p =>
            (typeof p === 'object' && p.name === person.name)
          );
          if (index !== -1) {
            localPeople[index].sharePointId = result.id;
            this._setLocalStorage('savedPeople', localPeople);
          }
          return {
            success: true,
            id: result.id,
            savedTo: 'SharePoint',
            data: result.data
          };
        }
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
   * @param {string|number} personId - Person identifier (name or SharePoint ID)
   * @returns {Promise<Object>}
   */
  async removePerson(personId) {
    // Remove from localStorage
    const localPeople = this._getLocalStorage('savedPeople', []);
    const filtered = localPeople.filter(p =>
      (typeof p === 'string' && p !== personId) ||
      (typeof p === 'object' && p.name !== personId && p.sharePointId !== personId)
    );
    this._setLocalStorage('savedPeople', filtered);

    // Deactivate in SharePoint
    if (this.isSharePointEnabled() && typeof personId === 'number') {
      try {
        const result = await sharePoint2013DataService.deactivateAttendee(personId);
        return {
          success: result.success,
          removedFrom: 'SharePoint'
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
   * @param {number} meetingId - Optional meeting ID filter
   * @returns {Promise<Array>}
   */
  async getIsolations(meetingId = null) {
    if (this.isSharePointEnabled()) {
      try {
        const isolations = await sharePoint2013DataService.getIsolations(meetingId);
        // Cache locally
        const cacheKey = meetingId ? `isolations_${meetingId}` : 'currentMeetingIsolations';
        this._setLocalStorage(cacheKey, isolations);
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
   * @param {number} meetingId - Meeting ID
   * @returns {Promise<Object>}
   */
  async saveIsolations(isolations, meetingId) {
    // Save to localStorage
    this._setLocalStorage('currentMeetingIsolations', isolations);

    // Sync to SharePoint
    if (this.isSharePointEnabled() && meetingId) {
      try {
        const results = await sharePoint2013DataService.saveIsolationsBatch(isolations, meetingId);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
          success: failed === 0,
          savedTo: 'SharePoint',
          successful,
          failed,
          results
        };
      } catch (error) {
        console.warn('Failed to save isolations to SharePoint:', error.message);
        this._addPendingChange('isolations', 'create', { isolations, meetingId });
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
   * @returns {Object|null}
   */
  getCurrentMeeting() {
    return this._getLocalStorage('currentMeetingInfo', null);
  }

  /**
   * Set current meeting info
   * @param {Object} meetingInfo - Current meeting data
   */
  setCurrentMeeting(meetingInfo) {
    this._setLocalStorage('currentMeetingInfo', meetingInfo);
  }

  /**
   * Clear current meeting
   */
  clearCurrentMeeting() {
    localStorage.removeItem('currentMeetingInfo');
    localStorage.removeItem('currentMeetingIsolations');
    localStorage.removeItem('currentMeetingResponses');
    localStorage.removeItem('currentMeetingPosition');
  }

  // ========================================
  // RESPONSES
  // ========================================

  /**
   * Get meeting responses
   * @returns {Object}
   */
  getResponses() {
    return this._getLocalStorage('currentMeetingResponses', {});
  }

  /**
   * Save response for an isolation
   * @param {string} isolationId - Isolation identifier
   * @param {Object} responseData - Response data
   */
  saveResponse(isolationId, responseData) {
    const responses = this.getResponses();
    responses[isolationId] = {
      ...responseData,
      timestamp: new Date().toISOString()
    };
    this._setLocalStorage('currentMeetingResponses', responses);
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
   * Sync all pending changes to SharePoint
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
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    try {
      const pendingChanges = [...this.syncStatus.pendingChanges];

      for (const change of pendingChanges) {
        try {
          let result;

          switch (change.type) {
            case 'meeting':
              if (change.action === 'create') {
                result = await sharePoint2013DataService.saveMeeting(change.data);
              } else if (change.action === 'update') {
                result = await sharePoint2013DataService.updateMeeting(change.data.id, change.data.data);
              } else if (change.action === 'delete') {
                result = await sharePoint2013DataService.deleteMeeting(change.data.id);
              }
              break;

            case 'attendee':
              if (change.action === 'create') {
                result = await sharePoint2013DataService.addAttendee(change.data);
              } else if (change.action === 'delete') {
                result = await sharePoint2013DataService.deactivateAttendee(change.data.id);
              }
              break;

            case 'isolations':
              if (change.action === 'create') {
                result = await sharePoint2013DataService.saveIsolationsBatch(
                  change.data.isolations,
                  change.data.meetingId
                );
              }
              break;
          }

          if (result && result.success !== false) {
            results.processed++;
            // Remove from pending changes
            this._removePendingChange(change);
          } else {
            results.failed++;
            results.errors.push(`${change.type} ${change.action}: ${result?.error || 'Unknown error'}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${change.type} ${change.action}: ${error.message}`);
        }
      }

      this.syncStatus.lastSync = new Date().toISOString();
      this._saveSyncStatus();

      results.success = results.failed === 0;
    } finally {
      this.syncStatus.syncInProgress = false;
    }

    return results;
  }

  /**
   * Force refresh from SharePoint (overwrites local cache)
   * @returns {Promise<Object>}
   */
  async refreshFromSharePoint() {
    if (!this.isSharePointEnabled()) {
      return { success: false, message: 'SharePoint not available' };
    }

    try {
      const [meetings, people] = await Promise.all([
        sharePoint2013DataService.getMeetings(),
        sharePoint2013DataService.getAttendees()
      ]);

      this._setLocalStorage('savedMeetings', meetings);
      this._setLocalStorage('savedPeople', people);

      return {
        success: true,
        meetings: meetings.length,
        people: people.length
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
   * @returns {Object}
   */
  createBackup() {
    return {
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
  }

  /**
   * Restore from a backup
   * @param {Object} backupData - Backup data object
   * @returns {Object}
   */
  restoreBackup(backupData) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup format');
      }

      const { data } = backupData;

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

      return {
        success: true,
        message: 'Backup restored successfully',
        restoredAt: new Date().toISOString()
      };
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
