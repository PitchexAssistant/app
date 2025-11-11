#!/bin/bash

################################################################################
# Pitchex Application Status Script
# Description: Shows real-time status of backend, frontend, and health monitor
# Author: Pitchex Team
# Date: November 6, 2025
################################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
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

check_process_status() {
    local name=$1
    local pid_file=$2
    local port=$3
    local health_url=$4
    
    echo -e "${CYAN}┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${MAGENTA}${name}${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────┤${NC}"
    
    # Check PID file
    if [ -f "${pid_file}" ]; then
        local pid=$(cat "${pid_file}")
        
        if kill -0 ${pid} 2>/dev/null; then
            echo -e "${CYAN}│${NC} Process ID: ${GREEN}${pid}${NC} (Running)"
            
            # Get process info
            local cpu=$(ps -p ${pid} -o %cpu= 2>/dev/null | xargs)
            local mem=$(ps -p ${pid} -o %mem= 2>/dev/null | xargs)
            local uptime=$(ps -p ${pid} -o etime= 2>/dev/null | xargs)
            
            echo -e "${CYAN}│${NC} CPU Usage: ${cpu}%"
            echo -e "${CYAN}│${NC} Memory Usage: ${mem}%"
            echo -e "${CYAN}│${NC} Uptime: ${uptime}"
        else
            echo -e "${CYAN}│${NC} Process ID: ${RED}${pid}${NC} (Not Running)"
        fi
    else
        echo -e "${CYAN}│${NC} Process: ${RED}Not Started${NC}"
        echo -e "${CYAN}│${NC} No PID file found"
    fi
    
    # Check port
    if [ -n "${port}" ]; then
        if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${CYAN}│${NC} Port ${port}: ${GREEN}LISTENING${NC}"
        else
            echo -e "${CYAN}│${NC} Port ${port}: ${RED}NOT LISTENING${NC}"
        fi
    fi
    
    # Check health endpoint
    if [ -n "${health_url}" ]; then
        if curl -sf "${health_url}" > /dev/null 2>&1; then
            echo -e "${CYAN}│${NC} Health Check: ${GREEN}PASSED${NC}"
            
            # Get response time
            local response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "${health_url}" 2>/dev/null)
            echo -e "${CYAN}│${NC} Response Time: ${response_time}s"
        else
            echo -e "${CYAN}│${NC} Health Check: ${RED}FAILED${NC}"
        fi
    fi
    
    echo -e "${CYAN}└─────────────────────────────────────────────────────┘${NC}"
    echo ""
}

show_log_summary() {
    local log_file=$1
    local name=$2
    local lines=${3:-10}
    
    echo -e "${CYAN}Last ${lines} lines from ${name}:${NC}"
    echo -e "${YELLOW}───────────────────────────────────────────────────${NC}"
    
    if [ -f "${log_file}" ]; then
        tail -n ${lines} "${log_file}"
    else
        echo -e "${RED}Log file not found: ${log_file}${NC}"
    fi
    
    echo -e "${YELLOW}───────────────────────────────────────────────────${NC}"
    echo ""
}

show_system_resources() {
    echo -e "${CYAN}┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${MAGENTA}System Resources${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────┤${NC}"
    
    # CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    echo -e "${CYAN}│${NC} CPU Usage: ${cpu_usage}%"
    
    # Memory
    local mem_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
    echo -e "${CYAN}│${NC} Memory Usage: ${mem_usage}%"
    
    # Disk
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}')
    echo -e "${CYAN}│${NC} Disk Usage: ${disk_usage}"
    
    echo -e "${CYAN}└─────────────────────────────────────────────────────┘${NC}"
    echo ""
}

main() {
    clear
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  Pitchex Application Status${NC}"
    echo -e "${MAGENTA}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Check each service
    check_process_status "Backend (FastAPI)" "${BACKEND_PID_FILE}" "${BACKEND_PORT}" "http://localhost:${BACKEND_PORT}/api/v1/health"
    check_process_status "Frontend (Next.js)" "${FRONTEND_PID_FILE}" "${FRONTEND_PORT}" "http://localhost:${FRONTEND_PORT}"
    check_process_status "Health Monitor" "${HEALTH_PID_FILE}" "" ""
    
    # Show system resources
    show_system_resources
    
    # Offer to show logs
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Available Log Files:${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    if [ -d "${LOG_DIR}" ]; then
        ls -lh "${LOG_DIR}"/*.log 2>/dev/null || echo "No log files found"
    else
        echo "Log directory not found"
    fi
    
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  View backend logs:  ${GREEN}tail -f ${LOG_DIR}/backend.log${NC}"
    echo -e "  View frontend logs: ${GREEN}tail -f ${LOG_DIR}/frontend.log${NC}"
    echo -e "  View health logs:   ${GREEN}tail -f ${LOG_DIR}/health.log${NC}"
    echo -e "  View all logs:      ${GREEN}tail -f ${LOG_DIR}/*.log${NC}"
    echo ""
}

# Run with watch if requested
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    watch -n 5 -c "$0"
else
    main
fi
