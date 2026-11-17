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
            "docs/psp-hoangthithang880-dotcom.md",
            "docs/course-git.md",
            "docs/evidence/github-main-history.txt",
        ):
            with self.subTest(path=relative):
                self.assertTrue((ROOT / relative).is_file())

    def test_blog_marks_unverified_course_fields_as_pending(self):
        blog = (ROOT / "博客草稿.md").read_text(encoding="utf-8")
        self.assertIn("实际代码与分工", blog)
        self.assertIn("贡献比例", blog)
        self.assertIn("PSP", blog)
        self.assertIn("hoangthithang880-dotcom", blog)
        self.assertEqual(blog.count("50%"), 2)
        self.assertIn("https://github.com/jasonxie2026-fzu/program2", blog)
        self.assertIn("补一张 GitHub Commits 页面截图", blog)
        self.assertIn("待在 GitHub 创建后补链接", blog)
        self.assertIn("待在 GitHub 发布后补链接", blog)

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
        self.assertIn("GitHub Commits", checklist)
        self.assertIn("(../CODE_STANDARDS.md)", checklist)

    def test_published_site_and_browser_local_privacy_are_documented(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        qa = (ROOT / "docs/qa-results.md").read_text(encoding="utf-8")
        url = "https://joyful-centaur-da2325.netlify.app"
        blog = (ROOT / "博客草稿.md").read_text(encoding="utf-8")
        self.assertIn(url + "/", blog)
        self.assertIn(url + "/showcase.html", blog)
        self.assertIn(url + "/showcase.html", readme)
        self.assertIn(url, readme)
        self.assertIn(url, qa)
        self.assertIn("不上传", readme)


if __name__ == "__main__":
    unittest.main()
