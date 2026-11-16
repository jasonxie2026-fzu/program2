import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SubmissionEvidenceTests(unittest.TestCase):
    def test_course_evidence_files_exist(self):
        for relative in (
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
        self.assertIn("分工与贡献比例", blog)
        self.assertIn("PSP", blog)
        self.assertIn("未创建前不要填写为已完成", blog)

    def test_qa_report_does_not_claim_saved_screenshots_or_video(self):
        report = (ROOT / "docs/qa-results.md").read_text(encoding="utf-8")
        self.assertIn("仓库内没有保存截图文件", report)
        self.assertIn("没有演示视频", report)


if __name__ == "__main__":
    unittest.main()
