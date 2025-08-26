/**
 * Comprehensive Test for PDF Export Isolation Data Issue
 * This test will identify why isolations are not appearing in the PDF
 */

// Mock meeting data structures to test different scenarios
const testMeetingData = {
  // Scenario 1: Enhanced data structure (version 4.0+)
  enhancedMeeting: {
    date: '2025-01-15',
    attendees: ['John Doe', 'Jane Smith'],
    isolations: [
      {
        id: 'CAHE-001-001',
        description: 'Test isolation 1',
        Title: 'Enhanced Isolation Title',
        'Planned Start Date': '2024-12-01'
      },
      {
        id: 'CAHE-001-002',
        description: 'Test isolation 2',
        plannedStartDate: '2025-01-15'
      }
    ],
    responses: {
      'CAHE-001-001': {
        riskLevel: 'High',
        mocRequired: 'Yes',
        partsRequired: 'No',
        comments: 'Critical isolation requiring immediate attention'
      },
      'CAHE-001-002': {
        riskLevel: 'Medium',
        mocRequired: 'No',
        partsRequired: 'Yes',
        comments: 'Standard isolation with parts requirement'
      }
    }
  },

  // Scenario 2: Legacy data structure
  legacyMeeting: {
    date: '2025-01-15',
    attendees: ['John Doe', 'Jane Smith'],
    responses: {
      'CAHE-002-001': {
        description: 'Legacy isolation 1',
        riskLevel: 'Critical',
        mocRequired: 'Yes',
        partsRequired: 'Yes',
        comments: 'Legacy format isolation'
      },
      'CAHE-002-002': {
        description: 'Legacy isolation 2',
        riskLevel: 'Low',
        mocRequired: 'No',
        partsRequired: 'No',
        comments: 'Low risk legacy isolation'
      }
    }
  },

  // Scenario 3: Empty/problematic data
  emptyMeeting: {
    date: '2025-01-15',
    attendees: ['John Doe']
  },

  // Scenario 4: Mixed/corrupted data
  corruptedMeeting: {
    date: '2025-01-15',
    attendees: ['John Doe'],
    isolations: null,
    responses: undefined
  }
};

// Mock PDF Export Service for testing
class TestPDFExportService {
  constructor() {
    this.testResults = [];
  }

  // Simulate the prepareTableData method
  prepareTableData(meeting) {
    console.log('\n=== PDF Export Debug Test ===');
    console.log('Meeting data received:', JSON.stringify(meeting, null, 2));
    
    const tableData = [];
    const isolations = meeting.isolations || [];
    const responses = meeting.responses || {};
    
    console.log('Isolations found:', isolations.length);
    console.log('Responses found:', Object.keys(responses).length);
    console.log('Isolations data:', isolations);
    console.log('Responses data:', responses);
    
    if (isolations.length > 0) {
      console.log('Using enhanced data structure (isolations array)');
      // New enhanced data structure
      isolations.forEach((isolation, index) => {
        console.log(`Processing isolation ${index + 1}:`, isolation);
        
        const response = responses[isolation.id] || {};
        console.log(`Response for ${isolation.id}:`, response);
        
        const plannedStartDate = isolation['Planned Start Date'] || 
                               isolation.plannedStartDate || 
                               isolation.PlannedStartDate;
        
        const rowData = [
          isolation.id || 'N/A',
          this.truncateText(isolation.description || isolation.Title || isolation.title || 'No description', 30),
          response.riskLevel || response.risk || 'N/A',
          this.calculateLTIAge(plannedStartDate),
          response.mocRequired || 'N/A',
          response.partsRequired || 'N/A',
          this.truncateText(response.comments || 'N/A', 40)
        ];
        
        console.log(`Row data for ${isolation.id}:`, rowData);
        tableData.push(rowData);
      });
    } else if (Object.keys(responses).length > 0) {
      console.log('Using legacy data structure (responses only)');
      // Legacy data structure
      Object.entries(responses).forEach(([id, response]) => {
        console.log(`Processing legacy response for ${id}:`, response);
        
        const rowData = [
          id,
          this.truncateText(response.description || 'No description', 30),
          response.riskLevel || response.risk || 'N/A',
          'N/A',
          response.mocRequired || 'N/A',
          response.partsRequired || 'N/A',
          this.truncateText(response.comments || 'N/A', 40)
        ];
        
        console.log(`Legacy row data for ${id}:`, rowData);
        tableData.push(rowData);
      });
    } else {
      console.log('❌ No isolation or response data found');
    }
    
    console.log('Final table data:', tableData);
    console.log('Table data length:', tableData.length);
    
    // Store test results
    this.testResults.push({
      meetingType: this.getMeetingType(meeting),
      isolationsCount: isolations.length,
      responsesCount: Object.keys(responses).length,
      tableDataCount: tableData.length,
      success: tableData.length > 0
    });
    
    return tableData;
  }

  getMeetingType(meeting) {
    if (meeting.isolations && meeting.isolations.length > 0) return 'Enhanced';
    if (meeting.responses && Object.keys(meeting.responses).length > 0) return 'Legacy';
    return 'Empty';
  }

  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  calculateLTIAge(plannedStartDate) {
    if (!plannedStartDate) return 'Unknown';
    
    try {
      const startDate = new Date(plannedStartDate);
      const currentDate = new Date();
      
      if (isNaN(startDate.getTime())) return 'Invalid Date';
      
      const diffTime = Math.abs(currentDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
      }
    } catch (error) {
      console.error('LTI age calculation error:', error);
      return 'Error';
    }
  }

  runAllTests() {
    console.log('\n🧪 Starting PDF Export Isolation Data Tests...\n');
    
    // Test all scenarios
    Object.entries(testMeetingData).forEach(([scenarioName, meetingData]) => {
      console.log(`\n📋 Testing Scenario: ${scenarioName}`);
      console.log('='.repeat(50));
      this.prepareTableData(meetingData);
    });

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.meetingType} Meeting: ${result.tableDataCount} rows generated`);
      console.log(`   Isolations: ${result.isolationsCount}, Responses: ${result.responsesCount}`);
    });

    // Identify issues
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n🚨 ISSUES IDENTIFIED:');
      failedTests.forEach(test => {
        console.log(`- ${test.meetingType} meeting failed to generate table data`);
      });
    } else {
      console.log('\n✅ All tests passed! PDF export should work correctly.');
    }

    return this.testResults;
  }
}

// Run the tests
const testService = new TestPDFExportService();
const results = testService.runAllTests();

// Additional diagnostic information
console.log('\n🔍 DIAGNOSTIC INFORMATION');
console.log('='.repeat(50));
console.log('Common issues that prevent isolations from appearing in PDF:');
console.log('1. Meeting data structure mismatch');
console.log('2. Missing isolation IDs');
console.log('3. Null/undefined isolation or response arrays');
console.log('4. Incorrect property names in isolation objects');
console.log('5. Response data not matching isolation IDs');

console.log('\n💡 RECOMMENDED FIXES:');
console.log('1. Add robust null/undefined checks');
console.log('2. Implement fallback data extraction methods');
console.log('3. Add data structure validation');
console.log('4. Improve error handling and logging');
console.log('5. Create data transformation utilities');

// Export results for further analysis
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testService, results, testMeetingData };
}
