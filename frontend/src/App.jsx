import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
// Removed ThemeProvider, createTheme imports
import { StyledEngineProvider } from '@mui/material/styles'; 
import LandingPage from './components/LandingPage';
import ManagePeoplePage from './components/ManagePeoplePage';
import MeetingPage from './components/MeetingPage';
import MeetingSetupPage from './components/MeetingSetupPage';
import ReviewPage from './components/ReviewPage';
import MeetingSummaryPage from './components/MeetingSummaryPageNew';
import PastMeetingsPage from './components/PastMeetingsPage';
import LTIMasterListPage from './components/LTIMasterListPage';
import MeetingCalendarPage from './components/MeetingCalendarPage';
import LTIDashboard from './components/LTIDashboard';
import AssetManagerReviewPage from './components/AssetManagerReviewPage';
import NavigationHeader from './components/NavigationHeader';
import ErrorBoundary from './components/ErrorBoundary';
import { AppContextProvider } from './context/AppContext';

// Removed the theme definition from here - it's now handled in index.jsx

function App() {
  return (
    // Removed StyledEngineProvider and ThemeProvider - handled in index.jsx
    // CssBaseline is also handled in index.jsx
    <ErrorBoundary>
      <AppContextProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <NavigationHeader />
            <Box component="main" sx={{ flexGrow: 1, pb: 4 }}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/people" element={<ManagePeoplePage />} />
                <Route path="/home" element={<MeetingPage />} />
                <Route path="/setup" element={<MeetingSetupPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/summary" element={<MeetingSummaryPage />} />
                <Route path="/past" element={<PastMeetingsPage />} />
                <Route path="/lti-master" element={<LTIMasterListPage />} />
                <Route path="/lti-dashboard" element={<LTIDashboard />} />
                <Route path="/asset-manager-review" element={<AssetManagerReviewPage />} />
                <Route path="/calendar" element={<MeetingCalendarPage />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AppContextProvider>
    </ErrorBoundary>
    // Removed closing ThemeProvider and StyledEngineProvider
  );
}

export default App;
