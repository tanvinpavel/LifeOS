import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBearer

from app.core.config import get_settings
from app.core.database import init_db, check_db_connection, AsyncSessionLocal
from app.core.seed import run_all_seeds

settings = get_settings()


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"\n{'='*50}")
    print(f"  🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"{'='*50}")

    connected = await check_db_connection()
    if not connected:
        raise RuntimeError("❌ Cannot connect to database! Check .env settings.")
    print("✅ Database connected!")

    await init_db()

    async with AsyncSessionLocal() as db:
        await run_all_seeds(db)

    print(f"✅ {settings.APP_NAME} is ready!")
    print(f"📖 Docs → http://localhost:8000/docs\n")

    yield

    from app.core.database import engine
    await engine.dispose()
    print(f"\n👋 {settings.APP_NAME} stopped.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url=None,       # Custom Swagger
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Custom OpenAPI — Bearer Token Authorization ───────────────────────────────

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=f"{settings.APP_NAME} — LifeOS Personal Productivity API",
        routes=app.routes,
    )

    # Bearer token security scheme
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Login করে token নিন → এখানে paste করুন → Authorize ✅",
        }
    }

    # Apply security to all routes EXCEPT /api/v1/auth/*
    paths = openapi_schema.get("paths", {})
    for path, path_item in paths.items():
        # Auth routes এ security লাগবে না
        if path.startswith("/api/v1/auth"):
            continue
        if path in ("/", "/health"):
            continue

        for method, operation in path_item.items():
            if method in ("get", "post", "put", "patch", "delete"):
                operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# ─── Custom Swagger UI ────────────────────────────────────────────────────────

SWAGGER_CUSTOM_JS = """
<style>
  /* Swagger header customize */
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    padding: 10px 20px;
  }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar-wrapper::before {
    content: "⚡ LifeOS API";
    color: #4ecca3;
    font-size: 22px;
    font-weight: 800;
    font-family: -apple-system, sans-serif;
    letter-spacing: 1px;
  }
  .swagger-ui .info .title {
    color: #302b63;
    font-size: 28px;
  }
  /* Authorize button highlight */
  .swagger-ui .auth-wrapper .authorize {
    background: #e94560 !important;
    border-color: #e94560 !important;
    color: white !important;
    font-weight: 700 !important;
    border-radius: 6px !important;
  }
  .swagger-ui .auth-wrapper .authorize svg { fill: white !important; }

  /* Token auto-fill banner */
  #tokenBanner {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #e0e0e0;
    padding: 10px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  #tokenBanner label {
    font-weight: 700;
    color: #4ecca3;
    white-space: nowrap;
    font-size: 15px;
  }
  #tokenBanner input {
    background: #0f3460;
    border: 1px solid #533483;
    color: #e94560;
    padding: 7px 13px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    flex: 1;
    max-width: 500px;
    outline: none;
  }
  #tokenBanner input:focus { border-color: #e94560; }
  #tokenBanner input::placeholder { color: #555; }
  #tokenBanner .tbtn {
    color: white;
    border: none;
    padding: 7px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
  }
  #tokenBanner .tbtn:hover { opacity: 0.85; }
  .tbtn-set   { background: #e94560; }
  .tbtn-clear { background: #533483; }
  #tokenStatus { margin-left: auto; font-size: 13px; color: #4ecca3; font-weight: 700; }
</style>

<div id="tokenBanner">
  <label>🔑 JWT Token:</label>
  <input
    type="text"
    id="globalTokenInput"
    placeholder="Login করুন → token copy করুন → এখানে paste করুন"
    onkeydown="if(event.key==='Enter') setGlobalToken()"
  />
  <button class="tbtn tbtn-set"   onclick="setGlobalToken()">Authorize All</button>
  <button class="tbtn tbtn-clear" onclick="clearGlobalToken()">Clear</button>
  <span id="tokenStatus"></span>
</div>

<script>
// On load — restore saved token
window.addEventListener('load', function () {
  var saved = localStorage.getItem('lifeos_jwt_token');
  if (saved) {
    document.getElementById('globalTokenInput').value = saved;
    document.getElementById('tokenStatus').textContent = '✅ Token Active';
    setTimeout(function () { applyTokenToSwagger(saved); }, 2500);
  }
});

function setGlobalToken() {
  var token = document.getElementById('globalTokenInput').value.trim();
  if (!token) { alert('Token দিন!'); return; }
  localStorage.setItem('lifeos_jwt_token', token);
  applyTokenToSwagger(token);
  document.getElementById('tokenStatus').textContent = '✅ Token Active';
}

function clearGlobalToken() {
  localStorage.removeItem('lifeos_jwt_token');
  document.getElementById('globalTokenInput').value = '';
  document.getElementById('tokenStatus').textContent = '';
  applyTokenToSwagger('');
}

function applyTokenToSwagger(token) {
  // Swagger UI internal store তে set করো
  var swaggerUI = window.ui;
  if (swaggerUI) {
    if (token) {
      swaggerUI.preauthorizeApiKey('BearerAuth', token);
    } else {
      // Clear auth
      swaggerUI.authActions && swaggerUI.authActions.logout &&
        swaggerUI.authActions.logout([{ name: 'BearerAuth' }]);
    }
    document.getElementById('tokenStatus').textContent = token ? '✅ Token Active' : '';
    return;
  }

  // Fallback: DOM inject
  setTimeout(function () {
    var authBtn = document.querySelector('.auth-wrapper .authorize');
    if (authBtn && token) { authBtn.click(); }
  }, 500);
}

// MutationObserver — Swagger load হলে token apply করো
var _tokenApplied = false;
var obs = new MutationObserver(function () {
  if (!_tokenApplied && window.ui) {
    var saved = localStorage.getItem('lifeos_jwt_token');
    if (saved) {
      applyTokenToSwagger(saved);
      _tokenApplied = true;
    }
  }
});
obs.observe(document.body, { childList: true, subtree: true });
</script>
"""


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    swagger_html = get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.APP_NAME} — API Docs",
        swagger_ui_parameters={
            "docExpansion": "none",
            "defaultModelsExpandDepth": -1,
            "persistAuthorization": True,       # ← token persist করবে
            "displayRequestDuration": True,
            "filter": True,
            "tryItOutEnabled": True,
            "onComplete": "() => { window.ui = window.swaggerUIBundle; }",
        },
    )

    html = swagger_html.body.decode()
    html = html.replace("</body>", f"{SWAGGER_CUSTOM_JS}</body>")
    return HTMLResponse(content=html)


# ─── Routes ───────────────────────────────────────────────────────────────────

from app.api.v1 import (
    auth, users, daily_state, habits, life_areas,
    distractions, excuses, productivity, streaks, weekly_summary
)

app.include_router(auth.router,           prefix="/api/v1/auth",           tags=["Auth"])
app.include_router(users.router,          prefix="/api/v1/users",          tags=["Users"])
app.include_router(daily_state.router,    prefix="/api/v1/daily-state",    tags=["Daily State"])
app.include_router(habits.router,         prefix="/api/v1/habits",         tags=["Habits"])
app.include_router(life_areas.router,     prefix="/api/v1/life-areas",     tags=["Life Areas"])
app.include_router(distractions.router,   prefix="/api/v1/distractions",   tags=["Distractions"])
app.include_router(excuses.router,        prefix="/api/v1/excuses",        tags=["Excuses"])
app.include_router(productivity.router,   prefix="/api/v1/productivity",   tags=["Productivity"])
app.include_router(streaks.router,        prefix="/api/v1/streaks",        tags=["Streaks"])
app.include_router(weekly_summary.router, prefix="/api/v1/weekly-summary", tags=["Weekly Summary"])


# ─── System Routes ────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    db_ok = await check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
    )