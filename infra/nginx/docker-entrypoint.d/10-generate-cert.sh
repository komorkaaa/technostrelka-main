#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CRT="${CERT_DIR}/server.crt"
KEY="${CERT_DIR}/server.key"

CERT_HOST="${CERT_HOST:-localhost}"
CERT_SANS="${CERT_SANS:-}"

if [ -f "$CRT" ] && [ -f "$KEY" ]; then
  exit 0
fi

mkdir -p "$CERT_DIR"

san="DNS:localhost,IP:127.0.0.1,DNS:${CERT_HOST}"
if [ -n "$CERT_SANS" ]; then
  # CERT_SANS is comma-separated list of extra SAN entries, e.g.
  # CERT_SANS=DNS:myhost.local,IP:192.168.1.10
  san="${san},${CERT_SANS}"
fi

# Self-signed cert for local development.
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -subj "/CN=${CERT_HOST}" \
  -addext "subjectAltName=${san}" \
  -keyout "$KEY" \
  -out "$CRT"
