#!/bin/sh
# Installs the botobs binary for this machine's OS/arch and (on Linux, when
# run as root) sets it up as a systemd service. Usage:
#
#   curl -fsSL https://raw.githubusercontent.com/marcfs31/fors-observability-design-system/main/botobs/install.sh | sh
#
# Honors:
#   BOTOBS_VERSION   release tag to install, e.g. "botobs-v0.1.0" (default: latest)
#   BOTOBS_INSTALL_DIR   where to place the binary (default: /usr/local/bin)
set -eu

REPO="marcfs31/fors-observability-design-system"
INSTALL_DIR="${BOTOBS_INSTALL_DIR:-/usr/local/bin}"

os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in
  x86_64|amd64) arch="amd64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "botobs: unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

version="${BOTOBS_VERSION:-}"
if [ -z "$version" ]; then
  version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" \
    | grep -o '"tag_name": *"botobs-v[^"]*"' \
    | head -n1 \
    | sed -E 's/.*"(botobs-v[^"]+)".*/\1/')
  if [ -z "$version" ]; then
    echo "botobs: could not determine the latest release; set BOTOBS_VERSION explicitly" >&2
    exit 1
  fi
fi

asset="botobs_${os}_${arch}.tar.gz"
url="https://github.com/${REPO}/releases/download/${version}/${asset}"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

echo "botobs: downloading ${version} for ${os}/${arch}..."
curl -fsSL "$url" -o "$tmpdir/$asset"
tar -xzf "$tmpdir/$asset" -C "$tmpdir"

if [ -w "$INSTALL_DIR" ]; then
  mv "$tmpdir/botobs" "$INSTALL_DIR/botobs"
else
  echo "botobs: $INSTALL_DIR isn't writable, retrying with sudo..."
  sudo mv "$tmpdir/botobs" "$INSTALL_DIR/botobs"
fi
chmod +x "$INSTALL_DIR/botobs"
echo "botobs: installed to $INSTALL_DIR/botobs"
"$INSTALL_DIR/botobs" version

# Optional: register a systemd service on Linux when run as root. Anyone who
# doesn't want this can just run "botobs run" directly instead.
if [ "$os" = "linux" ] && [ "$(id -u)" = "0" ] && command -v systemctl >/dev/null 2>&1; then
  cat > /etc/systemd/system/botobs.service <<EOF
[Unit]
Description=botobs observability agent
After=network.target

[Service]
ExecStart=${INSTALL_DIR}/botobs run
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now botobs
  echo "botobs: installed and started as a systemd service (systemctl status botobs)"
else
  echo "botobs: run '${INSTALL_DIR}/botobs run' to start it"
fi
