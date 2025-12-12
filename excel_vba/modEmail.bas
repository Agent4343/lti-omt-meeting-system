Attribute VB_Name = "modEmail"
Option Explicit

' Sends an Outlook email with (optional) PDF + Excel exports attached.
' NOTE: Outlook security policies may prompt the user.
Public Sub EmailOutputs()
  Dim meetingId As String
  meetingId = CStr(ThisWorkbook.Worksheets(SH_UI_REVIEW).Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "No active MeetingID set.", vbExclamation
    Exit Sub
  End If

  If Len(ThisWorkbook.Path) = 0 Then
    MsgBox "Save the workbook first so exports have a folder.", vbExclamation
    Exit Sub
  End If

  ' Ensure latest summary exists
  Call modSummary.BuildSummary

  ' Create attachments
  Dim pdfPath As String, xlsxPath As String
  pdfPath = ThisWorkbook.Path & "\MeetingSummary_" & meetingId & ".pdf"
  xlsxPath = ThisWorkbook.Path & "\MeetingExport_" & meetingId & ".xlsx"

  Call modExport.ExportSummaryPDF
  Call modExport.ExportMeetingExcel

  Dim outlookApp As Object, mail As Object
  On Error Resume Next
  Set outlookApp = GetObject(, "Outlook.Application")
  If outlookApp Is Nothing Then Set outlookApp = CreateObject("Outlook.Application")
  On Error GoTo 0

  If outlookApp Is Nothing Then
    MsgBox "Outlook not available.", vbExclamation
    Exit Sub
  End If

  Set mail = outlookApp.CreateItem(0)

  Dim recipients As String
  recipients = GetMeetingAttendees(meetingId)

  With mail
    .To = recipients
    .Subject = "LTI Meeting Outputs - " & meetingId
    .Body = "Attached are the meeting summary PDF and meeting export Excel for meeting " & meetingId & "." & vbCrLf
    If Len(Dir$(pdfPath)) > 0 Then .Attachments.Add pdfPath
    If Len(Dir$(xlsxPath)) > 0 Then .Attachments.Add xlsxPath
    .Display  ' change to .Send if your policy allows automatic sending
  End With
End Sub

Private Function GetMeetingAttendees(ByVal meetingId As String) As String
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETINGS)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      GetMeetingAttendees = CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ATTENDEES).Index).Value)
      Exit Function
    End If
  Next i

  GetMeetingAttendees = ""
End Function
