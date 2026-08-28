# Nexus AI Voice OS - Production FastAPI Backend Architecture

This directory contains the production-ready FastAPI backend source code for **Nexus AI Voice OS**.

## Architecture Overview

The backend is built following Clean Architecture & Repository Pattern principles:

```
backend/
├── auth/             # Authentication dependencies & OAuth2 JWT context handlers
├── core/             # Application configuration (pydantic-settings) & security utilities
├── database/         # SQLAlchemy engine, session factory, & Declarative Base setup
├── middleware/       # Custom ASGI Middlewares (Token-bucket Rate Limiter & Audit Logger)
├── models/           # SQLAlchemy DB Models (Users, Agents, Campaigns, Contacts, etc.)
├── repositories/     # Generic BaseRepository CRUD & specialized model repositories
├── routers/          # FastAPI APIRouters split by domain module
├── schemas/          # Pydantic v2 schemas for requests, responses & pagination
├── services/         # Business logic layer (AuthService, etc.)
├── integrations/     # Abstract Telemetry & Provider interfaces (Twilio, ElevenLabs, Deepgram)
├── websocket/        # Realtime WebSocket ConnectionManager & audio stream router
├── alembic/          # Migration environment setup
├── tests/            # Pytest test cases
└── main.py           # FastAPI Application Entrypoint
```

## Setup & Local / Production Deployment Instructions

### Prerequisites
- Python 3.11+ or 3.12+
- PostgreSQL database (or SQLite for local development)
- Virtual Environment tool (`venv` or `poetry`)

### Step 1: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install Runtime Dependencies
```bash
pip install -r backend/requirements.txt
```

Required Production Packages:
- **FastAPI** (`>=0.110.0`): Web framework
- **Uvicorn** (`>=0.28.0`): ASGI web server
- **SQLAlchemy** (`>=2.0.28`): ORM & Database abstraction layer
- **Alembic** (`>=1.13.1`): Database migrations tool
- **Pydantic** (`>=2.6.4`): Data validation & Settings management
- **python-jose**: JWT Token encoding/decoding with Cryptography backend
- **passlib[bcrypt]**: Password hashing using bcrypt algorithm
- **psycopg2-binary**: PostgreSQL Database Adapter
- **httpx**: Async HTTP requests for external integrations

### Step 3: Environment Variables Configuration
Copy `.env.example` to `.env` and populate your secrets:
```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/nexus_db`)
- `JWT_SECRET`: Minimum 32-character secret key for auth signature verification
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: For telephony provider calls
- `ELEVENLABS_API_KEY`: For ultra-low latency TTS voice synthesis

### Step 4: Run Database Migrations
```bash
alembic upgrade head
```

### Step 5: Launch the Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
