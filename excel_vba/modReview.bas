Attribute VB_Name = "modReview"
Option Explicit

' UI_Review expects input cells:
' B7 RiskLevel
' B8 BusinessImpact
' B9 MOCRequired
' B10 MOCNumber
' B11 PartsRequired
' B12 PartsExpectedDate
' B13 ActionRequired
' B14 Comments

Public Sub LoadCurrent()
  Dim wsUI As Worksheet
  Set wsUI = ThisWorkbook.Worksheets(SH_UI_REVIEW)

  Dim meetingId As String
  meetingId = CStr(wsUI.Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "No active MeetingID set (UI_Review!B3).", vbExclamation
    Exit Sub
  End If

  Dim idx As Long
  idx = CLng(Nz(wsUI.Range("B4").Value, 1))
  If idx < 1 Then idx = 1

  Dim isoId As String
  isoId = GetMeetingIsolationIdByIndex(meetingId, idx)
  If Len(isoId) = 0 Then
    MsgBox "No isolations found for this meeting. Import first.", vbExclamation
    Exit Sub
  End If

  wsUI.Range("B5").Value = isoId

  ' Load response (if exists)
  Dim resp As Object
  Set resp = GetResponse(meetingId, isoId)

  If resp Is Nothing Then
    wsUI.Range("B7").Value = "N/A"
    wsUI.Range("B8").Value = "N/A"
    wsUI.Range("B9").Value = "N/A"
    wsUI.Range("B10").Value = ""
    wsUI.Range("B11").Value = "N/A"
    wsUI.Range("B12").Value = ""
    wsUI.Range("B13").Value = "N/A"
    wsUI.Range("B14").Value = ""
  Else
    wsUI.Range("B7").Value = Nz(resp(COL_RESP_RISK), "N/A")
    wsUI.Range("B8").Value = Nz(resp(COL_RESP_BIZ), "N/A")
    wsUI.Range("B9").Value = Nz(resp(COL_RESP_MOC_REQ), "N/A")
    wsUI.Range("B10").Value = Nz(resp(COL_RESP_MOC_NUM), "")
    wsUI.Range("B11").Value = Nz(resp(COL_RESP_PARTS_REQ), "N/A")
    wsUI.Range("B12").Value = Nz(resp(COL_RESP_PARTS_ETA), "")
    wsUI.Range("B13").Value = Nz(resp(COL_RESP_ACTION_REQ), "N/A")
    wsUI.Range("B14").Value = Nz(resp(COL_RESP_COMMENTS), "")
  End If

  ' Related isolation warning (first 3 digits after CAHE- from SystemEquipment)
  Dim sys As String
  sys = GetMeetingIsolationSystem(meetingId, isoId)
  Dim prefix As String
  prefix = CAHEPrefix3(sys)
  If Len(prefix) > 0 Then
    Dim relatedCount As Long
    relatedCount = CountRelatedByPrefix(meetingId, isoId, prefix)
    If relatedCount > 0 Then
      wsUI.Range("D3").Value = "WARNING: " & relatedCount & " related isolation(s) share CAHE-" & prefix
      wsUI.Range("D3").Font.Color = vbRed
      wsUI.Range("D3").Font.Bold = True
    Else
      wsUI.Range("D3").Value = ""
    End If
  Else
    wsUI.Range("D3").Value = ""
  End If
End Sub

Public Sub SaveCurrent()
  Dim wsUI As Worksheet
  Set wsUI = ThisWorkbook.Worksheets(SH_UI_REVIEW)

  Dim meetingId As String, isoId As String
  meetingId = CStr(wsUI.Range("B3").Value)
  isoId = CStr(wsUI.Range("B5").Value)

  If Len(meetingId) = 0 Or Len(isoId) = 0 Then
    MsgBox "Load an isolation first.", vbExclamation
    Exit Sub
  End If

  Dim fields As Object
  Set fields = CreateObject("Scripting.Dictionary")
  fields(COL_RESP_RISK) = NormalizeText(CStr(wsUI.Range("B7").Value))
  fields(COL_RESP_BIZ) = NormalizeText(CStr(wsUI.Range("B8").Value))
  fields(COL_RESP_MOC_REQ) = NormalizeText(CStr(wsUI.Range("B9").Value))
  fields(COL_RESP_MOC_NUM) = NormalizeText(CStr(wsUI.Range("B10").Value))
  fields(COL_RESP_PARTS_REQ) = NormalizeText(CStr(wsUI.Range("B11").Value))
  fields(COL_RESP_PARTS_ETA) = wsUI.Range("B12").Value
  fields(COL_RESP_ACTION_REQ) = NormalizeText(CStr(wsUI.Range("B13").Value))
  fields(COL_RESP_COMMENTS) = NormalizeText(CStr(wsUI.Range("B14").Value))

  UpsertResponse meetingId, isoId, fields
  MsgBox "Saved.", vbInformation
End Sub

Public Sub NextIsolation()
  Dim wsUI As Worksheet
  Set wsUI = ThisWorkbook.Worksheets(SH_UI_REVIEW)

  wsUI.Range("B4").Value = CLng(Nz(wsUI.Range("B4").Value, 1)) + 1
  LoadCurrent
End Sub

Public Sub PreviousIsolation()
  Dim wsUI As Worksheet
  Set wsUI = ThisWorkbook.Worksheets(SH_UI_REVIEW)

  Dim idx As Long
  idx = CLng(Nz(wsUI.Range("B4").Value, 1)) - 1
  If idx < 1 Then idx = 1
  wsUI.Range("B4").Value = idx
  LoadCurrent
End Sub

Private Function GetMeetingIsolationIdByIndex(ByVal meetingId As String, ByVal index1 As Long) As String
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETING_ISO)

  Dim n As Long, i As Long
  n = 0
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      ' skip removed rows
      If CStr(lo.DataBodyRange(i, lo.ListColumns("IsRemoved").Index).Value) <> "Yes" Then
        n = n + 1
        If n = index1 Then
          GetMeetingIsolationIdByIndex = CStr(lo.DataBodyRange(i, lo.ListColumns(COL_ISO_ID).Index).Value)
          Exit Function
        End If
      End If
    End If
  Next i

  GetMeetingIsolationIdByIndex = ""
End Function

Private Function GetMeetingIsolationSystem(ByVal meetingId As String, ByVal isoId As String) As String
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETING_ISO)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_ISO_ID).Index).Value) = isoId Then
        GetMeetingIsolationSystem = CStr(lo.DataBodyRange(i, lo.ListColumns(COL_ISO_SYSTEM).Index).Value)
        Exit Function
      End If
    End If
  Next i

  GetMeetingIsolationSystem = ""
End Function

Private Function CountRelatedByPrefix(ByVal meetingId As String, ByVal isoId As String, ByVal prefix3 As String) As Long
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETING_ISO)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      Dim otherId As String
      otherId = CStr(lo.DataBodyRange(i, lo.ListColumns(COL_ISO_ID).Index).Value)
      If otherId <> isoId Then
        Dim sys As String
        sys = CStr(lo.DataBodyRange(i, lo.ListColumns(COL_ISO_SYSTEM).Index).Value)
        If CAHEPrefix3(sys) = prefix3 Then
          CountRelatedByPrefix = CountRelatedByPrefix + 1
        End If
      End If
    End If
  Next i
End Function

Private Function GetResponse(ByVal meetingId As String, ByVal isoId As String) As Object
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_RESPONSES)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MEETING_ID).Index).Value) = meetingId Then
      If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_RESP_ISO_ID).Index).Value) = isoId Then
        Dim d As Object
        Set d = CreateObject("Scripting.Dictionary")
        d(COL_RESP_RISK) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_RISK).Index).Value
        d(COL_RESP_BIZ) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_BIZ).Index).Value
        d(COL_RESP_MOC_REQ) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MOC_REQ).Index).Value
        d(COL_RESP_MOC_NUM) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MOC_NUM).Index).Value
        d(COL_RESP_PARTS_REQ) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_PARTS_REQ).Index).Value
        d(COL_RESP_PARTS_ETA) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_PARTS_ETA).Index).Value
        d(COL_RESP_ACTION_REQ) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_ACTION_REQ).Index).Value
        d(COL_RESP_COMMENTS) = lo.DataBodyRange(i, lo.ListColumns(COL_RESP_COMMENTS).Index).Value
        Set GetResponse = d
        Exit Function
      End If
    End If
  Next i

  Set GetResponse = Nothing
End Function

Private Sub UpsertResponse(ByVal meetingId As String, ByVal isoId As String, ByVal fields As Object)
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_RESPONSES)

  Dim i As Long
  For i = 1 To lo.ListRows.Count
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MEETING_ID).Index).Value) = meetingId And _
       CStr(lo.DataBodyRange(i, lo.ListColumns(COL_RESP_ISO_ID).Index).Value) = isoId Then

      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_RISK).Index).Value = fields(COL_RESP_RISK)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_BIZ).Index).Value = fields(COL_RESP_BIZ)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MOC_REQ).Index).Value = fields(COL_RESP_MOC_REQ)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_MOC_NUM).Index).Value = fields(COL_RESP_MOC_NUM)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_PARTS_REQ).Index).Value = fields(COL_RESP_PARTS_REQ)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_PARTS_ETA).Index).Value = fields(COL_RESP_PARTS_ETA)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_ACTION_REQ).Index).Value = fields(COL_RESP_ACTION_REQ)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_COMMENTS).Index).Value = fields(COL_RESP_COMMENTS)
      lo.DataBodyRange(i, lo.ListColumns(COL_RESP_UPDATED).Index).Value = Now
      Exit Sub
    End If
  Next i

  Dim lr As ListRow
  Set lr = lo.ListRows.Add
  lr.Range(1, lo.ListColumns(COL_RESP_MEETING_ID).Index).Value = meetingId
  lr.Range(1, lo.ListColumns(COL_RESP_ISO_ID).Index).Value = isoId
  lr.Range(1, lo.ListColumns(COL_RESP_RISK).Index).Value = fields(COL_RESP_RISK)
  lr.Range(1, lo.ListColumns(COL_RESP_BIZ).Index).Value = fields(COL_RESP_BIZ)
  lr.Range(1, lo.ListColumns(COL_RESP_MOC_REQ).Index).Value = fields(COL_RESP_MOC_REQ)
  lr.Range(1, lo.ListColumns(COL_RESP_MOC_NUM).Index).Value = fields(COL_RESP_MOC_NUM)
  lr.Range(1, lo.ListColumns(COL_RESP_PARTS_REQ).Index).Value = fields(COL_RESP_PARTS_REQ)
  lr.Range(1, lo.ListColumns(COL_RESP_PARTS_ETA).Index).Value = fields(COL_RESP_PARTS_ETA)
  lr.Range(1, lo.ListColumns(COL_RESP_ACTION_REQ).Index).Value = fields(COL_RESP_ACTION_REQ)
  lr.Range(1, lo.ListColumns(COL_RESP_COMMENTS).Index).Value = fields(COL_RESP_COMMENTS)
  lr.Range(1, lo.ListColumns(COL_RESP_UPDATED).Index).Value = Now
End Sub
