# NASA Coin Dockerfile
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NASA_COIN_VERSION=1.0.0

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libtool \
    autotools-dev \
    automake \
    pkg-config \
    libssl-dev \
    libevent-dev \
    bsdmainutils \
    libboost-all-dev \
    libdb-dev \
    libdb++-dev \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create nasacoin user
RUN useradd -m -s /bin/bash nasacoin

# Set working directory
WORKDIR /opt/nasacoin

# Copy source code
COPY bitcoin-core/ /opt/nasacoin/

# Build NASA Coin
RUN cd /opt/nasacoin && \
    ./autogen.sh && \
    ./configure --disable-wallet --disable-gui --prefix=/usr/local && \
    make -j$(nproc) && \
    make install && \
    ldconfig

# Create data directory
RUN mkdir -p /home/nasacoin/.nasacoin && \
    chown -R nasacoin:nasacoin /home/nasacoin/.nasacoin

# Copy configuration
COPY nasacoin.conf /home/nasacoin/.nasacoin/nasacoin.conf
RUN chown nasacoin:nasacoin /home/nasacoin/.nasacoin/nasacoin.conf

# Expose ports
EXPOSE 8334 18334

# Switch to nasacoin user
USER nasacoin

# Set working directory
WORKDIR /home/nasacoin

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nasacoin-cli getblockchaininfo || exit 1

# Default command
CMD ["nasacoind", "-daemon", "-conf=/home/nasacoin/.nasacoin/nasacoin.conf"]