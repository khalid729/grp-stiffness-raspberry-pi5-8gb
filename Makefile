# GRP Ring Stiffness Test Machine - Makefile

.PHONY: install install-backend install-frontend dev dev-backend dev-frontend build clean

# Install all dependencies
install: install-backend install-frontend

# Install backend dependencies (using Python 3.11)
install-backend:
	cd backend && /opt/homebrew/bin/python3.11 -m venv venv && . venv/bin/activate && pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Run both (use two terminals)
dev:
	@echo "Run 'make dev-backend' in one terminal"
	@echo "Run 'make dev-frontend' in another terminal"

# Run backend only
dev-backend:
	cd backend && . venv/bin/activate && uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload

# Run frontend only
dev-frontend:
	cd frontend && npm run dev

# Build frontend for production
build:
	cd frontend && npm run build

# Clean generated files
clean:
	rm -rf backend/venv backend/__pycache__ backend/*.db backend/*.log
	rm -rf frontend/node_modules frontend/dist
