#!/bin/bash

################################################################################
# Pitchex Application Startup Script
# Description: Starts backend (FastAPI) and frontend (Next.js) with health monitoring
# Author: Pitchex Team
# Date: November 6, 2025
################################################################################

# Note: Don't use set -e as we handle errors explicitly

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
LOG_DIR="${SCRIPT_DIR}/logs"
PID_DIR="${SCRIPT_DIR}/.pids"

BACKEND_PORT=8000
FRONTEND_PORT=3001
HEALTH_CHECK_INTERVAL=30  # seconds
MAX_STARTUP_TIME=60       # seconds

# Log files
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"
HEALTH_LOG="${LOG_DIR}/health.log"
MAIN_LOG="${LOG_DIR}/main.log"

# PID files
BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
HEALTH_PID_FILE="${PID_DIR}/health_monitor.pid"

################################################################################
# Utility Functions
################################################################################

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    # Only log to file if log directory exists
    if [ -d "${LOG_DIR}" ]; then
        echo -e "${timestamp} [${level}] ${message}" | tee -a "${MAIN_LOG}"
    else
        echo -e "${timestamp} [${level}] ${message}"
    fi
}

log_info() {
    echo -e "${BLUE}ℹ ${NC}$@"
    log "INFO" "$@"
}

log_success() {
    echo -e "${GREEN}✓${NC} $@"
    log "SUCCESS" "$@"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $@"
    log "WARNING" "$@"
}

log_error() {
    echo -e "${RED}✗${NC} $@"
    log "ERROR" "$@"
}

log_section() {
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  $@${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    log "SECTION" "$@"
}

################################################################################
# Setup Functions
################################################################################

setup_directories() {
    log_section "Setting Up Directories"
    
    # Create log directory
    if [ ! -d "${LOG_DIR}" ]; then
        mkdir -p "${LOG_DIR}"
        log_success "Created logs directory: ${LOG_DIR}"
    fi
    
    # Create PID directory
    if [ ! -d "${PID_DIR}" ]; then
        mkdir -p "${PID_DIR}"
        log_success "Created PID directory: ${PID_DIR}"
    fi
    
    # Clear old logs (optional - comment out to keep history)
    # > "${BACKEND_LOG}"
    # > "${FRONTEND_LOG}"
    # > "${HEALTH_LOG}"
    # > "${MAIN_LOG}"
}

check_dependencies() {
    log_section "Checking Dependencies"
    
    local missing_deps=()
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    else
        log_success "Python3: $(python3 --version)"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        log_success "Node.js: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        log_success "npm: $(npm --version)"
    fi
    
    # Check curl for health checks
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    else
        log_success "curl: Available"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi
    
    log_success "All dependencies satisfied"
}

check_ports() {
    log_section "Checking Port Availability"
    
    # Check backend port
    if lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "Port ${BACKEND_PORT} (Backend) is already in use"
        log_info "Run: lsof -i :${BACKEND_PORT} to see what's using it"
        log_info "Or run: ./stop-app.sh to stop existing instances"
        exit 1
    else
        log_success "Port ${BACKEND_PORT} (Backend) is available"
    fi
    
    # Check frontend port
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "Port ${FRONTEND_PORT} (Frontend) is already in use"
        log_info "Run: lsof -i :${FRONTEND_PORT} to see what's using it"
        log_info "Or run: ./stop-app.sh to stop existing instances"
        exit 1
    else
        log_success "Port ${FRONTEND_PORT} (Frontend) is available"
    fi
}

################################################################################
# Backend Functions
################################################################################

start_backend() {
    log_section "Starting Backend (FastAPI)"
    
    if [ ! -d "${BACKEND_DIR}" ]; then
        log_error "Backend directory not found: ${BACKEND_DIR}"
        exit 1
    fi
    
    cd "${BACKEND_DIR}"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_warning "Virtual environment not found, creating one..."
        python3 -m venv venv
        log_success "Virtual environment created"
    fi
    
    # Activate virtual environment and install dependencies
    log_info "Installing/updating backend dependencies..."
    venv/bin/pip install -q --upgrade pip
    venv/bin/pip install -q -r requirements.txt 2>&1 | tee -a "${BACKEND_LOG}"
    
    # Start backend server
    log_info "Starting FastAPI server on port ${BACKEND_PORT}..."
    nohup venv/bin/python -m uvicorn main:app \
        --reload \
        --host 0.0.0.0 \
        --port ${BACKEND_PORT} \
        >> "${BACKEND_LOG}" 2>&1 &
    
    local backend_pid=$!
    echo ${backend_pid} > "${BACKEND_PID_FILE}"
    
    log_success "Backend started (PID: ${backend_pid})"
    log_info "Backend logs: ${BACKEND_LOG}"
    
    cd "${SCRIPT_DIR}"
}

wait_for_backend() {
    log_info "Waiting for backend to become healthy..."
    
    local elapsed=0
    local backend_healthy=false
    
    while [ ${elapsed} -lt ${MAX_STARTUP_TIME} ]; do
        if curl -sf "http://localhost:${BACKEND_PORT}/api/v1/health" > /dev/null 2>&1; then
            backend_healthy=true
            break
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    
    if [ "${backend_healthy}" = true ]; then
        log_success "Backend is healthy and responding on port ${BACKEND_PORT}"
    else
        log_error "Backend failed to start within ${MAX_STARTUP_TIME} seconds"
        log_error "Check logs at: ${BACKEND_LOG}"
        cleanup_on_error
        exit 1
    fi
}

################################################################################
# Frontend Functions
################################################################################

start_frontend() {
    log_section "Starting Frontend (Next.js)"
    
    if [ ! -d "${FRONTEND_DIR}" ]; then
        log_error "Frontend directory not found: ${FRONTEND_DIR}"
        exit 1
    fi
    
    cd "${FRONTEND_DIR}"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules not found, installing dependencies..."
        npm install 2>&1 | tee -a "${FRONTEND_LOG}"
        log_success "Dependencies installed"
    fi
    
    # Start frontend server
    log_info "Starting Next.js server on port ${FRONTEND_PORT}..."
    nohup npm run dev -- -p ${FRONTEND_PORT} \
        >> "${FRONTEND_LOG}" 2>&1 &
    
    local frontend_pid=$!
    echo ${frontend_pid} > "${FRONTEND_PID_FILE}"
    
    log_success "Frontend started (PID: ${frontend_pid})"
    log_info "Frontend logs: ${FRONTEND_LOG}"
    
    cd "${SCRIPT_DIR}"
}

wait_for_frontend() {
    log_info "Waiting for frontend to become healthy..."
    
    local elapsed=0
    local frontend_healthy=false
    
    while [ ${elapsed} -lt ${MAX_STARTUP_TIME} ]; do
        if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
            frontend_healthy=true
            break
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    
    if [ "${frontend_healthy}" = true ]; then
        log_success "Frontend is healthy and responding on port ${FRONTEND_PORT}"
    else
        log_warning "Frontend may still be starting up..."
        log_info "Check logs at: ${FRONTEND_LOG}"
    fi
}

################################################################################
# Health Monitoring Functions
################################################################################

start_health_monitor() {
    log_section "Starting Health Monitor"
    
    # Create health monitoring background process
    (
        while true; do
            local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            local backend_status="DOWN"
            local frontend_status="DOWN"
            
            # Check backend health
            if curl -sf "http://localhost:${BACKEND_PORT}/api/v1/health" > /dev/null 2>&1; then
                backend_status="UP"
            fi
            
            # Check frontend health
            if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
                frontend_status="UP"
            fi
            
            # Log health status
            echo "${timestamp} | Backend: ${backend_status} | Frontend: ${frontend_status}" >> "${HEALTH_LOG}"
            
            # Alert if services are down
            if [ "${backend_status}" = "DOWN" ]; then
                echo "${timestamp} [ALERT] Backend is DOWN on port ${BACKEND_PORT}" >> "${HEALTH_LOG}"
            fi
            
            if [ "${frontend_status}" = "DOWN" ]; then
                echo "${timestamp} [ALERT] Frontend is DOWN on port ${FRONTEND_PORT}" >> "${HEALTH_LOG}"
            fi
            
            sleep ${HEALTH_CHECK_INTERVAL}
        done
    ) &
    
    local health_pid=$!
    echo ${health_pid} > "${HEALTH_PID_FILE}"
    
    log_success "Health monitor started (PID: ${health_pid})"
    log_info "Health checks every ${HEALTH_CHECK_INTERVAL} seconds"
    log_info "Health logs: ${HEALTH_LOG}"
}

################################################################################
# Cleanup Functions
################################################################################

cleanup_on_error() {
    log_warning "Cleaning up due to error..."
    
    if [ -f "${BACKEND_PID_FILE}" ]; then
        local backend_pid=$(cat "${BACKEND_PID_FILE}")
        if kill -0 ${backend_pid} 2>/dev/null; then
            kill ${backend_pid}
            log_info "Stopped backend (PID: ${backend_pid})"
        fi
        rm -f "${BACKEND_PID_FILE}"
    fi
    
    if [ -f "${FRONTEND_PID_FILE}" ]; then
        local frontend_pid=$(cat "${FRONTEND_PID_FILE}")
        if kill -0 ${frontend_pid} 2>/dev/null; then
            kill ${frontend_pid}
            log_info "Stopped frontend (PID: ${frontend_pid})"
        fi
        rm -f "${FRONTEND_PID_FILE}"
    fi
}

setup_signal_handlers() {
    trap 'log_warning "Received interrupt signal. Use ./stop-app.sh to stop services cleanly."; exit 130' INT TERM
}

################################################################################
# Display Functions
################################################################################

display_status() {
    log_section "Application Status"
    
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}✓${NC} Pitchex Application Started Successfully           ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  Backend (FastAPI):                                     ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • URL: ${GREEN}http://localhost:${BACKEND_PORT}${NC}                       ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Docs: ${GREEN}http://localhost:${BACKEND_PORT}/docs${NC}                 ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Health: ${GREEN}http://localhost:${BACKEND_PORT}/api/v1/health${NC}      ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Logs: ${BACKEND_LOG}  ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                           ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  Frontend (Next.js):                                    ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • URL: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}                       ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Dashboard: ${GREEN}http://localhost:${FRONTEND_PORT}/dashboard${NC}      ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Logs: ${FRONTEND_LOG} ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                           ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  Health Monitor:                                        ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Check interval: ${HEALTH_CHECK_INTERVAL}s                             ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Logs: ${HEALTH_LOG}  ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  Management Commands:                                   ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Stop: ${YELLOW}./stop-app.sh${NC}                                ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • Status: ${YELLOW}./status-app.sh${NC}                             ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}    • View logs: ${YELLOW}tail -f logs/*.log${NC}                     ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    clear
    
    # Setup signal handlers first
    setup_signal_handlers
    
    # Setup directories before any logging
    log_section "Pitchex Application Startup"
    setup_directories
    
    # Now proceed with checks
    check_dependencies || { log_error "Dependency check failed"; exit 1; }
    check_ports || { log_error "Port check failed"; exit 1; }
    
    # Start backend
    start_backend || { log_error "Backend startup failed"; cleanup_on_error; exit 1; }
    wait_for_backend || { log_error "Backend health check failed"; cleanup_on_error; exit 1; }
    
    # Start frontend
    start_frontend || { log_error "Frontend startup failed"; cleanup_on_error; exit 1; }
    wait_for_frontend  # Frontend can be slow, don't fail on this
    
    # Start health monitoring
    start_health_monitor || { log_warning "Health monitor failed to start"; }
    
    # Display status
    display_status
    
    log_success "Application startup complete!"
    log_info "Press Ctrl+C to exit (services will continue running)"
    log_info "Use ./stop-app.sh to stop all services"
    
    # Keep script running to show it's managing the processes
    echo ""
    echo -e "${YELLOW}Monitoring application... (Ctrl+C to exit)${NC}"
    echo ""
    
    # Tail logs in real-time
    tail -f "${HEALTH_LOG}" 2>/dev/null || sleep infinity
}

# Run main function
main
