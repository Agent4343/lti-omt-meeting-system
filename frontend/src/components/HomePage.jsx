import { useState } from 'react';
import { Button, Typography, Box, TextField, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function HomePage() {
  const navigate = useNavigate();
  const [meetingDate, setMeetingDate] = useState('');
  const [attendees, setAttendees] = useState([]);
  const { people, setCurrentMeeting } = useAppContext();

  const toggleAttendee = (name) => {
    setAttendees(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const startMeeting = () => {
    if (!meetingDate || attendees.length === 0) {
      alert('Please select a meeting date and attendees.');
      return;
    }
    const meetingInfo = { date: meetingDate, attendees };
    setCurrentMeeting(meetingInfo);
    navigate('/setup');
  };

  return (
    <Box textAlign="center" mt={5}>
      <Typography variant="h4" gutterBottom>Setup New Meeting</Typography>

      <TextField
        label="Meeting Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        value={meetingDate}
        onChange={(e) => setMeetingDate(e.target.value)}
        sx={{ mt: 3 }}
      />

      <Typography variant="h6" sx={{ mt: 4 }}>Select Attendees:</Typography>

      <FormGroup>
        {people.map((person, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={attendees.includes(person)}
                onChange={() => toggleAttendee(person)}
              />
            }
            label={person}
          />
        ))}
      </FormGroup>

      <Button variant="contained" sx={{ mt: 4 }} onClick={startMeeting}>
        Proceed to Upload Excel
      </Button>
    </Box>
  );
}

export default HomePage;
