"""Prepare the dependency-free public static edition from the existing UI."""
from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "static"


def build(output: Path) -> Path:
    output = Path(output)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for name in ("index.html", "app.js", "xlsx.js", "style.css", "favicon.svg"):
        shutil.copy2(ASSETS / name, output / name)
    manifest = ROOT / ".openai" / "hosting.json"
    if manifest.is_file():
        site_config = output / ".openai"
        site_config.mkdir()
        shutil.copy2(manifest, site_config / "hosting.json")
    return output


if __name__ == "__main__":
    destination = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    print(build(destination))
