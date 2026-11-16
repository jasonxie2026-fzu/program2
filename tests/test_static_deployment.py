import json
import tempfile
import unittest
from pathlib import Path

from scripts.build_static import build


class StaticDeploymentTests(unittest.TestCase):
    def test_static_build_contains_all_runtime_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = build(Path(temporary) / "dist")
            for name in ("index.html", "showcase.html", "app.js", "xlsx.js", "style.css", "favicon.svg"):
                with self.subTest(asset=name):
                    self.assertTrue((output / name).is_file())
            manifest = output / ".openai/hosting.json"
            self.assertTrue(manifest.is_file())
            expected = json.loads((Path(__file__).resolve().parents[1] / ".openai/hosting.json").read_text())
            self.assertEqual(json.loads(manifest.read_text()), expected)

    def test_public_runtime_keeps_contacts_in_browser_storage(self):
        app = (Path(__file__).resolve().parents[1] / "static/app.js").read_text(encoding="utf-8")
        self.assertIn("localStorage.getItem(LOCAL_KEY)", app)
        self.assertIn("localStorage.setItem(LOCAL_KEY", app)
        self.assertIn("if (staticMode) return localRequest", app)

    def test_public_xlsx_support_is_local_and_has_no_remote_script(self):
        root = Path(__file__).resolve().parents[1]
        html = (root / "static/index.html").read_text(encoding="utf-8")
        xlsx = (root / "static/xlsx.js").read_text(encoding="utf-8")
        self.assertIn('src="/xlsx.js"', html)
        self.assertIn("AddressBookXlsx={importFile,exportFile}", xlsx)
        self.assertNotIn("<script src=\"https://", html)

    def test_showcase_is_standalone_and_uses_only_ephemeral_sample_state(self):
        root = Path(__file__).resolve().parents[1]
        html = (root / "static/showcase.html").read_text(encoding="utf-8")
        self.assertIn("交互演示 · 示例数据", html)
        self.assertIn("aria-label=\"示例联系人筛选\"", html)
        self.assertIn("prefers-reduced-motion:reduce", html)
        self.assertIn("inert", html)
        self.assertNotIn("localStorage", html)
        self.assertNotIn("fetch(", html)
        self.assertNotIn("XMLHttpRequest", html)
        self.assertNotIn("https://renjian-youxin-contacts.flaredmerit8.chatgpt.site", html)
        self.assertGreaterEqual(html.count('href="/"'), 3)
        self.assertIn('id="detail"', html)
        self.assertIn("keydown", html)

    def test_contacts_home_links_to_independent_showcase(self):
        root = Path(__file__).resolve().parents[1]
        html = (root / "static/index.html").read_text(encoding="utf-8")
        self.assertIn('href="/showcase.html"', html)


if __name__ == "__main__":
    unittest.main()
