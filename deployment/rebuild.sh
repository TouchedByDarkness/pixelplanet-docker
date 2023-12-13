#!/bin/bash
# Rebuild from master branch and restart pixelplanet

#folder for building the canvas (the git repository will get checkout there and the canvas will get buil thtere)
BUILDDIR="/home/pixelpla/pixelplanet-build"
#folder for dev canvas
DEVFOLDER="/home/pixelpla/pixelplanet-dev"
#folder for shards
SCBFOLDER="/home/pixelpla/pixelplanet-scb"
SCCFOLDER="/home/pixelpla/pixelplanet-scc"
SCDFOLDER="/home/pixelpla/pixelplanet-scd"
SCEFOLDER="/home/pixelpla/pixelplanet-sce"
SCFFOLDER="/home/pixelpla/pixelplanet-scf"
SCGFOLDER="/home/pixelpla/pixelplanet-scg"
SCHFOLDER="/home/pixelpla/pixelplanet-sch"
#folder for production canvas
PFOLDER="/home/pixelpla/pixelplanet"
#which branch to use
BRANCH="master"

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

GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git fetch --all
cd "$BUILDDIR"
echo "---UPDATING REPO ON PRODUCTION SERVER---"
GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git reset --hard "origin/${BRANCH}"
echo "---BUILDING pixelplanet---"
should_reinstall master
DO_REINSTALL=$?
[ $DO_REINSTALL -eq 0 ] && npm_reinstall
npm run build
echo "---RESTARTING CANVAS---"
pm2 stop ppfun-server
pm2 stop ppfun-backups
pm2 stop ppfun-scb
pm2 stop ppfun-scc
pm2 stop ppfun-scd
pm2 stop ppfun-sce
pm2 stop ppfun-scf
pm2 stop ppfun-scg
pm2 stop ppfun-sch
copy "${PFOLDER}" "${DO_REINSTALL}"
copy "${SCBFOLDER}" 1
copy "${SCCFOLDER}" 1
copy "${SCDFOLDER}" 1
copy "${SCEFOLDER}" 1
copy "${SCFFOLDER}" 1
copy "${SCGFOLDER}" 1
copy "${SCHFOLDER}" 1
cd "$PFOLDER"
pm2 start ecosystem-backup.yml
