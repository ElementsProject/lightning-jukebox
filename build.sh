#!/bin/bash
set -xeo pipefail

rm -rf dist/*

babel -d dist src

mkdir dist/bundles
browserify client/pay.js | uglifyjs -cm > dist/bundles/pay.js
browserify client/play.js | uglifyjs -cm > dist/bundles/play.js
