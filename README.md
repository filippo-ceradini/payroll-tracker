# Payroll Tracker PWA

A Progressive Web App for tracking overtime and amenities over a 15-day period for payroll submission.

## Features

- 📱 **PWA Support**: Works offline and can be installed on mobile devices
- 📅 **15-Day Tracking**: View and manage entries for any 15-day period
- ➕ **Multiple Entry Types**: Track PM DJSK, Overtime, and Amenities
- 💾 **Local Storage**: Data persists in browser storage
- 📧 **Email Export**: Send data to payroll via email

## Setup

1. **Clone or download this repository**

2. **Add Icons** (Required for PWA):
   - Create `icon-192.png` (192x192 pixels)
   - Create `icon-512.png` (512x512 pixels)
   - You can use any image editor or online tool to create these icons
   - Place them in the root directory

3. **Open `index.html` in a browser** to use locally

## Deployment to GitHub Pages

1. **Create a new GitHub repository**

2. **Push all files to the repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/filippo-ceradini/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Make sure repository is PUBLIC** (required for free GitHub accounts):
   - Go to Settings > General > Danger Zone
   - Or make it public when creating the repository

4. **Enable GitHub Pages**:
   - Go to your repository settings
   - Click **"Pages"** in the left sidebar
   - Under **"Source"**, select:
     - **Branch**: `main` (or `master` if that's your branch)
     - **Folder**: `/ (root)`
   - Click **Save**
   - Wait 1-2 minutes for deployment

5. **Access your app** at: `https://filippo-ceradini.github.io/YOUR_REPO_NAME/`

## Troubleshooting 404 Errors

If you see a 404 error:

1. **Verify `index.html` is at the root** of your repository (not in a subfolder)
2. **Check GitHub Pages is enabled**: Settings > Pages > Source should be set to `main` branch
3. **Repository must be public** (for free GitHub accounts)
4. **Wait a few minutes** after enabling Pages for deployment
5. **Check the deployment status**: Look for a green checkmark in the Actions tab
6. **Clear browser cache** and try again
7. **Try incognito/private mode** to rule out cache issues

## Usage

1. **Set Quantities**: Use the +1/-1 buttons to set quantities for each entry type
2. **Apply to Day**: Click "Apply" button on any day row to apply current quantities
3. **Navigate**: Use "PAST" and "NEXT" buttons to view different 15-day periods
4. **Send**: Click "SEND" button to generate an email with all your entries

## File Structure

```
payroll-tracker/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── app.js              # Application logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline support
├── icon-192.png       # App icon (192x192) - you need to create this
├── icon-512.png       # App icon (512x512) - you need to create this
└── README.md          # This file
```

## Browser Support

- Modern browsers with Service Worker support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Data is stored locally in your browser's localStorage
- The app works offline after first load
- Email functionality uses `mailto:` links (requires email client setup)

## License

MIT License - feel free to use and modify as needed.

