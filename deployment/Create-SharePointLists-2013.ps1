<#
.SYNOPSIS
    Creates SharePoint lists required for LTI OMT Meeting System

.DESCRIPTION
    This script creates the following SharePoint lists:
    - Meetings: Stores meeting records
    - Isolations: Stores isolation tracking data
    - Attendees: Stores master list of attendees (shared across organization)
    - Action Items: Stores action items from meetings

.PARAMETER SiteUrl
    The URL of the SharePoint site where lists will be created

.EXAMPLE
    .\Create-SharePointLists-2013.ps1 -SiteUrl "http://sharepoint.company.com/sites/ltiomt"

.NOTES
    Compatible with: SharePoint 2013, SharePoint 2016, SharePoint 2019
    Author: LTI OMT Meeting System
    Version: 1.0.0
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="SharePoint site URL")]
    [string]$SiteUrl,

    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Load SharePoint PowerShell snap-in
Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  LTI OMT Meeting System - SharePoint Setup  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target Site: $SiteUrl" -ForegroundColor Yellow
Write-Host ""

# Verify site exists
try {
    $web = Get-SPWeb $SiteUrl -ErrorAction Stop
    Write-Host "[OK] Connected to SharePoint site: $($web.Title)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to connect to SharePoint site: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Function to create a list if it doesn't exist
function Create-ListIfNotExists {
    param(
        [Parameter(Mandatory=$true)]
        [Microsoft.SharePoint.SPWeb]$Web,

        [Parameter(Mandatory=$true)]
        [string]$ListName,

        [Parameter(Mandatory=$true)]
        [string]$Description,

        [Parameter(Mandatory=$false)]
        [switch]$Force = $false
    )

    $list = $Web.Lists.TryGetList($ListName)

    if ($list -ne $null) {
        if ($Force) {
            Write-Host "  [WARN] List '$ListName' exists. Deleting and recreating..." -ForegroundColor Yellow
            $list.Delete()
            $list = $null
        }
        else {
            Write-Host "  [SKIP] List '$ListName' already exists" -ForegroundColor Cyan
            return $null
        }
    }

    if ($list -eq $null) {
        $listId = $Web.Lists.Add($ListName, $Description, [Microsoft.SharePoint.SPListTemplateType]::GenericList)
        $list = $Web.Lists[$listId]
        Write-Host "  [OK] Created list '$ListName'" -ForegroundColor Green
        return $list
    }

    return $null
}

# Function to add a field to a list
function Add-ListField {
    param(
        [Parameter(Mandatory=$true)]
        [Microsoft.SharePoint.SPList]$List,

        [Parameter(Mandatory=$true)]
        [string]$FieldName,

        [Parameter(Mandatory=$true)]
        [Microsoft.SharePoint.SPFieldType]$FieldType,

        [Parameter(Mandatory=$false)]
        [bool]$Required = $false
    )

    try {
        if ($List.Fields.ContainsField($FieldName)) {
            Write-Host "    [SKIP] Field '$FieldName' already exists" -ForegroundColor Gray
            return
        }

        $List.Fields.Add($FieldName, $FieldType, $Required)
        Write-Host "    [OK] Added field '$FieldName'" -ForegroundColor DarkGreen
    }
    catch {
        Write-Host "    [ERROR] Failed to add field '$FieldName': $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to add a choice field to a list
function Add-ChoiceField {
    param(
        [Parameter(Mandatory=$true)]
        [Microsoft.SharePoint.SPList]$List,

        [Parameter(Mandatory=$true)]
        [string]$FieldName,

        [Parameter(Mandatory=$true)]
        [string[]]$Choices,

        [Parameter(Mandatory=$false)]
        [string]$DefaultValue = ""
    )

    try {
        if ($List.Fields.ContainsField($FieldName)) {
            Write-Host "    [SKIP] Choice field '$FieldName' already exists" -ForegroundColor Gray
            return
        }

        $choicesXml = ($Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ""
        $defaultXml = if ($DefaultValue) { "<Default>$DefaultValue</Default>" } else { "" }

        $fieldXml = @"
<Field Type="Choice" DisplayName="$FieldName" Name="$FieldName" Required="FALSE">
    <CHOICES>
        $choicesXml
    </CHOICES>
    $defaultXml
</Field>
"@

        $List.Fields.AddFieldAsXml($fieldXml, $true, [Microsoft.SharePoint.SPAddFieldOptions]::AddFieldToDefaultView) | Out-Null
        Write-Host "    [OK] Added choice field '$FieldName'" -ForegroundColor DarkGreen
    }
    catch {
        Write-Host "    [ERROR] Failed to add choice field '$FieldName': $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Creating SharePoint Lists..." -ForegroundColor Yellow
Write-Host ""

# ========================================
# CREATE MEETINGS LIST
# ========================================
Write-Host "[1/4] Meetings List" -ForegroundColor White
$meetingsList = Create-ListIfNotExists -Web $web -ListName "Meetings" -Description "LTI OMT Meeting records and tracking" -Force:$Force

if ($meetingsList -ne $null) {
    Add-ListField -List $meetingsList -FieldName "Description" -FieldType Note
    Add-ListField -List $meetingsList -FieldName "Attendees" -FieldType Note
    Add-ListField -List $meetingsList -FieldName "MeetingData" -FieldType Note
    Add-ListField -List $meetingsList -FieldName "IsolationCount" -FieldType Number
    Add-ChoiceField -List $meetingsList -FieldName "Status" -Choices @("Planned", "In Progress", "Completed", "Cancelled") -DefaultValue "Planned"

    $meetingsList.Update()
    Write-Host "  [OK] Meetings list configured successfully" -ForegroundColor Green
}

# ========================================
# CREATE ISOLATIONS LIST
# ========================================
Write-Host ""
Write-Host "[2/4] Isolations List" -ForegroundColor White
$isolationsList = Create-ListIfNotExists -Web $web -ListName "Isolations" -Description "LTI Isolation tracking and management" -Force:$Force

if ($isolationsList -ne $null) {
    Add-ListField -List $isolationsList -FieldName "Description" -FieldType Note
    Add-ListField -List $isolationsList -FieldName "PlannedStartDate" -FieldType DateTime
    Add-ListField -List $isolationsList -FieldName "RelatedIsolations" -FieldType Note
    Add-ListField -List $isolationsList -FieldName "MeetingId" -FieldType Number
    Add-ListField -List $isolationsList -FieldName "MOCRequired" -FieldType Text
    Add-ListField -List $isolationsList -FieldName "PartsRequired" -FieldType Text
    Add-ListField -List $isolationsList -FieldName "Comments" -FieldType Note
    Add-ChoiceField -List $isolationsList -FieldName "RiskLevel" -Choices @("Critical", "High", "Medium", "Low") -DefaultValue "Medium"
    Add-ChoiceField -List $isolationsList -FieldName "Status" -Choices @("Active", "Under Review", "Completed", "Cancelled") -DefaultValue "Active"

    $isolationsList.Update()
    Write-Host "  [OK] Isolations list configured successfully" -ForegroundColor Green
}

# ========================================
# CREATE ATTENDEES LIST
# ========================================
Write-Host ""
Write-Host "[3/4] Attendees List" -ForegroundColor White
$attendeesList = Create-ListIfNotExists -Web $web -ListName "Attendees" -Description "Meeting attendees master list (shared across organization)" -Force:$Force

if ($attendeesList -ne $null) {
    Add-ListField -List $attendeesList -FieldName "Email" -FieldType Text
    Add-ListField -List $attendeesList -FieldName "Active" -FieldType Boolean
    Add-ChoiceField -List $attendeesList -FieldName "Department" -Choices @("Operations", "Engineering", "Safety", "Management", "Maintenance", "Quality", "Other") -DefaultValue "Operations"
    Add-ChoiceField -List $attendeesList -FieldName "Role" -Choices @("Organizer", "Reviewer", "Approver", "Observer") -DefaultValue "Reviewer"

    $attendeesList.Update()
    Write-Host "  [OK] Attendees list configured successfully" -ForegroundColor Green
}

# ========================================
# CREATE ACTION ITEMS LIST
# ========================================
Write-Host ""
Write-Host "[4/4] Action Items List" -ForegroundColor White
$actionItemsList = Create-ListIfNotExists -Web $web -ListName "Action Items" -Description "Meeting action items tracking" -Force:$Force

if ($actionItemsList -ne $null) {
    Add-ListField -List $actionItemsList -FieldName "DueDate" -FieldType DateTime
    Add-ListField -List $actionItemsList -FieldName "MeetingId" -FieldType Number
    Add-ListField -List $actionItemsList -FieldName "IsolationId" -FieldType Text
    Add-ListField -List $actionItemsList -FieldName "Comments" -FieldType Note

    # AssignedTo (Person field) - requires special handling
    try {
        if (-not $actionItemsList.Fields.ContainsField("AssignedTo")) {
            $assignedToXml = @"
<Field Type="User" DisplayName="AssignedTo" Name="AssignedTo" Required="FALSE" UserSelectionMode="PeopleOnly" />
"@
            $actionItemsList.Fields.AddFieldAsXml($assignedToXml, $true, [Microsoft.SharePoint.SPAddFieldOptions]::AddFieldToDefaultView) | Out-Null
            Write-Host "    [OK] Added person field 'AssignedTo'" -ForegroundColor DarkGreen
        }
    }
    catch {
        Write-Host "    [WARN] Could not add person field 'AssignedTo': $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Add-ChoiceField -List $actionItemsList -FieldName "Priority" -Choices @("Critical", "High", "Medium", "Low") -DefaultValue "Medium"
    Add-ChoiceField -List $actionItemsList -FieldName "Status" -Choices @("Open", "In Progress", "Completed", "Cancelled") -DefaultValue "Open"

    $actionItemsList.Update()
    Write-Host "  [OK] Action Items list configured successfully" -ForegroundColor Green
}

# Cleanup
$web.Dispose()

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SharePoint Setup Complete!                 " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Site URL: $SiteUrl"
Write-Host "  Lists created/verified:"
Write-Host "    - Meetings"
Write-Host "    - Isolations"
Write-Host "    - Attendees"
Write-Host "    - Action Items"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure list permissions as needed"
Write-Host "  2. Set up list views for common filtering"
Write-Host "  3. Deploy the LTI OMT Meeting System application"
Write-Host "  4. Configure the app to use SharePoint storage"
Write-Host ""
Write-Host "To enable SharePoint storage in the application:" -ForegroundColor Cyan
Write-Host "  Set environment variable: REACT_APP_SHAREPOINT_MODE=true"
Write-Host "  Set environment variable: REACT_APP_SHAREPOINT_SITE_URL=$SiteUrl"
Write-Host ""
