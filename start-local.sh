#!/bin/bash
cd /home/itziktdk/.openclaw/workspace/school-app
export PORT=3030
export $(grep -v '^#' .env | xargs)
node server.js
