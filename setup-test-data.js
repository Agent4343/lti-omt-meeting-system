/**
 * Setup Test Data for Previous Review Notification
 * This script creates mock previous meeting data in localStorage format
 * Run this in browser console to test the enhanced notification
 */

// Test data to copy-paste into browser console
const testDataScript = `
// Clear existing data
localStorage.clear();

// Create previous meeting with isolation responses
const previousMeeting = {
  id: 'meeting-001',
  name: 'LTI OMT Meeting - December 2024',
  date: '2024-12-15',
  attendees: ['Asset Manager', 'OMT Team'],
  responses: {
    'CAHE-123-001': {
      // Core Assessment
      riskLevel: 'Medium',
      mocRequired: 'Yes',
      mocNumber: 'MOC-2024-456',
      actionRequired: 'Plan Work',
      
      // Conditional Comment Fields
      riskLevelComment: 'Equipment shows signs of wear but is still functioning within acceptable parameters. Regular monitoring recommended.',
      mocRequiredComment: 'Safety modifications require formal review process due to pressure rating changes and new piping configuration.',
      actionRequiredComment: 'Schedule maintenance during next planned shutdown window in Q2. Coordinate with operations team.',
      
      // WMS Manual Risk Assessment
      corrosionRisk: 'Low',
      corrosionRiskComment: 'Minimal corrosive exposure due to protective coating applied last year. Visual inspection shows good condition.',
      deadLegsRisk: 'Medium',
      deadLegsRiskComment: 'Some stagnant areas identified in bypass lines requiring monitoring. Recommend periodic flushing.',
      automationLossRisk: 'High',
      automationLossRiskComment: 'Critical control systems affected, backup systems required. Manual operation procedures must be in place.',
      
      // General comments
      comments: 'Overall assessment indicates manageable risk with proper planning and coordination. Equipment condition is stable.',
      
      // Action items
      actionItems: [
        { description: 'Schedule inspection during shutdown', owner: 'Maintenance Team' },
        { description: 'Review backup control systems', owner: 'Automation Engineer' }
      ]
    },
    'CAHE-456-002': {
      riskLevel: 'High',
      mocRequired: 'No',
      actionRequired: 'Urgent',
      riskLevelComment: 'Critical safety concern identified requiring immediate attention.',
      actionRequiredComment: 'Immediate work order required - safety risk present.',
      corrosionRisk: 'High',
      deadLegsRisk: 'Low',
      automationLossRisk: 'Medium',
      comments: 'High priority isolation requiring urgent action.'
    }
  }
};

// Save to localStorage
localStorage.setItem('savedMeetings', JSON.stringify([previousMeeting]));

// Create current meeting isolations that include some from previous meeting
const currentIsolations = [
  {
    id: 'CAHE-123-001', // This one was in previous meeting - should trigger notification
    description: 'Heat Exchanger Isolation',
    'System/Equipment': 'CAHE-123-HX-001',
    'Planned Start Date': '2024-06-01'
  },
  {
    id: 'CAHE-789-003', // This one is new - should not trigger notification
    description: 'Pump Isolation',
    'System/Equipment': 'CAHE-789-P-003',
    'Planned Start Date': '2024-08-15'
  },
  {
    id: 'CAHE-456-002', // This one was also in previous meeting - should trigger notification
    description: 'Valve Isolation',
    'System/Equipment': 'CAHE-456-V-002',
    'Planned Start Date': '2024-05-20'
  }
];

localStorage.setItem('currentMeetingIsolations', JSON.stringify(currentIsolations));

console.log('✅ Test data created successfully!');
console.log('📋 Previous meeting data saved with 2 isolation responses');
console.log('📋 Current meeting has 3 isolations (2 should show previous review notification)');
console.log('');
console.log('🎯 TO TEST THE ENHANCED NOTIFICATION:');
console.log('1. Navigate to the Review page');
console.log('2. Look for isolations CAHE-123-001 and CAHE-456-002');
console.log('3. You should see the large blue notification card asking:');
console.log('   "Do you have any other updates required for this isolation?"');
console.log('');
console.log('🔍 Expected behavior:');
console.log('- CAHE-123-001: Shows enhanced previous review notification');
console.log('- CAHE-789-003: No notification (new isolation)');
console.log('- CAHE-456-002: Shows enhanced previous review notification');
`;

console.log('🧪 SETUP TEST DATA FOR ENHANCED PREVIOUS REVIEW NOTIFICATION');
console.log('============================================================\n');

console.log('📋 INSTRUCTIONS TO TEST THE ENHANCED NOTIFICATION:');
console.log('==================================================\n');

console.log('1. Open your browser and navigate to: http://localhost:3000');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to the Console tab');
console.log('4. Copy and paste the following script:\n');

console.log('```javascript');
console.log(testDataScript);
console.log('```\n');

console.log('5. Press Enter to execute the script');
console.log('6. Navigate to the meeting setup and create a new meeting');
console.log('7. When you get to the Review page, you should see:');
console.log('   - CAHE-123-001: Large blue notification "🔍 LTI PREVIOUSLY REVIEWED"');
console.log('   - CAHE-456-002: Large blue notification "🔍 LTI PREVIOUSLY REVIEWED"');
console.log('   - CAHE-789-003: No notification (new isolation)\n');

console.log('🎯 WHAT YOU SHOULD SEE:');
console.log('=======================');
console.log('✅ Large blue card with 3px border and shadow');
console.log('✅ Bold header: "🔍 LTI PREVIOUSLY REVIEWED"');
console.log('✅ Warning message: "⚠️ IMPORTANT: This LTI has been reviewed before"');
console.log('✅ Chips showing: "Last Review: 2024-12-15" and "REQUIRES CONFIRMATION"');
console.log('✅ Complete previous assessment data in organized sections');
console.log('✅ All conditional comment fields displayed');
console.log('✅ Direct question: "❓ Do you have any other updates required for this isolation?"');
console.log('✅ Three action buttons:');
console.log('   - "✅ No Updates Required" (Green, Large)');
console.log('   - "📝 Updates Required" (Blue, Large)');
console.log('   - "👁️ Hide Previous Data" (Outlined)\n');

console.log('🚀 THE ENHANCED NOTIFICATION IS READY TO TEST!');
