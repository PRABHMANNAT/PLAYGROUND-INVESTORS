# Playground investor workspace

A responsive investor dashboard built from Sydney_Investor_List.xlsx and the supplied Playground logo. The interface uses a quiet white-and-gray palette, system typography, clear navigation, and simplified investor cards.

The website includes all 20 investor organizations and 31 named contacts, source fit assessments, eligibility notes, original evidence links, preferred pitch routes, and contact attribution. Each investor has six checklist steps, outreach status, follow-up date, notes, and a shortlist bookmark. Card and table views, search, filters, a pipeline, contacts view, CSV export, and JSON backup/restore are included.

Checklist progress, notes, dates, and custom investors are stored in the browser's local storage. Use **Data & backup → Download backup** to transfer progress or preserve a copy. The site does not automatically send outreach.

Each investor profile has **Overview**, **Checklist**, **Contacts**, and **Notes** tabs. Use **Strong matches** to see the closest fits, and **Filters** for investment fit, outreach status, and sorting. **Data & backup** in the sidebar contains the download and restore controls.

The files in `dist` are ready for static hosting. Open `dist/index.html` in a browser, or run `npm run preview` to serve it at http://127.0.0.1:4173. No frontend dependencies or build step are required. Configure your hosting provider's publish directory as `dist`.

Validated in Chrome on desktop and at a 390px mobile width: 20 investor organizations, 31 contacts, 14 strong matches, 120 checklist steps, filters, table view, saved progress, pipeline, notes, follow-up dates, bookmarks, CSV export, JSON backup and restore, and adding an investor. No browser script errors were observed.

The data reflects the supplied spreadsheet, dated 13 October 2026. Published contact details and investment terms have not been independently reverified during website creation. Original source values are preserved in data.js; replacement characters in punctuation are normalized for display.
