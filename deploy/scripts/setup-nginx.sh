#!/usr/bin/env bash
# =========================================================================
# TECHZU POS - NGINX REVERSE PROXY & SSL AUTOMATION SCRIPT
# =========================================================================
# Domains:
#   - pos-techzu.codernex.dev     -> 127.0.0.1:3004 (Admin UI)
#   - api-pos-techzu.codernex.dev -> 127.0.0.1:5006 (Backend API)
# =========================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}  STARTING HOST NGINX & SSL AUTOMATION FOR TECHZU POS   ${NC}"
echo -e "${BLUE}========================================================${NC}"

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/pos_techzu}"
NGINX_SRC="$DEPLOY_DIR/deploy/nginx/pos-techzu.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/pos-techzu.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/pos-techzu.conf"
DOMAIN_FRONTEND="pos-techzu.codernex.dev"
DOMAIN_BACKEND="api-pos-techzu.codernex.dev"
SSL_EMAIL="${SSL_EMAIL:-admin@codernex.dev}"

# 1. Verify Nginx is installed on the host
if ! command -v nginx >/dev/null 2>&1; then
  echo -e "${YELLOW}[!] Nginx not found on host. Attempting installation via apt...${NC}"
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y && apt-get install -y nginx
  else
    echo -e "${RED}[ERROR] Nginx is not installed and apt-get is not available. Please install Nginx.${NC}"
    exit 1
  fi
fi

# 2. Verify source config exists
if [ ! -f "$NGINX_SRC" ]; then
  echo -e "${RED}[ERROR] Source configuration file not found at: $NGINX_SRC${NC}"
  exit 1
fi

# 3. Deploy Nginx site configuration
echo -e "${BLUE}[*] Deploying site configuration to $NGINX_AVAILABLE...${NC}"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp "$NGINX_SRC" "$NGINX_AVAILABLE"

# 4. Enable site if not already enabled
if [ ! -L "$NGINX_ENABLED" ]; then
  echo -e "${BLUE}[*] Creating symlink in /etc/nginx/sites-enabled/...${NC}"
  ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
fi

# 5. Validate initial Nginx configuration
echo -e "${BLUE}[*] Testing Nginx syntax...${NC}"
if ! nginx -t; then
  echo -e "${RED}[ERROR] Nginx syntax check failed. Reverting changes...${NC}"
  rm -f "$NGINX_ENABLED"
  systemctl reload nginx || true
  exit 1
fi
echo -e "${GREEN}[✓] Nginx syntax is valid.${NC}"

# 6. Automate Let's Encrypt SSL with Certbot
if command -v certbot >/dev/null 2>&1; then
  echo -e "${BLUE}[*] Certbot found. Configuring Let's Encrypt SSL certificates...${NC}"
  
  # Check if email is valid or register unsafely
  CERTBOT_EMAIL_FLAG="--email $SSL_EMAIL"
  if [ -z "$SSL_EMAIL" ] || [ "$SSL_EMAIL" = "admin@codernex.dev" ]; then
    CERTBOT_EMAIL_FLAG="--register-unsafely-without-email"
  fi

  echo -e "${BLUE}[*] Running Certbot for $DOMAIN_FRONTEND and $DOMAIN_BACKEND...${NC}"
  if certbot --nginx \
    -d "$DOMAIN_FRONTEND" \
    -d "$DOMAIN_BACKEND" \
    --non-interactive \
    --agree-tos \
    $CERTBOT_EMAIL_FLAG \
    --keep-until-expiring \
    --redirect; then
    echo -e "${GREEN}[✓] SSL certificates successfully configured & HTTPS redirection enabled!${NC}"
  else
    echo -e "${YELLOW}[WARNING] Certbot was unable to provision certificates.${NC}"
    echo -e "${YELLOW}Ensure DNS A-records for $DOMAIN_FRONTEND and $DOMAIN_BACKEND point to this Droplet's IP.${NC}"
    echo -e "${YELLOW}Continuing with HTTP on port 80...${NC}"
  fi
else
  echo -e "${YELLOW}[!] Certbot is not installed. To enable free automatic HTTPS:${NC}"
  echo -e "${YELLOW}    apt-get update && apt-get install -y certbot python3-certbot-nginx${NC}"
  echo -e "${YELLOW}    certbot --nginx -d $DOMAIN_FRONTEND -d $DOMAIN_BACKEND${NC}"
fi

# 7. Final Nginx reload
echo -e "${BLUE}[*] Reloading Nginx service...${NC}"
nginx -t && systemctl reload nginx
echo -e "${GREEN}[✓] Nginx successfully reloaded!${NC}"
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}  NGINX REVERSE PROXY CONFIGURED SUCCESSFULLY           ${NC}"
echo -e "${GREEN}  Frontend: http(s)://$DOMAIN_FRONTEND                  ${NC}"
echo -e "${GREEN}  Backend:  http(s)://$DOMAIN_BACKEND/health            ${NC}"
echo -e "${GREEN}========================================================${NC}"

