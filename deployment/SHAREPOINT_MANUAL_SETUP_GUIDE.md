# SharePoint 2013 Manual List Setup Guide
## For Site Administrators (No Server Access Required)

This guide allows you to create the required SharePoint lists through the web browser interface.

---

## Prerequisites

- **Site Permission**: Site Owner or Site Collection Administrator
- **Browser**: IE 9+, Chrome, Firefox, or Edge
- **SharePoint Site URL**: Your target site (e.g., `http://sharepoint/sites/lti-omt`)

---

## Step-by-Step Instructions

### Step 1: Navigate to Your SharePoint Site

1. Open your browser
2. Go to your SharePoint site URL
3. Log in with your credentials

---

### Step 2: Create the Lists

You need to create **4 lists**. For each list, follow these steps:

#### How to Create a New List:

1. Click the **Settings gear** (⚙️) in the top-right corner
2. Select **"Add an app"** or **"Site Contents"**
3. Click **"Custom List"**
4. Enter the list name and click **Create**

---

## List 1: Meetings

**Name:** `Meetings`

**Description:** LTI OMT Meeting records and tracking

### Columns to Add:

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | (Already exists - this is the Meeting Date) |
| Description | Multiple lines of text | No | Plain text |
| Attendees | Multiple lines of text | No | Plain text (stores JSON) |
| MeetingData | Multiple lines of text | No | Plain text (stores JSON) |
| IsolationCount | Number | No | 0 decimal places |
| Status | Choice | No | Choices: Planned, In Progress, Completed, Cancelled |

#### To Add Columns:

1. Open the **Meetings** list
2. Click **LIST** tab in the ribbon → **Create Column**
3. Or click the **+** icon next to columns and select **More...**

---

## List 2: Isolations

**Name:** `Isolations`

**Description:** LTI Isolation tracking and management

### Columns to Add:

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | (Already exists - this is the Isolation ID like CAHE-XXX-XXX) |
| Description | Multiple lines of text | No | Plain text |
| PlannedStartDate | Date and Time | No | Date only |
| RelatedIsolations | Multiple lines of text | No | Plain text (stores JSON) |
| MeetingId | Number | No | 0 decimal places |
| MOCRequired | Single line of text | No | Values: Yes or No |
| PartsRequired | Single line of text | No | Values: Yes or No |
| Comments | Multiple lines of text | No | Plain text |
| RiskLevel | Choice | No | Choices: Critical, High, Medium, Low |
| Status | Choice | No | Choices: Active, Under Review, Completed, Cancelled |

---

## List 3: Attendees

**Name:** `Attendees`

**Description:** Meeting attendees master list (shared across organization)

### Columns to Add:

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | (Already exists - this is the Person's Name) |
| Email | Single line of text | No | |
| Department | Choice | No | Choices: Operations, Engineering, Safety, Management, Maintenance, Quality, Other |
| Role | Choice | No | Choices: Organizer, Reviewer, Approver, Observer |
| Active | Yes/No | No | Default: Yes |

---

## List 4: Action Items

**Name:** `Action Items`

**Description:** Meeting action items tracking

### Columns to Add:

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | (Already exists - this is the Action Item Description) |
| DueDate | Date and Time | No | Date only |
| AssignedTo | Person or Group | No | People only (not groups) |
| MeetingId | Number | No | 0 decimal places |
| IsolationId | Single line of text | No | |
| Comments | Multiple lines of text | No | Plain text |
| Priority | Choice | No | Choices: Critical, High, Medium, Low |
| Status | Choice | No | Choices: Open, In Progress, Completed, Cancelled |

---

## Step 3: Verify List Creation

After creating all lists, verify they appear in Site Contents:

1. Click **Settings gear** → **Site Contents**
2. You should see:
   - ✅ Meetings
   - ✅ Isolations
   - ✅ Attendees
   - ✅ Action Items

---

## Step 4: Set Permissions (Optional but Recommended)

For each list, configure appropriate permissions:

1. Open the list
2. Click **LIST** tab → **List Settings**
3. Click **Permissions for this list**
4. Configure as needed:
   - **Contribute**: Users who can add/edit items
   - **Read**: Users who can only view

### Recommended Permissions:

| List | Who Can Edit | Who Can View |
|------|--------------|--------------|
| Meetings | Meeting organizers | All site members |
| Isolations | Meeting organizers | All site members |
| Attendees | Site admins only | All site members |
| Action Items | All site members | All site members |

---

## Step 5: Configure the Application

Once lists are created, update the application's environment variables:

```env
# Enable SharePoint mode
REACT_APP_SHAREPOINT_MODE=true

# Your SharePoint site URL
REACT_APP_SHAREPOINT_SITE_URL=http://your-sharepoint-site/sites/lti-omt

# SharePoint version
REACT_APP_SHAREPOINT_VERSION=2013
```

---

## Troubleshooting

### "Access Denied" when creating lists
- You need Site Owner or Site Collection Admin permissions
- Contact your SharePoint administrator

### Can't see "Custom List" option
- Try: Site Contents → New → List
- Or: Settings → Add an app → Custom List

### Choice column not saving correctly
- Make sure each choice is on a separate line
- Don't include extra spaces

### "The list already exists" error
- A list with that name already exists
- Either use the existing list or delete it first

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│           SHAREPOINT LISTS SUMMARY                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Meetings (7 columns)                            │
│     └─ Stores meeting records                       │
│                                                      │
│  2. Isolations (10 columns)                         │
│     └─ Stores isolation tracking data               │
│                                                      │
│  3. Attendees (5 columns)                           │
│     └─ Master list of people (shared)               │
│                                                      │
│  4. Action Items (8 columns)                        │
│     └─ Tasks assigned from meetings                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Need Help?

If you encounter issues:
1. Check your permissions (Site Settings → Site Permissions)
2. Verify SharePoint version (Site Settings → Site Information)
3. Contact your SharePoint administrator

---

**Document Version:** 1.0
**Compatible With:** SharePoint 2013, 2016, 2019, Online
