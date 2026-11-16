import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import Store, export_xlsx, import_xlsx


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

if __name__ == '__main__':
    unittest.main()
