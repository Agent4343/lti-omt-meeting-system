Attribute VB_Name = "modExport"
Option Explicit

Public Sub ExportSummaryPDF()
  Dim ws As Worksheet
  Set ws = ThisWorkbook.Worksheets(SH_UI_SUMMARY)

  Dim outPath As String
  outPath = ThisWorkbook.Path
  If Len(outPath) = 0 Then
    MsgBox "Save the workbook first so we can choose an output folder.", vbExclamation
    Exit Sub
  End If

  Dim meetingId As String
  meetingId = CStr(ws.Range("B3").Value)
  If Len(meetingId) = 0 Then meetingId = "Meeting"

  Dim fileName As String
  fileName = outPath & "\MeetingSummary_" & meetingId & ".pdf"

  ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=fileName, Quality:=xlQualityStandard
  MsgBox "PDF exported: " & fileName, vbInformation
End Sub

Public Sub ExportMeetingExcel()
  Dim meetingId As String
  meetingId = CStr(ThisWorkbook.Worksheets(SH_UI_REVIEW).Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "No active MeetingID set.", vbExclamation
    Exit Sub
  End If

  Dim outPath As String
  outPath = ThisWorkbook.Path
  If Len(outPath) = 0 Then
    MsgBox "Save the workbook first so we can choose an output folder.", vbExclamation
    Exit Sub
  End If

  Dim wbOut As Workbook
  Set wbOut = Workbooks.Add

  Dim wsOut As Worksheet
  Set wsOut = wbOut.Worksheets(1)
  wsOut.Name = "MeetingExport"

  wsOut.Range("A1").Value = "MeetingID"
  wsOut.Range("B1").Value = meetingId

  ' Dump meeting isolations + response (flat) starting at row 3
  wsOut.Range("A3").Value = "IsolationID"
  wsOut.Range("B3").Value = "Description"
  wsOut.Range("C3").Value = "SystemEquipment"
  wsOut.Range("D3").Value = "PlannedStartDate"
  wsOut.Range("E3").Value = "RiskLevel"
  wsOut.Range("F3").Value = "MOCRequired"
  wsOut.Range("G3").Value = "MOCNumber"
  wsOut.Range("H3").Value = "PartsRequired"
  wsOut.Range("I3").Value = "PartsExpectedDate"
  wsOut.Range("J3").Value = "ActionRequired"
  wsOut.Range("K3").Value = "Comments"

  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim loIso As ListObject, loResp As ListObject
  Set loIso = FindTable(wsData, TBL_MEETING_ISO)
  Set loResp = FindTable(wsData, TBL_RESPONSES)

  Dim outRow As Long
  outRow = 4

  Dim i As Long
  For i = 1 To loIso.ListRows.Count
    If CStr(loIso.DataBodyRange(i, loIso.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      If CStr(loIso.DataBodyRange(i, loIso.ListColumns("IsRemoved").Index).Value) <> "Yes" Then
        Dim isoId As String
        isoId = CStr(loIso.DataBodyRange(i, loIso.ListColumns(COL_ISO_ID).Index).Value)

        wsOut.Cells(outRow, 1).Value = isoId
        wsOut.Cells(outRow, 2).Value = loIso.DataBodyRange(i, loIso.ListColumns(COL_ISO_DESC).Index).Value
        wsOut.Cells(outRow, 3).Value = loIso.DataBodyRange(i, loIso.ListColumns(COL_ISO_SYSTEM).Index).Value
        wsOut.Cells(outRow, 4).Value = loIso.DataBodyRange(i, loIso.ListColumns(COL_ISO_START).Index).Value

        ' response lookup
        Dim risk As Variant, mocReq As Variant, mocNum As Variant, partsReq As Variant, partsEta As Variant, actionReq As Variant, comments As Variant
        risk = ""
        mocReq = ""
        mocNum = ""
        partsReq = ""
        partsEta = ""
        actionReq = ""
        comments = ""

        Dim j As Long
        For j = 1 To loResp.ListRows.Count
          If CStr(loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_MEETING_ID).Index).Value) = meetingId And _
             CStr(loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_ISO_ID).Index).Value) = isoId Then
            risk = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_RISK).Index).Value
            mocReq = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_MOC_REQ).Index).Value
            mocNum = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_MOC_NUM).Index).Value
            partsReq = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_PARTS_REQ).Index).Value
            partsEta = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_PARTS_ETA).Index).Value
            actionReq = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_ACTION_REQ).Index).Value
            comments = loResp.DataBodyRange(j, loResp.ListColumns(COL_RESP_COMMENTS).Index).Value
            Exit For
          End If
        Next j

        wsOut.Cells(outRow, 5).Value = risk
        wsOut.Cells(outRow, 6).Value = mocReq
        wsOut.Cells(outRow, 7).Value = mocNum
        wsOut.Cells(outRow, 8).Value = partsReq
        wsOut.Cells(outRow, 9).Value = partsEta
        wsOut.Cells(outRow, 10).Value = actionReq
        wsOut.Cells(outRow, 11).Value = comments

        outRow = outRow + 1
      End If
    End If
  Next i

  wsOut.Columns("A:K").AutoFit

  Dim fileName As String
  fileName = ThisWorkbook.Path & "\MeetingExport_" & meetingId & ".xlsx"
  Application.DisplayAlerts = False
  wbOut.SaveAs Filename:=fileName, FileFormat:=xlOpenXMLWorkbook
  Application.DisplayAlerts = True

  wbOut.Close False
  MsgBox "Meeting export saved: " & fileName, vbInformation
End Sub
