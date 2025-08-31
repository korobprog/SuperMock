#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================================
# SuperMock Multi-Domain Production Deploy Script v3.0
# ============================================================================
# Enhanced deployment script for multi-domain architecture with Traefik
# Usage: 
#   SERVER=217.198.6.238 DEST=/opt/mockmate bash scripts/deploy-quick.sh
#   bash scripts/deploy-quick.sh --help

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER="${SERVER:-217.198.6.238}"
USER_="${USER_:-root}"
DEST="${DEST:-/opt/mockmate}"
COMPOSE_FILE="${COMPOSE_FILE:-traefik-multi.yml}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/timeweb_vps_key}"
LOG_FILE="${LOG_FILE:-deploy-$(date +%Y%m%d-%H%M%S).log}"
TIMEOUT="${TIMEOUT:-300}"
RETRY_COUNT="${RETRY_COUNT:-3}"

# Multi-domain configuration
LANDING_DOMAIN="${LANDING_DOMAIN:-supermock.ru}"
APP_DOMAIN="${APP_DOMAIN:-app.supermock.ru}"
API_DOMAIN="${API_DOMAIN:-api.supermock.ru}"
TRAEFIK_DASHBOARD_DOMAIN="${TRAEFIK_DASHBOARD_DOMAIN:-traefik.supermock.ru}"

# Enhanced helper functions
print() { printf "%s\n" "$*"; }
step() { printf "\n${BLUE}==== %s ====${NC}\n" "$*"; }
success() { printf "${GREEN}✅ %s${NC}\n" "$*"; }
error() { printf "${RED}❌ %s${NC}\n" "$*"; }
warning() { printf "${YELLOW}⚠️  %s${NC}\n" "$*"; }
info() { printf "${CYAN}ℹ️  %s${NC}\n" "$*"; }

# Logging and error handling
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cleanup() {
    if [[ $? -ne 0 ]]; then
        error "Script failed! Check log file: $LOG_FILE"
        warning "Last 10 lines of log:"
        tail -10 "$LOG_FILE" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Environment validation function
validate_environment() {
    info "Ensuring environment variables are up to date..."
    if [[ -f "production.env" ]]; then
        scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no production.env "${USER_}@${SERVER}:${DEST}/.env" 2>/dev/null
        success "Environment variables synchronized"
    else
        warning "production.env file not found locally"
    fi
}

# Validation functions
validate_ssh_key() {
    if [[ ! -f "$SSH_KEY" ]]; then
        error "SSH key not found: $SSH_KEY"
        info "Create SSH key with: ssh-keygen -t rsa -b 2048 -f $SSH_KEY"
        info "Or set SSH_KEY environment variable to your key path"
        exit 1
    fi
    
    if [[ "$(stat -c %a "$SSH_KEY" 2>/dev/null || stat -f %A "$SSH_KEY" 2>/dev/null)" != "600" ]]; then
        warning "SSH key permissions are not secure. Fixing..."
        chmod 600 "$SSH_KEY"
        success "SSH key permissions fixed"
    fi
}

validate_connection() {
    info "Testing SSH connection to ${USER_}@${SERVER}..."
    if ! ssh -i "${SSH_KEY}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${USER_}@${SERVER}" "echo 'Connection OK'" >/dev/null 2>&1; then
        error "Cannot connect to ${USER_}@${SERVER}"
        error "Check if:"
        error "  1. Server is running and accessible"
        error "  2. SSH key is correct and has proper permissions"
        error "  3. User has access to the server"
        exit 1
    fi
    success "SSH connection validated"
}

# Enhanced sync function for multi-domain
enhanced_sync() {
    local description="${1:-Full sync}"
    step "$description"
    
    info "Syncing from $(pwd) to ${USER_}@${SERVER}:${DEST}"
    
    rsync -az \
        --delete \
        --progress \
        --human-readable \
        --exclude='.git' \
        --exclude='.github' \
        --exclude='.pnpm-store' \
        --exclude='**/node_modules' \
        --exclude='**/.next' \
        --exclude='**/dist' \
        --exclude='*.log' \
        --exclude='.env.local' \
        -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
        ./ "${USER_}@${SERVER}:${DEST}/" 2>&1 | tee -a "$LOG_FILE"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        success "Sync completed successfully"
        return 0
    else
        error "Sync failed"
        return 1
    fi
}

# Enhanced remote execution with retry and timeout
run_remote() {
    local cmd="$1"
    local description="${2:-Remote command}"
    local retries="${3:-$RETRY_COUNT}"
    
    log "$description: $cmd"
    
    for ((i=1; i<=retries; i++)); do
        if [[ $i -gt 1 ]]; then
            info "Executing: $description (attempt $i/$retries)"
        fi
        
        if timeout "$TIMEOUT" ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${USER_}@${SERVER}" "bash -c \"cd '${DEST}' && $cmd\"" 2>&1 | tee -a "$LOG_FILE"; then
            success "$description completed"
            return 0
        else
            local exit_code=$?
            if [[ $i -eq $retries ]]; then
                error "$description failed after $retries attempts (exit code: $exit_code)"
                return $exit_code
            else
                warning "$description failed (attempt $i/$retries), retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
}

# Multi-domain health checks
check_service_health() {
    local service="$1"
    local url="$2"
    local expected="${3:-200}"
    
    info "Checking $service health..."
    
    local http_code
    http_code=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 --max-time 30 -k "$url" 2>/dev/null || echo "000")
    
    if [[ "$http_code" == "$expected" ]]; then
        success "$service is healthy (HTTP $http_code)"
        return 0
    else
        warning "$service health check failed (HTTP $http_code)"
        return 1
    fi
}

# Deploy functions for multi-domain
deploy_full() {
    step "🚀 Full Multi-Domain Application Deployment"
    enhanced_sync "Full application sync"
    
    # Убеждаемся, что PostgreSQL запущен
    run_remote "cd '${DEST}' && docker compose -f '${COMPOSE_FILE}' up -d postgres" "Ensuring PostgreSQL is running" 1
    
    # Ждем немного для запуска PostgreSQL
    sleep 5
    
    # Создаем сеть если нужно
    run_remote "cd '${DEST}' && \
        echo '-- Creating supermock-network if needed --' && \
        docker network inspect supermock-network >/dev/null 2>&1 || docker network create supermock-network" "Creating network"
    
    # Полный деплой multi-domain архитектуры
    run_remote "cd '${DEST}' && \
        echo '-- Building all services --' && \
        docker compose -f '${COMPOSE_FILE}' build --pull && \
        echo '-- Starting all services --' && \
        docker compose -f '${COMPOSE_FILE}' up -d && \
        echo '-- Waiting for services to be healthy --' && \
        sleep 20" "Multi-domain deployment"
    
    comprehensive_health_check
}

deploy_backend() {
    step "🔧 Backend API Deployment"
    enhanced_sync "Backend sync"
    
    # Убеждаемся, что PostgreSQL запущен
    run_remote "cd '${DEST}' && docker compose -f '${COMPOSE_FILE}' up -d postgres" "Ensuring PostgreSQL is running" 1
    sleep 5
    
    run_remote "cd '${DEST}' && \
        docker compose -f '${COMPOSE_FILE}' build --pull backend && \
        docker compose -f '${COMPOSE_FILE}' up -d --no-deps backend && \
        echo 'Waiting for backend to start...' && \
        sleep 10" "Backend build and deploy"
    
    check_service_health "Backend API" "https://$API_DOMAIN/api/health"
}

deploy_frontend_app() {
    step "🎨 Frontend App Deployment (app.supermock.ru)"
    enhanced_sync "Frontend app sync"
    
    # Убеждаемся что backend работает
    info "Checking backend dependency..."
    if ! run_remote "cd '${DEST}' && docker exec supermock-backend sh -lc 'wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1'" "Backend availability check" 1; then
        warning "Backend not responding, starting it first..."
        run_remote "cd '${DEST}' && docker compose -f '${COMPOSE_FILE}' up -d backend && sleep 10" "Starting backend"
    fi
    
    # Убеждаемся что .env файл синхронизирован перед сборкой
    info "Ensuring .env is current before build..."
    if [[ -f "production.env" ]]; then
        scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no production.env "${USER_}@${SERVER}:${DEST}/.env" 2>/dev/null
    fi
    
    run_remote "cd '${DEST}' && \
        docker compose -f '${COMPOSE_FILE}' build --no-cache frontend-app && \
        docker compose -f '${COMPOSE_FILE}' up -d --no-deps frontend-app && \
        echo 'Waiting for frontend-app to be ready...' && \
        sleep 10" "Frontend app build and deploy"
    
    check_service_health "Frontend App" "https://$APP_DOMAIN"
}

deploy_frontend_landing() {
    step "🏠 Landing Page Deployment (supermock.ru)"
    enhanced_sync "Frontend landing sync"
    
    run_remote "cd '${DEST}' && \
        docker compose -f '${COMPOSE_FILE}' build --no-cache frontend-landing && \
        docker compose -f '${COMPOSE_FILE}' up -d --no-deps frontend-landing && \
        echo 'Waiting for frontend-landing to be ready...' && \
        sleep 10" "Frontend landing build and deploy"
    
    check_service_health "Landing Page" "https://$LANDING_DOMAIN"
}

deploy_traefik() {
    step "🌐 Traefik Deployment"
    enhanced_sync "Traefik sync"
    
    run_remote "cd '${DEST}' && \
        docker compose -f '${COMPOSE_FILE}' up -d --no-deps traefik && \
        echo 'Waiting for Traefik to be ready...' && \
        sleep 10" "Traefik deployment"
    
    check_service_health "Traefik Dashboard" "http://$SERVER:8081"
}

comprehensive_health_check() {
    step "🏥 Multi-Domain Health Check"
    
    # Container status
    info "Checking container status..."
    run_remote "docker compose -f '${COMPOSE_FILE}' ps --format table" "Container status"
    
    # Internal health checks
    info "Internal service health checks..."
    run_remote "\
        echo '-- Backend internal health --' && \
        docker exec supermock-backend sh -lc 'wget -qO- http://127.0.0.1:3000/api/health' 2>/dev/null && echo 'Backend internal OK' || echo 'Backend internal FAIL' && \
        echo '-- Frontend-app internal health --' && \
        docker exec supermock-frontend-app sh -lc 'wget -qO- http://127.0.0.1:8080/health' 2>/dev/null && echo 'Frontend-app internal OK' || echo 'Frontend-app internal FAIL' && \
        echo '-- Frontend-landing internal health --' && \
        docker exec supermock-frontend-landing sh -lc 'wget -qO- http://127.0.0.1:80/health' 2>/dev/null && echo 'Frontend-landing internal OK' || echo 'Frontend-landing internal FAIL'" "Internal health checks"
    
    # External health checks for all domains
    info "External health checks..."
    
    if check_service_health "Landing Page" "https://$LANDING_DOMAIN"; then
        success "Landing page externally accessible"
    else
        error "Landing page not accessible externally"
    fi
    
    if check_service_health "Frontend App" "https://$APP_DOMAIN"; then
        success "Frontend app externally accessible"
    else
        error "Frontend app not accessible externally"
    fi
    
    if check_service_health "Backend API" "https://$API_DOMAIN/api/health"; then
        success "Backend API externally accessible"
    else
        error "Backend API not accessible externally"
    fi
    
    if check_service_health "Traefik Dashboard" "http://$SERVER:8081"; then
        success "Traefik dashboard accessible"
    else
        error "Traefik dashboard not accessible"
    fi
    
    success "Multi-domain health check completed"
}

show_environment() {
    step "🔑 Environment Variables"
    
    run_remote "cd '${DEST}' && \
        echo '-- Environment file status --' && \
        ls -la .env* 2>/dev/null || echo 'No .env files found' && \
        echo '-- Key environment variables --' && \
        [ -f .env ] && grep -E '^(TELEGRAM_BOT_TOKEN|VITE_TELEGRAM_BOT_NAME|VITE_TELEGRAM_BOT_ID|FRONTEND_URL|BACKEND_URL|VITE_API_URL|ENABLE_DEMO_MODE)=' .env | sed 's/=.*/=***/' || echo 'No .env file'" "Environment check"
}

full_diagnostic() {
    step "🔍 Full Multi-Domain System Diagnostic"
    
    run_remote "cd '${DEST}' && \
        echo '=== SYSTEM INFO ===' && \
        echo '-- OS Info --' && uname -a && \
        echo '-- Docker Version --' && docker --version && docker compose version && \
        echo '-- Available Space --' && df -h && \
        echo '-- Memory Usage --' && free -h && \
        echo '-- System Load --' && uptime && \
        echo && echo '=== DOCKER STATUS ===' && \
        echo '-- All Containers --' && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' && \
        echo '-- Docker Compose Status --' && docker compose -f '${COMPOSE_FILE}' ps && \
        echo '-- Docker Networks --' && docker network ls && \
        echo && echo '=== SERVICE LOGS ===' && \
        echo '-- Backend Logs (last 15 lines) --' && docker logs supermock-backend --tail=15 2>&1 && \
        echo '-- Frontend-App Logs (last 15 lines) --' && docker logs supermock-frontend-app --tail=15 2>&1 && \
        echo '-- Frontend-Landing Logs (last 15 lines) --' && docker logs supermock-frontend-landing --tail=15 2>&1 && \
        echo '-- Traefik Logs (last 15 lines) --' && docker logs supermock-traefik --tail=15 2>&1 && \
        echo && echo '=== NETWORK STATUS ===' && \
        echo '-- Open Ports --' && ss -tlnp | grep -E ':(80|443|3000|8081)' && \
        echo '-- Supermock Network Inspect --' && docker network inspect supermock-network | grep -A3 -B3 supermock || echo 'No supermock containers in network' && \
        echo && echo '=== DOMAIN STATUS ===' && \
        echo '-- DNS Resolution --' && \
        for domain in $LANDING_DOMAIN $APP_DOMAIN $API_DOMAIN; do \
            echo \"\$domain: \$(dig +short \$domain | head -1 || echo 'DNS resolution failed')\"; \
        done && \
        echo && echo '=== END DIAGNOSTIC ==='" "Full diagnostic"
}

quick_restart() {
    step "🔄 Quick Multi-Domain Service Restart"
    
    run_remote "cd '${DEST}' && \
        echo '-- Restarting all services --' && \
        docker compose -f '${COMPOSE_FILE}' restart && \
        echo '-- Waiting for services to stabilize --' && \
        sleep 15 && \
        docker compose -f '${COMPOSE_FILE}' ps" "Quick restart"
}

# Функция для восстановления базы данных
fix_database() {
    step "🔧 Database Recovery"
    
    warning "This will recreate the database and lose all data!"
    printf "${YELLOW}Are you sure? [y/N]:${NC} "
    read -r confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        run_remote "cd '${DEST}' && \
            echo '-- Stopping services --' && \
            docker compose -f '${COMPOSE_FILE}' down && \
            echo '-- Removing database volume --' && \
            docker volume rm mockmate_postgres_data || true && \
            echo '-- Starting database --' && \
            docker compose -f '${COMPOSE_FILE}' up -d postgres && \
            echo '-- Waiting for PostgreSQL --' && \
            sleep 15 && \
            echo '-- Starting backend --' && \
            docker compose -f '${COMPOSE_FILE}' up -d backend && \
            echo '-- Creating schema --' && \
            docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma db push --accept-data-loss && \
            echo '-- Starting all services --' && \
            docker compose -f '${COMPOSE_FILE}' up -d" "Database recovery"
        
        success "Database recovery completed"
        comprehensive_health_check
    else
        info "Database recovery cancelled"
    fi
}

# SSL certificate management
manage_ssl() {
    step "🔒 SSL Certificate Management"
    
    print "SSL Certificate Options:"
    print "  1) Check current certificates"
    print "  2) Generate self-signed certificates"
    print "  3) Setup Let's Encrypt certificates"
    printf "\n${YELLOW}Choice [1-3]:${NC} "
    read -r ssl_choice
    
    case "${ssl_choice}" in
        1)
            run_remote "cd '${DEST}' && \
                echo '-- Checking SSL certificates --' && \
                ls -la nginx/ssl/live/*/ 2>/dev/null || echo 'No SSL certificates found' && \
                echo '-- Traefik certificates --' && \
                docker exec supermock-traefik ls -la /letsencrypt/ 2>/dev/null || echo 'No Traefik certificates found'" "SSL certificate check"
            ;;
        2)
            run_remote "cd '${DEST}' && \
                echo '-- Generating self-signed certificates --' && \
                mkdir -p nginx/ssl/live/{$LANDING_DOMAIN,$APP_DOMAIN,$API_DOMAIN} && \
                for domain in $LANDING_DOMAIN $APP_DOMAIN $API_DOMAIN; do \
                    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                        -keyout nginx/ssl/live/\$domain/privkey.pem \
                        -out nginx/ssl/live/\$domain/fullchain.pem \
                        -subj \"/CN=\$domain\"; \
                done && \
                echo 'Self-signed certificates generated'" "Self-signed certificate generation"
            ;;
        3)
            info "Let's Encrypt certificates are automatically managed by Traefik"
            info "Make sure your domains point to this server and run:"
            info "  docker compose -f traefik-multi.yml up -d"
            ;;
        *)
            error "Invalid choice"
            ;;
    esac
}

# Pre-flight checks and main execution
info "Starting SuperMock Multi-Domain Deploy Script v3.0"
log "Deploy started by $(whoami) at $(date)"
validate_ssh_key
validate_connection
validate_environment

# Check for non-interactive mode
if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
    choice="$1"
    case "${choice}" in
      1) deploy_full; exit 0 ;;
      2) deploy_backend; exit 0 ;;
      3) deploy_frontend_app; exit 0 ;;
      4) deploy_frontend_landing; exit 0 ;;
      5) deploy_traefik; exit 0 ;;
      6) 
        step "📊 Database Update"
        run_remote "cd '${DEST}' && \
            echo '-- Running Prisma migrations --' && \
            (docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma migrate deploy || \
             docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma db push) && \
            echo '-- Generating Prisma client --' && \
            docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma generate" "Database migration"
        exit 0 ;;
      7) comprehensive_health_check; exit 0 ;;
      8) show_environment; exit 0 ;;
      9) full_diagnostic; exit 0 ;;
      10) quick_restart; exit 0 ;;
      11) fix_database; exit 0 ;;
      12) manage_ssl; exit 0 ;;
      0) exit 0 ;;
      *) error "Invalid choice: $choice"; exit 1 ;;
    esac
fi

# Main loop
while true; do
    step "🚀 SuperMock Multi-Domain Deploy Console"
    print "${PURPLE}Deploy target:${NC} ${USER_}@${SERVER}:${DEST}"
    print "${PURPLE}SSH Key:${NC} ${SSH_KEY}"
    print "${PURPLE}Log File:${NC} ${LOG_FILE}"
    print "${PURPLE}Compose File:${NC} ${COMPOSE_FILE}"
    print ""
    print "Select deployment action:"
    print "  ${GREEN}1)${NC} 🚀 Full Deploy (All services + Multi-domain)"
    print "  ${GREEN}2)${NC} 🔧 Backend API only (api.supermock.ru)"
    print "  ${GREEN}3)${NC} 🎨 Frontend App only (app.supermock.ru)"
    print "  ${GREEN}4)${NC} 🏠 Landing Page only (supermock.ru)"
    print "  ${GREEN}5)${NC} 🌐 Traefik only (Reverse proxy)"
    print "  ${GREEN}6)${NC} 📊 Database update (Prisma migrate)"
    print "  ${GREEN}7)${NC} ❤️  Health check (all domains)"
    print "  ${GREEN}8)${NC} 🔑 Show environment variables"
    print "  ${GREEN}9)${NC} 🔍 Full diagnostic (logs + status)"
    print "  ${GREEN}10)${NC} 🔄 Quick restart all services"
    print "  ${YELLOW}11)${NC} 🔧 Fix database (recreate with schema)"
    print "  ${YELLOW}12)${NC} 🔒 SSL certificate management"
    print "  ${RED}0)${NC} 🚪 Exit"
    printf "\n${YELLOW}Choice [1-12, 0]:${NC} "
    read -r choice

case "${choice}" in
  1) deploy_full
    ;;
  2) deploy_backend
    ;;
  3) deploy_frontend_app
    ;;
  4) deploy_frontend_landing
    ;;
  5) deploy_traefik
    ;;
  6) 
    step "📊 Database Update"
    run_remote "cd '${DEST}' && \
        echo '-- Running Prisma migrations --' && \
        (docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma migrate deploy || \
         docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma db push) && \
        echo '-- Generating Prisma client --' && \
        docker compose -f '${COMPOSE_FILE}' exec -T backend pnpm exec prisma generate" "Database migration"
    ;;
  7) comprehensive_health_check
    ;;
  8) show_environment
    ;;
  9) full_diagnostic
    ;;
  10) quick_restart
    ;;
  11) fix_database
    ;;
  12) manage_ssl
    ;;
  0) 
    success "Goodbye! 👋"
    log "Deploy script completed successfully"
    exit 0 
    ;;
  *) 
    error "Invalid choice: $choice"
    warning "Please select a number between 0-12"
    ;;
esac

print "\n${CYAN}Press Enter to continue...${NC}"
read -r
done


