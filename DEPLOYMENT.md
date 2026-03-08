# Local Server Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- A domain name or local hostname (e.g., `save4223.local`)
- Static IP or mDNS configured for the server

## Deployment Steps

### 1. Generate SSL Certificates

```bash
cd ssl
./generate-certs.sh save4223.local
cd ..
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

### 3. Build and Start Services

```bash
docker-compose up -d
```

### 4. Verify Deployment

```bash
# Check containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Test health endpoint
curl -k https://localhost:8443/api/health
```

### 5. Copy Certificate to Raspberry Pi

```bash
# On the Pi, create SSL directory
ssh pi@<pi-ip> "mkdir -p /home/pi/cabinet/ssl"

# Copy certificate
scp ssl/server.crt pi@<pi-ip>:/home/pi/cabinet/ssl/

# Install certificate for system-wide trust (optional but recommended)
ssh pi@<pi-ip> "sudo cp /home/pi/cabinet/ssl/server.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
```

### 6. Configure Pi

Update `/home/pi/cabinet/config.json`:

```json
{
  "server_url": "https://save4223.local:8443",
  "edge_secret": "edge_device_secret_key",
  "cabinet_id": 1,
  "db_path": "/home/pi/cabinet/data/local.db",
  "ssl": {
    "verify": true,
    "cert_path": "/home/pi/cabinet/ssl/server.crt"
  }
}
```

## Ports

- `443` - Web UI (HTTPS)
- `8443` - Edge Device API (HTTPS)
- `3000` - Next.js app (internal, via Docker network)

## Troubleshooting

### SSL Certificate Issues

If the Pi cannot verify the certificate:

1. Check certificate path in config
2. Ensure certificate is readable by Pi user
3. For testing only, set `"verify": false` in config (not recommended for production)

### Connection Refused

1. Check firewall rules: `sudo ufw allow 8443/tcp`
2. Verify Docker containers are running: `docker-compose ps`
3. Check nginx logs: `docker-compose logs nginx`

### Database Connection Issues

1. Verify Supabase credentials in `.env.production`
2. Check Supabase project status
3. Verify network connectivity

## Maintenance

### Update SSL Certificate

Certificates expire after 365 days. To renew:

```bash
cd ssl
rm server.crt server.key
./generate-certs.sh save4223.local
cd ..
docker-compose restart nginx

# Copy new cert to Pi and restart
scp ssl/server.crt pi@<pi-ip>:/home/pi/cabinet/ssl/
ssh pi@<pi-ip> "sudo systemctl restart cabinet"
```

### Update Application

```bash
git pull
docker-compose build app
docker-compose up -d
```

## Security Notes

1. Keep `EDGE_API_SECRET` secure and unique per deployment
2. Use strong firewall rules
3. Regularly update Docker images
4. Monitor logs for unauthorized access attempts
