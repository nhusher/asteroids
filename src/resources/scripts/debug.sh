#!/bin/bash


rm ../../*
cp ../src/debug.html ../../index.html
cp ../src/asteroids.js ../build/asteroids.js

./mp3.sh
cat ../build/asteroids.js >> ../build/mp3.js
mv ../build/mp3.js ../build/asteroids.js

cp ../build/asteroids.js ../../asteroids.js