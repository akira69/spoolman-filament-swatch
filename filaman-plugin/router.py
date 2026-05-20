"""
Filaman plugin router for spoolman-filament-swatch.

Serves:
  GET /hosted-config  -> JSON config consumed by the SPA bootstrap
  GET /{path:path}    -> static SPA bundle with index.html fallback (SPA routing)

mount_plugin_router_on_app mounts this router at /plugins/filament-swatch,
so final paths are /plugins/filament-swatch/hosted-config and
/plugins/filament-swatch/{asset-path}.
"""

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter()

STATIC_DIR = Path(__file__).parent / "static"

HOSTED_CONFIG = {
    "contract_version": 1,
    "mode": "hosted",
    "app_key": "filaman",
    "spoolman_base_url": "/spoolman",
    "app_base_path": "/plugins/filament-swatch",
}


@router.get("/hosted-config")
async def hosted_config() -> JSONResponse:
    """Return the hosted-mode configuration consumed by the SPA bootstrap."""
    return JSONResponse(HOSTED_CONFIG)


@router.get("/{path:path}")
async def spa_static(path: str) -> FileResponse:
    """
    Serve the pre-built SPA bundle.

    Exact file matches are served directly; anything else falls back to
    index.html so that client-side routing works for all deep-link paths.
    """
    target = STATIC_DIR / path if path else STATIC_DIR / "index.html"
    if path and target.is_file():
        return FileResponse(target)
    return FileResponse(STATIC_DIR / "index.html")
