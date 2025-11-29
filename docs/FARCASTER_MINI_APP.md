# Farcaster Mini App Setup

## ✅ Completed
- [x] SDK integration (`farcaster-integration.js`)
- [x] Frame manifest (`.well-known/farcaster.json`)
- [x] Meta tags in `index.html`
- [x] Mobile optimization (HUD scaling)
- [x] Composer integration (ability to share scores)

## ⏳ Still Needed - Images

The app requires these images to be placed in `/images/`:

### Required Images

1. **Splash Screen** (1284x2778px)
   - File: `splash-icon.png`
   - Shown while app loads
   - Should be eye-catching and convey the game theme
   - Recommended: Dark space background with moon and spacecraft

2. **App Icon** (1024x1024px)
   - File: `icon-1024.png`
   - Displayed in app stores and listings
   - Should be the moon emoji or game logo

3. **OG Image for Shares** (1200x630px)
   - File: `og-1200x630.png`
   - Used when sharing to other platforms
   - Should show game branding and title

4. **Screenshots** (1284x2778px each)
   - Files: `screenshot-1-1284x2778.png`, `screenshot-2-1284x2778.png`, `screenshot-3-1284x2778.png`
   - Show gameplay, wallet connection, and leaderboard
   - Best: 3-4 screenshots showing different game states

## How to Create Images

### Option 1: Design Tools
- Figma: Use templates for Farcaster mini app sizes
- Canva: Search for mobile app screenshot templates
- Adobe XD: Create from scratch

### Option 2: Screenshot + Edit
1. Take screenshots of the game in action
2. Crop to required dimensions
3. Add text, effects with Figma/Photoshop
4. Export as PNG

### Option 3: AI Generation
Use tools like:
- Midjourney: "lunar lander game in space, dark background, moon, spacecraft"
- DALL-E: Similar prompts
- Stable Diffusion: Open source alternative

## File Placement

```
moonlander/
├── images/
│   ├── splash-icon.png          (1284x2778)
│   ├── icon-1024.png            (1024x1024)
│   ├── og-1200x630.png          (1200x630)
│   ├── screenshot-1-1284x2778.png
│   ├── screenshot-2-1284x2778.png
│   ├── screenshot-3-1284x2778.png
│   └── ... other images
```

## Testing Frame Manifest

Once images are uploaded, test the manifest at:
```
https://m00nlander.netlify.app/.well-known/farcaster.json
```

Should return valid JSON with all image URLs accessible.

## Farcaster Directory Submission

After images are in place:
1. Submit at: https://warpcast.com/~/directory
2. Fill in app details
3. Provide `.well-known/farcaster.json` URL
4. App will appear in Farcaster's app directory

## Current Status

The app is **production-ready** for gameplay. Only missing visual assets (images) which don't affect functionality.
