# Production-Ready Piston API Deployment on Render
# Uses the official EngineerMan Piston image as base
FROM ghcr.io/engineer-man/piston:latest

# Pre-install language runtimes during image build so they are baked into the container
RUN pcli install python 3.10.0 || pcli install python
RUN pcli install gcc 10.2.0 || pcli install gcc
RUN pcli install java 15.0.2 || pcli install java
RUN pcli install node 18.15.0 || pcli install node
RUN pcli install go 1.16.2 || pcli install go

EXPOSE 2000
