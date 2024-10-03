#!/bin/bash -x

# ttyd.sh

brew install ttyd
# wget -nc https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.aarch64
# chmod +x ./ttyd.aarch64
# ./ttyd.aarch64 -p 8080 bash -c 'while true; do crewai run; done'
cd tedxsdg
pip install -r requirements.txt
ttyd -p 8080 bash -c 'while true; do crewai run; done'
