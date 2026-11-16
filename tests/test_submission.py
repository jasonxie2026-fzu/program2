import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SubmissionEvidenceTests(unittest.TestCase):
    def test_course_evidence_files_exist(self):
        for relative in (
            "CODE_STANDARDS.md",
            "docs/qa-results.md",
            "docs/submission-checklist.md",
            "docs/demo-script.md",
            "docs/third-party-licenses.md",
            "docs/psp-template.md",
            "docs/handoff-after.md",
            "博客草稿.md",
        ):
            with self.subTest(path=relative):
                self.assertTrue((ROOT / relative).is_file())

    def test_blog_marks_unverified_course_fields_as_pending(self):
        blog = (ROOT / "博客草稿.md").read_text(encoding="utf-8")
        self.assertIn("实际代码与分工", blog)
        self.assertIn("贡献比例", blog)
        self.assertIn("PSP", blog)
        self.assertIn("粘贴实际仓库地址", blog)
        self.assertIn("粘贴共享仓库 Commits 页面截图", blog)
        self.assertIn("粘贴实际 PR 地址", blog)
        self.assertIn("粘贴实际发布版本地址", blog)

    def test_demo_images_and_video_are_present_and_linked(self):
        blog = (ROOT / "博客草稿.md").read_text(encoding="utf-8")
        report = (ROOT / "docs/qa-results.md").read_text(encoding="utf-8")
        assets = ROOT / "docs/evidence"
        screenshots = sorted(assets.glob("*.jpg"))
        self.assertEqual(len(screenshots), 10)
        for screenshot in screenshots:
            with self.subTest(screenshot=screenshot.name):
                data = screenshot.read_bytes()
                self.assertTrue(data.startswith(b"\xff\xd8\xff"))
                self.assertTrue(data.endswith(b"\xff\xd9"))
        video = assets / "address-book-demo.mp4"
        with video.open("rb") as stream:
            self.assertEqual(stream.read(8)[4:], b"ftyp")
        self.assertIn("docs/evidence/address-book-demo.mp4", blog)
        self.assertIn("evidence/address-book-demo.mp4", report)

    def test_readme_links_to_code_standards_and_submission_instructions(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        checklist = (ROOT / "docs/submission-checklist.md").read_text(encoding="utf-8")
        self.assertIn("(CODE_STANDARDS.md)", readme)
        self.assertIn("(docs/submission-checklist.md)", readme)
        self.assertIn("创建团队自己的 GitHub 仓库", checklist)
        self.assertIn("(../CODE_STANDARDS.md)", checklist)

    def test_published_site_and_browser_local_privacy_are_documented(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        qa = (ROOT / "docs/qa-results.md").read_text(encoding="utf-8")
        url = "https://renjian-youxin-addressbook-2026.loneflora4.chatgpt.site"
        self.assertIn(url, readme)
        self.assertIn(url, qa)
        self.assertIn("不上传", readme)


if __name__ == "__main__":
    unittest.main()
