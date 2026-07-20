# -- Stage 1: Build Frontend --
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend config and code
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# We set the API base URL to empty so it defaults to the same host it's served from
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


# -- Stage 2: Serve Backend & Frontend via FastAPI --
FROM python:3.12-slim

WORKDIR /app

# Install OS dependencies required by XGBoost and other Python libs
RUN apt-get update && apt-get install -y libomp-dev && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, pipeline scripts, etc.
COPY . .

# Copy built frontend assets from the first stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend_dist

# Expose the default Render port
EXPOSE 8000

# We need to mount the static files from the frontend into FastAPI for a single-container deployment.
# We will do this via a small script or update main.py, but for the Dockerfile let's assume we run the pipeline, then the web app.
# The CMD will first run Phase 1 (to generate ML artifacts), then start FastAPI.
CMD ["sh", "-c", "python run_phase1.py && uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
