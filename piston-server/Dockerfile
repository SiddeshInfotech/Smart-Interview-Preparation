FROM ghcr.io/engineer-man/piston:latest

USER root

WORKDIR /piston-server

# Copy the entire Piston source into the image
COPY . .

# Ensure runtime directory exists
RUN mkdir -p /piston/packages

# Remove old runtimes if they exist
RUN rm -rf \
    /piston/packages/python \
    /piston/packages/gcc \
    /piston/packages/java || true

# Start Piston temporarily and install required runtimes
RUN /piston_api/src/docker-entrypoint.sh & \
    PID=$! && \
    sleep 20 && \
    cd cli && \
    node index.js -u http://127.0.0.1:2000 ppman install python 3.12.0 && \
    node index.js -u http://127.0.0.1:2000 ppman install gcc 10.2.0 && \
    node index.js -u http://127.0.0.1:2000 ppman install java 15.0.2 && \
    kill $PID || true

# Set correct ownership
RUN chown -R piston:piston /piston

EXPOSE 2000

ENTRYPOINT ["/piston_api/src/docker-entrypoint.sh"]