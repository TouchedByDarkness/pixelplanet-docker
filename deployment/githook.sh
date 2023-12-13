#!/bin/bash
# This hook builds pixelplanet after a push, and deploys it, it should be ron post-receive
# If it is the master branch, it will deploy it on the life system, and other branch will get deployed to the dev-canvas (a second canvas that is running on the server)
#
# To set up a server to use this, you have to go through the building steps manually first.
#
#folder for building the canvas (the git repository will get checkout there and the canvas will get buil thtere)
BUILDDIR="/home/pixelpla/pixelplanet-build"
#folder for dev canvas
DEVFOLDER="/home/pixelpla/pixelplanet-dev"
#folder for production canvas
PFOLDER="/home/pixelpla/pixelplanet"

should_reinstall () {
    local TMPFILE="${BUILDDIR}/package.json.${1}.tmp"
    local NODEDIR="${BUILDDIR}/node_modules"
    local ORFILE="${BUILDDIR}/package.json"
    [ -f "${TMPFILE}" ] && [ -d "${NODEDIR}" ] && diff -q  "${TMPFILE}" "${ORFILE}" && {
        echo "package.json stil the same, no need to rerun npm install."
        return 1
    }
    cp "${ORFILE}" "${TMPFILE}"
    echo "package.json changed, need to run npm install."
    return 0
}

npm_reinstall () {
    rm -rf node_modules
    rm package-lock.json 
    npm install
}

copy () {
  local TARGETDIR="${1}"
  local REINSTALL="${2}"
  cp -r dist/*.js "${TARGETDIR}/"
  cp -r dist/workers "${TARGETDIR}/"
  rm -rf "${TARGETDIR}/public/assets"
  cp -r dist/public "${TARGETDIR}/"
  cp -r dist/captchaFonts "${TARGETDIR}/"
  cp -r dist/package.json "${TARGETDIR}/"
  mkdir -p "${TARGETDIR}/log"
  cd "${TARGETDIR}"
  [ $REINSTALL -eq 0 ] && npm_reinstall
  pm2 start ecosystem.yml
  cd -
}

while read oldrev newrev refname
do
    GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git fetch --all
    cd "$BUILDDIR"
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    if [ "master" == "$branch" ]; then
        echo "---UPDATING REPO ON PRODUCTION SERVER---"
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git reset --hard "origin/$branch"
        COMMITS=`git log --pretty=format:'- %s%b' $newrev ^$oldrev`
        COMMITS=`echo "$COMMITS" | sed ':a;N;$!ba;s/\n/\\\n/g'`
        echo "---BUILDING pixelplanet---"
        should_reinstall master
        DO_REINSTALL=$?
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        npm run build
        echo "---RESTARTING CANVAS---"
        pm2 stop ppfun-server
        pm2 stop ppfun-backups
        copy "${PFOLDER}" "${DO_REINSTALL}"
        cd "$PFOLDER"
        pm2 start ecosystem-backup.yml
    else
        echo "---UPDATING REPO ON DEV SERVER---"
        pm2 stop ppfun-server-dev
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git reset --hard "origin/$branch"
        COMMITS=`git log --pretty=format:'- %s%b' $newrev ^$oldrev`
        COMMITS=`echo "$COMMITS" | sed ':a;N;$!ba;s/\n/\\\n/g'`
        echo "---BUILDING pixelplanet---"
        should_reinstall dev
        DO_REINSTALL=$?
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        nice -n 19 npm run build:dev
        echo "---RESTARTING CANVAS---"
        copy "${DEVFOLDER}" "${DO_REINSTALL}"
    fi
done
