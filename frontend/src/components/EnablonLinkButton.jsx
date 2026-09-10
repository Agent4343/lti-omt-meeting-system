import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ENABLON_CONFIG } from '../config';

/**
 * Opens Enablon in a new tab so the user can export the current LTI list.
 * Placed next to the Excel upload controls: export there, then upload here.
 *
 * The URL is configurable via REACT_APP_ENABLON_URL so the site can be
 * repointed without a code change.
 */
function EnablonLinkButton({ variant = 'outlined', size = 'large', sx = {} }) {
  if (!ENABLON_CONFIG.URL) return null;

  return (
    <Tooltip title="Opens Enablon in a new tab. Export the LTI list there, then upload the file here.">
      <Button
        variant={variant}
        size={size}
        color="info"
        href={ENABLON_CONFIG.URL}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<OpenInNewIcon />}
        sx={sx}
      >
        {ENABLON_CONFIG.LABEL}
      </Button>
    </Tooltip>
  );
}

export default EnablonLinkButton;
