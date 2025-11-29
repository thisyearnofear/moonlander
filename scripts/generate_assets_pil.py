#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os

def create_splash_screen():
    """Create splash screen 1284x2778px"""
    width, height = 1284, 2778
    image = Image.new('RGB', (width, height), color='#1a1a2e')  # Dark space background
    
    # Load and resize the logo
    logo = Image.open('../images/m00nlander.png')
    logo_size = 400
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (width - logo_size) // 2
    y = (height // 2) - 300  # Position it a bit higher than exact center
    image.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
    
    # Add title text
    draw = ImageDraw.Draw(image)
    
    # Try to use a default font, fall back to default if not available
    try:
        font_large = ImageFont.truetype("Arial.ttf", 72)
        font_medium = ImageFont.truetype("Arial.ttf", 36)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    title = "m00nlander"
    subtitle = "Prepare for Lunar Landing"
    
    # Draw title
    title_bbox = draw.textbbox((0, 0), title, font=font_large)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, y + logo_size + 50), title, fill='white', font=font_large)
    
    # Draw subtitle
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_medium)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, y + logo_size + 150), subtitle, fill='#aaa', font=font_medium)
    
    image.save('../images/splash-icon.png')
    print("Created splash screen: splash-icon.png (1284x2778px)")

def create_app_icon():
    """Create app icon 1024x1024px"""
    size = 1024
    image = Image.new('RGB', (size, size), color='#1a1a2e')  # Dark background
    
    # Load and resize the logo
    logo = Image.open('../images/m00nlander.png')
    logo_size = 800  # Make the logo large but not fill the whole space
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (size - logo_size) // 2
    y = (size - logo_size) // 2
    image.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
    
    image.save('../images/icon-1024.png')
    print("Created app icon: icon-1024.png (1024x1024px)")

def create_og_image():
    """Create OG share image 1200x630px"""
    width, height = 1200, 630
    image = Image.new('RGB', (width, height), color='#1a1a2e')  # Dark space background
    
    # Load the landscape image
    bg_img = Image.open('../images/m00n.png')
    bg_img = bg_img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Composite with background
    image.paste(bg_img, (0, 0))
    
    # Add text overlay
    draw = ImageDraw.Draw(image)
    
    try:
        font_large = ImageFont.truetype("Arial.ttf", 48)
        font_medium = ImageFont.truetype("Arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    title = "m00nlander"
    subtitle = "Lunar Lander Game on Farcaster"
    
    # Draw title
    title_bbox = draw.textbbox((0, 0), title, font=font_large)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, height // 2 - 50), title, fill='white', font=font_large)
    
    # Draw subtitle
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_medium)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, height // 2 + 20), subtitle, fill='#cccccc', font=font_medium)
    
    image.save('../images/og-1200x630.png')
    print("Created OG image: og-1200x630.png (1200x630px)")

def create_gameplay_screenshot():
    """Create a sample gameplay screenshot template 1284x2778px"""
    width, height = 1284, 2778
    image = Image.new('RGB', (width, height), color='#1a1a2e')  # Dark space background
    
    # Add text elements
    draw = ImageDraw.Draw(image)
    
    try:
        font_large = ImageFont.truetype("Arial.ttf", 72)
        font_medium = ImageFont.truetype("Arial.ttf", 36)
        font_small = ImageFont.truetype("Arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    title = "m00nlander"
    subtitle = "Lunar Lander Game"
    description = "Game in Progress"
    
    # Draw centered text
    title_bbox = draw.textbbox((0, 0), title, font=font_large)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, height // 2 - 200), title, fill='white', font=font_large)
    
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_medium)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, height // 2 - 100), subtitle, fill='#cccccc', font=font_medium)
    
    desc_bbox = draw.textbbox((0, 0), description, font=font_small)
    desc_width = desc_bbox[2] - desc_bbox[0]
    desc_x = (width - desc_width) // 2
    draw.text((desc_x, height // 2), description, fill='#cccccc', font=font_small)
    
    image.save('../images/screenshot-1-1284x2778.png')
    print("Created gameplay screenshot: screenshot-1-1284x2778.png (1284x2778px)")

def main():
    # Create images directory if it doesn't exist
    os.makedirs('../images', exist_ok=True)
    
    print("Generating Farcaster mini app visual assets...")
    create_splash_screen()
    create_app_icon()
    create_og_image()
    create_gameplay_screenshot()
    print("\nAll required visual assets have been generated in the /images/ directory!")
    print("\nNote: These are basic implementations. For better results:")
    print("1. Create actual gameplay screenshots for more authentic images")
    print("2. Adjust colors and design elements to match your brand")

if __name__ == "__main__":
    main()