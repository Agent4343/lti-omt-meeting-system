/**
 * SharePoint Document Library Storage Service
 * Stores application data as JSON files in a SharePoint Document Library
 *
 * This is simpler than SharePoint Lists - just need ONE document library!
 *
 * Storage Structure:
 *   /LTIMeetingData/
 *     ├── meetings.json       - All saved meetings
 *     ├── attendees.json      - All attendees/people
 *     ├── current-meeting.json - Current active meeting
 *     └── app-config.json     - App configuration
 *
 * @version 1.0.0
 * @compatibility SharePoint 2013, 2016, 2019, Online
 */

class SharePointDocumentStorage {
  constructor() {
    this.libraryName = 'LTIMeetingData'; // Default library name
    this.digestValue = null;
    this.digestExpiry = null;
    this._isSharePointEnvironment = this._checkSharePointEnvironment();
    this.siteUrl = this._getSiteUrl();

    console.log('SharePointDocumentStorage initialized:', {
      isSharePoint: this._isSharePointEnvironment,
      siteUrl: this.siteUrl,
      libraryName: this.libraryName
    });
  }

  /**
   * Check if running in SharePoint environment
   * Detects SharePoint from URL pattern if _spPageContextInfo is not available
   */
  _checkSharePointEnvironment() {
    // Check for _spPageContextInfo first (classic SharePoint pages)
    if (typeof _spPageContextInfo !== 'undefined') {
      console.log('SharePoint detected via _spPageContextInfo');
      return true;
    }

    // Check URL patterns for SharePoint
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    // Common SharePoint URL patterns
    const sharePointPatterns = [
      '.sharepoint.com',      // SharePoint Online
      '/sites/',              // SharePoint site collections
      '/_layouts/',           // SharePoint layouts
      '/siteassets/',         // SharePoint Site Assets
      '/shared%20documents/', // Shared Documents (encoded)
      '/shared documents/',   // Shared Documents
      'ishareteam',           // Corporate SharePoint (like ishareteam2.na.xom.com)
      '.xom.com'              // Corporate domain
    ];

    for (const pattern of sharePointPatterns) {
      if (url.includes(pattern) || hostname.includes(pattern)) {
        console.log(`SharePoint detected via URL pattern: ${pattern}`);
        return true;
      }
    }

    console.log('SharePoint not detected');
    return false;
  }

  /**
   * Check if SharePoint is available
   */
  isAvailable() {
    return this._isSharePointEnvironment;
  }

  /**
   * Get SharePoint site URL
   * Extracts the site collection URL from the current page URL
   */
  _getSiteUrl() {
    // Use _spPageContextInfo if available
    if (typeof _spPageContextInfo !== 'undefined') {
      return _spPageContextInfo.webAbsoluteUrl;
    }

    // Extract site URL from current location
    const url = window.location.href;
    const hostname = window.location.origin;

    // Try to extract site collection URL (e.g., /sites/EMPC0872)
    const sitesMatch = url.match(/(https?:\/\/[^\/]+\/sites\/[^\/]+)/i);
    if (sitesMatch) {
      console.log('Site URL extracted from /sites/ pattern:', sitesMatch[1]);
      return sitesMatch[1];
    }

    // Try to match corporate SharePoint pattern
    const corpMatch = url.match(/(https?:\/\/[^\/]+)/i);
    if (corpMatch && this._isSharePointEnvironment) {
      // For URLs like ishareteam2.na.xom.com/sites/EMPC0872/...
      const pathMatch = url.match(/(https?:\/\/[^\/]+\/sites\/[^\/]+)/i);
      if (pathMatch) {
        console.log('Site URL extracted:', pathMatch[1]);
        return pathMatch[1];
      }
    }

    console.log('Using origin as site URL:', hostname);
    return hostname;
  }

  /**
   * Set the document library name
   */
  setLibraryName(name) {
    this.libraryName = name;
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    if (typeof _spPageContextInfo !== 'undefined') {
      return {
        id: _spPageContextInfo.userId,
        loginName: _spPageContextInfo.userLoginName,
        displayName: _spPageContextInfo.userDisplayName || 'Unknown User'
      };
    }
    return { id: 0, loginName: 'anonymous', displayName: 'Anonymous' };
  }

  /**
   * Get Request Digest for write operations
   */
  async getRequestDigest() {
    if (this.digestValue && this.digestExpiry && new Date() < this.digestExpiry) {
      return this.digestValue;
    }

    const digestElement = document.getElementById('__REQUESTDIGEST');
    if (digestElement && digestElement.value) {
      this.digestValue = digestElement.value;
      this.digestExpiry = new Date(Date.now() + 1800000);
      return this.digestValue;
    }

    try {
      const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose' },
        credentials: 'same-origin'
      });

      const data = await response.json();
      this.digestValue = data.d.GetContextWebInformation.FormDigestValue;
      const timeoutSeconds = data.d.GetContextWebInformation.FormDigestTimeoutSeconds;
      this.digestExpiry = new Date(Date.now() + (timeoutSeconds * 1000) - 60000);

      return this.digestValue;
    } catch (error) {
      console.error('Failed to get request digest:', error);
      throw error;
    }
  }

  // ========================================
  // FILE OPERATIONS
  // ========================================

  /**
   * Read a JSON file from the document library
   */
  async readFile(fileName) {
    const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${this.libraryName}')/Files('${fileName}')/$value`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (response.status === 404) {
        // File doesn't exist, return null
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.status}`);
      }

      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('does not exist')) {
        return null;
      }
      console.error(`Error reading ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Write a JSON file to the document library
   */
  async writeFile(fileName, data) {
    const digest = await this.getRequestDigest();
    const jsonContent = JSON.stringify(data, null, 2);

    // Use Add with overwrite=true
    const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${this.libraryName}')/Files/Add(url='${fileName}',overwrite=true)`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json',
          'X-RequestDigest': digest
        },
        body: jsonContent,
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to write file: ${response.status} - ${errorText}`);
      }

      return { success: true, fileName };
    } catch (error) {
      console.error(`Error writing ${fileName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file from the document library
   */
  async deleteFile(fileName) {
    const digest = await this.getRequestDigest();
    const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${this.libraryName}')/Files('${fileName}')`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE'
        },
        credentials: 'same-origin'
      });

      return { success: response.ok };
    } catch (error) {
      console.error(`Error deleting ${fileName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if the document library exists
   */
  async checkLibraryExists() {
    const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${this.libraryName}')`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json;odata=verbose' },
        credentials: 'same-origin'
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ========================================
  // DATA OPERATIONS
  // ========================================

  /**
   * Get all meetings
   */
  async getMeetings() {
    try {
      const data = await this.readFile('meetings.json');
      return data || [];
    } catch (error) {
      console.error('Error getting meetings:', error);
      return [];
    }
  }

  /**
   * Save meetings
   */
  async saveMeetings(meetings) {
    return await this.writeFile('meetings.json', meetings);
  }

  /**
   * Add a single meeting
   */
  async addMeeting(meeting) {
    try {
      const meetings = await this.getMeetings();

      // Add timestamp if not present
      if (!meeting.timestamp) {
        meeting.timestamp = new Date().toISOString();
      }

      meetings.push(meeting);
      const result = await this.saveMeetings(meetings);

      return {
        success: result.success,
        meeting: meeting
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all attendees/people
   */
  async getAttendees() {
    try {
      const data = await this.readFile('attendees.json');
      return data || [];
    } catch (error) {
      console.error('Error getting attendees:', error);
      return [];
    }
  }

  /**
   * Save attendees
   */
  async saveAttendees(attendees) {
    return await this.writeFile('attendees.json', attendees);
  }

  /**
   * Get past meetings
   */
  async getPastMeetings() {
    try {
      const data = await this.readFile('past-meetings.json');
      return data || [];
    } catch (error) {
      console.error('Error getting past meetings:', error);
      return [];
    }
  }

  /**
   * Save past meetings
   */
  async savePastMeetings(meetings) {
    return await this.writeFile('past-meetings.json', meetings);
  }

  /**
   * Get LTI Master List
   */
  async getLTIMasterList() {
    try {
      const data = await this.readFile('lti-master-list.json');
      return data || [];
    } catch (error) {
      console.error('Error getting LTI master list:', error);
      return [];
    }
  }

  /**
   * Save LTI Master List
   */
  async saveLTIMasterList(items) {
    return await this.writeFile('lti-master-list.json', items);
  }

  /**
   * Add a single attendee
   */
  async addAttendee(attendee) {
    try {
      const attendees = await this.getAttendees();

      // Normalize attendee data
      const person = typeof attendee === 'string' ? { name: attendee } : attendee;

      // Check for duplicate
      const exists = attendees.some(a =>
        (typeof a === 'string' && a === person.name) ||
        (typeof a === 'object' && a.name === person.name)
      );

      if (exists) {
        return { success: true, duplicate: true };
      }

      attendees.push(person);
      const result = await this.saveAttendees(attendees);

      return {
        success: result.success,
        duplicate: false,
        attendee: person
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current meeting data
   */
  async getCurrentMeeting() {
    try {
      return await this.readFile('current-meeting.json');
    } catch (error) {
      return null;
    }
  }

  /**
   * Save current meeting data
   */
  async saveCurrentMeeting(meetingData) {
    return await this.writeFile('current-meeting.json', meetingData);
  }

  /**
   * Get isolations for current meeting
   */
  async getIsolations() {
    try {
      const data = await this.readFile('current-isolations.json');
      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save isolations
   */
  async saveIsolations(isolations) {
    return await this.writeFile('current-isolations.json', isolations);
  }

  /**
   * Get meeting responses
   */
  async getResponses() {
    try {
      const data = await this.readFile('current-responses.json');
      return data || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Save meeting responses
   */
  async saveResponses(responses) {
    return await this.writeFile('current-responses.json', responses);
  }

  // ========================================
  // BACKUP & SYNC
  // ========================================

  /**
   * Create full backup
   */
  async createBackup() {
    try {
      const [meetings, attendees, currentMeeting, isolations, responses] = await Promise.all([
        this.getMeetings(),
        this.getAttendees(),
        this.getCurrentMeeting(),
        this.getIsolations(),
        this.getResponses()
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        source: 'SharePoint Document Library',
        data: {
          meetings,
          attendees,
          currentMeeting,
          isolations,
          responses
        }
      };

      // Also save backup file to SharePoint
      const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await this.writeFile(backupFileName, backup);

      return { success: true, backup, backupFileName };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupData) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup data');
      }

      const { data } = backupData;

      await Promise.all([
        data.meetings && this.saveMeetings(data.meetings),
        data.attendees && this.saveAttendees(data.attendees),
        data.currentMeeting && this.saveCurrentMeeting(data.currentMeeting),
        data.isolations && this.saveIsolations(data.isolations),
        data.responses && this.saveResponses(data.responses)
      ]);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync from localStorage to SharePoint
   */
  async syncFromLocalStorage() {
    try {
      console.log('📤 Starting SharePoint sync...');

      // Read from localStorage - ALL data sources
      const localMeetings = JSON.parse(localStorage.getItem('savedMeetings') || '[]');
      const localPastMeetings = JSON.parse(localStorage.getItem('pastMeetings') || '[]');
      const localPeople = JSON.parse(localStorage.getItem('savedPeople') || '[]');
      const localMeetingPeople = JSON.parse(localStorage.getItem('meetingPeople') || '[]');
      const localLTIMasterList = JSON.parse(localStorage.getItem('ltiMasterList') || '[]');
      const localCurrentMeeting = JSON.parse(localStorage.getItem('currentMeetingInfo') || 'null');
      const localIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations') || '[]');
      const localResponses = JSON.parse(localStorage.getItem('currentMeetingResponses') || '{}');

      console.log('📦 Local data to sync:', {
        savedMeetings: localMeetings.length,
        pastMeetings: localPastMeetings.length,
        savedPeople: localPeople.length,
        meetingPeople: localMeetingPeople.length,
        ltiMasterList: localLTIMasterList.length,
        currentIsolations: localIsolations.length,
        currentResponses: Object.keys(localResponses).length
      });

      // Merge with SharePoint data
      const [spMeetings, spPastMeetings, spPeople, spLTIMasterList] = await Promise.all([
        this.getMeetings(),
        this.getPastMeetings(),
        this.getAttendees(),
        this.getLTIMasterList()
      ]);

      // Combine saved meetings (avoid duplicates by timestamp or id)
      const allMeetings = [...spMeetings];
      for (const localMeeting of localMeetings) {
        const exists = spMeetings.some(m =>
          m.timestamp === localMeeting.timestamp || m.id === localMeeting.id
        );
        if (!exists) {
          allMeetings.push(localMeeting);
        }
      }

      // Combine past meetings (avoid duplicates by timestamp or id)
      const allPastMeetings = [...spPastMeetings];
      for (const localMeeting of localPastMeetings) {
        const exists = spPastMeetings.some(m =>
          m.timestamp === localMeeting.timestamp || m.id === localMeeting.id
        );
        if (!exists) {
          allPastMeetings.push(localMeeting);
        }
      }

      // Combine attendees (avoid duplicates by name)
      const allPeople = [...spPeople];
      const combinedLocalPeople = [...localPeople, ...localMeetingPeople];
      for (const localPerson of combinedLocalPeople) {
        const name = typeof localPerson === 'string' ? localPerson : localPerson.name;
        const exists = allPeople.some(p =>
          (typeof p === 'string' ? p : p.name) === name
        );
        if (!exists) {
          allPeople.push(localPerson);
        }
      }

      // Combine LTI Master List (avoid duplicates by id)
      const allLTIMasterList = [...spLTIMasterList];
      for (const localItem of localLTIMasterList) {
        const itemId = localItem.id || localItem.ID || localItem['LTI Number'];
        const exists = spLTIMasterList.some(item =>
          (item.id || item.ID || item['LTI Number']) === itemId
        );
        if (!exists) {
          allLTIMasterList.push(localItem);
        }
      }

      console.log('📊 Merged data totals:', {
        meetings: allMeetings.length,
        pastMeetings: allPastMeetings.length,
        people: allPeople.length,
        ltiMasterList: allLTIMasterList.length
      });

      // Save merged data
      const savePromises = [
        this.saveMeetings(allMeetings),
        this.savePastMeetings(allPastMeetings),
        this.saveAttendees(allPeople),
        this.saveLTIMasterList(allLTIMasterList)
      ];

      // Only save current meeting data if it exists
      if (localCurrentMeeting) {
        savePromises.push(this.saveCurrentMeeting(localCurrentMeeting));
      }
      if (localIsolations.length > 0) {
        savePromises.push(this.saveIsolations(localIsolations));
      }
      if (Object.keys(localResponses).length > 0) {
        savePromises.push(this.saveResponses(localResponses));
      }

      await Promise.all(savePromises);

      console.log('✅ SharePoint sync complete!');

      return {
        success: true,
        synced: {
          meetings: allMeetings.length,
          pastMeetings: allPastMeetings.length,
          attendees: allPeople.length,
          ltiMasterList: allLTIMasterList.length
        }
      };
    } catch (error) {
      console.error('❌ SharePoint sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync from SharePoint to localStorage
   */
  async syncToLocalStorage() {
    try {
      console.log('📥 Loading data from SharePoint...');

      const [meetings, pastMeetings, attendees, ltiMasterList, currentMeeting, isolations, responses] = await Promise.all([
        this.getMeetings(),
        this.getPastMeetings(),
        this.getAttendees(),
        this.getLTIMasterList(),
        this.getCurrentMeeting(),
        this.getIsolations(),
        this.getResponses()
      ]);

      console.log('📦 SharePoint data loaded:', {
        meetings: meetings.length,
        pastMeetings: pastMeetings.length,
        attendees: attendees.length,
        ltiMasterList: ltiMasterList.length
      });

      // Save to localStorage
      localStorage.setItem('savedMeetings', JSON.stringify(meetings));
      localStorage.setItem('pastMeetings', JSON.stringify(pastMeetings));
      localStorage.setItem('savedPeople', JSON.stringify(attendees));
      localStorage.setItem('ltiMasterList', JSON.stringify(ltiMasterList));

      if (currentMeeting) {
        localStorage.setItem('currentMeetingInfo', JSON.stringify(currentMeeting));
      }
      if (isolations.length) {
        localStorage.setItem('currentMeetingIsolations', JSON.stringify(isolations));
      }
      if (Object.keys(responses).length) {
        localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
      }

      console.log('✅ localStorage updated from SharePoint');

      return {
        success: true,
        synced: {
          meetings: meetings.length,
          pastMeetings: pastMeetings.length,
          attendees: attendees.length,
          ltiMasterList: ltiMasterList.length
        }
      };
    } catch (error) {
      console.error('❌ Error loading from SharePoint:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
const sharePointDocumentStorage = new SharePointDocumentStorage();
export default sharePointDocumentStorage;
export { SharePointDocumentStorage };
