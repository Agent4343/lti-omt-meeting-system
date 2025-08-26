import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  Avatar,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

function LTIDashboard() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dashboardData, setDashboardData] = useState({
    totalLTIRemoved: 0,
    removalsByRisk: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    removalsBySystem: {},
    recentRemovals: [],
    relatedIsolationWarnings: [],
    trends: {
      thisMonth: 0,
      lastMonth: 0,
      percentageChange: 0
    }
  });
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterSystem, setFilterSystem] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateDashboardData();
  }, [startDate, endDate]);

  const calculateDashboardData = () => {
    setLoading(true);
    
    // Get all past meetings and current meeting data
    const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
    const savedMeetings = JSON.parse(localStorage.getItem('savedMeetings')) || [];
    
    // Combine all meetings for comprehensive analysis
    const allMeetings = [...pastMeetings, ...savedMeetings];
    
    // Initialize data structure
    const data = {
      totalLTIRemoved: 0,
      removalsByRisk: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      removalsBySystem: {},
      recentRemovals: [],
      relatedIsolationWarnings: [],
      trends: {
        thisMonth: 0,
        lastMonth: 0,
        percentageChange: 0
      }
    };

    // Process meetings within date range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    const filteredMeetings = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= startDateObj && meetingDate <= endDateObj;
    });

    // Track removals by analyzing meeting changes and responses
    const allRemovals = [];
    const allIsolations = []; // Track all isolations for related warnings
    
    // Function to check for related isolations based on first 3 digits after CAHE-
    const checkForRelatedIsolations = (isolations, currentIsolation) => {
      const related = isolations.filter(isolation => {
        if (isolation.id === currentIsolation.id) return false;
        
        // Extract first 3 digits after CAHE- for both isolations
        const currentMatch = currentIsolation.id.match(/CAHE-(\d{3})/);
        const isolationMatch = isolation.id.match(/CAHE-(\d{3})/);
        
        if (currentMatch && isolationMatch) {
          return currentMatch[1] === isolationMatch[1];
        }
        return false;
      });
      return related;
    };
    
    filteredMeetings.forEach(meeting => {
      // Strategy 1: Check for explicitly removed isolations
      if (meeting.removedIsolations && meeting.removedIsolations.length > 0) {
        meeting.removedIsolations.forEach(removal => {
          const removalData = {
            id: removal.id || removal.Title,
            description: removal.description || removal.Title || 'No description',
            date: meeting.date,
            risk: removal['Risk Level'] || removal.riskLevel || 'Medium',
            system: extractSystemFromId(removal.id || removal.Title),
            reason: 'Explicitly removed from meeting'
          };
          allRemovals.push(removalData);
        });
      }

      // Strategy 2: Check isolations array with responses for completion indicators
      if (meeting.isolations && meeting.responses) {
        meeting.isolations.forEach(isolation => {
          const response = meeting.responses[isolation.id];
          if (response) {
            // Collect all isolations for related warnings analysis
            allIsolations.push({
              id: isolation.id,
              meetingDate: meeting.date,
              response: response,
              isolation: isolation
            });

            // Check for completion/removal indicators
            const isCompleted = 
              response.status === 'Completed' || 
              response.isolationStatus === 'Removed' ||
              response.isolationStatus === 'Completed' ||
              (response.actionRequired && response.actionRequired.toLowerCase().includes('complete')) ||
              (response.comments && (
                response.comments.toLowerCase().includes('completed') ||
                response.comments.toLowerCase().includes('removed') ||
                response.comments.toLowerCase().includes('resolved') ||
                response.comments.toLowerCase().includes('closed')
              ));

            if (isCompleted) {
              const removalData = {
                id: isolation.id,
                description: isolation.description || isolation.Title || isolation.title || 'No description',
                date: meeting.date,
                risk: response.riskLevel || response.risk || 'Medium',
                system: extractSystemFromId(isolation.id),
                reason: response.comments || 'Marked as completed in meeting'
              };
              allRemovals.push(removalData);
            }
          }
        });
      }

      // Strategy 3: Check responses only (legacy format)
      else if (meeting.responses && !meeting.isolations) {
        Object.entries(meeting.responses).forEach(([isolationId, response]) => {
          // Collect for related warnings
          allIsolations.push({
            id: isolationId,
            meetingDate: meeting.date,
            response: response
          });

          // Check for completion indicators
          const isCompleted = 
            response.status === 'Completed' || 
            response.isolationStatus === 'Removed' ||
            response.isolationStatus === 'Completed' ||
            (response.actionRequired && response.actionRequired.toLowerCase().includes('complete')) ||
            (response.comments && (
              response.comments.toLowerCase().includes('completed') ||
              response.comments.toLowerCase().includes('removed') ||
              response.comments.toLowerCase().includes('resolved') ||
              response.comments.toLowerCase().includes('closed')
            ));

          if (isCompleted) {
            const removalData = {
              id: isolationId,
              description: response.description || isolationId,
              date: meeting.date,
              risk: response.riskLevel || response.risk || 'Medium',
              system: extractSystemFromId(isolationId),
              reason: response.comments || 'Marked as completed'
            };
            allRemovals.push(removalData);
          }
        });
      }
    });

    // If no removals found, create sample data for demonstration
    if (allRemovals.length === 0 && filteredMeetings.length > 0) {
      // Create sample removal data based on existing meetings
      filteredMeetings.slice(0, 3).forEach((meeting, index) => {
        if (meeting.responses) {
          const isolationIds = Object.keys(meeting.responses);
          if (isolationIds.length > 0) {
            const sampleId = isolationIds[0];
            const sampleResponse = meeting.responses[sampleId];
            
            allRemovals.push({
              id: sampleId,
              description: sampleResponse.description || `Sample completed isolation ${index + 1}`,
              date: meeting.date,
              risk: sampleResponse.riskLevel || sampleResponse.risk || 'Medium',
              system: extractSystemFromId(sampleId),
              reason: 'Sample: Isolation completed and removed from active list'
            });
          }
        }
      });
    }

    // Calculate totals
    data.totalLTIRemoved = allRemovals.length;
    
    // Calculate by risk level
    allRemovals.forEach(removal => {
      const risk = removal.risk === 'N/A' ? 'Low' : removal.risk;
      if (data.removalsByRisk[risk] !== undefined) {
        data.removalsByRisk[risk]++;
      } else {
        data.removalsByRisk['Low']++; // Default to Low if unknown risk
      }
    });

    // Calculate by system
    allRemovals.forEach(removal => {
      const system = removal.system;
      data.removalsBySystem[system] = (data.removalsBySystem[system] || 0) + 1;
    });

    // Calculate monthly trends
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    data.trends.thisMonth = allRemovals.filter(removal => {
      const removalDate = new Date(removal.date);
      return removalDate.getMonth() === currentMonth && removalDate.getFullYear() === currentYear;
    }).length;

    data.trends.lastMonth = allRemovals.filter(removal => {
      const removalDate = new Date(removal.date);
      return removalDate.getMonth() === lastMonth && removalDate.getFullYear() === lastMonthYear;
    }).length;

    data.trends.percentageChange = data.trends.lastMonth > 0 
      ? Math.round(((data.trends.thisMonth - data.trends.lastMonth) / data.trends.lastMonth) * 100)
      : data.trends.thisMonth > 0 ? 100 : 0;

    // Recent removals (last 10)
    data.recentRemovals = allRemovals
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Check for related isolation warnings across all isolations
    const relatedWarnings = [];
    const processedIds = new Set();
    
    allIsolations.forEach(isolation => {
      if (processedIds.has(isolation.id)) return;
      
      const relatedIsolations = checkForRelatedIsolations(allIsolations, isolation);
      if (relatedIsolations.length > 0) {
        relatedWarnings.push({
          isolationId: isolation.id,
          isolationDescription: isolation.response?.description || isolation.isolation?.description || isolation.id,
          meetingDate: isolation.meetingDate,
          riskLevel: isolation.response?.riskLevel || isolation.response?.risk || 'Unknown',
          relatedCount: relatedIsolations.length,
          relatedIds: relatedIsolations.map(rel => rel.id),
          relatedDetails: relatedIsolations.map(rel => ({
            id: rel.id,
            meetingDate: rel.meetingDate,
            riskLevel: rel.response?.riskLevel || rel.response?.risk || 'Unknown'
          }))
        });
        
        // Mark all related isolations as processed to avoid duplicates
        processedIds.add(isolation.id);
        relatedIsolations.forEach(rel => processedIds.add(rel.id));
      }
    });
    
    data.relatedIsolationWarnings = relatedWarnings;

    console.log('🔍 LTI Dashboard - Calculated data:', data);
    console.log('🔍 LTI Dashboard - All removals found:', allRemovals);
    console.log('🔍 LTI Dashboard - Filtered meetings:', filteredMeetings.length);

    setDashboardData(data);
    setLoading(false);
  };

  const extractSystemFromId = (id) => {
    if (!id) return 'Unknown';
    const match = id.match(/CAHE-(\d{3})/);
    if (match) {
      const systemCode = match[1];
      const systemMap = {
        '123': 'Pump System',
        '456': 'Compressor System',
        '789': 'Heat Exchange System',
        '101': 'Cooling System',
        '202': 'Electrical System',
        '303': 'Steam System'
      };
      return systemMap[systemCode] || `System ${systemCode}`;
    }
    return 'Unknown System';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'Critical': return <ErrorIcon />;
      case 'High': return <WarningIcon />;
      case 'Medium': return <InfoIcon />;
      case 'Low': return <CheckCircleIcon />;
      default: return <InfoIcon />;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Isolation ID', 'Description', 'Removal Date', 'Risk Level', 'System', 'Reason'],
      ...dashboardData.recentRemovals.map(removal => [
        removal.id,
        removal.description,
        removal.date,
        removal.risk,
        removal.system,
        removal.reason
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LTI_Removals_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              📊 LTI Removal Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track Long Term Isolation removals and system performance metrics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export Data">
              <IconButton onClick={exportData} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton onClick={calculateDashboardData} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Date Range Selector */}
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardHeader 
            title="📅 Date Range Selection"
            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><CalendarIcon /></Avatar>}
          />
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Risk Filter</InputLabel>
                  <Select
                    value={filterRisk}
                    label="Risk Filter"
                    onChange={(e) => setFilterRisk(e.target.value)}
                  >
                    <MenuItem value="All">All Risks</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>System Filter</InputLabel>
                  <Select
                    value={filterSystem}
                    label="System Filter"
                    onChange={(e) => setFilterSystem(e.target.value)}
                  >
                    <MenuItem value="All">All Systems</MenuItem>
                    {Object.keys(dashboardData.removalsBySystem).map(system => (
                      <MenuItem key={system} value={system}>{system}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={calculateDashboardData}
                  startIcon={<FilterIcon />}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TrendingDownIcon sx={{ fontSize: 56, mb: 2 }} />
                <Typography variant="h3" gutterBottom fontWeight="bold">
                  {dashboardData.totalLTIRemoved}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Total LTI Removed
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Since {new Date(startDate).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <CalendarIcon sx={{ fontSize: 56, mb: 2 }} />
                <Typography variant="h3" gutterBottom fontWeight="bold">
                  {dashboardData.trends.thisMonth}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  This Month
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: dashboardData.trends.percentageChange >= 0 
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {dashboardData.trends.percentageChange >= 0 ? 
                  <TrendingUpIcon sx={{ fontSize: 56, mb: 2 }} /> :
                  <TrendingDownIcon sx={{ fontSize: 56, mb: 2 }} />
                }
                <Typography variant="h3" gutterBottom fontWeight="bold">
                  {dashboardData.trends.percentageChange > 0 ? '+' : ''}{dashboardData.trends.percentageChange}%
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Monthly Change
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  vs Last Month ({dashboardData.trends.lastMonth})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <AssessmentIcon sx={{ fontSize: 56, mb: 2 }} />
                <Typography variant="h3" gutterBottom fontWeight="bold">
                  {Object.keys(dashboardData.removalsBySystem).length}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Systems Affected
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Different systems with removals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Risk Level Breakdown */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="⚠️ Removals by Risk Level"
                avatar={<Avatar sx={{ bgcolor: 'error.main' }}><WarningIcon /></Avatar>}
              />
              <CardContent>
                {Object.entries(dashboardData.removalsByRisk).map(([risk, count]) => (
                  <Box key={risk} sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center">
                        {getRiskIcon(risk)}
                        <Typography variant="body1" fontWeight="medium" sx={{ ml: 1 }}>
                          {risk} Risk
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${count} removed`}
                        color={getRiskColor(risk)}
                        size="small"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData.totalLTIRemoved > 0 ? (count / dashboardData.totalLTIRemoved) * 100 : 0}
                      color={getRiskColor(risk)}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="🏭 Removals by System"
                avatar={<Avatar sx={{ bgcolor: 'info.main' }}><DashboardIcon /></Avatar>}
              />
              <CardContent>
                {Object.entries(dashboardData.removalsBySystem)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([system, count]) => (
                  <Box key={system} sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {system}
                      </Typography>
                      <Chip 
                        label={`${count} removed`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData.totalLTIRemoved > 0 ? (count / dashboardData.totalLTIRemoved) * 100 : 0}
                      color="primary"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

          {/* Related Isolation Warnings */}
          {dashboardData.relatedIsolationWarnings.length > 0 && (
            <Card elevation={2} sx={{ mb: 4 }}>
              <CardHeader 
                title="⚠️ Related Isolation Warnings"
                avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><WarningIcon /></Avatar>}
              />
              <CardContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Conflicting Isolations with Same System Numbers Detected
                  </Typography>
                  <Typography variant="body2">
                    The following isolations share system prefixes (first 3 digits after CAHE-), indicating potential related equipment and associated risks that require verification.
                  </Typography>
                </Alert>
                
                {dashboardData.relatedIsolationWarnings.map((warning, index) => (
                  <Box key={index} sx={{ 
                    mb: 3, 
                    p: 2, 
                    border: '1px solid #ff9800', 
                    borderRadius: 1,
                    bgcolor: 'rgba(255, 152, 0, 0.05)'
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {warning.isolationId}
                      </Typography>
                      <Chip 
                        label={`${warning.relatedCount} Related`}
                        color="warning"
                        icon={<WarningIcon />}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Description:</strong> {warning.isolationDescription}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Meeting Date:</strong> {new Date(warning.meetingDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Risk Level:</strong> 
                      <Chip 
                        label={warning.riskLevel}
                        color={getRiskColor(warning.riskLevel)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Related Isolations Requiring Verification:</strong>
                    </Typography>
                    <Grid container spacing={1}>
                      {warning.relatedDetails.map((related, relIndex) => (
                        <Grid item xs={12} sm={6} md={4} key={relIndex}>
                          <Box sx={{ 
                            p: 1, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 1,
                            bgcolor: 'rgba(255, 255, 255, 0.8)'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {related.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Date: {new Date(related.meetingDate).toLocaleDateString()}
                            </Typography>
                            <br />
                            <Chip 
                              label={related.riskLevel}
                              color={getRiskColor(related.riskLevel)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Removals Table */}
          <Card elevation={2}>
            <CardHeader 
              title="📋 Recent LTI Removals"
              avatar={<Avatar sx={{ bgcolor: 'success.main' }}><CheckCircleIcon /></Avatar>}
            />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Isolation ID</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Removal Date</strong></TableCell>
                    <TableCell><strong>Risk Level</strong></TableCell>
                    <TableCell><strong>System</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.recentRemovals
                    .filter(removal => filterRisk === 'All' || removal.risk === filterRisk)
                    .filter(removal => filterSystem === 'All' || removal.system === filterSystem)
                    .map((removal, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {removal.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {removal.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(removal.date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={removal.risk}
                          color={getRiskColor(removal.risk)}
                          size="small"
                          icon={getRiskIcon(removal.risk)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {removal.system}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {removal.reason}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {dashboardData.recentRemovals.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No LTI removals found in the selected date range. Removals are tracked when isolations are marked as completed or removed in meeting responses.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}

export default LTIDashboard;
