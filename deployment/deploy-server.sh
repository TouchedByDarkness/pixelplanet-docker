#!/bin/sh
scp dist/server.js pixelplanet:/home/pixelpla/pixelplanet/
ssh pixelplanet ./restart.sh
