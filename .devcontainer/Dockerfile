FROM ubuntu:latest

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies and Ollama
RUN apt-get update && apt-get install -y \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

EXPOSE 3000
EXPOSE 8000
EXPOSE 11434

CMD [".devcontainer/bin/cmd.sh"]
