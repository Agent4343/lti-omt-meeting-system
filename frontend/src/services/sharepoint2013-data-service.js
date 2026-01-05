/**
 * SharePoint 2013 Data Service
 * Handles all CRUD operations with SharePoint Lists
 *
 * This service provides centralized data storage via SharePoint Lists,
 * solving the localStorage multi-user data sharing limitation.
 *
 * @version 1.0.0
 * @compatibility SharePoint 2013, SharePoint 2016, SharePoint Online
 */

class SharePoint2013DataService {
  constructor() {
    this.siteUrl = this._getSiteUrl();
    this.digestValue = null;
    this.digestExpiry = null;
    this._isSharePointEnvironment = this._checkSharePointEnvironment();
  }

  /**
   * Check if running in SharePoint environment
   * @returns {boolean}
   */
  _checkSharePointEnvironment() {
    return typeof _spPageContextInfo !== 'undefined';
  }

  /**
   * Check if SharePoint is available
   * @returns {boolean}
   */
  isAvailable() {
    return this._isSharePointEnvironment;
  }

  /**
   * Get SharePoint site URL from page context
   * @returns {string}
   */
  _getSiteUrl() {
    // SharePoint 2013/2016 provides _spPageContextInfo
    if (typeof _spPageContextInfo !== 'undefined') {
      return _spPageContextInfo.webAbsoluteUrl;
    }
    // Fallback for development/non-SharePoint environment
    return window.location.origin;
  }

  /**
   * Get current user information
   * @returns {Object} User info object
   */
  getCurrentUser() {
    if (typeof _spPageContextInfo !== 'undefined') {
      return {
        id: _spPageContextInfo.userId,
        loginName: _spPageContextInfo.userLoginName,
        displayName: _spPageContextInfo.userDisplayName || 'Unknown User',
        email: _spPageContextInfo.userEmail || ''
      };
    }
    return {
      id: 0,
      loginName: 'anonymous',
      displayName: 'Anonymous',
      email: ''
    };
  }

  /**
   * Get Request Digest for POST operations
   * SharePoint 2013 requires this for write operations
   * @returns {Promise<string>}
   */
  async getRequestDigest() {
    // Check if we have a valid cached digest
    if (this.digestValue && this.digestExpiry && new Date() < this.digestExpiry) {
      return this.digestValue;
    }

    // Try to get from page element first (faster)
    const digestElement = document.getElementById('__REQUESTDIGEST');
    if (digestElement && digestElement.value) {
      this.digestValue = digestElement.value;
      this.digestExpiry = new Date(Date.now() + 1800000); // 30 minutes
      return this.digestValue;
    }

    // Request new digest from SharePoint
    try {
      const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to get context info: ${response.status}`);
      }

      const data = await response.json();
      this.digestValue = data.d.GetContextWebInformation.FormDigestValue;

      // Parse expiry from digest timeout
      const timeoutSeconds = data.d.GetContextWebInformation.FormDigestTimeoutSeconds;
      this.digestExpiry = new Date(Date.now() + (timeoutSeconds * 1000) - 60000); // 1 min buffer

      return this.digestValue;
    } catch (error) {
      console.error('Failed to get request digest:', error);
      throw error;
    }
  }

  /**
   * Generic REST API call method
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {string} method - HTTP method
   * @param {Object} data - Request body data
   * @returns {Promise<Object>}
   */
  async callRestApi(endpoint, method = 'GET', data = null) {
    const headers = {
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose'
    };

    // Add request digest for write operations
    if (method !== 'GET') {
      headers['X-RequestDigest'] = await this.getRequestDigest();
    }

    // SharePoint 2013 tunnels MERGE/DELETE through POST
    let actualMethod = method;
    if (method === 'MERGE' || method === 'DELETE') {
      headers['IF-MATCH'] = '*';
      headers['X-HTTP-Method'] = method;
      actualMethod = 'POST';
    }

    const config = {
      method: actualMethod,
      headers: headers,
      credentials: 'same-origin'
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.siteUrl}/_api/${endpoint}`;

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SharePoint API error: ${response.status} - ${errorText}`);
      }

      // Handle empty responses (DELETE operations)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('SharePoint REST API error:', error);
      throw error;
    }
  }

  // ========================================
  // MEETINGS OPERATIONS
  // ========================================

  /**
   * Get all meetings from SharePoint list
   * @param {number} limit - Maximum number of meetings to retrieve
   * @returns {Promise<Array>}
   */
  async getMeetings(limit = 100) {
    const endpoint = `web/lists/getbytitle('Meetings')/items?$select=Id,Title,Description,Attendees,Status,MeetingData,IsolationCount,Created,Modified,Author/Title&$expand=Author&$orderby=Created desc&$top=${limit}`;

    try {
      const result = await this.callRestApi(endpoint);
      return result.d.results.map(item => this._mapMeetingFromSharePoint(item));
    } catch (error) {
      console.error('Failed to get meetings:', error);
      throw error;
    }
  }

  /**
   * Get a single meeting by ID
   * @param {number} meetingId - SharePoint list item ID
   * @returns {Promise<Object>}
   */
  async getMeetingById(meetingId) {
    const endpoint = `web/lists/getbytitle('Meetings')/items(${meetingId})?$select=Id,Title,Description,Attendees,Status,MeetingData,IsolationCount,Created,Modified,Author/Title&$expand=Author`;

    try {
      const result = await this.callRestApi(endpoint);
      return this._mapMeetingFromSharePoint(result.d);
    } catch (error) {
      console.error('Failed to get meeting:', error);
      throw error;
    }
  }

  /**
   * Save a meeting to SharePoint
   * @param {Object} meetingData - Meeting data object
   * @returns {Promise<Object>}
   */
  async saveMeeting(meetingData) {
    // Get the list item entity type
    const listItemType = await this._getListItemEntityType('Meetings');

    const listItem = {
      __metadata: { type: listItemType },
      Title: meetingData.date || new Date().toISOString().split('T')[0],
      Description: meetingData.description || '',
      Attendees: JSON.stringify(meetingData.attendees || []),
      Status: meetingData.status || 'Planned',
      MeetingData: JSON.stringify(meetingData),
      IsolationCount: meetingData.isolations?.length || 0
    };

    try {
      const result = await this.callRestApi(
        "web/lists/getbytitle('Meetings')/items",
        'POST',
        listItem
      );

      return {
        success: true,
        id: result.d.Id,
        data: this._mapMeetingFromSharePoint(result.d)
      };
    } catch (error) {
      console.error('Failed to save meeting to SharePoint:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing meeting
   * @param {number} meetingId - SharePoint list item ID
   * @param {Object} meetingData - Updated meeting data
   * @returns {Promise<Object>}
   */
  async updateMeeting(meetingId, meetingData) {
    const listItemType = await this._getListItemEntityType('Meetings');

    const listItem = {
      __metadata: { type: listItemType },
      Title: meetingData.date,
      Description: meetingData.description || '',
      Attendees: JSON.stringify(meetingData.attendees || []),
      Status: meetingData.status || 'In Progress',
      MeetingData: JSON.stringify(meetingData),
      IsolationCount: meetingData.isolations?.length || 0
    };

    try {
      await this.callRestApi(
        `web/lists/getbytitle('Meetings')/items(${meetingId})`,
        'MERGE',
        listItem
      );

      return { success: true, id: meetingId };
    } catch (error) {
      console.error('Failed to update meeting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a meeting
   * @param {number} meetingId - SharePoint list item ID
   * @returns {Promise<Object>}
   */
  async deleteMeeting(meetingId) {
    try {
      await this.callRestApi(
        `web/lists/getbytitle('Meetings')/items(${meetingId})`,
        'DELETE'
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // ISOLATIONS OPERATIONS
  // ========================================

  /**
   * Get isolations from SharePoint list
   * @param {number} meetingId - Optional meeting ID filter
   * @returns {Promise<Array>}
   */
  async getIsolations(meetingId = null) {
    let endpoint = `web/lists/getbytitle('Isolations')/items?$select=Id,Title,Description,PlannedStartDate,RiskLevel,Status,MeetingId,RelatedIsolations,MOCRequired,PartsRequired,Comments,Created,Modified&$orderby=Title&$top=1000`;

    if (meetingId) {
      endpoint += `&$filter=MeetingId eq ${meetingId}`;
    }

    try {
      const result = await this.callRestApi(endpoint);
      return result.d.results.map(item => this._mapIsolationFromSharePoint(item));
    } catch (error) {
      console.error('Failed to get isolations:', error);
      throw error;
    }
  }

  /**
   * Save isolation to SharePoint
   * @param {Object} isolationData - Isolation data object
   * @param {number} meetingId - Associated meeting ID
   * @returns {Promise<Object>}
   */
  async saveIsolation(isolationData, meetingId) {
    const listItemType = await this._getListItemEntityType('Isolations');

    const listItem = {
      __metadata: { type: listItemType },
      Title: isolationData.id || isolationData['Isolation Certificate'] || '',
      Description: isolationData.description || isolationData.Title || isolationData.title || '',
      PlannedStartDate: this._formatDateForSharePoint(
        isolationData['Planned Start Date'] || isolationData.plannedStartDate
      ),
      RiskLevel: isolationData.riskLevel || 'Medium',
      Status: 'Active',
      MeetingId: meetingId,
      RelatedIsolations: JSON.stringify(isolationData.relatedIsolations || []),
      MOCRequired: isolationData.mocRequired ? 'Yes' : 'No',
      PartsRequired: isolationData.partsRequired ? 'Yes' : 'No',
      Comments: isolationData.comments || ''
    };

    try {
      const result = await this.callRestApi(
        "web/lists/getbytitle('Isolations')/items",
        'POST',
        listItem
      );

      return { success: true, id: result.d.Id };
    } catch (error) {
      console.error('Failed to save isolation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save multiple isolations in batch
   * @param {Array} isolations - Array of isolation data objects
   * @param {number} meetingId - Associated meeting ID
   * @returns {Promise<Array>}
   */
  async saveIsolationsBatch(isolations, meetingId) {
    const results = [];

    // SharePoint 2013 has limited batch support, process in chunks
    const chunkSize = 10;
    for (let i = 0; i < isolations.length; i += chunkSize) {
      const chunk = isolations.slice(i, i + chunkSize);
      const promises = chunk.map(isolation =>
        this.saveIsolation(isolation, meetingId)
      );

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Update isolation response data
   * @param {number} isolationId - SharePoint list item ID
   * @param {Object} responseData - Response/review data
   * @returns {Promise<Object>}
   */
  async updateIsolationResponse(isolationId, responseData) {
    const listItemType = await this._getListItemEntityType('Isolations');

    const listItem = {
      __metadata: { type: listItemType },
      RiskLevel: responseData.riskLevel || responseData.risk,
      Status: responseData.status || 'Under Review',
      MOCRequired: responseData.mocRequired,
      PartsRequired: responseData.partsRequired,
      Comments: responseData.comments || responseData.narrative || ''
    };

    try {
      await this.callRestApi(
        `web/lists/getbytitle('Isolations')/items(${isolationId})`,
        'MERGE',
        listItem
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to update isolation:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // ATTENDEES OPERATIONS
  // ========================================

  /**
   * Get all attendees from SharePoint list
   * @returns {Promise<Array>}
   */
  async getAttendees() {
    const endpoint = `web/lists/getbytitle('Attendees')/items?$select=Id,Title,Email,Department,Role,Active&$filter=Active eq 1&$orderby=Title&$top=500`;

    try {
      const result = await this.callRestApi(endpoint);
      return result.d.results.map(item => ({
        id: item.Id,
        name: item.Title,
        email: item.Email || '',
        department: item.Department || 'Operations',
        role: item.Role || 'Reviewer',
        active: item.Active
      }));
    } catch (error) {
      console.error('Failed to get attendees:', error);
      throw error;
    }
  }

  /**
   * Add new attendee to shared list
   * @param {Object} attendeeData - Attendee data object
   * @returns {Promise<Object>}
   */
  async addAttendee(attendeeData) {
    const listItemType = await this._getListItemEntityType('Attendees');

    const listItem = {
      __metadata: { type: listItemType },
      Title: attendeeData.name || attendeeData,
      Email: attendeeData.email || '',
      Department: attendeeData.department || 'Operations',
      Role: attendeeData.role || 'Reviewer',
      Active: true
    };

    try {
      const result = await this.callRestApi(
        "web/lists/getbytitle('Attendees')/items",
        'POST',
        listItem
      );

      return {
        success: true,
        id: result.d.Id,
        data: {
          id: result.d.Id,
          name: result.d.Title,
          email: result.d.Email,
          department: result.d.Department,
          role: result.d.Role
        }
      };
    } catch (error) {
      console.error('Failed to add attendee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update attendee information
   * @param {number} attendeeId - SharePoint list item ID
   * @param {Object} attendeeData - Updated attendee data
   * @returns {Promise<Object>}
   */
  async updateAttendee(attendeeId, attendeeData) {
    const listItemType = await this._getListItemEntityType('Attendees');

    const listItem = {
      __metadata: { type: listItemType },
      Title: attendeeData.name,
      Email: attendeeData.email || '',
      Department: attendeeData.department,
      Role: attendeeData.role,
      Active: attendeeData.active !== false
    };

    try {
      await this.callRestApi(
        `web/lists/getbytitle('Attendees')/items(${attendeeId})`,
        'MERGE',
        listItem
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to update attendee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate attendee (soft delete)
   * @param {number} attendeeId - SharePoint list item ID
   * @returns {Promise<Object>}
   */
  async deactivateAttendee(attendeeId) {
    const listItemType = await this._getListItemEntityType('Attendees');

    const listItem = {
      __metadata: { type: listItemType },
      Active: false
    };

    try {
      await this.callRestApi(
        `web/lists/getbytitle('Attendees')/items(${attendeeId})`,
        'MERGE',
        listItem
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to deactivate attendee:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // ACTION ITEMS OPERATIONS
  // ========================================

  /**
   * Get action items from SharePoint list
   * @param {number} meetingId - Optional meeting ID filter
   * @returns {Promise<Array>}
   */
  async getActionItems(meetingId = null) {
    let endpoint = `web/lists/getbytitle('Action Items')/items?$select=Id,Title,DueDate,Priority,Status,MeetingId,IsolationId,Comments,AssignedTo/Title&$expand=AssignedTo&$orderby=DueDate&$top=500`;

    if (meetingId) {
      endpoint += `&$filter=MeetingId eq ${meetingId}`;
    }

    try {
      const result = await this.callRestApi(endpoint);
      return result.d.results.map(item => ({
        id: item.Id,
        title: item.Title,
        dueDate: item.DueDate,
        priority: item.Priority,
        status: item.Status,
        meetingId: item.MeetingId,
        isolationId: item.IsolationId,
        comments: item.Comments,
        assignedTo: item.AssignedTo?.Title || ''
      }));
    } catch (error) {
      console.error('Failed to get action items:', error);
      throw error;
    }
  }

  /**
   * Create action item
   * @param {Object} actionItemData - Action item data
   * @returns {Promise<Object>}
   */
  async createActionItem(actionItemData) {
    const listItemType = await this._getListItemEntityType('Action Items');

    const listItem = {
      __metadata: { type: listItemType },
      Title: actionItemData.title || actionItemData.description,
      DueDate: this._formatDateForSharePoint(actionItemData.dueDate),
      Priority: actionItemData.priority || 'Medium',
      Status: actionItemData.status || 'Open',
      MeetingId: actionItemData.meetingId,
      IsolationId: actionItemData.isolationId || '',
      Comments: actionItemData.comments || ''
    };

    try {
      const result = await this.callRestApi(
        "web/lists/getbytitle('Action Items')/items",
        'POST',
        listItem
      );

      return { success: true, id: result.d.Id };
    } catch (error) {
      console.error('Failed to create action item:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get list item entity type name (required for POST operations)
   * @param {string} listName - SharePoint list name
   * @returns {Promise<string>}
   */
  async _getListItemEntityType(listName) {
    try {
      const result = await this.callRestApi(
        `web/lists/getbytitle('${listName}')?$select=ListItemEntityTypeFullName`
      );
      return result.d.ListItemEntityTypeFullName;
    } catch (error) {
      // Fallback to standard naming convention
      return `SP.Data.${listName.replace(/\s/g, '_x0020_')}ListItem`;
    }
  }

  /**
   * Map SharePoint meeting item to application format
   * @param {Object} item - SharePoint list item
   * @returns {Object}
   */
  _mapMeetingFromSharePoint(item) {
    return {
      id: item.Id,
      sharePointId: item.Id,
      date: item.Title,
      description: item.Description || '',
      attendees: this._safeJsonParse(item.Attendees, []),
      status: item.Status || 'Planned',
      isolationCount: item.IsolationCount || 0,
      meetingData: this._safeJsonParse(item.MeetingData, {}),
      created: item.Created ? new Date(item.Created) : null,
      modified: item.Modified ? new Date(item.Modified) : null,
      createdBy: item.Author?.Title || ''
    };
  }

  /**
   * Map SharePoint isolation item to application format
   * @param {Object} item - SharePoint list item
   * @returns {Object}
   */
  _mapIsolationFromSharePoint(item) {
    return {
      id: item.Title,
      sharePointId: item.Id,
      description: item.Description || '',
      'Planned Start Date': item.PlannedStartDate,
      plannedStartDate: item.PlannedStartDate,
      riskLevel: item.RiskLevel || 'Medium',
      status: item.Status || 'Active',
      meetingId: item.MeetingId,
      relatedIsolations: this._safeJsonParse(item.RelatedIsolations, []),
      mocRequired: item.MOCRequired === 'Yes',
      partsRequired: item.PartsRequired === 'Yes',
      comments: item.Comments || ''
    };
  }

  /**
   * Safe JSON parse with fallback
   * @param {string} jsonString - JSON string to parse
   * @param {*} fallback - Fallback value on error
   * @returns {*}
   */
  _safeJsonParse(jsonString, fallback) {
    try {
      return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Format date for SharePoint REST API
   * @param {string|Date} date - Date to format
   * @returns {string|null}
   */
  _formatDateForSharePoint(date) {
    if (!date) return null;

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toISOString();
    } catch (error) {
      return null;
    }
  }

  // ========================================
  // DATA SYNC UTILITIES
  // ========================================

  /**
   * Sync localStorage data to SharePoint
   * Use this to migrate existing local data to SharePoint
   * @returns {Promise<Object>}
   */
  async syncLocalStorageToSharePoint() {
    const results = {
      meetings: { success: 0, failed: 0, errors: [] },
      attendees: { success: 0, failed: 0, errors: [] }
    };

    // Sync meetings
    try {
      const localMeetings = JSON.parse(localStorage.getItem('savedMeetings') || '[]');
      for (const meeting of localMeetings) {
        try {
          const result = await this.saveMeeting(meeting);
          if (result.success) {
            results.meetings.success++;
          } else {
            results.meetings.failed++;
            results.meetings.errors.push(result.error);
          }
        } catch (error) {
          results.meetings.failed++;
          results.meetings.errors.push(error.message);
        }
      }
    } catch (error) {
      console.error('Error syncing meetings:', error);
    }

    // Sync attendees
    try {
      const localAttendees = JSON.parse(localStorage.getItem('savedPeople') || '[]');
      for (const attendee of localAttendees) {
        try {
          const result = await this.addAttendee(attendee);
          if (result.success) {
            results.attendees.success++;
          } else {
            results.attendees.failed++;
            results.attendees.errors.push(result.error);
          }
        } catch (error) {
          results.attendees.failed++;
          results.attendees.errors.push(error.message);
        }
      }
    } catch (error) {
      console.error('Error syncing attendees:', error);
    }

    return results;
  }

  /**
   * Check if SharePoint lists exist
   * @returns {Promise<Object>}
   */
  async checkListsExist() {
    const lists = ['Meetings', 'Isolations', 'Attendees', 'Action Items'];
    const results = {};

    for (const listName of lists) {
      try {
        await this.callRestApi(`web/lists/getbytitle('${listName}')?$select=Id`);
        results[listName] = true;
      } catch (error) {
        results[listName] = false;
      }
    }

    return results;
  }
}

// Export singleton instance
const sharePoint2013DataService = new SharePoint2013DataService();
export default sharePoint2013DataService;

// Also export the class for testing
export { SharePoint2013DataService };
