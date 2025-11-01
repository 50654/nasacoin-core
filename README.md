# 🚀 NASA Coin Core

**NASA Coin ($nasapepe)** is a custom Bitcoin fork with limited supply, meme-fueled branding, and ultra-high block rewards. Designed for fun, experimentation, and mining with pool support.

---

## 🌌 Coin Specs

| Parameter        | Value              |
|------------------|--------------------|
| Name             | NASA Coin          |
| Ticker           | NASAPEPE           |
| Algorithm        | SHA256 (Proof of Work) |
| Block Reward     | 500,000 NASAPEPE   |
| Max Supply       | 5,000,000 NASAPEPE |
| Mining Mode      | Pool-ready         |
| Forked From      | Bitcoin Core       |

---

## ⚙️ Build Instructions (Ubuntu)

```bash
sudo apt update
sudo apt install build-essential libtool autotools-dev automake pkg-config libssl-dev \
libevent-dev bsdmainutils libboost-all-dev libdb-dev libdb++-dev

git clone https://github.com/wbaker7702/nasacoin-core.git
cd nasacoin-core
./autogen.sh
./configure
make -j$(nproc)
# nasacoin-core

## 🛠️ VS Code Setup

If you rely on the workspace tasks, install the Arm Virtual Hardware extension (`arm.virtual-hardware`). It registers the `virtual-hardware.run` task defined in `.vscode/tasks.json`; without it VS Code raises a "there is no registered task type" error.
