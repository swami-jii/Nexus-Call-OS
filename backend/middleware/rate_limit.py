import time

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 1200):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.client_requests: dict[str, list] = {}
        self.exempt_paths = {
            "/health",
            "/api/health",
            "/api/providers/health",
            "/api/live-sessions",
            "/api/notifications",
            "/docs",
            "/openapi.json"
        }

    async def dispatch(self, request: Request, call_next):
        # Exempt health checks and real-time telemetry from rate limit
        path = request.url.path
        if any(path.startswith(exempt) for exempt in self.exempt_paths):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        if client_ip not in self.client_requests:
            self.client_requests[client_ip] = []

        timestamps = [ts for ts in self.client_requests[client_ip] if now - ts < 60]
        self.client_requests[client_ip] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please try again in 1 minute."}
            )

        self.client_requests[client_ip].append(now)
        response = await call_next(request)
        return response
