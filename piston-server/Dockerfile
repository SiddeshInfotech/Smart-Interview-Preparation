FROM ghcr.io/engineer-man/piston:latest

USER root

COPY build/ /piston/packages/

RUN chown -R piston:piston /piston/packages

EXPOSE 2000

ENTRYPOINT ["/piston_api/src/docker-entrypoint.sh"]