#!/bin/sh
tar --exclude='./dist/tiles' --exclude='./dist/log' -cvJf /tmp/ppfun.tar.xz ./dist
scp /tmp/ppfun.tar.xz pixelplanet:/tmp/
rm /tmp/ppfun.tar.xz
ssh pixelplanet ./dev-deploy-from-temp.sh
