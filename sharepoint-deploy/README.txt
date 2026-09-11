========================================
LTI OMT MEETING SYSTEM - SHAREPOINT DEPLOYMENT
========================================

This folder is a production build of the app, generated from the current
source. Upload it to SharePoint as-is.

Everything here is a build artifact. Do not edit these files by hand -
regenerate the folder instead (see REGENERATING below).


----------------------------------------
BEFORE YOU START
----------------------------------------

Check that the site allows custom scripting. The app calls the SharePoint
REST API from the browser, which many tenants disable by default. If
custom scripting is blocked, the pages will load but every save will fail,
and this approach will not work without help from your SharePoint admin.

Ask your admin to confirm "Allow users to run custom script" is enabled
for the target site collection.


----------------------------------------
HOW TO DEPLOY
----------------------------------------

1. Create the data library
   Site Contents > New > Document library
   Name it exactly:  LTIMeetingData
   This is where meetings, attendees and the LTI master list are stored.
   The app creates the JSON files inside it on first save.

2. Upload the app
   Go to Site Contents > Site Assets (or any document library).
   Create a folder called:  LTIMeetingApp
   Upload the contents of this folder into it, keeping the structure:

       LTIMeetingApp/
         index.html
         asset-manifest.json
         static/js/...

   Upload the whole `static` folder, not just the files inside it.

3. Open the app
   https://<your-site>/SiteAssets/LTIMeetingApp/index.html

   The app detects SharePoint from the URL, so it must be opened from the
   SharePoint address. Opening index.html from your own machine will run it
   in local-only mode with no SharePoint saving.


----------------------------------------
VERIFYING IT WORKS
----------------------------------------

The cloud icon in the top bar shows the connection state. After the first
save, check that JSON files have appeared in the LTIMeetingData library:

    meetings.json, attendees.json, lti-master-list.json

If those files never appear, saving to SharePoint is not working even if
the app looks healthy - it falls back to browser-local storage, which is
per-person and not shared.


----------------------------------------
BROWSER SUPPORT
----------------------------------------

Chrome    recommended
Edge      works; avoid IE mode
Firefox   works
IE 11     not supported


----------------------------------------
WHAT IS NOT INCLUDED
----------------------------------------

Earlier versions of this folder shipped load-test-data.html,
load-asset-manager-test-data.html and debug-asset-manager-data.html. Those
write fabricated isolations into the same browser storage the app reads,
and the sample records are not visually distinguishable from real ones.
They are development tools and are deliberately left out of this bundle.
They remain in the repository root if you need them for testing.

Source maps are also excluded, which is why this folder is around 2 MB
rather than 28 MB.


----------------------------------------
REGENERATING
----------------------------------------

    cd frontend
    npm ci
    GENERATE_SOURCEMAP=false npm run build

Then replace the contents of sharepoint-deploy/ with frontend/build/.

Do not commit a hand-edited bundle: the folder should always be a clean
build, so what is deployed matches the source it came from.
