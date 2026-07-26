FROM ghcr.io/engineer-man/piston:latest

USER root

# Create runtime directory
RUN mkdir -p /piston/packages

# Copy pre-built runtimes
COPY build/ /piston/packages/

# Remove any accidental metadata files if present
RUN find /piston/packages -maxdepth 1 \
    \( \
        -name ".gitignore" -o \
        -name "README.md" -o \
        -name "README.MD" -o \
        -name "CONTRIBUTING.MD" -o \
        -name "Makefile" -o \
        -name "test.sh" -o \
        -name "init" \
    \) -exec rm -rf {} +

# Fix permissions
RUN chown -R piston:piston /piston

EXPOSE 2000

ENTRYPOINT ["/piston_api/src/docker-entrypoint.sh"]