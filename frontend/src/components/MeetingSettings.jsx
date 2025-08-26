import { Typography, Button, Select, MenuItem } from '@mui/material';
import { useState } from 'react';

function MeetingSettings() {
  const [day, setDay] = useState(4); // Default Thursday

  const handleSave = () => {
    localStorage.setItem('meetingDay', day);
    alert('Meeting day updated.');
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Meeting Settings</Typography>

      <Select fullWidth value={day} onChange={(e) => setDay(e.target.value)}>
        <MenuItem value={0}>Sunday</MenuItem>
        <MenuItem value={1}>Monday</MenuItem>
        <MenuItem value={2}>Tuesday</MenuItem>
        <MenuItem value={3}>Wednesday</MenuItem>
        <MenuItem value={4}>Thursday</MenuItem>
        <MenuItem value={5}>Friday</MenuItem>
        <MenuItem value={6}>Saturday</MenuItem>
      </Select>

      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSave}>Save Settings</Button>
    </div>
  );
}

export default MeetingSettings;
