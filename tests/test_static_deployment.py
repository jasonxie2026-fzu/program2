import json
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree

from scripts.build_static import build


class StaticDeploymentTests(unittest.TestCase):
    def test_static_build_contains_all_runtime_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = build(Path(temporary) / "dist")
            for name in ("index.html", "showcase.html", "app.js", "xlsx.js", "style.css", "motion.css", "favicon.svg", "envelope.svg"):
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

    def test_both_pages_share_motion_and_keep_favorites_as_stars(self):
        root = Path(__file__).resolve().parents[1] / "static"
        index = (root / "index.html").read_text(encoding="utf-8")
        showcase = (root / "showcase.html").read_text(encoding="utf-8")
        app = (root / "app.js").read_text(encoding="utf-8")
        styles = (root / "style.css").read_text(encoding="utf-8")
        motion = (root / "motion.css").read_text(encoding="utf-8")
        for html in (index, showcase):
            self.assertIn('rel="stylesheet" href="/motion.css"', html)
        for text in (index, showcase, app):
            self.assertNotRegex(text, "[♡♥❤]")
        self.assertIn('type="checkbox" name="favorite"', index)
        self.assertIn('data-detail-favorite aria-pressed=', app)
        for rule in ("paper-drift", "star-pop", "--motion-sheet"):
            self.assertIn(rule, styles)
            self.assertIn(rule, showcase)
            self.assertIn(rule, motion)
        self.assertIn("animation: none !important", motion)
        self.assertIn("transition: none !important", motion)

    def test_built_pages_use_envelopes_in_place_of_flower_icons(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = build(Path(temporary) / "dist")
            for filename, envelope_count in (
                ("index.html", 5),
                ("showcase.html", 7),
            ):
                with self.subTest(page=filename):
                    html = (output / filename).read_text(encoding="utf-8")
                    self.assertNotIn("✳", html)
                    self.assertNotIn("side-flower", html)
                    self.assertNotIn("empty-flower", html)
                    self.assertEqual(html.count('<use href="/envelope.svg#envelope"/>'), envelope_count)
                    self.assertIn('href="/favicon.svg"', html)

            namespace = {"svg": "http://www.w3.org/2000/svg"}
            sprite = ElementTree.parse(output / "envelope.svg")
            envelope = sprite.find("svg:symbol[@id='envelope']", namespace)
            self.assertIsNotNone(envelope)
            self.assertIsNotNone(envelope.find("svg:rect", namespace))
            self.assertEqual(envelope.find("svg:path", namespace).get("d"), "m4 7 8 6 8-6")
            favicon = ElementTree.parse(output / "favicon.svg")
            self.assertIsNotNone(favicon.find("svg:g/svg:rect", namespace))
            self.assertIsNotNone(favicon.find("svg:g/svg:path", namespace))


if __name__ == "__main__":
    unittest.main()
