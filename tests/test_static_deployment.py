import tempfile
import unittest
from pathlib import Path

from scripts.build_static import build


class StaticDeploymentTests(unittest.TestCase):
    def test_static_build_contains_all_runtime_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = build(Path(temporary) / "dist")
            for name in ("index.html", "app.js", "xlsx.js", "style.css", "favicon.svg"):
                with self.subTest(asset=name):
                    self.assertTrue((output / name).is_file())

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


if __name__ == "__main__":
    unittest.main()
