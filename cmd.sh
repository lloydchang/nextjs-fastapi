#!/bin/sh -x

which ollama || curl -fsSL https://ollama.com/install.sh | sh
ps auxww | grep ollama || ollama serve &
sleep 5
ollama pull llama3.2
ollama run llama3.2
