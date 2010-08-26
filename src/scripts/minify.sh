#!/bin/bash

echo ""
echo "Compressing javascript file..."
java -jar ../lib/yuicompressor.jar --type js -v -o ../build/asteroids-min.js ../build/asteroids.js
mv ../build/asteroids-min.js ../build/asteroids.js
echo "Done."