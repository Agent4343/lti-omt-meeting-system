/**
 * CSV Export utility for the LTI OMT Meeting System
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Column definitions [{key: 'field', label: 'Column Name'}]
 * @returns {string} CSV string
 */
export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';

  // Header row
  const header = columns.map(col => `"${col.label}"`).join(',');

  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      // Handle nested properties (e.g., 'ageInfo.display')
      if (col.key.includes('.')) {
        const keys = col.key.split('.');
        value = keys.reduce((obj, key) => obj?.[key], item);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        value = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join('; ');
      }

      // Handle objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }

      // Escape quotes and wrap in quotes
      if (value === null || value === undefined) {
        return '""';
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export meeting data to CSV
 * @param {Object} meetingData - Meeting data object
 * @returns {Object} Result with success status
 */
export const exportMeetingToCSV = (meetingData) => {
  try {
    const columns = [
      { key: 'id', label: 'Isolation ID' },
      { key: 'description', label: 'Description' },
      { key: 'plannedStartDate', label: 'Planned Start Date' },
      { key: 'ageDisplay', label: 'Age' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'mocRequired', label: 'MOC Required' },
      { key: 'mocNumber', label: 'MOC Number' },
      { key: 'mocStatus', label: 'MOC Status' },
      { key: 'actionRequired', label: 'Action Required' },
      { key: 'partsRequired', label: 'Parts Required' },
      { key: 'partsStatus', label: 'Parts Status' },
      { key: 'equipmentDisconnectionRequired', label: 'Equipment Disconnection' },
      { key: 'corrosionRisk', label: 'Corrosion Risk' },
      { key: 'deadLegsRisk', label: 'Dead Legs Risk' },
      { key: 'automationLossRisk', label: 'Automation Loss Risk' },
      { key: 'comments', label: 'Comments' }
    ];

    // Combine isolations with their responses
    const data = (meetingData.isolations || []).map(isolation => {
      const response = meetingData.responses?.[isolation.id] || {};
      return {
        id: isolation.id,
        description: isolation.description || isolation.Title || '',
        plannedStartDate: isolation['Planned Start Date'] || isolation.plannedStartDate || '',
        ageDisplay: response.ageDisplay || '',
        riskLevel: response.riskLevel || 'N/A',
        mocRequired: response.mocRequired || 'N/A',
        mocNumber: response.mocNumber || '',
        mocStatus: response.mocStatus || 'N/A',
        actionRequired: response.actionRequired || 'N/A',
        partsRequired: response.partsRequired || 'N/A',
        partsStatus: response.partsStatus || 'N/A',
        equipmentDisconnectionRequired: response.equipmentDisconnectionRequired || 'N/A',
        corrosionRisk: response.corrosionRisk || 'N/A',
        deadLegsRisk: response.deadLegsRisk || 'N/A',
        automationLossRisk: response.automationLossRisk || 'N/A',
        comments: response.comments || ''
      };
    });

    const csvContent = convertToCSV(data, columns);
    const dateStr = meetingData.date || new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `LTI-Meeting-Report-${dateStr}.csv`);

    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Export Asset Manager dashboard data to CSV
 * @param {Array} ltis - Array of LTI data
 * @param {string} filterType - Type of filter applied
 * @returns {Object} Result with success status
 */
export const exportAssetManagerToCSV = (ltis, filterType = 'all') => {
  try {
    const columns = [
      { key: 'id', label: 'LTI ID' },
      { key: 'description', label: 'Description' },
      { key: 'plannedStartDate', label: 'Start Date' },
      { key: 'ageInfo.display', label: 'Age' },
      { key: 'ageInfo.days', label: 'Age (Days)' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'mocRequired', label: 'MOC Required' },
      { key: 'mocNumber', label: 'MOC Number' },
      { key: 'mocStatus', label: 'MOC Status' },
      { key: 'actionRequired', label: 'Action Required' },
      { key: 'equipmentDisconnectionRequired', label: 'Equipment Disconnection' },
      { key: 'equipmentRemovalRequired', label: 'Equipment Removal' },
      { key: 'partsRequired', label: 'Parts Required' },
      { key: 'partsStatus', label: 'Parts Status' },
      { key: 'corrosionRisk', label: 'Corrosion Risk' },
      { key: 'deadLegsRisk', label: 'Dead Legs Risk' },
      { key: 'automationLossRisk', label: 'Automation Loss Risk' },
      { key: 'comments', label: 'Comments' },
      { key: 'meetingDate', label: 'Last Meeting Date' }
    ];

    // Process data for CSV
    const data = ltis.map(lti => ({
      ...lti,
      'ageInfo.display': lti.ageInfo?.display || '',
      'ageInfo.days': lti.ageInfo?.days || 0
    }));

    const csvContent = convertToCSV(data, columns);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `Asset-Manager-Report-${filterType}-${dateStr}.csv`);

    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, message: error.message };
  }
};
