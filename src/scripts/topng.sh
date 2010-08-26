#!/bin/bash

echo ""
echo "Encoding to png..."
../lib/topng.php ../build/asteroids.js > ../build/asteroids.png
echo "Done."