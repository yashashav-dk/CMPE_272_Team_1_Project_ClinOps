# Testing Interactive Dashboard - Quick Guide

## ✅ Test Checklist

### 1. Interactive Tables
```
✓ Click any cell to edit
✓ Type new value
✓ Press Enter to save
✓ Click "Add Row" - new row appears
✓ Click trash icon to delete row
✓ Click "Save Changes" button
✓ Refresh page - changes persist
```

### 2. Clickable Checkboxes
```
✓ Click checkbox item - toggles immediately
✓ Progress bar updates in real-time
✓ Wait 2 seconds - auto-saves
✓ Refresh page - state persists
✓ Use filters - priority/category work
✓ Use sorting - reorders correctly
```

### 3. Enhanced Diagrams
```
✓ Click zoom + button - diagram grows
✓ Click zoom - button - diagram shrinks
✓ Click Reset - returns to 100%
✓ Click Fullscreen - expands view
✓ Click Download - SVG file downloads
✓ Scroll - can pan across diagram
```

## 🚀 Quick Start

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/trial-dashboard/[your-project-id]`
3. Look for table, checklist, or diagram widgets
4. Test interactions above
5. Verify changes persist after page refresh

## 🔍 Troubleshooting

**Changes not saving?**
- Check browser console (F12) for errors
- Verify database is running
- Check Network tab for API calls

**Components not interactive?**
- Clear browser cache
- Restart dev server
- Run: `npx prisma generate`

**Need help?**
- See DASHBOARD_INTERACTIVE_FEATURES.md for details
- Check API endpoint: `/api/dashboard/widget/[widgetId]/data`
