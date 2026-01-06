/**
 * Debug Banner Component
 * Shows app status visually - useful when F12 developer tools are blocked
 *
 * Click the banner to expand/collapse details
 */
import React, { useState, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, CheckCircle, Error, Warning } from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import sharePointDocumentStorage from '../services/sharepoint-document-storage';

const DebugBanner = ({ show = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({});
  const { storageStatus } = useAppContext();

  useEffect(() => {
    // Detect browser and environment
    const ua = navigator.userAgent;
    const isEdge = ua.includes('Edg/');
    const isChrome = ua.includes('Chrome') && !isEdge;
    const isFirefox = ua.includes('Firefox');
    const isIE = ua.includes('Trident') || ua.includes('MSIE');

    // Use the SharePoint storage service to detect SharePoint
    const isSharePoint = sharePointDocumentStorage.isAvailable();
    const spSiteUrl = sharePointDocumentStorage.siteUrl;

    setBrowserInfo({
      browser: isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isIE ? 'IE' : 'Other',
      userAgent: ua.substring(0, 100) + '...',
      isSharePoint,
      sharePointUrl: spSiteUrl,
      localStorage: (() => {
        try {
          localStorage.setItem('_test', '1');
          localStorage.removeItem('_test');
          return 'Working';
        } catch {
          return 'Blocked';
        }
      })(),
      cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
      online: navigator.onLine ? 'Online' : 'Offline'
    });
  }, []);

  if (!show) return null;

  const getStatusColor = () => {
    if (browserInfo.localStorage === 'Blocked') return '#f44336'; // Red
    if (!browserInfo.isSharePoint && storageStatus?.sharePointAvailable) return '#ff9800'; // Orange
    if (storageStatus?.sharePointAvailable) return '#4caf50'; // Green
    return '#2196f3'; // Blue (localStorage only)
  };

  const getStatusIcon = () => {
    if (browserInfo.localStorage === 'Blocked') return <Error sx={{ fontSize: 16 }} />;
    if (storageStatus?.sharePointAvailable) return <CheckCircle sx={{ fontSize: 16 }} />;
    return <Warning sx={{ fontSize: 16 }} />;
  };

  const getStatusText = () => {
    if (browserInfo.localStorage === 'Blocked') return 'Storage Blocked!';
    if (storageStatus?.sharePointAvailable) return 'SharePoint Connected';
    return 'localStorage Mode';
  };

  return (
    <Box
      sx={{
        backgroundColor: getStatusColor(),
        color: 'white',
        py: 0.5,
        px: 2,
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '12px'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {getStatusText()} | {browserInfo.browser} | {browserInfo.online}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'white', p: 0 }}>
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1, fontSize: '11px', fontFamily: 'monospace' }}>
          <Box>Browser: {browserInfo.browser}</Box>
          <Box>localStorage: {browserInfo.localStorage}</Box>
          <Box>Cookies: {browserInfo.cookies}</Box>
          <Box>SharePoint Detected: {browserInfo.isSharePoint ? 'Yes' : 'No'}</Box>
          {browserInfo.isSharePoint && (
            <Box>SP URL: {browserInfo.sharePointUrl}</Box>
          )}
          <Box>Storage Mode: {storageStatus?.mode || 'Unknown'}</Box>
          <Box>Pending Sync: {storageStatus?.pendingSync || 0}</Box>
          <Box>Last Sync: {storageStatus?.lastSync || 'Never'}</Box>
          <Box sx={{ mt: 1, fontSize: '10px', opacity: 0.8 }}>
            UA: {browserInfo.userAgent}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default DebugBanner;
