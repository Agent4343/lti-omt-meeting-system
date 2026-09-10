import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HistoryIcon from '@mui/icons-material/History';
import { openEmailClient, downloadAsFile } from '../utils/emailUtils';

function RemovedLTIsPage() {
  const navigate = useNavigate();
  const [removedLTIs, setRemovedLTIs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateRemoved');
  const [filterYear, setFilterYear] = useState('all');

  // Load and calculate removed LTIs from past meetings
  useEffect(() => {
    const calculateRemovedLTIs = () => {
      const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings') || '[]');

      // Sort meetings by date (oldest first)
      const sortedMeetings = [...pastMeetings].sort((a, b) =>
        new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0)
      );

      const removed = [];
      const seenLTIs = new Map(); // Track all LTIs we've seen and their last data

      sortedMeetings.forEach((meeting, meetingIndex) => {
        const meetingDate = meeting.date || (meeting.timestamp ? meeting.timestamp.split('T')[0] : 'Unknown');
        const currentIsolationIds = new Set();

        // Get all isolation IDs in this meeting
        if (meeting.isolations && Array.isArray(meeting.isolations)) {
          meeting.isolations.forEach(iso => {
            currentIsolationIds.add(iso.id);
            // Store the LTI data with its response
            const response = meeting.responses?.[iso.id] || {};
            seenLTIs.set(iso.id, {
              ...iso,
              response,
              lastSeenDate: meetingDate,
              lastSeenMeetingIndex: meetingIndex
            });
          });
        } else if (meeting.responses) {
          // Fallback for meetings without isolations array
          Object.keys(meeting.responses).forEach(id => {
            currentIsolationIds.add(id);
            seenLTIs.set(id, {
              id,
              response: meeting.responses[id],
              lastSeenDate: meetingDate,
              lastSeenMeetingIndex: meetingIndex
            });
          });
        }

        // Check if any previously seen LTIs are missing from this meeting
        if (meetingIndex > 0) {
          seenLTIs.forEach((ltiData, ltiId) => {
            // If this LTI was seen in a previous meeting but not in current
            if (ltiData.lastSeenMeetingIndex < meetingIndex && !currentIsolationIds.has(ltiId)) {
              // Check if already marked as removed
              const alreadyRemoved = removed.find(r => r.id === ltiId);
              if (!alreadyRemoved) {
                removed.push({
                  id: ltiId,
                  description: ltiData.Title || ltiData.description || 'No description',
                  plannedStartDate: ltiData['Planned Start Date'] || ltiData.plannedStartDate,
                  lastSeenDate: ltiData.lastSeenDate,
                  dateRemoved: meetingDate,
                  lastRiskLevel: ltiData.response?.riskLevel || 'N/A',
                  lastMOCRequired: ltiData.response?.mocRequired || 'N/A',
                  lastMOCNumber: ltiData.response?.mocNumber || '',
                  lastComments: ltiData.response?.comments || '',
                  lastActionRequired: ltiData.response?.actionRequired || 'N/A',
                  meetingsPresent: ltiData.lastSeenMeetingIndex + 1
                });
              }
            }
          });
        }

        // Also check for explicitly removed isolations in meeting data
        if (meeting.removedIsolations && Array.isArray(meeting.removedIsolations)) {
          meeting.removedIsolations.forEach(iso => {
            const alreadyRemoved = removed.find(r => r.id === iso.id);
            if (!alreadyRemoved) {
              removed.push({
                id: iso.id || iso.ID,
                description: iso.Title || iso.description || 'No description',
                plannedStartDate: iso['Planned Start Date'] || iso.plannedStartDate,
                lastSeenDate: meetingDate,
                dateRemoved: meetingDate,
                lastRiskLevel: 'N/A',
                lastMOCRequired: 'N/A',
                lastMOCNumber: '',
                lastComments: 'Explicitly removed from meeting',
                lastActionRequired: 'N/A',
                meetingsPresent: 1,
                explicitlyRemoved: true
              });
            }
          });
        }
      });

      setRemovedLTIs(removed);
    };

    calculateRemovedLTIs();
  }, []);

  // Get unique years for filtering
  const availableYears = useMemo(() => {
    const years = new Set();
    removedLTIs.forEach(lti => {
      if (lti.dateRemoved && lti.dateRemoved !== 'Unknown') {
        const year = new Date(lti.dateRemoved).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [removedLTIs]);

  // Filter and sort LTIs
  const filteredLTIs = useMemo(() => {
    let filtered = [...removedLTIs];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lti =>
        lti.id?.toLowerCase().includes(search) ||
        lti.description?.toLowerCase().includes(search) ||
        lti.lastComments?.toLowerCase().includes(search)
      );
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(lti => {
        if (!lti.dateRemoved || lti.dateRemoved === 'Unknown') return false;
        return new Date(lti.dateRemoved).getFullYear() === parseInt(filterYear);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dateRemoved':
          return new Date(b.dateRemoved || 0) - new Date(a.dateRemoved || 0);
        case 'id':
          return (a.id || '').localeCompare(b.id || '');
        case 'riskLevel':
          const riskOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, 'N/A': 4 };
          return (riskOrder[a.lastRiskLevel] || 4) - (riskOrder[b.lastRiskLevel] || 4);
        default:
          return 0;
      }
    });

    return filtered;
  }, [removedLTIs, searchTerm, filterYear, sortBy]);

  // Statistics
  const stats = useMemo(() => ({
    total: removedLTIs.length,
    thisYear: removedLTIs.filter(lti => {
      if (!lti.dateRemoved) return false;
      return new Date(lti.dateRemoved).getFullYear() === new Date().getFullYear();
    }).length,
    withMOC: removedLTIs.filter(lti => lti.lastMOCRequired === 'Yes').length,
    highRisk: removedLTIs.filter(lti =>
      lti.lastRiskLevel === 'High' || lti.lastRiskLevel === 'Critical'
    ).length
  }), [removedLTIs]);

  // Export functions
  const handleExportCSV = () => {
    const headers = ['LTI ID', 'Description', 'Date Removed', 'Last Seen', 'Last Risk Level', 'MOC Required', 'MOC Number', 'Last Action', 'Comments'];
    const rows = filteredLTIs.map(lti => [
      lti.id,
      lti.description,
      lti.dateRemoved,
      lti.lastSeenDate,
      lti.lastRiskLevel,
      lti.lastMOCRequired,
      lti.lastMOCNumber,
      lti.lastActionRequired,
      lti.lastComments
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadAsFile(csvContent, `Removed_LTIs_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleEmailReport = () => {
    let body = `REMOVED LTIs REPORT\n`;
    body += `${'='.repeat(40)}\n\n`;
    body += `Report Date: ${new Date().toLocaleDateString()}\n`;
    body += `Total Removed: ${stats.total}\n`;
    body += `Removed This Year: ${stats.thisYear}\n\n`;

    body += `REMOVED LTIs\n`;
    body += `${'-'.repeat(30)}\n`;

    filteredLTIs.forEach(lti => {
      body += `\n${lti.id}\n`;
      body += `  Description: ${lti.description}\n`;
      body += `  Date Removed: ${lti.dateRemoved}\n`;
      body += `  Last Risk Level: ${lti.lastRiskLevel}\n`;
      if (lti.lastComments) {
        body += `  Last Comments: ${lti.lastComments}\n`;
      }
    });

    body += `\n${'='.repeat(40)}\n`;
    body += `Generated by LTI OMT Meeting System\n`;

    openEmailClient('', `Removed LTIs Report - ${new Date().toLocaleDateString()}`, body);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      case 'Critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
              Removed LTIs History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track isolations that have been closed or removed over time
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendingDownIcon sx={{ fontSize: 30 }} />
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2">Total Removed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 30 }} />
                <Typography variant="h4">{stats.thisYear}</Typography>
                <Typography variant="body2">This Year</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4">{stats.withMOC}</Typography>
                <Typography variant="body2">Had MOC</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4">{stats.highRisk}</Typography>
                <Typography variant="body2">Were High/Critical</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search LTIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={filterYear}
              label="Year"
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <MenuItem value="all">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="dateRemoved">Date Removed</MenuItem>
              <MenuItem value="id">LTI ID</MenuItem>
              <MenuItem value="riskLevel">Risk Level</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            size="small"
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={handleEmailReport}
            size="small"
            color="secondary"
          >
            Email Report
          </Button>
        </Box>

        {/* Results */}
        {filteredLTIs.length === 0 ? (
          <Alert severity="info">
            {removedLTIs.length === 0
              ? 'No removed LTIs found. LTIs will appear here when they are no longer present in subsequent meetings.'
              : 'No LTIs match your search criteria.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>LTI ID</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Date Removed</strong></TableCell>
                  <TableCell><strong>Last Seen</strong></TableCell>
                  <TableCell><strong>Last Risk</strong></TableCell>
                  <TableCell><strong>MOC</strong></TableCell>
                  <TableCell><strong>Last Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLTIs.map((lti, index) => (
                  <TableRow
                    key={`${lti.id}-${index}`}
                    sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {lti.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                        {lti.description}
                      </Typography>
                      {lti.lastComments && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {lti.lastComments.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lti.dateRemoved}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {lti.lastSeenDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lti.lastRiskLevel}
                        size="small"
                        color={getRiskColor(lti.lastRiskLevel)}
                      />
                    </TableCell>
                    <TableCell>
                      {lti.lastMOCRequired === 'Yes' ? (
                        <Tooltip title={lti.lastMOCNumber || 'No MOC number'}>
                          <Chip label="Yes" size="small" color="info" />
                        </Tooltip>
                      ) : (
                        <Chip label="No" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {lti.lastActionRequired}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary */}
        {filteredLTIs.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLTIs.length} of {removedLTIs.length} removed LTIs
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Back Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}

export default RemovedLTIsPage;
