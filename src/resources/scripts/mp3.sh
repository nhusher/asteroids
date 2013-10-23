#!/bin/bash

echo ""
echo "Generating base64 encoded MP3 files..."
echo -n "var MP3=[\"data:audio/mp3;base64," > ../build/mp3-x.js

base64 -e ../src/laser.mp3 >> ../build/mp3-x.js
echo -n "\",\"data:audio/mp3;base64," >> ../build/mp3-x.js

base64 -e ../src/thrust.mp3 >> ../build/mp3-x.js
echo -n "\",\"data:audio/mp3;base64," >> ../build/mp3-x.js

base64 -e ../src/death.mp3 >> ../build/mp3-x.js
echo -n "\",\"data:audio/mp3;base64," >> ../build/mp3-x.js

echo -n "\"];" >> ../build/mp3-x.js

tr -d '\n\r' <../build/mp3-x.js >../build/mp3.js
rm ../build/mp3-x.js

echo "Done."