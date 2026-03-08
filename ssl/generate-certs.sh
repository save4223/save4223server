#!/bin/bash
# Generate self-signed SSL certificates for local HTTPS deployment
# Usage: ./generate-certs.sh [hostname]

set -e

HOSTNAME=${1:-save4223.local}
CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Generating self-signed SSL certificates..."
echo "Hostname: $HOSTNAME"
echo "Output directory: $CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/server.key" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
    -subj "/C=US/ST=State/L=City/O=Save4223/CN=$HOSTNAME"

# Generate self-signed certificate (valid for 1 year)
openssl x509 -req -days 365 -in "$CERT_DIR/server.csr" \
    -signkey "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" \
    -sha256

# Clean up CSR
rm "$CERT_DIR/server.csr"

# Set appropriate permissions
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"

echo ""
echo "SSL certificates generated successfully!"
echo "  - Certificate: $CERT_DIR/server.crt"
echo "  - Private Key: $CERT_DIR/server.key"
echo ""
echo "To copy certificate to Raspberry Pi:"
echo "  scp $CERT_DIR/server.crt pi@<pi-ip>:/home/pi/save4223/ssl/"
echo ""
echo "To install certificate on Pi (for system-wide trust):"
echo "  sudo cp /home/pi/save4223/ssl/server.crt /usr/local/share/ca-certificates/"
echo "  sudo update-ca-certificates"
