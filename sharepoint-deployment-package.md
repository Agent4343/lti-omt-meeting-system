# SharePoint Deployment Package - Meeting Management System

## Quick Start for SharePoint Deployment

### Option A: Simple SharePoint Integration (Recommended for Quick Setup)

#### Step 1: Host the Application
1. **Frontend Hosting** (Choose one):
   - **Netlify** (Free): Connect your GitHub repo to Netlify for automatic deployment
   - **Azure Static Web Apps**: Deploy through Azure portal
   - **GitHub Pages**: Enable GitHub Pages in repository settings

2. **Backend Hosting** (Choose one):
   - **Heroku** (Free tier available): Deploy Node.js backend
   - **Azure App Service**: Enterprise-grade hosting
   - **Railway/Render**: Alternative cloud platforms

#### Step 2: SharePoint Site Setup
1. Create a new SharePoint site or use existing site
2. Create a new page called "Meeting Management System"
3. Add an "Embed" web part to the page
4. Enter your hosted application URL
5. Configure permissions for team access

### Option B: SharePoint Document Library Approach

#### Step 1: Prepare Files for SharePoint
Create these folders in your SharePoint document library:

```
Meeting-Management-System/
├── 📁 Application/
│   ├── 📄 index.html (main application file)
│   ├── 📁 assets/ (CSS, JS, images)
│   └── 📄 README.md
├── 📁 Documentation/
│   ├── 📄 User-Guide.pdf
│   ├── 📄 System-Documentation.pdf
│   └── 📄 Deployment-Guide.pdf
├── 📁 Templates/
│   ├── 📄 Meeting-Template.xlsx
│   └── 📄 Isolation-List-Template.xlsx
└── 📁 Support/
    ├── 📄 FAQ.md
    └── 📄 Contact-Information.md
```

## SharePoint List Integration

### Create SharePoint Lists for Data Storage

#### 1. Meetings List
```
List Name: Meeting Management
Columns:
- Title (Single line of text) - Meeting Date
- Attendees (Multiple lines of text)
- Status (Choice: Active, Completed, Cancelled)
- Isolation Count (Number)
- Created By (Person or Group)
- Last Modified (Date and Time)
- Meeting Notes (Multiple lines of text)
```

#### 2. People List
```
List Name: Meeting Attendees
Columns:
- Title (Single line of text) - Full Name
- Email (Single line of text)
- Department (Single line of text)
- Role (Choice: Organizer, Attendee, Observer)
- Active (Yes/No)
```

#### 3. Isolation Tracking List
```
List Name: Isolation Tracking
Columns:
- Title (Single line of text) - Isolation ID
- Meeting ID (Lookup to Meetings List)
- Status (Choice: New, Reviewed, Approved, Rejected)
- Risk Level (Choice: Low, Medium, High, Critical)
- Parts Required (Multiple lines of text)
- Engineering Notes (Multiple lines of text)
- Reviewer (Person or Group)
- Review Date (Date and Time)
```

## SharePoint Page Templates

### 1. Main Dashboard Page
```html
<!-- SharePoint Modern Page Content -->
<div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #0078d4; margin-bottom: 30px;">Meeting Management System</h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f3f2f1; padding: 20px; border-radius: 8px;">
            <h3>Quick Actions</h3>
            <a href="/sites/yoursite/SitePages/new-meeting.aspx" style="display: inline-block; background: #0078d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px;">New Meeting</a>
            <a href="/sites/yoursite/Lists/Meeting%20Management" style="display: inline-block; background: #107c10; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px;">View Meetings</a>
        </div>
        
        <div style="background: #f3f2f1; padding: 20px; border-radius: 8px;">
            <h3>Recent Activity</h3>
            <!-- Embed Recent Meetings List View -->
        </div>
    </div>
    
    <!-- Embed your hosted application here -->
    <iframe src="YOUR_HOSTED_APP_URL" width="100%" height="800px" frameborder="0"></iframe>
</div>
```

### 2. User Guide Page
```html
<!-- SharePoint Page for User Instructions -->
<div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1>Meeting Management System - User Guide</h1>
    
    <h2>Getting Started</h2>
    <ol>
        <li>Click "New Meeting" to create a meeting</li>
        <li>Select attendees from the dropdown or add new people</li>
        <li>Upload your Excel isolation list</li>
        <li>Review and approve isolations</li>
        <li>Send email notifications to attendees</li>
    </ol>
    
    <h2>Features</h2>
    <ul>
        <li>✅ Create and manage meetings</li>
        <li>✅ Track attendees and isolations</li>
        <li>✅ Email notifications</li>
        <li>✅ Historical data tracking</li>
        <li>✅ Export capabilities</li>
    </ul>
    
    <h2>Support</h2>
    <p>For technical support, contact: <a href="mailto:support@yourcompany.com">support@yourcompany.com</a></p>
</div>
```

## Deployment Scripts

### PowerShell Script for SharePoint Setup
```powershell
# SharePoint-Setup.ps1
# Run this script to set up SharePoint lists and permissions

# Connect to SharePoint
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive

# Create Lists
Write-Host "Creating SharePoint Lists..." -ForegroundColor Green

# Create Meetings List
$meetingsList = New-PnPList -Title "Meeting Management" -Template GenericList
Add-PnPField -List "Meeting Management" -DisplayName "Attendees" -InternalName "Attendees" -Type Note
Add-PnPField -List "Meeting Management" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Active","Completed","Cancelled"
Add-PnPField -List "Meeting Management" -DisplayName "Isolation Count" -InternalName "IsolationCount" -Type Number

# Create Attendees List
$attendeesList = New-PnPList -Title "Meeting Attendees" -Template GenericList
Add-PnPField -List "Meeting Attendees" -DisplayName "Email" -InternalName "Email" -Type Text
Add-PnPField -List "Meeting Attendees" -DisplayName "Department" -InternalName "Department" -Type Text
Add-PnPField -List "Meeting Attendees" -DisplayName "Role" -InternalName "Role" -Type Choice -Choices "Organizer","Attendee","Observer"
Add-PnPField -List "Meeting Attendees" -DisplayName "Active" -InternalName "Active" -Type Boolean

Write-Host "SharePoint setup completed!" -ForegroundColor Green
```

### Batch File for Quick Deployment
```batch
@echo off
echo Meeting Management System - SharePoint Deployment
echo ================================================

echo Step 1: Building frontend...
cd frontend
call npm install
call npm run build

echo Step 2: Preparing deployment package...
cd ..
mkdir sharepoint-package
xcopy frontend\build sharepoint-package\app\ /E /I
xcopy backend sharepoint-package\backend\ /E /I
xcopy *.md sharepoint-package\documentation\ /I

echo Step 3: Package ready in 'sharepoint-package' folder
echo.
echo Next steps:
echo 1. Upload the 'app' folder contents to your web hosting service
echo 2. Deploy the 'backend' folder to your server hosting service
echo 3. Create SharePoint pages using the templates in documentation
echo 4. Update the iframe URL in SharePoint pages to point to your hosted app
echo.
pause
```

## SharePoint Permissions Configuration

### Permission Groups
1. **Meeting System Administrators**
   - Full control over lists and pages
   - Can modify system settings
   - Can manage user permissions

2. **Meeting Organizers**
   - Create and edit meetings
   - Manage attendees
   - Send notifications

3. **Meeting Attendees**
   - View assigned meetings
   - Update attendance status
   - Access meeting documents

4. **Meeting Viewers**
   - Read-only access to meeting summaries
   - View historical data

### Setting Up Permissions
```powershell
# Create SharePoint Groups
New-PnPGroup -Title "Meeting System Administrators" -Description "Full system access"
New-PnPGroup -Title "Meeting Organizers" -Description "Can create and manage meetings"
New-PnPGroup -Title "Meeting Attendees" -Description "Can participate in meetings"
New-PnPGroup -Title "Meeting Viewers" -Description "Read-only access"

# Assign permissions
Set-PnPGroupPermissions -Identity "Meeting System Administrators" -AddRole "Full Control"
Set-PnPGroupPermissions -Identity "Meeting Organizers" -AddRole "Contribute"
Set-PnPGroupPermissions -Identity "Meeting Attendees" -AddRole "Contribute"
Set-PnPGroupPermissions -Identity "Meeting Viewers" -AddRole "Read"
```

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Weekly**: Review system usage and performance
2. **Monthly**: Update user permissions and access
3. **Quarterly**: System backup and security review
4. **As needed**: Application updates and feature additions

### Update Process
1. Test updates in development environment
2. Schedule maintenance window
3. Deploy updates to hosting platform
4. Update SharePoint pages if needed
5. Notify users of changes
6. Monitor system performance

## Support and Training

### Training Materials Location
- **SharePoint Site**: `/sites/meeting-management/SitePages/training.aspx`
- **Document Library**: `/sites/meeting-management/Shared Documents/Training`
- **Video Tutorials**: Embedded in SharePoint pages

### Support Contacts
- **System Administrator**: [Name] - [Email]
- **SharePoint Administrator**: [Name] - [Email]
- **Application Support**: [Name] - [Email]

---

This package provides everything needed to deploy the Meeting Management System to SharePoint for team access, including templates, scripts, and configuration guides.
