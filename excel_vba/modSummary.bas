Attribute VB_Name = "modSummary"
Option Explicit

Public Sub BuildSummary()
  Dim meetingId As String
  meetingId = CStr(ThisWorkbook.Worksheets(SH_UI_REVIEW).Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "No active MeetingID set.", vbExclamation
    Exit Sub
  End If

  Dim wsSum As Worksheet
  Set wsSum = ThisWorkbook.Worksheets(SH_UI_SUMMARY)
  wsSum.Cells.Clear

  wsSum.Range("A1").Value = "Meeting Summary"
  wsSum.Range("A1").Font.Bold = True
  wsSum.Range("A1").Font.Size = 16

  wsSum.Range("A3").Value = "MeetingID:"
  wsSum.Range("B3").Value = meetingId

  Dim stats As Object
  Set stats = CalculateStats(meetingId)

  wsSum.Range("A5").Value = "Total isolations in meeting snapshot:"
  wsSum.Range("B5").Value = stats("total")

  wsSum.Range("A6").Value = "Added vs previous master:"
  wsSum.Range("B6").Value = stats("added")

  wsSum.Range("A7").Value = "Removed vs previous master:"
  wsSum.Range("B7").Value = stats("removed")

  wsSum.Range("A9").Value = "Risk distribution (from responses):"
  wsSum.Range("A10").Value = "Critical"
  wsSum.Range("A11").Value = "High"
  wsSum.Range("A12").Value = "Medium"
  wsSum.Range("A13").Value = "Low"
  wsSum.Range("B10").Value = stats("risk_critical")
  wsSum.Range("B11").Value = stats("risk_high")
  wsSum.Range("B12").Value = stats("risk_medium")
  wsSum.Range("B13").Value = stats("risk_low")

  wsSum.Columns("A:B").AutoFit
End Sub

Private Function CalculateStats(ByVal meetingId As String) As Object
  Dim d As Object
  Set d = CreateObject("Scripting.Dictionary")
  d("total") = 0
  d("added") = 0
  d("removed") = 0
  d("risk_critical") = 0
  d("risk_high") = 0
  d("risk_medium") = 0
  d("risk_low") = 0

  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim loIso As ListObject
  Set loIso = FindTable(wsData, TBL_MEETING_ISO)

  Dim i As Long
  For i = 1 To loIso.ListRows.Count
    If CStr(loIso.DataBodyRange(i, loIso.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      d("total") = d("total") + 1
      If CStr(loIso.DataBodyRange(i, loIso.ListColumns("IsAdded").Index).Value) = "Yes" Then d("added") = d("added") + 1
      If CStr(loIso.DataBodyRange(i, loIso.ListColumns("IsRemoved").Index).Value) = "Yes" Then d("removed") = d("removed") + 1
    End If
  Next i

  Dim loResp As ListObject
  Set loResp = FindTable(wsData, TBL_RESPONSES)

  For i = 1 To loResp.ListRows.Count
    If CStr(loResp.DataBodyRange(i, loResp.ListColumns(COL_RESP_MEETING_ID).Index).Value) = meetingId Then
      Dim risk As String
      risk = UCase$(NormalizeText(CStr(loResp.DataBodyRange(i, loResp.ListColumns(COL_RESP_RISK).Index).Value)))
      Select Case risk
        Case "CRITICAL": d("risk_critical") = d("risk_critical") + 1
        Case "HIGH": d("risk_high") = d("risk_high") + 1
        Case "MEDIUM": d("risk_medium") = d("risk_medium") + 1
        Case "LOW": d("risk_low") = d("risk_low") + 1
      End Select
    End If
  Next i

  Set CalculateStats = d
End Function
