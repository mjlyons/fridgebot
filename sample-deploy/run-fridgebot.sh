#!/bin/sh

cd /home/mike/src/fridgebot
. /home/mike/.nvm/nvm.sh
nvm install 20
nvm use 20
npm run dev watch

