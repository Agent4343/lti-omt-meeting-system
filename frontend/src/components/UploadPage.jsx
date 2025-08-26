
import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useState } from 'react';

function UploadPage({ setIsolations }) {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setIsolations(data);
      navigate('/review');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Upload Excel File</Typography>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{ marginTop: '20px' }}
      />
      {fileName && <Typography>Uploaded: {fileName}</Typography>}
    </div>
  );
}

export default UploadPage;

