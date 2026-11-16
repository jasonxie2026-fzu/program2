"""A small local address book; Python 3.10+, standard library only."""
import io
import json
import os
import re
import threading
import uuid
import webbrowser
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data' / 'contacts.json'
FIELDS = ['姓名', '电话', '邮箱', '公司', '地址', '备注', '收藏']
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def clean(data):
    name = str(data.get('name', '')).strip()
    if not name or len(name) > 100:
        raise ValueError('姓名不能为空，且不能超过 100 个字符')
    result = {'name': name}
    for key in ('phones', 'emails'):
        value = data.get(key, [])
        if not isinstance(value, list):
            raise ValueError('联系方式格式不正确')
        result[key] = [str(v).strip() for v in value if str(v).strip()]
    for key in ('company', 'address', 'note'):
        result[key] = str(data.get(key, '')).strip()
    result['favorite'] = bool(data.get('favorite', False))
    return result

class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.RLock()
    def _read(self):
        if not self.path.exists(): return []
        return json.loads(self.path.read_text(encoding='utf-8'))
    def _write(self, items):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix('.tmp')
        tmp.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
        os.replace(tmp, self.path)
    def list(self, query='', favorites=False):
        with self.lock:
            q = query.strip().casefold()
            return [p for p in self._read() if (not favorites or p['favorite']) and (not q or q in ' '.join([p['name'], p['company'], p['address'], p['note'], *p['phones'], *p['emails']]).casefold())]
    def create(self, data):
        with self.lock:
            p = clean(data); p['id'] = uuid.uuid4().hex
            items = self._read(); items.append(p); self._write(items); return p
    def update(self, identifier, data):
        with self.lock:
            items = self._read()
            for i, p in enumerate(items):
                if p['id'] == identifier:
                    items[i] = {**clean(data), 'id': identifier}; self._write(items); return items[i]
            raise KeyError(identifier)
    def delete(self, identifier):
        with self.lock:
            items = self._read(); result = [p for p in items if p['id'] != identifier]
            if len(items) == len(result): raise KeyError(identifier)
            self._write(result)
    def add_many(self, records):
        with self.lock:
            validated = [dict(clean(p), id=uuid.uuid4().hex) for p in records]
            items = self._read(); items.extend(validated); self._write(items)
            return len(validated)

def export_xlsx(records):
    rows = [FIELDS] + [[p['name'], '\n'.join(p['phones']), '\n'.join(p['emails']), p['company'], p['address'], p['note'], '是' if p['favorite'] else '否'] for p in records]
    xmlrows = []
    for i, row in enumerate(rows, 1):
        cells = ''.join(f'<c r="{chr(65+j)}{i}" t="inlineStr"><is><t xml:space="preserve">{escape(str(value))}</t></is></c>' for j, value in enumerate(row))
        xmlrows.append(f'<row r="{i}">{cells}</row>')
    sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + ''.join(xmlrows) + '</sheetData></worksheet>'
    files = {'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>', '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>', 'xl/workbook.xml':'<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="联系人" sheetId="1" r:id="rId1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml':sheet}
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, content in files.items(): z.writestr(name, content)
    return out.getvalue()

def import_xlsx(content):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            if sum(x.file_size for x in z.infolist()) > 20_000_000: raise ValueError('Excel 文件过大')
            shared = []
            if 'xl/sharedStrings.xml' in z.namelist():
                root = ET.fromstring(z.read('xl/sharedStrings.xml'))
                shared = [''.join(t.text or '' for t in si.iter(NS+'t')) for si in root.findall(NS+'si')]
            root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            rows = []
            for row in root.findall('.//' + NS+'row'):
                cells = {}
                for c in row.findall(NS+'c'):
                    ref = re.match(r'[A-Z]+', c.get('r', ''))
                    if not ref: continue
                    index = 0
                    for char in ref.group(): index = index * 26 + ord(char) - 64
                    v = c.find(NS+'v'); raw = v.text or '' if v is not None else ''
                    if c.get('t') == 's': raw = shared[int(raw)]
                    elif c.get('t') == 'inlineStr': raw = ''.join(x.text or '' for x in c.iter(NS+'t'))
                    cells[index-1] = raw
                rows.append(cells)
        if not rows or rows[0].get(0) != '姓名': raise ValueError('首列必须是“姓名”，请使用导出的模板')
        result = []
        for row in rows[1:]:
            if not any(str(v).strip() for v in row.values()): continue
            split = lambda s: [x.strip() for x in re.split(r'[\n;；]', s) if x.strip()]
            result.append(clean({'name': row.get(0,''), 'phones':split(row.get(1,'')), 'emails':split(row.get(2,'')), 'company':row.get(3,''), 'address':row.get(4,''), 'note':row.get(5,''), 'favorite':row.get(6,'').strip().lower() in ('是','yes','true','1')}))
        return result
    except (zipfile.BadZipFile, KeyError, ET.ParseError, IndexError, TypeError) as e:
        raise ValueError('无法读取此 Excel 文件，请使用 .xlsx 格式和指定模板') from e

store = Store(DATA)
class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data, kind='application/json; charset=utf-8', headers=None):
        if isinstance(data, (dict,list)): data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status); self.send_header('Content-Type', kind); self.send_header('Content-Length', str(len(data)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        for k,v in (headers or {}).items(): self.send_header(k,v)
        self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/api/contacts':
            q = parse_qs(u.query); return self.respond(200, store.list(q.get('q',[''])[0], q.get('favorite',[''])[0]=='1'))
        if u.path == '/api/export': return self.respond(200, export_xlsx(store.list()), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {'Content-Disposition':'attachment; filename="contacts.xlsx"'})
        files = {'/':('index.html','text/html; charset=utf-8'), '/style.css':('style.css','text/css; charset=utf-8'), '/app.js':('app.js','text/javascript; charset=utf-8')}
        if u.path in files:
            name, kind = files[u.path]; return self.respond(200, (ROOT / 'static' / name).read_bytes(), kind)
        self.respond(404, {'error':'未找到资源'})
    def body(self):
        n = int(self.headers.get('Content-Length','0'))
        if n > 5_000_000: raise ValueError('文件过大（上限 5 MB）')
        return self.rfile.read(n)
    def mutate(self):
        path = urlparse(self.path).path
        if self.command == 'POST' and path == '/api/import': return self.respond(200, {'count':store.add_many(import_xlsx(self.body()))})
        if self.command == 'POST' and path == '/api/contacts': return self.respond(201, store.create(json.loads(self.body())))
        if path.startswith('/api/contacts/'):
            identifier = path.rsplit('/',1)[-1]
            if self.command == 'PUT': return self.respond(200, store.update(identifier,json.loads(self.body())))
            if self.command == 'DELETE': store.delete(identifier); return self.respond(200, {'ok':True})
        self.respond(404, {'error':'未找到资源'})
    def dispatch(self):
        try: self.mutate()
        except (ValueError, json.JSONDecodeError) as e: self.respond(400, {'error':str(e)})
        except KeyError: self.respond(404, {'error':'联系人不存在'})
    do_POST = do_PUT = do_DELETE = dispatch

if __name__ == '__main__':
    port = int(os.environ.get('ADDRESSBOOK_PORT', '8765'))
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print(f'通讯录已启动：http://127.0.0.1:{port}  （按 Ctrl+C 停止）', flush=True)
    if os.environ.get('ADDRESSBOOK_NO_BROWSER') != '1': webbrowser.open(f'http://127.0.0.1:{port}')
    server.serve_forever()
