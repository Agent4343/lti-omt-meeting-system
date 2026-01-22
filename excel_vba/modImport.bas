Attribute VB_Name = "modImport"
Option Explicit

' Import an isolation Excel file (first sheet), require an ID column (ID or id or IsolationID).
' Then compare to master list and write meeting snapshot rows.
Public Sub ImportAndCompare()
  Dim meetingId As String
  meetingId = CStr(ThisWorkbook.Worksheets(SH_UI_REVIEW).Range("B3").Value)
  If Len(meetingId) = 0 Then
    MsgBox "Create/set an active meeting first (UI_Meeting -> Create/Set Active Meeting).", vbExclamation
    Exit Sub
  End If

  Dim filePath As Variant
  filePath = Application.GetOpenFilename("Excel Files (*.xlsx;*.xls),*.xlsx;*.xls", , "Select Isolation Excel")
  If VarType(filePath) = vbBoolean Then Exit Sub

  Application.ScreenUpdating = False

  Dim wb As Workbook
  Set wb = Workbooks.Open(CStr(filePath), ReadOnly:=True)

  Dim ws As Worksheet
  Set ws = wb.Worksheets(1)

  Dim dataRange As Range
  Set dataRange = ws.UsedRange

  If dataRange.Rows.Count < 2 Then
    wb.Close False
    MsgBox "No rows found in the file.", vbExclamation
    Application.ScreenUpdating = True
    Exit Sub
  End If

  ' Build header map
  Dim headerMap As Object
  Set headerMap = CreateObject("Scripting.Dictionary")

  Dim c As Long
  For c = 1 To dataRange.Columns.Count
    headerMap(LCase$(NormalizeText(CStr(dataRange.Cells(1, c).Value)))) = c
  Next c

  Dim idCol As Long
  idCol = 0
  If headerMap.Exists("id") Then idCol = headerMap("id")
  If idCol = 0 And headerMap.Exists("isolationid") Then idCol = headerMap("isolationid")
  If idCol = 0 And headerMap.Exists("isolation id") Then idCol = headerMap("isolation id")
  If idCol = 0 And headerMap.Exists("cahe") Then idCol = headerMap("cahe")
  If idCol = 0 And headerMap.Exists("id ") Then idCol = headerMap("id ")
  If idCol = 0 And headerMap.Exists("id") = False And headerMap.Exists("isolationid") = False Then
    If headerMap.Exists("id") Then
      idCol = headerMap("id")
    End If
  End If
  If idCol = 0 And headerMap.Exists("id") = False Then
    If headerMap.Exists("id") Then idCol = headerMap("id")
  End If

  If idCol = 0 Then
    wb.Close False
    MsgBox "Excel must contain an ID column (ID/id/IsolationID).", vbExclamation
    Application.ScreenUpdating = True
    Exit Sub
  End If

  Dim descCol As Long, sysCol As Long, startCol As Long
  descCol = IIf(headerMap.Exists("description"), headerMap("description"), 0)
  If descCol = 0 And headerMap.Exists("title") Then descCol = headerMap("title")

  sysCol = IIf(headerMap.Exists("system/equipment"), headerMap("system/equipment"), 0)
  If sysCol = 0 And headerMap.Exists("systemequipment") Then sysCol = headerMap("systemequipment")

  startCol = IIf(headerMap.Exists("planned start date"), headerMap("planned start date"), 0)
  If startCol = 0 And headerMap.Exists("plannedstartdate") Then startCol = headerMap("plannedstartdate")

  ' Read uploaded isolations into dictionary
  Dim uploaded As Object
  Set uploaded = CreateObject("Scripting.Dictionary")

  Dim r As Long
  For r = 2 To dataRange.Rows.Count
    Dim isoId As String
    isoId = NormalizeText(CStr(dataRange.Cells(r, idCol).Value))
    If Len(isoId) > 0 Then
      Dim rec As Object
      Set rec = CreateObject("Scripting.Dictionary")
      rec(COL_ISO_ID) = isoId
      rec(COL_ISO_DESC) = IIf(descCol > 0, NormalizeText(CStr(dataRange.Cells(r, descCol).Value)), "")
      rec(COL_ISO_SYSTEM) = IIf(sysCol > 0, NormalizeText(CStr(dataRange.Cells(r, sysCol).Value)), "")
      If startCol > 0 Then
        rec(COL_ISO_START) = DateFromExcelValue(dataRange.Cells(r, startCol).Value)
      Else
        rec(COL_ISO_START) = Empty
      End If

      uploaded(isoId) = rec
    End If
  Next r

  wb.Close False

  If uploaded.Count = 0 Then
    MsgBox "No valid IDs found in file.", vbExclamation
    Application.ScreenUpdating = True
    Exit Sub
  End If

  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim loMaster As ListObject, loMeetingIso As ListObject
  Set loMaster = FindTable(wsData, TBL_MASTER)
  Set loMeetingIso = FindTable(wsData, TBL_MEETING_ISO)

  ' Master IDs
  Dim masterIds As Object
  Set masterIds = CreateObject("Scripting.Dictionary")

  Dim i As Long
  For i = 1 To loMaster.ListRows.Count
    Dim mid As String
    mid = NormalizeText(CStr(loMaster.DataBodyRange(i, loMaster.ListColumns(COL_ISO_ID).Index).Value))
    If Len(mid) > 0 Then masterIds(mid) = True
  Next i

  ' Compare: added = in uploaded not in master; removed = in master not in uploaded
  Dim addedCount As Long, removedCount As Long

  Dim key As Variant
  For Each key In uploaded.Keys
    If Not masterIds.Exists(CStr(key)) Then
      addedCount = addedCount + 1
    End If
  Next key

  For Each key In masterIds.Keys
    If Not uploaded.Exists(CStr(key)) Then
      removedCount = removedCount + 1
    End If
  Next key

  ' Write meeting snapshot rows (clear old snapshot rows for this meeting first)
  Call ClearMeetingSnapshot(meetingId)

  ' Add uploaded rows
  For Each key In uploaded.Keys
    Dim recUp As Object
    Set recUp = uploaded(CStr(key))

    Dim lr As ListRow
    Set lr = loMeetingIso.ListRows.Add
    lr.Range(1, loMeetingIso.ListColumns(COL_MTG_ID).Index).Value = meetingId
    lr.Range(1, loMeetingIso.ListColumns(COL_ISO_ID).Index).Value = recUp(COL_ISO_ID)
    lr.Range(1, loMeetingIso.ListColumns(COL_ISO_DESC).Index).Value = recUp(COL_ISO_DESC)
    lr.Range(1, loMeetingIso.ListColumns(COL_ISO_SYSTEM).Index).Value = recUp(COL_ISO_SYSTEM)
    lr.Range(1, loMeetingIso.ListColumns(COL_ISO_START).Index).Value = recUp(COL_ISO_START)
    lr.Range(1, loMeetingIso.ListColumns("IsAdded").Index).Value = IIf(masterIds.Exists(CStr(key)), "No", "Yes")
    lr.Range(1, loMeetingIso.ListColumns("IsRemoved").Index).Value = "No"
  Next key

  ' Add removed rows (so you can see them in summary)
  For Each key In masterIds.Keys
    If Not uploaded.Exists(CStr(key)) Then
      Dim lr2 As ListRow
      Set lr2 = loMeetingIso.ListRows.Add
      lr2.Range(1, loMeetingIso.ListColumns(COL_MTG_ID).Index).Value = meetingId
      lr2.Range(1, loMeetingIso.ListColumns(COL_ISO_ID).Index).Value = CStr(key)
      lr2.Range(1, loMeetingIso.ListColumns(COL_ISO_DESC).Index).Value = ""
      lr2.Range(1, loMeetingIso.ListColumns(COL_ISO_SYSTEM).Index).Value = ""
      lr2.Range(1, loMeetingIso.ListColumns(COL_ISO_START).Index).Value = Empty
      lr2.Range(1, loMeetingIso.ListColumns("IsAdded").Index).Value = "No"
      lr2.Range(1, loMeetingIso.ListColumns("IsRemoved").Index).Value = "Yes"
    End If
  Next key

  ' Update master list to uploaded (like the web app)
  Call ReplaceMasterWithUploaded(uploaded, loMaster)

  Application.ScreenUpdating = True

  MsgBox "Import complete." & vbCrLf & _
         "Uploaded: " & uploaded.Count & vbCrLf & _
         "Added vs prior master: " & addedCount & vbCrLf & _
         "Removed vs prior master: " & removedCount & vbCrLf & vbCrLf & _
         "Next: Go to UI_Review and click Load Current.", vbInformation
End Sub

Private Sub ClearMeetingSnapshot(ByVal meetingId As String)
  Dim wsData As Worksheet
  Set wsData = ThisWorkbook.Worksheets(SH_DATA)

  Dim lo As ListObject
  Set lo = FindTable(wsData, TBL_MEETING_ISO)

  Dim i As Long
  For i = lo.ListRows.Count To 1 Step -1
    If CStr(lo.DataBodyRange(i, lo.ListColumns(COL_MTG_ID).Index).Value) = meetingId Then
      lo.ListRows(i).Delete
    End If
  Next i
End Sub

Private Sub ReplaceMasterWithUploaded(ByVal uploaded As Object, ByVal loMaster As ListObject)
  ' Clear all master rows
  Do While loMaster.ListRows.Count > 0
    loMaster.ListRows(1).Delete
  Loop

  Dim key As Variant
  For Each key In uploaded.Keys
    Dim rec As Object
    Set rec = uploaded(CStr(key))

    Dim lr As ListRow
    Set lr = loMaster.ListRows.Add
    lr.Range(1, loMaster.ListColumns(COL_ISO_ID).Index).Value = rec(COL_ISO_ID)
    lr.Range(1, loMaster.ListColumns(COL_ISO_DESC).Index).Value = rec(COL_ISO_DESC)
    lr.Range(1, loMaster.ListColumns(COL_ISO_SYSTEM).Index).Value = rec(COL_ISO_SYSTEM)
    lr.Range(1, loMaster.ListColumns(COL_ISO_START).Index).Value = rec(COL_ISO_START)
  Next key
End Sub
