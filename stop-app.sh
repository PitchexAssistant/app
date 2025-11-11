#!/bin/bash

################################################################################
# Pitchex Application Stop Script
# Description: Stops backend, frontend, and health monitor gracefully
# Author: Pitchex Team
# Date: November 6, 2025
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="${SCRIPT_DIR}/.pids"
LOG_DIR="${SCRIPT_DIR}/logs"

BACKEND_PORT=8000
FRONTEND_PORT=3001

BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
HEALTH_PID_FILE="${PID_DIR}/health_monitor.pid"

log_info() {
    echo -e "${BLUE}ℹ${NC} $@"
}

log_success() {
    echo -e "${GREEN}✓${NC} $@"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $@"
}

log_error() {
    echo -e "${RED}✗${NC} $@"
}

stop_process() {
    local name=$1
    local pid_file=$2
    local port=$3
    
    if [ -f "${pid_file}" ]; then
        local pid=$(cat "${pid_file}")
        
        if kill -0 ${pid} 2>/dev/null; then
            log_info "Stopping ${name} (PID: ${pid})..."
            kill ${pid}
            
            # Wait for process to stop
            local elapsed=0
            while kill -0 ${pid} 2>/dev/null && [ ${elapsed} -lt 10 ]; do
                sleep 1
                elapsed=$((elapsed + 1))
            done
            
            # Force kill if still running
            if kill -0 ${pid} 2>/dev/null; then
                log_warning "Force killing ${name}..."
                kill -9 ${pid} 2>/dev/null || true
            fi
            
            log_success "${name} stopped"
        else
            log_warning "${name} PID ${pid} not running"
        fi
        
        rm -f "${pid_file}"
    else
        log_warning "No PID file found for ${name}"
    fi
    
    # Kill any remaining processes on port
    if [ -n "${port}" ]; then
        local port_pids=$(lsof -ti:${port} 2>/dev/null || true)
        if [ -n "${port_pids}" ]; then
            log_info "Killing remaining processes on port ${port}..."
            echo ${port_pids} | xargs kill -9 2>/dev/null || true
            log_success "Port ${port} cleared"
        fi
    fi
}

main() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Stopping Pitchex Application${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Stop health monitor
    stop_process "Health Monitor" "${HEALTH_PID_FILE}" ""
    
    # Stop frontend
    stop_process "Frontend" "${FRONTEND_PID_FILE}" "${FRONTEND_PORT}"
    
    # Stop backend
    stop_process "Backend" "${BACKEND_PID_FILE}" "${BACKEND_PORT}"
    
    echo ""
    log_success "All services stopped successfully"
    echo ""
    
    # Show log file locations
    if [ -d "${LOG_DIR}" ]; then
        echo -e "${BLUE}Log files available at:${NC}"
        ls -lh "${LOG_DIR}"/*.log 2>/dev/null || log_info "No log files found"
        echo ""
    fi
}

main
