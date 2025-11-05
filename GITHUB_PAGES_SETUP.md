# GitHub Pages Setup Troubleshooting

If you're getting a 404 error, follow these steps:

## 1. Verify Repository Structure

Make sure your repository has these files at the **root** level:
- `index.html` (must be at root, not in a subfolder)
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `icon-192.png`
- `icon-512.png`
- `.nojekyll`

## 2. Check GitHub Pages Settings

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select:
   - **Branch**: `main` (or `master`)
   - **Folder**: `/ (root)`
5. Click **Save**

## 3. Verify Repository is Public (for free accounts)

- Free GitHub accounts require public repos for GitHub Pages
- If your repo is private, upgrade to GitHub Pro or make it public

## 4. Wait for Deployment

- After enabling Pages, wait 1-2 minutes
- GitHub will show a green checkmark when deployment is complete
- Your site URL will be: `https://filippo-ceradini.github.io/REPO_NAME/`

## 5. Clear Cache and Try Again

- Clear browser cache
- Try opening in incognito/private mode
- Or append `?v=2` to the URL

## 6. Check File Commits

Make sure all files are committed and pushed:

```bash
git status  # Should show "nothing to commit"
git log     # Should show your commits
```

## Common Issues

### Issue: "404 - File not found"
**Solution**: Make sure `index.html` is at the repository root, not in a subfolder.

### Issue: "Site not loading"
**Solution**: Check that GitHub Pages is enabled in Settings > Pages.

### Issue: "Service Worker not working"
**Solution**: This is normal for GitHub Pages. The app will still work without it.

## Testing Locally

Before deploying, test locally:
```bash
# Using Python (if installed)
python3 -m http.server 8000

# Or using Node.js (if installed)
npx http-server

# Then open: http://localhost:8000
```

## Repository Name Matters

If your repository is named `payroll-tracker`, your URL will be:
`https://filippo-ceradini.github.io/payroll-tracker/`

If you want it at the root (`https://filippo-ceradini.github.io/`), you need to:
1. Create a repository named exactly: `filippo-ceradini.github.io`
2. This will be your user site root

