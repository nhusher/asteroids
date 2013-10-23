#!/bin/bash

rm ../../*
cp ../src/index.html ../../
cp ../src/asteroids.js ../build/asteroids.js

./mp3.sh
./minify.sh
cat ../build/asteroids.js >> ../build/mp3.js
mv ../build/mp3.js ../build/asteroids.js
./topng.sh

cp ../build/asteroids.png ../../ast.png

wc ../../ast.png ../../index.html

echo "Done."