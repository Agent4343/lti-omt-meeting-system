Attribute VB_Name = "modConfig"
Option Explicit

' ===== Workbook Structure =====
Public Const SH_UI_HOME As String = "UI_Home"
Public Const SH_UI_MEETING As String = "UI_Meeting"
Public Const SH_UI_REVIEW As String = "UI_Review"
Public Const SH_UI_SUMMARY As String = "UI_Summary"
Public Const SH_DATA As String = "Data"

Public Const TBL_MEETINGS As String = "tblMeetings"
Public Const TBL_PEOPLE As String = "tblPeople"
Public Const TBL_MASTER As String = "tblMasterIsolations"
Public Const TBL_MEETING_ISO As String = "tblMeetingIsolations"
Public Const TBL_RESPONSES As String = "tblResponses"

' ===== Meetings table columns =====
Public Const COL_MTG_ID As String = "MeetingID"
Public Const COL_MTG_DATE As String = "MeetingDate"
Public Const COL_MTG_CREATED As String = "CreatedAt"
Public Const COL_MTG_TITLE As String = "Title"
Public Const COL_MTG_ATTENDEES As String = "Attendees"  ' comma-separated
Public Const COL_MTG_STATUS As String = "Status"          ' Draft/Final

' ===== Isolation columns (master + meeting) =====
Public Const COL_ISO_ID As String = "IsolationID"         ' required
Public Const COL_ISO_DESC As String = "Description"        ' optional
Public Const COL_ISO_SYSTEM As String = "SystemEquipment"  ' optional
Public Const COL_ISO_START As String = "PlannedStartDate"  ' optional

' ===== Response columns =====
Public Const COL_RESP_MEETING_ID As String = "MeetingID"
Public Const COL_RESP_ISO_ID As String = "IsolationID"
Public Const COL_RESP_RISK As String = "RiskLevel"                 ' Low/Medium/High/Critical/N-A
Public Const COL_RESP_BIZ As String = "BusinessImpact"             ' Low/Medium/High/Critical/N-A
Public Const COL_RESP_MOC_REQ As String = "MOCRequired"            ' Yes/No/Under Review/N-A
Public Const COL_RESP_MOC_NUM As String = "MOCNumber"
Public Const COL_RESP_MOC_STATUS As String = "MOCStatus"
Public Const COL_RESP_PARTS_REQ As String = "PartsRequired"        ' Yes/No/Unknown/N-A
Public Const COL_RESP_PARTS_DESC As String = "PartsDescription"
Public Const COL_RESP_PARTS_ETA As String = "PartsExpectedDate"
Public Const COL_RESP_PARTS_STATUS As String = "PartsStatus"
Public Const COL_RESP_DISCONN As String = "EquipmentDisconnectionRequired" ' Yes/No/Partially/N-A
Public Const COL_RESP_REMOVAL As String = "EquipmentRemovalRequired"        ' Yes/No/Temporarily/N-A
Public Const COL_RESP_RESOLUTION_DATE As String = "PlannedResolutionDate"
Public Const COL_RESP_WORK_WINDOW As String = "WorkWindowRequired"
Public Const COL_RESP_PRIORITY As String = "PriorityLevel"
Public Const COL_RESP_ACTION_REQ As String = "ActionRequired"      ' None/Monitor/Plan Work/Urgent/N-A
Public Const COL_RESP_NEXT_REVIEW As String = "NextReviewDate"
Public Const COL_RESP_COMMENTS As String = "Comments"

' WMS Manual risk assessment
Public Const COL_RESP_CORR As String = "CorrosionRisk"              ' Low/Medium/High/N-A
Public Const COL_RESP_CORR_C As String = "CorrosionRiskComment"
Public Const COL_RESP_DEAD As String = "DeadLegsRisk"
Public Const COL_RESP_DEAD_C As String = "DeadLegsRiskComment"
Public Const COL_RESP_AUTO As String = "AutomationLossRisk"
Public Const COL_RESP_AUTO_C As String = "AutomationLossRiskComment"

' Asset manager escalation
Public Const COL_RESP_AM_REVIEW As String = "AssetManagerReviewRequired"   ' Required/Scheduled/Completed/N-A
Public Const COL_RESP_AM_REASON As String = "EscalationReason"
Public Const COL_RESP_AM_STRATEGY As String = "ResolutionStrategy"

' Meta
Public Const COL_RESP_UPDATED As String = "UpdatedAt"

' ===== UI named ranges (created by SetupWorkbook) =====
Public Const NR_ACTIVE_MEETING_ID As String = "nrActiveMeetingID"
Public Const NR_REVIEW_INDEX As String = "nrReviewIndex"
Public Const NR_REVIEW_ISO_ID As String = "nrReviewIsolationID"
