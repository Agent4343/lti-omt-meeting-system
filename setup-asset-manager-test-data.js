/**
 * Setup Test Data for Asset Manager Dashboard
 * This script creates mock meeting data with LTIs over 6 months old
 * Run this in browser console to populate Asset Manager Dashboard metrics
 */

// Test data to copy-paste into browser console
const assetManagerTestDataScript = `
// Clear existing data
localStorage.clear();

// Create meetings with LTIs of various ages (6+ months old)
const meetingsWithAgedLTIs = [
  {
    id: 'meeting-001',
    name: 'LTI OMT Meeting - June 2023',
    date: '2023-06-15',
    attendees: ['Asset Manager', 'OMT Team', 'Operations Manager'],
    responses: {
      'CAHE-001-OLD': {
        riskLevel: 'High',
        mocRequired: 'Yes',
        mocStatus: 'In Progress',
        mocNumber: 'MOC-2023-001',
        actionRequired: 'Plan Work',
        equipmentIssues: 'Yes',
        equipmentDisconnect: 'Yes',
        equipmentRemove: 'No',
        riskLevelComment: 'Long-term isolation with corrosion concerns',
        mocRequiredComment: 'Safety modifications required for extended isolation',
        actionRequiredComment: 'Coordinate with maintenance team for equipment work',
        corrosionRisk: 'High',
        deadLegsRisk: 'Medium',
        automationLossRisk: 'Low',
        comments: 'Critical long-term isolation requiring Asset Manager review',
        actionItems: [
          { description: 'Complete MOC documentation', owner: 'Engineering Team' },
          { description: 'Schedule equipment disconnection', owner: 'Maintenance Team' }
        ]
      },
      'CAHE-002-OLD': {
        riskLevel: 'Medium',
        mocRequired: 'Yes',
        mocStatus: 'Completed',
        mocNumber: 'MOC-2023-002',
        actionRequired: 'Monitor',
        equipmentIssues: 'No',
        riskLevelComment: 'Stable isolation with regular monitoring',
        mocRequiredComment: 'MOC completed successfully',
        actionRequiredComment: 'Continue monitoring per schedule',
        corrosionRisk: 'Low',
        deadLegsRisk: 'Low',
        automationLossRisk: 'Medium',
        comments: 'Well-managed long-term isolation'
      }
    }
  },
  {
    id: 'meeting-002',
    name: 'LTI OMT Meeting - January 2023',
    date: '2023-01-20',
    attendees: ['Asset Manager', 'OMT Team', 'Safety Manager'],
    responses: {
      'CAHE-003-VERY-OLD': {
        riskLevel: 'High',
        mocRequired: 'Yes',
        mocStatus: 'Required',
        actionRequired: 'Urgent',
        equipmentIssues: 'Yes',
        equipmentDisconnect: 'Yes',
        equipmentRemove: 'Yes',
        riskLevelComment: 'Very long-term isolation - over 2 years old',
        mocRequiredComment: 'MOC required but not yet submitted',
        actionRequiredComment: 'Urgent action needed - exceeds acceptable timeframe',
        corrosionRisk: 'High',
        deadLegsRisk: 'High',
        automationLossRisk: 'High',
        comments: 'CRITICAL: This isolation has been active for over 2 years and requires immediate Asset Manager attention',
        actionItems: [
          { description: 'Immediate MOC submission required', owner: 'Engineering Manager' },
          { description: 'Equipment removal planning', owner: 'Asset Manager' },
          { description: 'Risk assessment update', owner: 'Safety Team' }
        ]
      },
      'CAHE-004-OLD': {
        riskLevel: 'Medium',
        mocRequired: 'No',
        actionRequired: 'Plan Work',
        equipmentIssues: 'Yes',
        equipmentDisconnect: 'No',
        equipmentRemove: 'Yes',
        riskLevelComment: 'Long-term isolation with equipment removal planned',
        actionRequiredComment: 'Equipment removal scheduled for next shutdown',
        corrosionRisk: 'Medium',
        deadLegsRisk: 'Low',
        automationLossRisk: 'Low',
        comments: 'Planned equipment removal will resolve this long-term isolation'
      }
    }
  },
  {
    id: 'meeting-003',
    name: 'LTI OMT Meeting - March 2024',
    date: '2024-03-10',
    attendees: ['Asset Manager', 'OMT Team'],
    responses: {
      'CAHE-005-MEDIUM': {
        riskLevel: 'Low',
        mocRequired: 'Yes',
        mocStatus: 'Submitted',
        mocNumber: 'MOC-2024-005',
        actionRequired: 'Monitor',
        equipmentIssues: 'No',
        riskLevelComment: '10-month isolation with good management',
        mocRequiredComment: 'MOC submitted and under review',
        actionRequiredComment: 'Continue monitoring while MOC is processed',
        corrosionRisk: 'Low',
        deadLegsRisk: 'Medium',
        automationLossRisk: 'Low',
        comments: 'Well-managed isolation approaching 1 year'
      }
    }
  }
];

// Save meetings to localStorage
localStorage.setItem('savedMeetings', JSON.stringify(meetingsWithAgedLTIs));

// Create current meeting isolations with proper aged dates
const currentIsolationsWithAges = [
  {
    id: 'CAHE-001-OLD',
    description: 'Heat Exchanger Long-term Isolation',
    'System/Equipment': 'CAHE-001-HX-001',
    'Planned Start Date': '2023-06-01', // 19+ months old
    'Risk Level': 'High',
    'MOC Required': 'Yes',
    'Equipment Issues': 'Yes'
  },
  {
    id: 'CAHE-002-OLD',
    description: 'Pump Isolation - Extended',
    'System/Equipment': 'CAHE-002-P-001',
    'Planned Start Date': '2023-07-15', // 18+ months old
    'Risk Level': 'Medium',
    'MOC Required': 'Yes',
    'Equipment Issues': 'No'
  },
  {
    id: 'CAHE-003-VERY-OLD',
    description: 'Critical Valve Isolation',
    'System/Equipment': 'CAHE-003-V-001',
    'Planned Start Date': '2022-12-01', // 25+ months old (over 2 years!)
    'Risk Level': 'High',
    'MOC Required': 'Yes',
    'Equipment Issues': 'Yes'
  },
  {
    id: 'CAHE-004-OLD',
    description: 'Piping Section Isolation',
    'System/Equipment': 'CAHE-004-P-002',
    'Planned Start Date': '2023-01-20', // 24+ months old
    'Risk Level': 'Medium',
    'MOC Required': 'No',
    'Equipment Issues': 'Yes'
  },
  {
    id: 'CAHE-005-MEDIUM',
    description: 'Instrument Isolation',
    'System/Equipment': 'CAHE-005-I-001',
    'Planned Start Date': '2024-03-01', // 10+ months old
    'Risk Level': 'Low',
    'MOC Required': 'Yes',
    'Equipment Issues': 'No'
  },
  {
    id: 'CAHE-006-RECENT',
    description: 'New Valve Isolation',
    'System/Equipment': 'CAHE-006-V-002',
    'Planned Start Date': '2024-11-01', // 2+ months old (should NOT appear in 6+ month list)
    'Risk Level': 'Low',
    'MOC Required': 'No',
    'Equipment Issues': 'No'
  },
  {
    id: 'CAHE-007-BORDERLINE',
    description: 'Compressor Isolation',
    'System/Equipment': 'CAHE-007-C-001',
    'Planned Start Date': '2024-07-01', // 6+ months old (should appear in list)
    'Risk Level': 'Medium',
    'MOC Required': 'Yes',
    'Equipment Issues': 'Yes'
  }
];

localStorage.setItem('currentMeetingIsolations', JSON.stringify(currentIsolationsWithAges));

console.log('✅ Asset Manager Test Data Created Successfully!');
console.log('');
console.log('📊 EXPECTED ASSET MANAGER DASHBOARD METRICS:');
console.log('============================================');
console.log('🔢 Total LTIs Over 6 Months: 6');
console.log('   - CAHE-001-OLD (19+ months)');
console.log('   - CAHE-002-OLD (18+ months)');
console.log('   - CAHE-003-VERY-OLD (25+ months) ⚠️ CRITICAL');
console.log('   - CAHE-004-OLD (24+ months) ⚠️ CRITICAL');
console.log('   - CAHE-005-MEDIUM (10+ months)');
console.log('   - CAHE-007-BORDERLINE (6+ months)');
console.log('');
console.log('📈 Age Distribution:');
console.log('   - 6-12 months: 2 LTIs');
console.log('   - 1-2 years: 2 LTIs');
console.log('   - 2+ years: 2 LTIs ⚠️ CRITICAL');
console.log('');
console.log('📋 MOC Status:');
console.log('   - Required: 1 (CAHE-003-VERY-OLD)');
console.log('   - Submitted: 1 (CAHE-005-MEDIUM)');
console.log('   - In Progress: 1 (CAHE-001-OLD)');
console.log('   - Completed: 1 (CAHE-002-OLD)');
console.log('   - Not Required: 1 (CAHE-004-OLD)');
console.log('');
console.log('🔧 Equipment Issues:');
console.log('   - LTIs with Equipment Issues: 4');
console.log('   - Disconnect Required: 3');
console.log('   - Removal Required: 2');
console.log('');
console.log('⚠️ HIGH PRIORITY ITEMS:');
console.log('   - 2 LTIs over 2 years old (CRITICAL)');
console.log('   - 1 MOC not yet submitted (CAHE-003-VERY-OLD)');
console.log('   - 4 LTIs with equipment issues requiring attention');
`;

console.log('🧪 SETUP ASSET MANAGER TEST DATA');
console.log('=================================\n');

console.log('📋 INSTRUCTIONS TO POPULATE ASSET MANAGER DASHBOARD:');
console.log('====================================================\n');

console.log('1. Open your browser and navigate to: http://localhost:3000');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to the Console tab');
console.log('4. Copy and paste the following script:\n');

console.log('```javascript');
console.log(assetManagerTestDataScript);
console.log('```\n');

console.log('5. Press Enter to execute the script');
console.log('6. Navigate to: Asset Manager Dashboard');
console.log('7. You should now see populated metrics:\n');

console.log('🎯 EXPECTED DASHBOARD RESULTS:');
console.log('==============================');
console.log('✅ Total LTIs Over 6 Months: 6 (instead of 0)');
console.log('✅ Age Distribution Chart with data');
console.log('✅ MOC Progress tracking with various statuses');
console.log('✅ Equipment Issues counter: 4');
console.log('✅ Detailed table showing all 6+ month LTIs');
console.log('✅ Meeting agenda generation with real data');
console.log('✅ Risk-based prioritization working\n');

console.log('🚨 CRITICAL ITEMS TO VERIFY:');
console.log('============================');
console.log('• CAHE-003-VERY-OLD should show as 25+ months (CRITICAL)');
console.log('• CAHE-004-OLD should show as 24+ months (CRITICAL)');
console.log('• Age calculations should be accurate');
console.log('• MOC status should display correctly');
console.log('• Equipment issues should be flagged properly');
console.log('• Meeting agenda should include all relevant LTIs\n');

console.log('🚀 ASSET MANAGER DASHBOARD TEST DATA IS READY!');
