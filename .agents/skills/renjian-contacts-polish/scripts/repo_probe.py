#!/usr/bin/env python3
"""Print a privacy-preserving structural snapshot of a frontend repo.

Does not inspect data stores, .env files, user contacts, or source contents.
Only prints names of likely code files and package dependencies/scripts.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", "coverage", ".venv", "venv", ".turbo", ".cache"}
SIGNALS = {"vite.config.ts", "vite.config.js", "next.config.js", "next.config.mjs", "next.config.ts", "vue.config.js", "nuxt.config.ts", "angular.json", "index.html", "package.json", "playwright.config.ts", "vitest.config.ts", "tailwind.config.ts", "postcss.config.js", "pnpm-lock.yaml", "yarn.lock", "package-lock.json", "components.json"}


def probe(root: Path) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise NotADirectoryError(str(root))
    package = root / "package.json"
    pkg = {}
    if package.is_file() and package.stat().st_size < 100000:
        try:
            pkg = json.loads(package.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValueError):
            pkg = {}
    scripts = pkg.get("scripts", {}) if isinstance(pkg.get("scripts", {}), dict) else {}
    deps = {}
    for section in ("dependencies", "devDependencies"):
        val = pkg.get(section, {})
        if isinstance(val, dict):
            deps.update(val)
    packages = sorted(name for name in deps if any(token in name.lower() for token in ["react", "vue", "next", "motion", "tailwind", "shadcn", "xlsx", "sheetjs", "playwright", "vitest", "jest", "radix", "lucide", "gsap", "typescript", "vite"]))
    files = []
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS or part.startswith(".") and part not in {".agents"} for part in path.relative_to(root).parts):
            continue
        if not path.is_file():
            continue
        if path.name in SIGNALS or (path.suffix.lower() in {".ts", ".tsx", ".js", ".jsx", ".vue", ".css", ".html"} and len(path.parts) - len(root.parts) <= 4):
            files.append(path.relative_to(root).as_posix())
        if len(files) >= 120:
            break
    files.sort()
    return {"repo": root.name, "scripts": sorted(scripts.keys()), "relevant_packages": packages, "file_paths_sample": files, "limitations": "structure-only; no data files or implementation contents inspected; not a functional audit"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, nargs="?", default=Path.cwd())
    args = parser.parse_args()
    print(json.dumps(probe(args.root), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
