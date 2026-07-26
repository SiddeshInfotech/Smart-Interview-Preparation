FROM ghcr.io/engineer-man/piston:latest

USER root

RUN mkdir -p /piston/packages

COPY packages/ /piston/packages/

RUN rm -rf \
    /piston/packages/.gitignore \
    /piston/packages/README.MD \
    /piston/packages/README.md \
    /piston/packages/CONTRIBUTING.MD \
    /piston/packages/Makefile \
    /piston/packages/test.sh \
    /piston/packages/init

RUN chown -R piston:piston /piston

EXPOSE 2000

CMD ["/piston_api/src/docker-entrypoint.sh"]