# Farcaster Visual Assets Generation

This directory contains HTML templates to help generate the required visual assets for your Farcaster mini app submission. The required assets are:

## Required Assets

1. **Splash Screen**: 1284x2778px
   - Template: `splash_template.html`
   - Features your m00nlander logo centered on a space-themed gradient background

2. **App Icon**: 1024x1024px
   - Template: `app_icon_template.html`
   - Uses your m00nlander.png as the main icon element

3. **OG Share Image**: 1200x630px
   - Template: `og_share_template.html`
   - For social media sharing with your game title and description

4. **Gameplay Screenshots**: 1284x2778px (3-4 images)
   - These need to be actual screenshots of your game in action

## How to Generate the Images

### Option 1: Using a Browser and Screenshot Tool
1. Open each HTML template in a browser
2. Use browser developer tools to set the exact dimensions:
   - For splash: Set device dimensions to 1284x2778
   - For OG image: Set device dimensions to 1200x630
   - For app icon: Set device dimensions to 1024x1024
3. Take full-page screenshots with no compression

### Option 2: Using Graphics Software (Recommended)
1. Open your preferred design tool (Figma, Canva, Photoshop, etc.)
2. Create new documents with the specified dimensions
3. Import your m00nlander.png and m00n.png images
4. Use the HTML templates as reference for layout and styling
5. Export as PNG with high quality

### Option 3: Using Command Line Tools
If you have ImageMagick installed:
```bash
# Convert HTML to image (requires additional tools like Puppeteer or similar)
```

## Gameplay Screenshots
For the gameplay screenshots, you'll need to:
1. Play your game and take screenshots at interesting moments
2. Use your mobile device's screenshot function or browser dev tools
3. Crop/resize to exactly 1284x2778px
4. Choose images showing:
   - Gameplay in progress
   - Different game states (landing, flying, crashed)
   - High score screens
   - Any special features

## Final Steps
Place all generated images in the `/images/` directory with appropriate names:
- `splash_screen.png`
- `app_icon.png`
- `og_image.png`
- `gameplay_1.png`, `gameplay_2.png`, etc.

Once you've created all required assets, your Farcaster mini app will be ready for submission!