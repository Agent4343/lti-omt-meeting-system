Attribute VB_Name = "modMeeting"
Option Explicit

Public Sub StartNewMeeting()
  ThisWorkbook.Worksheets(SH_UI_MEETING).Activate
End Sub

Public Sub CreateOrSetActiveMeeting()
  Dim wsM As Worksheet
  Set wsM = ThisWorkbook.Worksheets(SH_UI_MEETING)

  Dim meetingDate As Variant
  meetingDate = wsM.Range("B3").Value
  If Not IsDate(meetingDate) Then
    MsgBox "Enter a valid meeting date in UI_Meeting!B3", vbExclamation
    Exit Sub
  End If

  Dim title As String, attendees As String
  title = NormalizeText(CStr(wsM.Range("B4").Value))
  attendees = NormalizeText(CStr(wsM.Range("B5").Value))
  If Len(attendees) = 0 Then
    MsgBox "Enter at least one attendee (names/emails) in UI_Meeting!B5", vbExclamation
    Exit Sub
  End If

  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETINGS)

  Dim meetingId As String
  meetingId = Replace$(Replace$(NewGuid(), "{", ""), "}", "")

  Dim r As ListRow
  Set r = lo.ListRows.Add
  r.Range(1, lo.ListColumns(COL_MTG_ID).Index).Value = meetingId
  r.Range(1, lo.ListColumns(COL_MTG_DATE).Index).Value = CDate(meetingDate)
  r.Range(1, lo.ListColumns(COL_MTG_CREATED).Index).Value = Now
  r.Range(1, lo.ListColumns(COL_MTG_TITLE).Index).Value = title
  r.Range(1, lo.ListColumns(COL_MTG_ATTENDEES).Index).Value = attendees
  r.Range(1, lo.ListColumns(COL_MTG_STATUS).Index).Value = "Draft"

  ' Set active meeting id in UI_Review
  With ThisWorkbook.Worksheets(SH_UI_REVIEW)
    .Range("B3").Value = meetingId
    .Range("B4").Value = 1
    .Range("B5").Value = ""
  End With

  MsgBox "Active meeting created: " & meetingId & vbCrLf & "Next: Import isolations.", vbInformation
  ThisWorkbook.Worksheets(SH_UI_REVIEW).Activate
End Sub

Public Sub FinalizeMeeting()
  Dim meetingId As String
  meetingId = CStr(ThisWorkbook.Worksheets(SH_UI_REVIEW).Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "No active MeetingID set.", vbExclamation
    Exit Sub
  End If

  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETINGS)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      lo.DataBodyRange(i, lo.ListColumns(COL_MTG_STATUS).Index).Value = "Final"
      Exit For
    End If
  Next i

  Call modSummary.BuildSummary
  ThisWorkbook.Worksheets(SH_UI_SUMMARY).Activate
  MsgBox "Meeting finalized and summary refreshed.", vbInformation
End Sub

Public Sub ShowPastMeetings()
  MsgBox "Past Meetings view is table-driven in Data!" & TBL_MEETINGS & ". " & _
         "(Next enhancement: a UI grid + open meeting button)", vbInformation
  ThisWorkbook.Worksheets(SH_DATA).Activate
End Sub
