import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

spec = importlib.util.spec_from_file_location(
    "filaman_swatch_router", Path(__file__).parents[1] / "filaman-plugin/router.py"
)
plugin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plugin)


class StaticBundleTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.static = self.root / "static"
        (self.static / "assets").mkdir(parents=True)
        (self.static / "index.html").write_text("<main>Swatch</main>")
        (self.static / "assets/app.js").write_text("console.log('swatch')")
        self.outside = self.root / "outside.txt"
        self.outside.write_text("OUTSIDE_BUNDLE")
        self.addCleanup(patch.stopall)
        patch.object(plugin, "STATIC_DIR", self.static).start()
        app = FastAPI()
        app.include_router(plugin.router, prefix="/plugins/filament-swatch")
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def get(self, path):
        return self.client.get(f"/plugins/filament-swatch/{path}")

    def test_assets_and_spa_routes_remain_available(self):
        self.assertEqual(self.get("assets/app.js").text, "console.log('swatch')")
        for path in ("", "app/swatch", "app/projects/123", "unknown"):
            with self.subTest(path=path):
                response = self.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.text, "<main>Swatch</main>")
        response = self.get("hosted-config")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["api_base_path"], "/api/v1")

    def test_missing_assets_return_404_instead_of_the_spa(self):
        for path in ("assets/missing.js", "assets/missing", ".%2fassets%2fmissing", "plugin-font.woff2"):
            with self.subTest(path=path):
                self.assertEqual(self.get(path).status_code, 404)

    def test_asset_etag_avoids_resending_unchanged_bytes(self):
        path = "/plugins/filament-swatch/assets/app.js"
        initial = self.client.get(path)
        response = self.client.get(path, headers={"If-None-Match": initial.headers["etag"]})
        self.assertEqual(response.status_code, 304)
        self.assertEqual(response.content, b"")

    def test_rejects_encoded_traversal_and_absolute_paths(self):
        for path in (
            "..%2foutside.txt", "%2e%2e%2foutside.txt",
            "assets%2f..%2f..%2foutside.txt", str(self.outside),
            "invalid%00file",
        ):
            with self.subTest(path=path):
                self.assertEqual(self.get(path).status_code, 404)

    def test_rejects_escaping_file_and_directory_symlinks(self):
        (self.static / "escape.txt").symlink_to(self.outside)
        (self.static / "escape-dir").symlink_to(self.root, target_is_directory=True)
        for path in ("escape.txt", "escape-dir/outside.txt"):
            with self.subTest(path=path):
                self.assertEqual(self.get(path).status_code, 404)

    def test_fallback_index_cannot_escape_bundle(self):
        (self.static / "index.html").unlink()
        (self.static / "index.html").symlink_to(self.outside)
        self.assertEqual(self.get("app/swatch").status_code, 404)
        self.assertEqual(self.get("").status_code, 404)

    def test_allows_links_and_normalization_within_bundle(self):
        (self.static / "linked.js").symlink_to(self.static / "assets/app.js")
        for path in ("linked.js", "assets%2f..%2fassets/app.js"):
            with self.subTest(path=path):
                self.assertEqual(self.get(path).text, "console.log('swatch')")


if __name__ == "__main__":
    unittest.main()
