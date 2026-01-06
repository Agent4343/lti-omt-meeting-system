# SharePoint Document Library Setup Guide
## Simplest Approach - No Lists Required!

This guide shows how to set up data storage using a SharePoint Document Library instead of SharePoint Lists. This is the **easiest** way to enable shared data storage.

---

## Why Document Library?

| Feature | Document Library | SharePoint Lists |
|---------|-----------------|------------------|
| Setup complexity | **Very Easy** | Moderate |
| Columns to configure | **None** | 20+ columns |
| Data format | JSON files | List items |
| Works across SharePoint versions | Yes | Yes |
| Shared between users | **Yes** | Yes |

---

## Quick Setup (5 minutes)

### Step 1: Create the Document Library

1. Go to your SharePoint site
2. Click **Settings gear** (top-right) → **Site Contents**
3. Click **New** → **Document Library**
4. Name it: `LTIMeetingData`
5. Click **Create**

That's it! The app will automatically create these files when you save data:
```
LTIMeetingData/
├── meetings.json         ← All saved meetings
├── attendees.json        ← All attendees/people
├── current-meeting.json  ← Current active meeting
├── current-isolations.json
├── current-responses.json
└── backup_*.json         ← Automatic backups
```

---

### Step 2: Deploy Your App to SharePoint

Copy your built app files to a SharePoint folder or upload to a Document Library:

1. Build your React app:
   ```bash
   npm run build
   ```

2. Upload the `build` folder contents to SharePoint:
   - Create a folder in **Site Assets** or another Document Library
   - Upload all files from the `build` folder
   - Access via: `https://yoursite/_layouts/15/start.aspx#/SiteAssets/YourApp/index.html`

---

## How It Works

When running in SharePoint:

1. **Automatic Detection**: The app detects SharePoint via `_spPageContextInfo`
2. **Primary Storage**: Data saves to JSON files in the Document Library
3. **Fallback**: localStorage is used as a cache/backup
4. **Shared Data**: All users access the same JSON files

### Storage Flow:
```
User Action → localStorage (immediate) → SharePoint Document Library (sync)
                    ↑                              ↓
                 (cache)                    (shared storage)
```

---

## Permissions

Make sure users have these permissions on the `LTIMeetingData` library:

| Role | Permission Level |
|------|-----------------|
| Meeting organizers | **Contribute** (read/write) |
| Regular users | **Read** (view only) |

To set permissions:
1. Open `LTIMeetingData` library
2. Click **Library** tab → **Library Settings**
3. Click **Permissions for this document library**
4. Configure as needed

---

## Troubleshooting

### "Access Denied" when saving
- User needs **Contribute** permission on the Document Library
- Contact SharePoint administrator

### Data not syncing between users
- Check that the Document Library name matches exactly: `LTIMeetingData`
- Verify all users are accessing the same SharePoint site
- Check browser console for errors

### App works but doesn't detect SharePoint
- Make sure `_spPageContextInfo` is available (SharePoint master page)
- Try embedding in a SharePoint page instead of opening directly

---

## Alternative: Custom Library Name

If you can't use `LTIMeetingData`, configure a custom name:

```javascript
// In your app initialization
import { hybridStorageProvider } from './services';

// Set custom library name
hybridStorageProvider.setLibraryName('YourCustomLibraryName');
```

---

## Testing Locally

To test SharePoint integration locally:

1. Your app will detect "no SharePoint" and use localStorage only
2. Data saves to browser localStorage (not shared)
3. When deployed to SharePoint, it automatically switches to shared storage

---

## Document Library vs Lists

### When to use Document Library (recommended):
- Simple setup needed
- Small to medium data sizes
- Standard JSON data structures
- Quick deployment

### When to use SharePoint Lists:
- Need SharePoint views and filtering
- Complex querying requirements
- Integration with SharePoint workflows
- Very large datasets (10,000+ items)

---

**Version**: 1.0.0
**Compatible with**: SharePoint 2013, 2016, 2019, Online
