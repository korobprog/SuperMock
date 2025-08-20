# Interactive deployment script for Super Mock
# Allows to choose what to update through menu

# Function to show menu
function Show-Menu {
    Clear-Host
    Write-Host "Interactive Super Mock Deployment" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Choose action:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1) Deploy frontend only"
    Write-Host "2) Deploy backend only"
    Write-Host "3) Deploy frontend and backend"
    Write-Host "4) Check server status"
    Write-Host "5) Show container logs"
    Write-Host "6) Clean old containers/images"
    Write-Host "7) Check site availability"
    Write-Host "8) Show documentation"
    Write-Host "0) Exit"
    Write-Host ""
}

# Function to check server connection
function Test-ServerConnection {
    Write-Host "Checking server connection..." -ForegroundColor Yellow
    try {
        $result = ssh dokploy-server "echo 'Server available'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Server available" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Server unavailable" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Server unavailable" -ForegroundColor Red
        return $false
    }
}

# Function to deploy frontend
function Deploy-Frontend {
    Write-Host "Deploying frontend..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    bash scripts/deploy/deploy-frontend.sh
}

# Function to deploy backend
function Deploy-Backend {
    Write-Host "Deploying backend..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    bash scripts/deploy/deploy-backend.sh
}

# Function to deploy all
function Deploy-All {
    Write-Host "Full deployment..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    bash scripts/deploy/deploy-all.sh
}

# Function to check server status
function Get-ServerStatus {
    Write-Host "Checking server status..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    ssh dokploy-server "echo '=== CONTAINERS ==='; docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E '(mockmate|traefik)' || echo 'No mockmate containers'; echo ''; echo '=== IMAGES ==='; docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | grep -E '(mockmate|traefik)' || echo 'No mockmate images'; echo ''; echo '=== DISK ==='; df -h /opt/mockmate"
}

# Function to show logs
function Show-Logs {
    Write-Host "Show container logs..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    Write-Host "Choose container to view logs:" -ForegroundColor Yellow
    Write-Host "1) mockmate-frontend"
    Write-Host "2) mockmate-backend"
    Write-Host "3) All containers"
    Write-Host "0) Back"
    
    $logChoice = Read-Host "Choose (0-3)"
    
    switch ($logChoice) {
        "1" { ssh dokploy-server "docker logs --tail=50 mockmate-frontend" }
        "2" { ssh dokploy-server "docker logs --tail=50 mockmate-backend" }
        "3" { ssh dokploy-server "docker logs --tail=20 mockmate-frontend; echo '---'; docker logs --tail=20 mockmate-backend" }
        "0" { return }
        default { Write-Host "Invalid choice" -ForegroundColor Red }
    }
}

# Function to clean containers
function Clear-Containers {
    Write-Host "Cleaning old containers/images..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    Write-Host "WARNING: This will delete all stopped containers and unused images!" -ForegroundColor Red
    $confirm = Read-Host "Continue? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        ssh dokploy-server "echo 'Stopping containers...'; docker stop mockmate-frontend mockmate-backend 2>/dev/null || true; echo 'Removing containers...'; docker rm mockmate-frontend mockmate-backend 2>/dev/null || true; echo 'Removing images...'; docker rmi mockmate-frontend mockmate-backend 2>/dev/null || true; echo 'Cleaning unused resources...'; docker system prune -f; echo 'Done!'"
    } else {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
    }
}

# Function to check site availability
function Test-SiteAvailability {
    Write-Host "Checking site availability..." -ForegroundColor Blue
    if (-not (Test-ServerConnection)) {
        return
    }
    
    ssh dokploy-server "echo 'Checking HTTP status...'; curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' https://mockmate.primary.studio || echo 'Site unavailable'; echo ''; echo 'Checking containers...'; docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep mockmate || echo 'Containers not running'"
}

# Function to show documentation
function Show-Documentation {
    Write-Host "Deployment documentation:" -ForegroundColor Blue
    Write-Host ""
    Write-Host "=== DEPLOYMENT COMMANDS ===" -ForegroundColor Yellow
    Write-Host "• pnpm run deploy-frontend - Deploy frontend only"
    Write-Host "• pnpm run deploy-backend - Deploy backend only"
    Write-Host "• pnpm run deploy-interactive - Interactive deployment"
    Write-Host ""
    Write-Host "=== SCRIPTS ===" -ForegroundColor Yellow
    Write-Host "• scripts/deploy/deploy-frontend.sh - Frontend deployment script"
    Write-Host "• scripts/deploy/deploy-backend.sh - Backend deployment script"
    Write-Host "• scripts/deploy/deploy-all.sh - Full deployment script"
    Write-Host ""
    Write-Host "=== SERVER ===" -ForegroundColor Yellow
    Write-Host "• IP: 217.198.6.238"
    Write-Host "• User: root"
    Write-Host "• SSH key: ~/.ssh/timeweb_vps_key"
    Write-Host ""
    Write-Host "=== CONTAINERS ===" -ForegroundColor Yellow
    Write-Host "• mockmate-frontend - Frontend application"
    Write-Host "• mockmate-backend - Backend application"
    Write-Host "• traefik - Reverse proxy"
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Choose action (0-8)"
    
    switch ($choice) {
        "1" { Deploy-Frontend }
        "2" { Deploy-Backend }
        "3" { Deploy-All }
        "4" { Get-ServerStatus }
        "5" { Show-Logs }
        "6" { Clear-Containers }
        "7" { Test-SiteAvailability }
        "8" { Show-Documentation }
        "0" { 
            Write-Host "Goodbye!" -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "Invalid choice. Try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Read-Host "Press Enter to continue"
    }
} while ($choice -ne "0")
