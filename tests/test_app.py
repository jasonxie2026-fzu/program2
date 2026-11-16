import sys
import tempfile
import unittest
import io
import zipfile
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import Handler, Store, export_xlsx, import_xlsx


class AddressBookTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / 'contacts.json')

    def tearDown(self):
        self.temp.cleanup()

    def test_create_update_search_favorite_and_delete(self):
        person = self.store.create({'name': '林晓', 'phones': ['13800138000', '020-1234'], 'emails': ['lin@example.com'], 'favorite': True})
        self.assertEqual(len(self.store.list('020-1234', True)), 1)
        self.store.update(person['id'], {'name': '林晓明', 'phones': ['123'], 'emails': [], 'favorite': False})
        self.assertEqual(self.store.list('林晓明')[0]['phones'], ['123'])
        self.assertEqual(self.store.list('', True), [])
        self.store.delete(person['id'])
        self.assertEqual(self.store.list(), [])

    def test_name_is_required(self):
        with self.assertRaises(ValueError):
            self.store.create({'name': '  '})

    def test_excel_round_trip_multiple_contacts(self):
        records = [self.store.create({'name': '张三', 'phones': ['123', '456'], 'emails': ['a@example.com'], 'favorite': True, 'note': '同学'})]
        imported = import_xlsx(export_xlsx(records))
        self.assertEqual(imported[0]['name'], '张三')
        self.assertEqual(imported[0]['phones'], ['123', '456'])
        self.assertTrue(imported[0]['favorite'])

    def test_dynamic_excel_round_trip_keeps_each_method_in_its_own_column(self):
        a = self.store.create({
            'name': '林晓', 'phones': ['00123', '+1 (415) 555-0123'],
            'emails': ['lin@example.com', 'work@example.com'],
            'methods': [
                {'type': 'phone', 'label': '工作', 'value': '00123'},
                {'type': 'phone', 'label': '海外', 'value': '+1 (415) 555-0123'},
                {'type': 'email', 'label': '个人', 'value': 'lin@example.com'},
                {'type': 'email', 'label': '工作', 'value': 'work@example.com'},
                {'type': 'social', 'label': '微信', 'value': 'lin_wechat'},
                {'type': 'address', 'label': '家庭', 'value': '福州鼓楼区'},
            ],
            'company': '人间有信工作室', 'note': '同学', 'favorite': True,
        })
        self.store.create({'name': '陈一', 'phones': ['13900000000'], 'favorite': False})
        content = export_xlsx(self.store.list())
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
            self.assertNotIn(b'<f>', archive.read('xl/worksheets/sheet1.xml'))
        rows = sheet.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
        headers = [cell.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t').text or '' for cell in rows[0]]
        self.assertIn('电话 2', headers)
        self.assertIn('邮箱 2', headers)
        self.assertIn('社交方式 1', headers)
        self.assertIn('地址 1', headers)
        self.assertEqual(len(rows), 3)  # one header row and one row per person
        restored = import_xlsx(content)
        self.assertEqual(restored[0]['methods'], a['methods'])
        self.assertEqual(restored[0]['company'], a['company'])
        self.assertEqual(restored[0]['note'], a['note'])
        self.assertTrue(restored[0]['favorite'])
        self.assertEqual(restored[1]['phones'], ['13900000000'])

    def test_export_keeps_formula_like_values_as_inline_text(self):
        person = self.store.create({'name': '=HYPERLINK("https://bad.example")', 'phones': ['001234']})
        with zipfile.ZipFile(io.BytesIO(export_xlsx([person]))) as archive:
            xml = archive.read('xl/worksheets/sheet1.xml')
        self.assertIn(b't="inlineStr"', xml)
        self.assertNotIn(b'<f>', xml)
        self.assertIn(b'=HYPERLINK', xml)

    def test_legacy_seven_column_workbook_is_still_supported(self):
        xml = ('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
               '<row r="1">' + ''.join(self._cell(i, 1, value) for i, value in enumerate(['姓名','电话','邮箱','公司','地址','备注','收藏'], 1)) + '</row>'
               '<row r="2">' + ''.join(self._cell(i, 2, value) for i, value in enumerate(['王五','00123\n00456','w@example.com','旧公司','老地址','旧模板','是'], 1)) + '</row>'
               '</sheetData></worksheet>')
        content = io.BytesIO()
        with zipfile.ZipFile(content, 'w') as archive:
            archive.writestr('xl/worksheets/sheet1.xml', xml)
        imported = import_xlsx(content.getvalue())[0]
        self.assertEqual(imported['phones'], ['00123', '00456'])
        self.assertEqual(imported['address'], '老地址')
        self.assertTrue(imported['favorite'])

    @staticmethod
    def _cell(column, row, value):
        ref = chr(64 + column) + str(row)
        text = str(value).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return f'<c r="{ref}" t="inlineStr"><is><t>{text}</t></is></c>'

    def test_import_rejects_corrupt_workbook_without_changing_saved_contacts(self):
        self.store.create({'name': '保留联系人'})
        with self.assertRaises(ValueError):
            import_xlsx(b'not an Excel file')
        with self.assertRaises(ValueError):
            self.store.add_many([{'name': '新联系人'}, {'name': ''}])
        self.assertEqual([p['name'] for p in self.store.list()], ['保留联系人'])

    def test_legacy_json_loads_methods_and_persists_after_reopen(self):
        old = {'id': 'legacy-1', 'name': '旧联系人', 'phones': ['00123'], 'emails': ['old@example.com'],
               'company': '', 'address': '旧地址', 'note': '旧备注', 'favorite': True}
        self.store.path.parent.mkdir(parents=True, exist_ok=True)
        self.store.path.write_text(__import__('json').dumps([old], ensure_ascii=False), encoding='utf-8')
        migrated = Store(self.store.path)
        loaded = migrated.list()[0]
        self.assertEqual(loaded['methods'], [
            {'type': 'phone', 'label': '', 'value': '00123'},
            {'type': 'email', 'label': '', 'value': 'old@example.com'},
            {'type': 'address', 'label': '', 'value': '旧地址'},
        ])
        migrated.update('legacy-1', {**loaded, 'name': '旧联系人改名'})
        self.assertEqual(Store(self.store.path).list()[0]['phones'], ['00123'])

    def test_zero_contact_export_is_a_valid_importable_template(self):
        self.assertEqual(import_xlsx(export_xlsx([])), [])

    def test_import_preview_is_read_only_and_import_adds_only_after_confirmation(self):
        content = export_xlsx([{'name': '合成联系人', 'phones': ['00123'], 'emails': [], 'company': '', 'address': '', 'note': '', 'favorite': True}])
        with patch('app.store', self.store):
            def call(path):
                handler = object.__new__(Handler)
                handler.command = 'POST'
                handler.path = path
                handler.headers = {'Content-Length': str(len(content))}
                handler.rfile = io.BytesIO(content)
                response = []
                handler.respond = lambda status, data, *args, **kwargs: response.append((status, data))
                handler.mutate()
                return response[0]
            status, preview = call('/api/import/preview')
            self.assertEqual(status, 200)
            self.assertEqual(preview['count'], 1)
            self.assertEqual(preview['preview'][0]['name'], '合成联系人')
            self.assertEqual(preview['duplicatePolicy'], '追加导入，不自动去重')
            self.assertEqual(self.store.list(), [])
            status, result = call('/api/import')
            self.assertEqual(status, 200)
            self.assertEqual(result['count'], 1)
            self.assertEqual(self.store.list()[0]['phones'], ['00123'])

if __name__ == '__main__':
    unittest.main()
