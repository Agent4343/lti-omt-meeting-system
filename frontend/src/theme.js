import { createTheme } from '@mui/material/styles';

/**
 * Application theme.
 *
 * Most of the visual language lives here rather than in per-page `sx` props,
 * so the look stays consistent as pages are added.
 *
 * Notes on the choices:
 * - No web fonts are loaded (index.html has no <link> to Google Fonts), so the
 *   stack starts with the OS UI face. That renders well offline, which matters
 *   for the SharePoint deployment.
 * - Surfaces use a hairline border plus a soft shadow instead of Material's
 *   heavier elevation, which reads as flatter and more current.
 * - Status colours are tonal (tinted background, dark text) rather than solid
 *   fills. On a page listing dozens of isolations, solid red/amber chips create
 *   an alarm wall where nothing stands out.
 */

const FONT_STACK = [
  '"Segoe UI Variable Text"',
  '"Segoe UI"',
  '-apple-system',
  'BlinkMacSystemFont',
  'Inter',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif'
].join(',');

// Neutral ramp - slightly cool, keeps large table surfaces from looking muddy.
const grey = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a'
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d4ed8',
      light: '#3b82f6',
      dark: '#1e3a8a',
      contrastText: '#fff'
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#fff'
    },
    // Desaturated a step from the MUI defaults so a screen full of status
    // chips stays readable.
    success: { main: '#15803d', light: '#dcfce7', dark: '#166534', contrastText: '#fff' },
    warning: { main: '#b45309', light: '#fef3c7', dark: '#92400e', contrastText: '#fff' },
    error: { main: '#b91c1c', light: '#fee2e2', dark: '#991b1b', contrastText: '#fff' },
    info: { main: '#0369a1', light: '#e0f2fe', dark: '#075985', contrastText: '#fff' },
    grey,
    background: {
      default: grey[50],
      paper: '#ffffff'
    },
    text: {
      primary: grey[900],
      secondary: grey[500]
    },
    divider: grey[200]
  },

  shape: { borderRadius: 10 },

  typography: {
    fontFamily: FONT_STACK,
    // Tighter than the MUI defaults. The old headings were large enough that a
    // page title alone could take 80px of vertical space.
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h3: { fontSize: '1.375rem', fontWeight: 650, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h5: { fontSize: '1.0625rem', fontWeight: 650, lineHeight: 1.4 },
    h6: { fontSize: '0.9375rem', fontWeight: 650, lineHeight: 1.45 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 550 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, color: grey[500] },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    caption: { fontSize: '0.78125rem', color: grey[500] },
    button: { fontWeight: 600, letterSpacing: 0 }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        // Tables of isolations get long; a slim scrollbar is less intrusive.
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': { background: grey[300], borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { background: grey[400] }
      }
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: grey[900],
          borderBottom: `1px solid ${grey[200]}`
        }
      }
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: grey[200] }
      }
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${grey[200]}`,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }
      }
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, paddingInline: 16 },
        sizeLarge: { paddingBlock: 10, fontSize: '0.9375rem' },
        sizeSmall: { paddingBlock: 4 },
        outlined: { borderColor: grey[300] },
        // Secondary actions should recede; the old pages put five differently
        // coloured outlined buttons in a row with no clear primary.
        outlinedInherit: { borderColor: grey[300], color: grey[700] }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
        sizeSmall: { height: 22, fontSize: '0.75rem' },
        filledSuccess: { backgroundColor: '#dcfce7', color: '#166534' },
        filledWarning: { backgroundColor: '#fef3c7', color: '#92400e' },
        filledError: { backgroundColor: '#fee2e2', color: '#991b1b' },
        filledInfo: { backgroundColor: '#e0f2fe', color: '#075985' },
        filledPrimary: { backgroundColor: '#dbeafe', color: '#1e40af' },
        filledDefault: { backgroundColor: grey[100], color: grey[700] }
      }
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: grey[200], paddingBlock: 10 },
        head: {
          fontWeight: 600,
          fontSize: '0.78125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: grey[500],
          backgroundColor: grey[50]
        }
      }
    },

    MuiTableRow: {
      styleOverrides: {
        root: { '&:last-child td': { borderBottom: 0 } },
        hover: { '&:hover': { backgroundColor: grey[50] } }
      }
    },

    MuiAlert: {
      defaultProps: { variant: 'standard' },
      styleOverrides: {
        root: { borderRadius: 10, border: '1px solid transparent' },
        standardInfo: { backgroundColor: '#eff6ff', color: '#1e3a8a', borderColor: '#bfdbfe' },
        standardSuccess: { backgroundColor: '#f0fdf4', color: '#14532d', borderColor: '#bbf7d0' },
        standardWarning: { backgroundColor: '#fffbeb', color: '#78350f', borderColor: '#fde68a' },
        standardError: { backgroundColor: '#fef2f2', color: '#7f1d1d', borderColor: '#fecaca' }
      }
    },

    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: '#fff' },
        notchedOutline: { borderColor: grey[300] }
      }
    },
    MuiSelect: { defaultProps: { size: 'small' } },

    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: '0.9375rem' }
      }
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: 3 } }
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: grey[800], fontSize: '0.78125rem', borderRadius: 6, paddingBlock: 6 }
      }
    },

    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${grey[200]}` } }
    },

    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 999, height: 8, backgroundColor: grey[200] } }
    }
  }
});

export default theme;
