Attribute VB_Name = "modInit"
Option Explicit

' Run this once in a new .xlsm to create sheets/tables/named ranges.
Public Sub SetupWorkbook()
  Application.ScreenUpdating = False
  Application.DisplayAlerts = False

  Dim wsData As Worksheet
  Set wsData = GetOrCreateSheet(SH_DATA)
  wsData.Visible = xlSheetVeryHidden

  Dim wsHome As Worksheet, wsMeeting As Worksheet, wsReview As Worksheet, wsSummary As Worksheet
  Set wsHome = GetOrCreateSheet(SH_UI_HOME)
  Set wsMeeting = GetOrCreateSheet(SH_UI_MEETING)
  Set wsReview = GetOrCreateSheet(SH_UI_REVIEW)
  Set wsSummary = GetOrCreateSheet(SH_UI_SUMMARY)

  wsHome.Visible = xlSheetVisible
  wsMeeting.Visible = xlSheetVisible
  wsReview.Visible = xlSheetVisible
  wsSummary.Visible = xlSheetVisible

  BuildDataTables wsData
  BuildUISheets wsHome, wsMeeting, wsReview, wsSummary

  Application.DisplayAlerts = True
  Application.ScreenUpdating = True

  MsgBox "Setup complete. Use UI_Home to start.", vbInformation
End Sub

Private Sub BuildDataTables(ByVal ws As Worksheet)
  Dim headersMeetings As Variant
  headersMeetings = Array(COL_MTG_ID, COL_MTG_DATE, COL_MTG_CREATED, COL_MTG_TITLE, COL_MTG_ATTENDEES, COL_MTG_STATUS)
  Call EnsureTable(ws, TBL_MEETINGS, headersMeetings, "A1")

  Dim headersPeople As Variant
  headersPeople = Array("PersonName", "Email")
  Call EnsureTable(ws, TBL_PEOPLE, headersPeople, "A20")

  Dim headersMaster As Variant
  headersMaster = Array(COL_ISO_ID, COL_ISO_DESC, COL_ISO_SYSTEM, COL_ISO_START)
  Call EnsureTable(ws, TBL_MASTER, headersMaster, "A40")

  Dim headersMeetingIso As Variant
  headersMeetingIso = Array(COL_MTG_ID, COL_ISO_ID, COL_ISO_DESC, COL_ISO_SYSTEM, COL_ISO_START, "IsAdded", "IsRemoved")
  Call EnsureTable(ws, TBL_MEETING_ISO, headersMeetingIso, "A70")

  Dim headersResponses As Variant
  headersResponses = Array(
    COL_RESP_MEETING_ID, COL_RESP_ISO_ID, _
    COL_RESP_RISK, COL_RESP_BIZ, _
    COL_RESP_MOC_REQ, COL_RESP_MOC_NUM, COL_RESP_MOC_STATUS, _
    COL_RESP_PARTS_REQ, COL_RESP_PARTS_DESC, COL_RESP_PARTS_ETA, COL_RESP_PARTS_STATUS, _
    COL_RESP_DISCONN, COL_RESP_REMOVAL, _
    COL_RESP_RESOLUTION_DATE, COL_RESP_WORK_WINDOW, COL_RESP_PRIORITY, _
    COL_RESP_ACTION_REQ, COL_RESP_NEXT_REVIEW, COL_RESP_COMMENTS, _
    COL_RESP_CORR, COL_RESP_CORR_C, COL_RESP_DEAD, COL_RESP_DEAD_C, COL_RESP_AUTO, COL_RESP_AUTO_C, _
    COL_RESP_AM_REVIEW, COL_RESP_AM_REASON, COL_RESP_AM_STRATEGY, _
    COL_RESP_UPDATED
  )
  Call EnsureTable(ws, TBL_RESPONSES, headersResponses, "A110")
End Sub

Private Sub BuildUISheets(ByVal wsHome As Worksheet, ByVal wsMeeting As Worksheet, ByVal wsReview As Worksheet, ByVal wsSummary As Worksheet)
  wsHome.Cells.Clear
  wsMeeting.Cells.Clear
  wsReview.Cells.Clear
  wsSummary.Cells.Clear

  ' --- UI_Home ---
  wsHome.Range("A1").Value = "LTI OMT Meeting System (Excel VBA)"
  wsHome.Range("A1").Font.Size = 18
  wsHome.Range("A1").Font.Bold = True

  wsHome.Range("A3").Value = "Buttons (assign macros):"
  wsHome.Range("A4").Value = "- Start New Meeting  ->  modMeeting.StartNewMeeting"
  wsHome.Range("A5").Value = "- Go To Past Meetings -> modMeeting.ShowPastMeetings"
  wsHome.Range("A6").Value = "- Setup Workbook (one-time) -> modInit.SetupWorkbook"

  ' --- UI_Meeting ---
  wsMeeting.Range("A1").Value = "Meeting Setup"
  wsMeeting.Range("A1").Font.Size = 16
  wsMeeting.Range("A1").Font.Bold = True

  wsMeeting.Range("A3").Value = "Meeting Date (YYYY-MM-DD):"
  wsMeeting.Range("B3").NumberFormat = "yyyy-mm-dd"

  wsMeeting.Range("A4").Value = "Title (optional):"
  wsMeeting.Range("A5").Value = "Attendees (comma-separated emails or names):"

  wsMeeting.Range("A7").Value = "Buttons (assign macros):"
  wsMeeting.Range("A8").Value = "- Create/Set Active Meeting -> modMeeting.CreateOrSetActiveMeeting"
  wsMeeting.Range("A9").Value = "- Import Isolation Excel + Compare -> modImport.ImportAndCompare"

  ' --- UI_Review ---
  wsReview.Range("A1").Value = "Isolation Review"
  wsReview.Range("A1").Font.Size = 16
  wsReview.Range("A1").Font.Bold = True

  wsReview.Range("A3").Value = "Active MeetingID:"
  wsReview.Range("B3").Value = ""
  SafeSetNamedRange NR_ACTIVE_MEETING_ID, wsReview.Range("B3")

  wsReview.Range("A4").Value = "Current index:"
  wsReview.Range("B4").Value = 1
  SafeSetNamedRange NR_REVIEW_INDEX, wsReview.Range("B4")

  wsReview.Range("A5").Value = "Current IsolationID:"
  wsReview.Range("B5").Value = ""
  SafeSetNamedRange NR_REVIEW_ISO_ID, wsReview.Range("B5")

  wsReview.Range("A7").Value = "Risk Level (Low/Medium/High/Critical/N-A):"
  wsReview.Range("A8").Value = "Business Impact (Low/Medium/High/Critical/N-A):"
  wsReview.Range("A9").Value = "MOC Required (Yes/No/Under Review/N-A):"
  wsReview.Range("A10").Value = "MOC Number:"
  wsReview.Range("A11").Value = "Parts Required (Yes/No/Unknown/N-A):"
  wsReview.Range("A12").Value = "Parts Expected Date:"
  wsReview.Range("A13").Value = "Action Required (None/Monitor/Plan Work/Urgent/N-A):"
  wsReview.Range("A14").Value = "Comments:"

  wsReview.Range("B12").NumberFormat = "yyyy-mm-dd"

  wsReview.Range("A16").Value = "Buttons (assign macros):"
  wsReview.Range("A17").Value = "- Load Current -> modReview.LoadCurrent"
  wsReview.Range("A18").Value = "- Save -> modReview.SaveCurrent"
  wsReview.Range("A19").Value = "- Previous -> modReview.PreviousIsolation"
  wsReview.Range("A20").Value = "- Next -> modReview.NextIsolation"
  wsReview.Range("A21").Value = "- Finalize Meeting -> modMeeting.FinalizeMeeting"

  ' --- UI_Summary ---
  wsSummary.Range("A1").Value = "Meeting Summary"
  wsSummary.Range("A1").Font.Size = 16
  wsSummary.Range("A1").Font.Bold = True

  wsSummary.Range("A3").Value = "Buttons (assign macros):"
  wsSummary.Range("A4").Value = "- Refresh Summary -> modSummary.BuildSummary"
  wsSummary.Range("A5").Value = "- Export Summary PDF -> modExport.ExportSummaryPDF"
  wsSummary.Range("A6").Value = "- Export Meeting Excel -> modExport.ExportMeetingExcel"
  wsSummary.Range("A7").Value = "- Email Outputs -> modEmail.EmailOutputs"

  wsHome.Columns("A:B").AutoFit
  wsMeeting.Columns("A:B").ColumnWidth = 40
  wsReview.Columns("A:B").ColumnWidth = 45
  wsSummary.Columns("A:B").AutoFit
End Sub
