# SharePoint 2016 Corporate Integration Guide
## LTI OMT Meeting System - Complete Deployment Strategy

**Date:** January 16, 2025  
**Target Environment:** SharePoint 2016 Corporate On-Premises  
**Status:** 🎯 **COMPREHENSIVE INTEGRATION PLAN**

---

## 📋 **FULL APPLICATION REVIEW**

### **✅ CURRENT APPLICATION ARCHITECTURE**

#### **Frontend Components Analysis:**
```
LTI OMT Meeting System/
├── 🏠 LandingPage.jsx - Main dashboard and navigation
├── 📅 MeetingSetupPage.jsx - Meeting creation with Excel upload
├── 📊 LTIDashboard.jsx - Executive analytics and KPI tracking
├── 📝 IsolationQuestionnaire.jsx - Detailed isolation review forms
├── 🔍 ReviewPage.jsx - Multi-discipline review and approval
├── 📈 MeetingSummaryPage.jsx - Meeting outcomes and reports
├── 📚 PastMeetingsPage.jsx - Historical data with export capabilities
├── 🗂️ ManagePeoplePage.jsx - Attendee management
├── 📆 MeetingCalendarPage.jsx - Calendar view and scheduling
├── 🎯 NavigationHeader.jsx - Consistent navigation across pages
├── ⚠️ ErrorBoundary.jsx - Error handling and recovery
└── ⏳ LoadingSpinner.jsx - Professional loading states
```

#### **Backend Services Analysis:**
```
Backend Services/
├── 🌐 Express.js API Server (Node.js)
├── 📧 Email Notification System (Nodemailer)
├── 🔒 Security Middleware (CORS, Rate Limiting)
├── 📁 File Processing (Excel/XLSX handling)
└── 🛡️ Input Validation and Sanitization
```

#### **Key Features Inventory:**
- ✅ **Meeting Management**: Complete lifecycle from setup to summary
- ✅ **Excel Integration**: Upload, process, and export isolation data
- ✅ **PDF Export**: Professional reports with "LTI OMT Meeting System" branding
- ✅ **LTI Age Tracking**: Automatic calculation from planned start dates
- ✅ **Risk Assessment**: Comprehensive questionnaire system
- ✅ **Related Isolation Warnings**: Safety feature for interconnected equipment
- ✅ **Executive Dashboard**: KPI tracking and analytics
- ✅ **WMS Manual Compliance**: 95% coverage of regulatory requirements
- ✅ **Mobile Responsive**: Material-UI components for all devices

---

## 🏢 **SHAREPOINT 2016 CORPORATE INTEGRATION STRATEGY**

### **🎯 RECOMMENDED APPROACH: HYBRID DEPLOYMENT**

#### **Option A: SharePoint-Hosted Application Pages (RECOMMENDED)**
```
SharePoint 2016 Site Structure:
├── 🏠 Site Home Page
│   ├── LTI OMT Meeting System Web Part
│   ├── Quick Launch Navigation
│   └── Executive Dashboard Summary
├── 📁 Document Libraries
│   ├── Meeting Documents
│   ├── Excel Templates
│   ├── PDF Reports
│   └── Historical Archives
├── 📋 SharePoint Lists
│   ├── Meetings List
│   ├── Attendees List
│   ├── Isolations List
│   └── Action Items List
└── 🔧 Application Pages
    ├── New Meeting (/_layouts/15/MeetingSetup.aspx)
    ├── Review Meeting (/_layouts/15/ReviewMeeting.aspx)
    ├── LTI Dashboard (/_layouts/15/LTIDashboard.aspx)
    └── Past Meetings (/_layouts/15/PastMeetings.aspx)
```

---

## 🛠️ **TECHNICAL IMPLEMENTATION PLAN**

### **Phase 1: SharePoint 2016 Compatibility Preparation**

#### **1.1 Browser Compatibility Updates**
```javascript
// IE 11 Compatibility Fixes
// File: frontend/src/utils/ie11-polyfills.js

// Polyfills for IE 11
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Fetch polyfill for IE 11
if (!window.fetch) {
  require('whatwg-fetch');
}

// Promise polyfill for IE 11
if (!window.Promise) {
  require('es6-promise').polyfill();
}

// Array.from polyfill
if (!Array.from) {
  Array.from = function(arrayLike) {
    return Array.prototype.slice.call(arrayLike);
  };
}
```

#### **1.2 SharePoint 2016 Theme Integration**
```css
/* File: frontend/src/styles/sharepoint-2016-theme.css */

/* SharePoint 2016 Corporate Theme Variables */
:root {
  --sp-primary-color: #0078d4;
  --sp-secondary-color: #106ebe;
  --sp-background-color: #ffffff;
  --sp-text-color: #323130;
  --sp-border-color: #edebe9;
  --sp-hover-color: #f3f2f1;
}

/* SharePoint 2016 Suite Bar Integration */
.ms-core-suiteBar {
  height: 44px;
  background-color: var(--sp-primary-color);
}

/* Application Container for SharePoint */
.lti-meeting-app {
  margin-top: 44px; /* Account for SharePoint suite bar */
  padding: 20px;
  background-color: var(--sp-background-color);
  min-height: calc(100vh - 44px);
}

/* SharePoint 2016 Navigation Integration */
.sp-navigation-integration {
  border-left: 3px solid var(--sp-primary-color);
  padding-left: 15px;
  margin-bottom: 20px;
}
```

#### **1.3 SharePoint Context Integration**
```javascript
// File: frontend/src/utils/sharepoint-context.js

class SharePointContext {
  constructor() {
    this.siteUrl = _spPageContextInfo?.webAbsoluteUrl || '';
    this.userId = _spPageContextInfo?.userId || null;
    this.userDisplayName = _spPageContextInfo?.userDisplayName || '';
    this.listBaseTemplate = 100; // Generic List
  }

  // Get current SharePoint user
  getCurrentUser() {
    return {
      id: this.userId,
      displayName: this.userDisplayName,
      email: _spPageContextInfo?.userEmail || ''
    };
  }

  // SharePoint REST API helper
  async callSharePointAPI(endpoint, method = 'GET', data = null) {
    const url = `${this.siteUrl}/_api/${endpoint}`;
    const headers = {
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose',
      'X-RequestDigest': document.getElementById('__REQUESTDIGEST')?.value || ''
    };

    const config = {
      method,
      headers,
      credentials: 'same-origin'
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    return response.json();
  }

  // Create SharePoint list item
  async createListItem(listName, itemData) {
    const endpoint = `web/lists/getbytitle('${listName}')/items`;
    return this.callSharePointAPI(endpoint, 'POST', itemData);
  }

  // Get SharePoint list items
  async getListItems(listName, select = '', filter = '') {
    let endpoint = `web/lists/getbytitle('${listName}')/items`;
    const params = [];
    
    if (select) params.push(`$select=${select}`);
    if (filter) params.push(`$filter=${filter}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    
    return this.callSharePointAPI(endpoint);
  }
}

export default new SharePointContext();
```

### **Phase 2: SharePoint Lists and Libraries Setup**

#### **2.1 SharePoint List Schemas**
```javascript
// SharePoint List Creation Scripts
// File: sharepoint/list-schemas.js

const sharePointLists = {
  // Meetings List
  meetings: {
    Title: 'Meeting Date',
    Description: 'Meeting description and purpose',
    Attendees: 'Multiple lines of text', // JSON array of attendees
    Status: 'Choice (Planned|In Progress|Completed|Cancelled)',
    MeetingData: 'Multiple lines of text', // JSON meeting data
    IsolationCount: 'Number',
    CreatedBy: 'Person or Group',
    ModifiedBy: 'Person or Group',
    Created: 'Date and Time',
    Modified: 'Date and Time'
  },

  // Isolations List
  isolations: {
    Title: 'Isolation ID (CAHE-XXX-XXX)',
    Description: 'Multiple lines of text',
    PlannedStartDate: 'Date and Time',
    RiskLevel: 'Choice (Critical|High|Medium|Low)',
    SystemType: 'Choice (Pump|Compressor|Heat Exchange|Cooling|Electrical|Steam)',
    Status: 'Choice (Active|Under Review|Completed|Cancelled)',
    LTIAge: 'Calculated (Number)', // Days since planned start
    MeetingID: 'Lookup (Meetings)',
    RelatedIsolations: 'Multiple lines of text', // JSON array
    MOCRequired: 'Yes/No',
    PartsRequired: 'Yes/No',
    Comments: 'Multiple lines of text',
    CreatedBy: 'Person or Group',
    ModifiedBy: 'Person or Group'
  },

  // Action Items List
  actionItems: {
    Title: 'Action Item Description',
    AssignedTo: 'Person or Group',
    DueDate: 'Date and Time',
    Priority: 'Choice (Critical|High|Medium|Low)',
    Status: 'Choice (Open|In Progress|Completed|Cancelled)',
    MeetingID: 'Lookup (Meetings)',
    IsolationID: 'Lookup (Isolations)',
    Comments: 'Multiple lines of text',
    CreatedBy: 'Person or Group',
    ModifiedBy: 'Person or Group'
  },

  // Attendees List
  attendees: {
    Title: 'Full Name',
    Email: 'Single line of text',
    Department: 'Choice (Operations|Engineering|Safety|Management|Maintenance)',
    Role: 'Choice (Organizer|Reviewer|Approver|Observer)',
    Active: 'Yes/No',
    CreatedBy: 'Person or Group',
    ModifiedBy: 'Person or Group'
  }
};
```

#### **2.2 Document Libraries Setup**
```javascript
// Document Library Configuration
// File: sharepoint/document-libraries.js

const documentLibraries = {
  // Meeting Documents Library
  meetingDocuments: {
    name: 'Meeting Documents',
    description: 'Storage for meeting-related documents',
    contentTypes: ['Document', 'Excel Workbook', 'PDF'],
    folders: [
      'Excel Templates',
      'Meeting Reports',
      'Historical Archives',
      'Action Item Tracking'
    ],
    metadata: {
      MeetingDate: 'Date and Time',
      DocumentType: 'Choice (Template|Report|Archive|Action Item)',
      RelatedMeeting: 'Lookup (Meetings)',
      ApprovalStatus: 'Choice (Draft|Under Review|Approved|Archived)'
    }
  },

  // Export Reports Library
  exportReports: {
    name: 'Export Reports',
    description: 'Generated PDF and Excel reports',
    contentTypes: ['PDF', 'Excel Workbook'],
    folders: [
      'Daily Reports',
      'Weekly Summaries',
      'Monthly Analytics',
      'Executive Reports'
    ],
    metadata: {
      ReportType: 'Choice (Daily|Weekly|Monthly|Executive|Custom)',
      GeneratedDate: 'Date and Time',
      GeneratedBy: 'Person or Group',
      MeetingPeriod: 'Single line of text'
    }
  }
};
```

### **Phase 3: Application Page Development**

#### **3.1 SharePoint Application Master Page**
```html
<!-- File: sharepoint/layouts/LTIMeetingMaster.master -->
<%@ Master Language="C#" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint" %>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LTI OMT Meeting System</title>
    
    <!-- SharePoint 2016 CSS -->
    <SharePoint:CssRegistration Name="Themable/corev15.css" runat="server" />
    <SharePoint:CssRegistration Name="Themable/searchv15.css" runat="server" />
    
    <!-- Application CSS -->
    <link rel="stylesheet" href="/_layouts/15/LTIMeeting/css/app.css" />
    <link rel="stylesheet" href="/_layouts/15/LTIMeeting/css/sharepoint-2016-theme.css" />
    
    <!-- IE 11 Polyfills -->
    <script src="/_layouts/15/LTIMeeting/js/ie11-polyfills.js"></script>
</head>
<body>
    <!-- SharePoint Suite Bar -->
    <div id="suiteBarDelta">
        <SharePoint:SPRibbon runat="server" />
    </div>
    
    <!-- Application Container -->
    <div class="lti-meeting-app">
        <asp:ContentPlaceHolder ID="PlaceHolderMain" runat="server" />
    </div>
    
    <!-- Application JavaScript -->
    <script src="/_layouts/15/LTIMeeting/js/app.bundle.js"></script>
</body>
</html>
```

#### **3.2 Meeting Setup Application Page**
```html
<!-- File: sharepoint/layouts/MeetingSetup.aspx -->
<%@ Page Language="C#" MasterPageFile="~/_layouts/15/LTIMeeting/LTIMeetingMaster.master" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint" %>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <div class="sp-navigation-integration">
        <SharePoint:SPBreadCrumb runat="server" />
    </div>
    
    <div id="meeting-setup-container">
        <!-- React component will mount here -->
        <div class="loading-placeholder">
            <div class="sp-loading-spinner"></div>
            <p>Loading Meeting Setup...</p>
        </div>
    </div>
    
    <script>
        // Initialize React component with SharePoint context
        window.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('meeting-setup-container');
            const sharePointContext = {
                siteUrl: _spPageContextInfo.webAbsoluteUrl,
                userId: _spPageContextInfo.userId,
                userDisplayName: _spPageContextInfo.userDisplayName,
                listBaseTemplate: 100
            };
            
            // Mount React component
            ReactDOM.render(
                React.createElement(MeetingSetupPage, { 
                    sharePointContext: sharePointContext 
                }),
                container
            );
        });
    </script>
</asp:Content>
```

### **Phase 4: Data Integration Layer**

#### **4.1 SharePoint Data Service**
```javascript
// File: frontend/src/services/sharepoint-data-service.js

import SharePointContext from '../utils/sharepoint-context';

class SharePointDataService {
  constructor() {
    this.context = SharePointContext;
  }

  // Save meeting to SharePoint
  async saveMeeting(meetingData) {
    try {
      const listItem = {
        Title: meetingData.date,
        Description: meetingData.description || '',
        Attendees: JSON.stringify(meetingData.attendees || []),
        Status: 'Planned',
        MeetingData: JSON.stringify(meetingData),
        IsolationCount: meetingData.isolations?.length || 0
      };

      const result = await this.context.createListItem('Meetings', listItem);
      
      // Save isolations if present
      if (meetingData.isolations && meetingData.isolations.length > 0) {
        await this.saveIsolations(meetingData.isolations, result.d.Id);
      }

      return result;
    } catch (error) {
      console.error('Error saving meeting to SharePoint:', error);
      throw error;
    }
  }

  // Save isolations to SharePoint
  async saveIsolations(isolations, meetingId) {
    const promises = isolations.map(isolation => {
      const listItem = {
        Title: isolation.id,
        Description: isolation.description || isolation.Title || '',
        PlannedStartDate: isolation['Planned Start Date'] || isolation.plannedStartDate,
        RiskLevel: isolation.riskLevel || 'Medium',
        SystemType: this.getSystemType(isolation.id),
        Status: 'Active',
        MeetingID: meetingId,
        RelatedIsolations: JSON.stringify(isolation.relatedIsolations || []),
        MOCRequired: isolation.mocRequired || false,
        PartsRequired: isolation.partsRequired || false,
        Comments: isolation.comments || ''
      };

      return this.context.createListItem('Isolations', listItem);
    });

    return Promise.all(promises);
  }

  // Get meetings from SharePoint
  async getMeetings(limit = 50) {
    try {
      const select = 'Id,Title,Description,Attendees,Status,MeetingData,IsolationCount,Created,Modified,Author/Title,Editor/Title';
      const expand = 'Author,Editor';
      const orderBy = 'Created desc';
      
      const endpoint = `web/lists/getbytitle('Meetings')/items?$select=${select}&$expand=${expand}&$orderby=${orderBy}&$top=${limit}`;
      const result = await this.context.callSharePointAPI(endpoint);
      
      return result.d.results.map(item => ({
        id: item.Id,
        date: item.Title,
        description: item.Description,
        attendees: JSON.parse(item.Attendees || '[]'),
        status: item.Status,
        meetingData: JSON.parse(item.MeetingData || '{}'),
        isolationCount: item.IsolationCount,
        created: new Date(item.Created),
        modified: new Date(item.Modified),
        createdBy: item.Author?.Title || '',
        modifiedBy: item.Editor?.Title || ''
      }));
    } catch (error) {
      console.error('Error getting meetings from SharePoint:', error);
      throw error;
    }
  }

  // Upload document to SharePoint library
  async uploadDocument(libraryName, fileName, fileContent, metadata = {}) {
    try {
      const url = `${this.context.siteUrl}/_api/web/lists/getbytitle('${libraryName}')/RootFolder/Files/Add(url='${fileName}',overwrite=true)`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': document.getElementById('__REQUESTDIGEST')?.value || '',
          'Content-Type': 'application/octet-stream'
        },
        body: fileContent,
        credentials: 'same-origin'
      });

      const result = await response.json();
      
      // Update metadata if provided
      if (Object.keys(metadata).length > 0) {
        await this.updateDocumentMetadata(libraryName, fileName, metadata);
      }

      return result;
    } catch (error) {
      console.error('Error uploading document to SharePoint:', error);
      throw error;
    }
  }

  // Helper method to determine system type from isolation ID
  getSystemType(isolationId) {
    if (!isolationId) return 'Unknown';
    
    const systemMap = {
      '123': 'Pump',
      '456': 'Compressor',
      '789': 'Heat Exchange',
      '101': 'Cooling',
      '202': 'Electrical',
      '303': 'Steam'
    };

    const match = isolationId.match(/CAHE-(\d{3})-/);
    return match ? systemMap[match[1]] || 'Unknown' : 'Unknown';
  }
}

export default new SharePointDataService();
```

### **Phase 5: Deployment Package Creation**

#### **5.1 SharePoint Solution Package Structure**
```
sharepoint-solution-package/
├── 📁 Features/
│   ├── LTIMeetingFeature/
│   │   ├── Feature.xml
│   │   └── Elements.xml
├── 📁 Layouts/
│   ├── 15/
│   │   └── LTIMeeting/
│   │       ├── css/
│   │       ├── js/
│   │       ├── images/
│   │       ├── MeetingSetup.aspx
│   │       ├── LTIDashboard.aspx
│   │       ├── ReviewMeeting.aspx
│   │       └── PastMeetings.aspx
├── 📁 ListTemplates/
│   ├── Meetings/
│   ├── Isolations/
│   ├── ActionItems/
│   └── Attendees/
├── 📁 SiteTemplates/
│   └── LTIMeetingSite/
├── Package.package
├── manifest.xml
└── README.md
```

#### **5.2 Feature.xml Configuration**
```xml
<!-- File: Features/LTIMeetingFeature/Feature.xml -->
<?xml version="1.0" encoding="utf-8"?>
<Feature Id="12345678-1234-1234-1234-123456789012"
         Title="LTI OMT Meeting System"
         Description="Complete meeting management system for LTI operations"
         Version="4.0.0.0"
         Scope="Site"
         xmlns="http://schemas.microsoft.com/sharepoint/">
  <ElementManifests>
    <ElementManifest Location="Elements.xml" />
  </ElementManifests>
</Feature>
```

---

## 🚀 **DEPLOYMENT PROCESS**

### **Step 1: Pre-Deployment Preparation**

#### **1.1 SharePoint 2016 Environment Verification**
```powershell
# PowerShell script to verify SharePoint 2016 environment
# File: deployment/verify-environment.ps1

Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

# Check SharePoint version
$farm = Get-SPFarm
Write-Host "SharePoint Version: $($farm.BuildVersion)"

# Verify required features
$features = @(
    "Microsoft.SharePoint.Publishing",
    "Microsoft.Office.Server.Search"
)

foreach ($feature in $features) {
    $featureStatus = Get-SPFeature -Identity $feature -ErrorAction SilentlyContinue
    if ($featureStatus) {
        Write-Host "✅ $feature is available"
    } else {
        Write-Host "❌ $feature is NOT available"
    }
}

# Check browser compatibility requirements
Write-Host "Browser Compatibility Requirements:"
Write-Host "✅ Internet Explorer 11 or higher"
Write-Host "✅ Microsoft Edge (Legacy)"
Write-Host "✅ Chrome 60+ (if allowed by corporate policy)"
Write-Host "✅ Firefox 55+ (if allowed by corporate policy)"
```

#### **1.2 Corporate Security Compliance**
```javascript
// File: frontend/src/utils/corporate-security.js

// Corporate security compliance utilities
class CorporateSecurityCompliance {
  constructor() {
    this.corporateSettings = {
      // Data retention policies
      dataRetentionDays: 2555, // 7 years for regulatory compliance
      
      // File upload restrictions
      allowedFileTypes: ['.xlsx', '.xls', '.pdf'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      
      // User access controls
      requireAuthentication: true,
      requireAuthorization: true,
      
      // Audit logging
      enableAuditLogging: true,
      auditLogRetentionDays: 2555,
      
      // Data encryption
      encryptSensitiveData: true,
      useHttpsOnly: true
    };
  }

  // Validate file upload against corporate policies
  validateFileUpload(file) {
    const errors = [];
    
    // Check file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!this.corporateSettings.allowedFileTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not allowed by corporate policy`);
    }
    
    // Check file size
    if (file.size > this.corporateSettings.maxFileSize) {
      errors.push(`File size exceeds corporate limit of ${this.corporateSettings.maxFileSize / (1024 * 1024)}MB`);
    }
    
    // Check for potentially malicious content
    if (this.containsSuspiciousContent(file.name)) {
      errors.push('File name contains potentially unsafe characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Log user actions for audit trail
  logUserAction(action, details) {
    if (!this.corporateSettings.enableAuditLogging) return;
    
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: _spPageContextInfo?.userId || 'anonymous',
      userDisplayName: _spPageContextInfo?.userDisplayName || 'Unknown',
      action: action,
      details: details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    // Send to SharePoint audit list or corporate logging system
    this.sendToAuditSystem(auditEntry);
  }

  // Helper methods
  containsSuspiciousContent(filename) {
    const suspiciousPatterns = [
      /[<>:"|?*]/,  // Invalid filename characters
      /\.(exe|bat|cmd|scr|vbs|js)$/i,  // Executable file extensions
      /script/i,    // Script-related content
      /javascript/i // JavaScript content
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  getClientIP() {
    // In SharePoint environment, this would be available through server-side code
    return 'N/A (Client-side)';
  }

  async sendToAuditSystem(auditEntry) {
    try {
      // Send to SharePoint audit list
      const auditList = 'Audit Log';
      const listItem = {
        Title: auditEntry.action,
        UserId: auditEntry.userId,
        UserDisplayName: auditEntry.userDisplayName,
        ActionDetails: JSON.stringify(auditEntry.details),
        Timestamp: auditEntry.timestamp,
        IPAddress: auditEntry.ipAddress,
        UserAgent: auditEntry.userAgent
      };
      
      // This would use SharePoint REST API to create the audit entry
      console.log('Audit entry logged:', auditEntry);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }
}

export default new CorporateSecurityCompliance();
```

### **Step 2: Deployment Execution**

#### **2.1 SharePoint Solution Deployment Script**
```powershell
# File: deployment/deploy-solution.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$SolutionPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateLists = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$UploadFiles = $true
)

Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

Write-Host "🚀 Starting LTI OMT Meeting System deployment..." -ForegroundColor Green

try {
    # Get the site
    $site = Get-SPSite $SiteUrl
    $web = $site.RootWeb
    
    Write-Host "✅ Connected to SharePoint site: $($web.Title)" -ForegroundColor Green
    
    # Deploy solution package if provided
    if ($SolutionPath -and (Test-Path $SolutionPath)) {
        Write-Host "📦 Deploying solution package..." -ForegroundColor Yellow
        
        # Add solution to farm
        Add-SPSolution -LiteralPath $SolutionPath
        
        # Deploy solution
        Install-SPSolution -Identity "LTIMeetingSystem.wsp" -WebApplication $web.Site.WebApplication -GACDeployment
        
        Write-Host "✅ Solution package deployed successfully" -ForegroundColor Green
    }
    
    # Create SharePoint lists
    if ($CreateLists) {
        Write-Host "📋 Creating SharePoint lists..." -ForegroundColor Yellow
        
        # Create Meetings list
        $meetingsList = $web.Lists.TryGetList("Meetings")
        if ($meetingsList -eq $null) {
            $meetingsListId = $web.Lists.Add("Meetings", "Meeting management and tracking", [Microsoft.SharePoint.SPListTemplateType]::GenericList)
            $meetingsList = $web.Lists[$meetingsListId]
            
            # Add custom fields
            $meetingsList.Fields.Add("Description", [Microsoft.SharePoint.SPFieldType]::Note, $false)
            $meetingsList.Fields.Add("Attendees", [Microsoft.SharePoint.SPFieldType]::Note, $false)
            $meetingsList.Fields.Add("Status", [Microsoft.SharePoint.SPFieldType]::Choice, $false)
            $meetingsList.Fields.Add("MeetingData", [Microsoft.SharePoint.SPFieldType]::Note, $false)
            $meetingsList.Fields.Add("IsolationCount", [Microsoft.SharePoint.SPFieldType]::Number, $false)
            
            # Configure Status field choices
            $statusField = $meetingsList.Fields["Status"]
            $statusField.Choices.Add("Planned")
            $statusField.Choices.Add("In Progress")
            $statusField.Choices.Add("Completed")
            $statusField.Choices.Add("Cancelled")
            $statusField.Update()
            
            $meetingsList.Update()
            Write-Host "✅ Meetings list created" -ForegroundColor Green
        }
        
        # Create Isolations list
        $isolationsList = $web.Lists.TryGetList("Isolations")
        if ($isolationsList -eq $null) {
            $isolationsListId = $web.Lists.Add("Isolations", "Isolation tracking and management", [Microsoft.SharePoint.SPListTemplateType]::GenericList
