#!/bin/bash

# Navigate to images folder
cd src/public/images

# Create PWA icons from logo.png
echo "Creating PWA icons..."

sips -z 72 72 logo.png --out icon-72x72.png
sips -z 96 96 logo.png --out icon-96x96.png
sips -z 128 128 logo.png --out icon-128x128.png
sips -z 144 144 logo.png --out icon-144x144.png
sips -z 152 152 logo.png --out icon-152x152.png
sips -z 192 192 logo.png --out icon-192x192.png
sips -z 384 384 logo.png --out icon-384x384.png
sips -z 512 512 logo.png --out icon-512x512.png

# Create placeholder shortcuts icons (using 192x192 as base)
cp icon-192x192.png icon-add-192x192.png
cp icon-192x192.png icon-home-192x192.png

# Create placeholder screenshots
# For mobile (540x720)
sips -z 720 540 logo.png --out screenshot-mobile-1.png
sips -z 720 540 logo.png --out screenshot-mobile-2.png

# For desktop (1280x720)  
sips -z 720 1280 logo.png --out screenshot-desktop-1.png

echo ""
echo "✅ All PWA icons and screenshots created!"
echo ""
echo "Created files:"
ls -1 icon-*.png screenshot-*.png
