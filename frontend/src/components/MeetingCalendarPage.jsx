import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  IconButton, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import * as XLSX from 'xlsx';
import { createTheme, ThemeProvider } from '@mui/material/styles';

function MeetingCalendarPage() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: 'Meeting Calendar', text: '' });
  const [emailStatus, setEmailStatus] = useState({ loading: false, success: false, error: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  useEffect(() => {
    generateMeetings();
  }, [year, startDate]);
  
  const generateMeetings = () => {
    const regularMeetings = generateRegularMeetings(year, startDate);
    const assetManagerMeetings = generateAssetManagerMeetings(year, startDate);
    
    // Combine and sort all meetings by date
    const allMeetings = [...regularMeetings, ...assetManagerMeetings].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    setMeetings(allMeetings);
  };
  
  const generateRegularMeetings = (year, startDate) => {
    const meetings = [];
    const currentDate = new Date(startDate);
    
    // Set to the first Thursday at 1:00 PM after the start date
    currentDate.setHours(13, 0, 0, 0);
    
    // Find the next Thursday (day 4, where Sunday is 0)
    while (currentDate.getDay() !== 4) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate monthly Thursday meetings for the year
    while (currentDate.getFullYear() <= year) {
      // Only include meetings in the specified year
      if (currentDate.getFullYear() === year) {
        meetings.push({
          id: `regular-${currentDate.toISOString()}`,
          date: new Date(currentDate),
          type: 'Regular',
          title: 'Monthly LTI Meeting',
          time: '1:00 PM',
          attendees: 'Team Members',
          location: 'Conference Room A'
        });
      }
      
      // Move to the next month (approximately 4 weeks)
      currentDate.setDate(currentDate.getDate() + 28);
      
      // Adjust to the next Thursday if needed
      while (currentDate.getDay() !== 4) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return meetings;
  };
  
  const generateAssetManagerMeetings = (year, startDate) => {
    const meetings = [];
    const currentDate = new Date(startDate);
    
    // Set to 1:00 PM
    currentDate.setHours(13, 0, 0, 0);
    
    // Generate semi-annual Asset Manager meetings
    for (let month = 0; month < 12; month += 6) {
      const meetingDate = new Date(year, month, 15, 13, 0, 0);
      
      // Only include meetings after the start date
      if (meetingDate >= startDate) {
        meetings.push({
          id: `asset-manager-${meetingDate.toISOString()}`,
          date: new Date(meetingDate),
          type: 'Review',
          title: 'Asset Manager Review',
          time: '1:00 PM',
          attendees: 'Team Members, Asset Manager',
          location: 'Conference Room B'
        });
      }
    }
    
    return meetings;
  };
  
  const handleYearChange = (event) => {
    setYear(parseInt(event.target.value));
  };
  
  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const exportToCalendar = () => {
    // Create data for Excel export
    const data = meetings.map(meeting => ({
      Date: formatDate(meeting.date),
      Time: meeting.time,
      Title: meeting.title,
      Type: meeting.type,
      Attendees: meeting.attendees,
      Location: meeting.location
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Calendar');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `LTI_Meeting_Calendar_${year}.xlsx`);
    
    setSnackbar({
      open: true,
      message: 'Calendar exported successfully!',
      severity: 'success'
    });
  };
  
  const generateICalendarFile = () => {
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meeting System//LTI Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      const endDate = new Date(meetingDate);
      endDate.setHours(endDate.getHours() + 1); // 1 hour meeting
      
      // Format dates for iCalendar (YYYYMMDDTHHMMSSZ)
      const formatICalDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
      };
      
      const startDateStr = formatICalDate(meetingDate);
      const endDateStr = formatICalDate(endDate);
      
      icalContent = [
        ...icalContent,
        'BEGIN:VEVENT',
        `UID:${meeting.id}@meeting-system`,
        `DTSTAMP:${formatICalDate(new Date())}`,
        `DTSTART:${startDateStr}`,
        `DTEND:${endDateStr}`,
        `SUMMARY:${meeting.title}`,
        `DESCRIPTION:Type: ${meeting.type}\\nAttendees: ${meeting.attendees}`,
        `LOCATION:${meeting.location}`,
        'END:VEVENT'
      ];
    });
    
    icalContent.push('END:VCALENDAR');
    
    // Create and download the .ics file
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LTI_Meeting_Calendar_${year}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'iCalendar file downloaded successfully!',
      severity: 'success'
    });
  };
  
  const sendEmail = async () => {
    if (!emailData.to || !emailData.text) {
      setEmailStatus({
        loading: false,
        success: false,
        error: 'Please fill in all required fields'
      });
      return;
    }
    
    setEmailStatus({ loading: false, success: false, error: null });
    
    try {
      // Generate calendar content for email
      let calendarText = 'LTI Meeting Calendar for ' + year + '\n\n';
      
      meetings.forEach(meeting => {
        calendarText += `${formatDate(meeting.date)} at ${meeting.time}\n`;
        calendarText += `${meeting.title} (${meeting.type})\n`;
        calendarText += `Attendees: ${meeting.attendees}\n`;
        calendarText += `Location: ${meeting.location}\n\n`;
      });
      
      // Prepare email data
      const emailPayload = {
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text + '\n\n' + calendarText
      };
      
      // Send email using backend API
      const response = await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      setEmailStatus({ loading: false, success: true, error: null });
      
      // Reset email form
      setEmailData({ 
        to: '', 
        subject: 'Meeting Calendar', 
        text: 'Please find attached the LTI meeting calendar for the year.' 
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Failed to send email. Please check your backend configuration.'
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i <= currentYear + 5; i++) {
    years.push(i);
  }
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Meeting Calendar</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={year}
                label="Year"
                onChange={handleYearChange}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => handleStartDateChange(new Date(e.target.value))}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">
            {year} Meeting Schedule
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={exportToCalendar}
              sx={{ mr: 2 }}
            >
              Export to Excel
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<CalendarMonthIcon />} 
              onClick={generateICalendarFile}
              sx={{ mr: 2 }}
            >
              Download iCalendar
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />} 
              onClick={() => setEmailDialog(true)}
              color="secondary"
            >
              Email Calendar
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="meeting calendar table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Attendees</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No meetings scheduled for this year.
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>{formatDate(meeting.date)}</TableCell>
                    <TableCell>{meeting.time}</TableCell>
                    <TableCell>{meeting.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={meeting.type} 
                        color={meeting.type === 'Review' ? 'secondary' : 'primary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{meeting.attendees}</TableCell>
                    <TableCell>{meeting.location}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
      
      {/* Email Dialog */}
      <Dialog open={emailDialog} onClose={() => !emailStatus.loading && setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Email Meeting Calendar</DialogTitle>
        <DialogContent>
          {emailStatus.loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Sending email...</Typography>
            </Box>
          ) : emailStatus.success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Email sent successfully!
            </Alert>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="To"
                fullWidth
                required
                value={emailData.to}
                onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                placeholder="recipient@example.com"
                helperText="Separate multiple recipients with commas"
              />
              
              <TextField
                label="Subject"
                fullWidth
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              />
              
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={6}
                value={emailData.text}
                onChange={(e) => setEmailData({...emailData, text: e.target.value})}
                placeholder="Enter your message here..."
              />
              
              {emailStatus.error && (
                <Alert severity="error">
                  {emailStatus.error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!emailStatus.loading && (
            <>
              <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
              <Button 
                onClick={sendEmail} 
                variant="contained" 
                color="primary"
                disabled={!emailData.to || !emailData.text}
              >
                Send Email
              </Button>
            </>
          )}
          {emailStatus.success && (
            <Button onClick={() => {
              setEmailDialog(false);
              setEmailStatus({ loading: false, success: false, error: null });
            }}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default MeetingCalendarPage;
