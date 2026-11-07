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
from stat import S_ISREG

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from starlette.staticfiles import StaticFiles

router = APIRouter()
static_files = StaticFiles()

STATIC_DIR = Path(__file__).parent / "static"

HOSTED_CONFIG = {
    "contract_version": 2,
    "mode": "hosted",
    "app_key": "filaman",
    "api_base_path": "/api/v1",
    "app_base_path": "/plugins/filament-swatch",
}


@router.get("/hosted-config")
async def hosted_config() -> JSONResponse:
    """Return the hosted-mode configuration consumed by the SPA bootstrap."""
    return JSONResponse(HOSTED_CONFIG)


@router.get("/{path:path}")
async def spa_static(path: str, request: Request) -> Response:
    """
    Serve the pre-built SPA bundle.

    Exact files are served directly. Extensionless SPA paths outside the
    asset directory fall back to index.html.
    """
    try:
        static_dir = STATIC_DIR.resolve()
        target = (static_dir / (path or "index.html")).resolve()
        if not target.is_relative_to(static_dir):
            raise HTTPException(status_code=404, detail="Not found")

        def serve(file: Path) -> Response | None:
            try:
                metadata = file.stat()
            except (FileNotFoundError, NotADirectoryError):
                return None
            if S_ISREG(metadata.st_mode):
                return static_files.file_response(file, metadata, request.scope)
            return None

        response = serve(target)
        if response is not None:
            return response
        relative = target.relative_to(static_dir)
        if not relative.suffix and relative.parts[:1] != ("assets",):
            index = (static_dir / "index.html").resolve()
            if index.is_relative_to(static_dir):
                response = serve(index)
                if response is not None:
                    return response
    except (OSError, RuntimeError, ValueError):
        pass
    raise HTTPException(status_code=404, detail="Not found")
