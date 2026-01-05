========================================
LTI OMT MEETING SYSTEM - SHAREPOINT DEPLOYMENT
========================================

HOW TO DEPLOY TO SHAREPOINT:

1. Download this entire folder as a ZIP from GitHub
   - Click "Code" button > "Download ZIP"
   - Or download just the sharepoint-deploy folder

2. In SharePoint:
   - Go to Site Contents > Site Assets (or create a Document Library)
   - Create a new folder called "LTIMeetingApp"
   - Upload ALL files and folders from this sharepoint-deploy folder

3. Create Data Storage Library:
   - Go to Site Contents > New > Document Library
   - Name it: LTIMeetingData
   - This is where your app data will be stored

4. Access your app:
   - URL will be something like:
   - https://yoursite/SiteAssets/LTIMeetingApp/index.html

========================================
FILES INCLUDED:
========================================
- index.html          : Main app entry point
- static/             : JavaScript, CSS, and assets
- asset-manifest.json : Build manifest

========================================
BROWSER SUPPORT:
========================================
- Chrome: RECOMMENDED (works best)
- Edge: May have IE mode issues (see notes below)
- Firefox: Should work
- IE: NOT SUPPORTED

NOTE FOR EDGE USERS:
If your corporate SharePoint forces IE7 mode, the app won't work in Edge.
Use Chrome instead, or ask IT to disable IE mode for your site.

========================================
DATA STORAGE:
========================================
The app stores data in:
1. SharePoint Document Library (shared between all users)
2. localStorage (fallback/cache)

Make sure to create the "LTIMeetingData" library!

========================================
VERSION INFO:
========================================
Built: 2026-01-05
Router: HashRouter (URLs use /#/ format)
