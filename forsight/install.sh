#!/bin/sh
# Installs the forsight binary for this machine's OS/arch and (on Linux, when
# run as root) sets it up as a systemd service. Usage:
#
#   curl -fsSL https://raw.githubusercontent.com/marcfs31/forsight/main/forsight/install.sh | sh
#
# Honors:
#   FORSIGHT_VERSION   release tag to install, e.g. "forsight-v0.1.0" (default: latest)
#   FORSIGHT_INSTALL_DIR   where to place the binary (default: /usr/local/bin)
set -eu

REPO="marcfs31/forsight"
INSTALL_DIR="${FORSIGHT_INSTALL_DIR:-/usr/local/bin}"

os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in
  x86_64|amd64) arch="amd64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "forsight: unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

version="${FORSIGHT_VERSION:-}"
if [ -z "$version" ]; then
  version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" \
    | grep -o '"tag_name": *"forsight-v[^"]*"' \
    | head -n1 \
    | sed -E 's/.*"(forsight-v[^"]+)".*/\1/')
  if [ -z "$version" ]; then
    echo "forsight: could not determine the latest release; set FORSIGHT_VERSION explicitly" >&2
    exit 1
  fi
fi

asset="forsight_${os}_${arch}.tar.gz"
url="https://github.com/${REPO}/releases/download/${version}/${asset}"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

echo "forsight: downloading ${version} for ${os}/${arch}..."
curl -fsSL "$url" -o "$tmpdir/$asset"
tar -xzf "$tmpdir/$asset" -C "$tmpdir"

if [ -w "$INSTALL_DIR" ]; then
  mv "$tmpdir/forsight" "$INSTALL_DIR/forsight"
else
  echo "forsight: $INSTALL_DIR isn't writable, retrying with sudo..."
  sudo mv "$tmpdir/forsight" "$INSTALL_DIR/forsight"
fi
chmod +x "$INSTALL_DIR/forsight"
echo "forsight: installed to $INSTALL_DIR/forsight"
"$INSTALL_DIR/forsight" version

# Optional: register a systemd service on Linux when run as root. Anyone who
# doesn't want this can just run "forsight run" directly instead.
if [ "$os" = "linux" ] && [ "$(id -u)" = "0" ] && command -v systemctl >/dev/null 2>&1; then
  cat > /etc/systemd/system/forsight.service <<EOF
[Unit]
Description=forsight observability agent
After=network.target

[Service]
ExecStart=${INSTALL_DIR}/forsight run
Restart=on-failure
MemoryMax=256M

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now forsight
  echo "forsight: installed and started as a systemd service (systemctl status forsight)"
else
  echo "forsight: run '${INSTALL_DIR}/forsight run' to start it"
fi
