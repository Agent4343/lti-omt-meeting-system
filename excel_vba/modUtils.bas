Attribute VB_Name = "modUtils"
Option Explicit

Public Function SheetExists(ByVal sheetName As String) As Boolean
  On Error Resume Next
  SheetExists = Not ThisWorkbook.Worksheets(sheetName) Is Nothing
  On Error GoTo 0
End Function

Public Function GetOrCreateSheet(ByVal sheetName As String) As Worksheet
  If SheetExists(sheetName) Then
    Set GetOrCreateSheet = ThisWorkbook.Worksheets(sheetName)
  Else
    Set GetOrCreateSheet = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
    GetOrCreateSheet.Name = sheetName
  End If
End Function

Public Function FindTable(ByVal ws As Worksheet, ByVal tableName As String) As ListObject
  Dim lo As ListObject
  For Each lo In ws.ListObjects
    If lo.Name = tableName Then
      Set FindTable = lo
      Exit Function
    End If
  Next lo
  Set FindTable = Nothing
End Function

Public Function EnsureTable(ByVal ws As Worksheet, ByVal tableName As String, ByVal headers As Variant, ByVal topLeft As String) As ListObject
  Dim lo As ListObject
  Set lo = FindTable(ws, tableName)
  If Not lo Is Nothing Then
    Set EnsureTable = lo
    Exit Function
  End If

  Dim r As Range
  Set r = ws.Range(topLeft)

  Dim i As Long
  For i = LBound(headers) To UBound(headers)
    r.Offset(0, i).Value = headers(i)
  Next i

  Set lo = ws.ListObjects.Add(xlSrcRange, ws.Range(r, r.Offset(1, UBound(headers))), , xlYes)
  lo.Name = tableName
  lo.TableStyle = "TableStyleMedium2"

  Set EnsureTable = lo
End Function

Public Function NewGuid() As String
  ' Example: "{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
  NewGuid = CreateObject("Scriptlet.TypeLib").GUID
End Function

Public Function Nz(ByVal v As Variant, Optional ByVal fallback As Variant = "") As Variant
  If IsError(v) Then
    Nz = fallback
  ElseIf IsEmpty(v) Or IsNull(v) Then
    Nz = fallback
  Else
    Nz = v
  End If
End Function

Public Function NormalizeText(ByVal s As String) As String
  NormalizeText = Trim$(Replace$(Replace$(s, vbCr, " "), vbLf, " "))
End Function

Public Function CAHEPrefix3(ByVal systemEquipment As String) As String
  ' Extract first 3 digits after CAHE or CAHE-
  Dim re As Object, m As Object
  Set re = CreateObject("VBScript.RegExp")
  re.Global = False
  re.IgnoreCase = True
  re.Pattern = "CAHE[-]?(\d{3})"

  If re.Test(systemEquipment) Then
    Set m = re.Execute(systemEquipment)(0)
    CAHEPrefix3 = m.SubMatches(0)
  Else
    CAHEPrefix3 = ""
  End If
End Function

Public Function DateFromExcelValue(ByVal v As Variant) As Variant
  ' Handles:
  ' - Excel serial date (number)
  ' - actual Date
  ' - ISO-ish string (YYYY-MM-DD)
  On Error GoTo CleanFail

  If IsDate(v) Then
    DateFromExcelValue = CDate(v)
    Exit Function
  End If

  If IsNumeric(v) Then
    ' Excel serial dates: 25000..50000 roughly maps 1968..2036
    If CDbl(v) > 25000 And CDbl(v) < 60000 Then
      DateFromExcelValue = DateSerial(1899, 12, 30) + CDbl(v)
      Exit Function
    End If
  End If

  If VarType(v) = vbString Then
    If Len(v) >= 10 Then
      If Mid$(v, 5, 1) = "-" And Mid$(v, 8, 1) = "-" Then
        DateFromExcelValue = DateSerial(CInt(Left$(v, 4)), CInt(Mid$(v, 6, 2)), CInt(Mid$(v, 9, 2)))
        Exit Function
      End If
    End If
  End If

CleanFail:
  DateFromExcelValue = Empty
End Function

Public Sub SafeSetNamedRange(ByVal name As String, ByVal target As Range)
  On Error Resume Next
  ThisWorkbook.Names(name).Delete
  On Error GoTo 0
  ThisWorkbook.Names.Add Name:=name, RefersTo:=target
End Sub
