#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Pashmiya Stack..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Backend (Go)...${NC}"
cd "$SCRIPT_DIR/backend" && go run main.go &
BACKEND_PID=$!

sleep 3

echo -e "${YELLOW}Starting CMS...${NC}"
cd "$SCRIPT_DIR/cms" && npm run dev &
CMS_PID=$!

echo -e "${YELLOW}Starting Frontend...${NC}"
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Pashmiya Stack is running:${NC}"
echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}  CMS:       http://localhost:3001${NC}"
echo -e "${GREEN}  Backend:   http://localhost:8080${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $BACKEND_PID $CMS_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
