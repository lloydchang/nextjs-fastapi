#!/bin/sh -x

curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
sleep 5
ollama pull llama3.2
ollama run llam3.2
