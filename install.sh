#!/bin/sh
# Installs the universal-downloader CLI (udl) and its engine (udl-engine).
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/wuguishifu/universal-downloader/main/install.sh | sh
#
# Env vars:
#   UDL_VERSION      release tag to install (default: latest)
#   UDL_INSTALL_DIR  install directory (default: $HOME/.local/bin)
#
# udl and udl-engine are installed side by side in the same directory; the
# cli finds the engine relative to its own path, so only the install
# directory needs to be on PATH.

set -e

REPO="wuguishifu/universal-downloader"
CLI_BIN="udl"
ENGINE_BIN="udl-engine"
INSTALL_DIR="${UDL_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${UDL_VERSION:-latest}"

detect_platform() {
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Darwin) platform="macos" ;;
    Linux) platform="linux" ;;
    *)
      echo "Error: unsupported OS: $os" >&2
      echo "udl currently only supports macOS and Linux." >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x86_64 | amd64) arch="x64" ;;
    arm64 | aarch64) arch="arm64" ;;
    *)
      echo "Error: unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  asset="universal-downloader-${platform}-${arch}.tar.gz"
}

download_url() {
  if [ "$VERSION" = "latest" ]; then
    echo "https://github.com/${REPO}/releases/latest/download/${asset}"
  else
    echo "https://github.com/${REPO}/releases/download/${VERSION}/${asset}"
  fi
}

# Only ever prints instructions - never edits shell config on its own, so
# it doesn't touch files the user maintains themselves.
check_path() {
  case ":$PATH:" in
    *":$INSTALL_DIR:"*)
      return
      ;;
  esac

  shell_name="$(basename "${SHELL:-sh}")"

  case "$shell_name" in
    fish)
      profile="~/.config/fish/config.fish"
      line="set -gx PATH \"$INSTALL_DIR\" \$PATH"
      ;;
    zsh)
      profile="~/.zshrc"
      line="export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
    bash)
      if [ "$(uname -s)" = "Darwin" ]; then
        profile="~/.bash_profile"
      else
        profile="~/.bashrc"
      fi
      line="export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
    *)
      profile="~/.profile"
      line="export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
  esac

  echo ""
  echo "$INSTALL_DIR is not on your PATH."
  echo "Add it yourself by putting this line in $profile:"
  echo ""
  echo "  $line"
  echo ""
  echo "then restart your shell (or source $profile)."
}

main() {
  detect_platform
  url="$(download_url)"

  echo "Installing udl (universal-downloader) for ${platform}-${arch}..."
  echo "Downloading ${url}"

  mkdir -p "$INSTALL_DIR"
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  tmp_archive="$tmp_dir/archive.tar.gz"
  if ! curl -fsSL "$url" -o "$tmp_archive"; then
    echo "Error: failed to download release archive from $url" >&2
    exit 1
  fi

  tar -xzf "$tmp_archive" -C "$tmp_dir"

  for bin in "$CLI_BIN" "$ENGINE_BIN"; do
    if [ ! -f "$tmp_dir/$bin" ]; then
      echo "Error: $bin missing from downloaded archive" >&2
      exit 1
    fi
  done

  chmod +x "$tmp_dir/$CLI_BIN" "$tmp_dir/$ENGINE_BIN"
  mv "$tmp_dir/$CLI_BIN" "$INSTALL_DIR/$CLI_BIN"
  mv "$tmp_dir/$ENGINE_BIN" "$INSTALL_DIR/$ENGINE_BIN"

  echo "Installed $CLI_BIN and $ENGINE_BIN to $INSTALL_DIR"

  check_path
}

main
