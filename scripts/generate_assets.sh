#!/bin/bash

echo "Checking for required tools..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Installing..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "Error: Homebrew is not installed. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo ""
        echo "Then install ImageMagick:"
        echo "  brew install imagemagick"
        echo ""
        echo "Or install ImageMagick manually from: https://imagemagick.org"
        exit 1
    fi
fi

echo "ImageMagick is installed. Generating Farcaster mini app visual assets..."

# Create images directory if it doesn't exist
mkdir -p ../images

# Check if source images exist
if [ ! -f "../images/m00nlander.png" ]; then
    echo "Error: ../images/m00nlander.png not found!"
    exit 1
fi

if [ ! -f "../images/m00n.png" ]; then
    echo "Error: ../images/m00n.png not found!"
    exit 1
fi

echo "Creating splash screen (1284x2778px)..."
convert ../images/m00nlander.png -resize 400x400 -background "#1a1a2e" -gravity center -extent 1284x2778 ../images/splash-icon.png

echo "Creating app icon (1024x1024px)..."
convert ../images/m00nlander.png -resize 1024x1024 ../images/icon-1024.png

echo "Creating OG share image (1200x630px)..."
convert ../images/m00n.png -resize 1200x630^ -gravity center -extent 1200x630 -background "#1a1a2e" -fill white -pointsize 48 -gravity center -annotate +0-100 "m00nlander" -fill "#cccccc" -pointsize 24 -gravity center -annotate +0+20 "Lunar Lander Game on Farcaster" ../images/og-1200x630.png

echo "Creating sample gameplay screenshot template (1284x2778px)..."
convert -size 1284x2778 xc:"#1a1a2e" -fill white -pointsize 72 -gravity center -annotate +0-300 "m00nlander" -fill "#cccccc" -pointsize 36 -gravity center -annotate +0-200 "Lunar Lander Game" -fill "#cccccc" -pointsize 24 -gravity center -annotate +0+0 "Game in Progress" ../images/screenshot-1-1284x2778.png

echo "All required visual assets have been generated in the /images/ directory!"
echo ""
echo "Note: These are basic implementations. For better results:"
echo "1. Use the HTML templates in /templates/ for better layouts"
echo "2. Create actual gameplay screenshots for more authentic images"
echo "3. Adjust colors and design elements to match your brand"