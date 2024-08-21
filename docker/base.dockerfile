FROM alpine:latest

# use GCC
ENV CC=gcc
ENV CXX=g++

# Set the SUMO HOME
ENV SUMO_HOME=/app/sumo
ENV PATH=$SUMO_HOME/bin:$PATH

RUN apk upgrade --no-cache

RUN echo '@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories

RUN apk add bash
RUN apk add --no-cache make
RUN apk add git cmake g++ fox-dev@testing mesa-dev mesa-gl \
    gdal-dev xerces-c-dev proj-dev eigen-dev gettext wget unzip fmt-dev
RUN apk add swig python3-dev py3-pip py3-setuptools py3-build
RUN apk add freetype-dev \
    fontconfig-dev \
    libxft-dev \
    libxrender-dev \
    libpng-dev  \
    glu-dev
