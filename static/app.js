const $ = selector => document.querySelector(selector);
const byId = id => document.getElementById(id);
const TYPE_NAMES = {phone:'电话', email:'邮箱', social:'社交账号', address:'地址', other:'其他'};
const TYPE_ORDER = ['phone','email','social','address','other'];
let contacts = [];
let filter = 'all';
let editing = null;
let detailId = null;
let detailTrigger = null;
let editorTrigger = null;
let pendingImport = null;
let composingSearch = false;
const staticMode = location.protocol === 'https:' || new URLSearchParams(location.search).get('storage') === 'browser';
const LOCAL_KEY = 'renjian-addressbook.contacts.v1';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function localContacts() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('本地联系人数据格式异常，未修改现有内容。');
  return parsed.map(person => ({
    ...person,
    id:person.id || crypto.randomUUID(),
    favorite:!!person.favorite,
    methods:Array.isArray(person.methods) ? person.methods : [
      ...(person.phones || []).map(value=>({type:'phone',label:'',value})),
      ...(person.emails || []).map(value=>({type:'email',label:'',value})),
      ...(person.address ? [{type:'address',label:'',value:person.address}] : []),
    ],
  }));
}
function writeLocalContacts(items) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); }
  catch { throw new Error('浏览器存储空间不足或不可用。请先导出 Excel 备份并释放空间。'); }
}
async function localRequest(url, options = {}) {
  const path = new URL(url, location.href).pathname;
  const method = options.method || 'GET';
  if (path === '/api/contacts' && method === 'GET') return localContacts();
  if (path === '/api/contacts' && method === 'POST') {
    const person = JSON.parse(options.body || '{}');
    if (!person.name?.trim()) throw new Error('请填写联系人姓名。');
    const items = localContacts();
    const saved = {...person,id:crypto.randomUUID(),name:person.name.trim()};
    items.push(saved); writeLocalContacts(items); return saved;
  }
  const personMatch = path.match(/^\/api\/contacts\/([^/]+)$/);
  if (personMatch) {
    const id = decodeURIComponent(personMatch[1]), items = localContacts(), index = items.findIndex(item=>item.id===id);
    if (index < 0) throw new Error('找不到这位联系人。');
    if (method === 'PUT') { const next={...JSON.parse(options.body||'{}'),id}; if(!next.name?.trim()) throw new Error('请填写联系人姓名。'); items[index]=next; writeLocalContacts(items); return next; }
    if (method === 'DELETE') { items.splice(index,1); writeLocalContacts(items); return {ok:true}; }
  }
  if (path === '/api/import/preview' && method === 'POST') {
    const records=await AddressBookXlsx.importFile(options.body);
    return {count:records.length,preview:records.slice(0,8).map(person=>({name:person.name,phones:person.phones?.length||0,emails:person.emails?.length||0,favorite:person.favorite})),duplicatePolicy:'追加导入，不自动去重',records};
  }
  if (path === '/api/import' && method === 'POST') {
    const records=await AddressBookXlsx.importFile(options.body), items=localContacts();
    items.push(...records); writeLocalContacts(items); return {count:records.length};
  }
  throw new Error('不支持此操作。');
}
async function request(url, options = {}) {
  if (staticMode) return localRequest(url, options);
  const response = await fetch(url, options);
  let body;
  try { body = await response.json(); } catch { body = {}; }
  if (!response.ok) throw new Error(body.error || '操作没有完成，请重试');
  return body;
}
function toast(message) {
  const el = byId('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
}
function methodsOf(person) {
  if (Array.isArray(person.methods)) return person.methods.filter(method => method?.value);
  return [
    ...(person.phones || []).map(value => ({type:'phone', label:'', value})),
    ...(person.emails || []).map(value => ({type:'email', label:'', value})),
    ...(person.address ? [{type:'address', label:'', value:person.address}] : []),
  ];
}
function searchableText(person) {
  return [person.name, person.company, person.note, ...methodsOf(person).map(method => `${method.label || ''} ${method.value}`)].join(' ').toLocaleLowerCase();
}
async function refresh() {
  try {
    contacts = await request('/api/contacts');
    byId('load-error').hidden = true;
    render();
    if (detailId) {
      const current = contacts.find(person => person.id === detailId);
      if (current && byId('detail-dialog').open) showDetails(current, detailTrigger, false);
    }
  } catch (error) {
    byId('load-error').hidden = false;
    byId('empty').hidden = true;
    toast(error.message);
  }
}
function render() {
  const query = byId('search').value.trim().toLocaleLowerCase();
  const shown = contacts.filter(person => (filter !== 'favorites' || person.favorite) && (!query || searchableText(person).includes(query)));
  byId('all-count').textContent = String(contacts.length);
  byId('summary-total').textContent = String(contacts.length);
  const favoriteCount = contacts.filter(person => person.favorite).length;
  byId('favorite-count').textContent = String(favoriteCount);
  byId('summary-star').textContent = String(favoriteCount);
  byId('visible-count').textContent = String(shown.length);
  byId('title').textContent = filter === 'all' ? '全部联系人' : '星标联系人';
  byId('subtitle').textContent = filter === 'all' ? '所有值得记住的人，都在这里。' : '把常联系的人，放在更近的地方。';
  byId('empty').hidden = shown.length > 0 || byId('load-error').hidden === false;
  const emptyTitle = query ? '没有找到联系人' : filter === 'favorites' && contacts.length ? '还没有星标联系人' : '这里还是空的';
  byId('empty').querySelector('h3').textContent = emptyTitle;
  byId('empty').querySelector('p').textContent = query ? '换个关键词再试试，或清空搜索恢复列表。' : filter === 'favorites' && contacts.length ? '在联系人旁点亮星标，常联系的人就会留在这里。' : '添加一位联系人，让故事从这里开始。';
  byId('empty-add').hidden = !!query;
  byId('list').innerHTML = shown.map(person => {
    const methods = methodsOf(person);
    const first = methods[0];
    const second = methods[1];
    const preview = first ? `${TYPE_NAMES[first.type] || '联系方式'}${first.label ? ` · ${first.label}` : ''}：${first.value}` : '还没有联系方式';
    const secondary = second ? `另有 ${methods.length - 1} 项联系方式` : (person.company || '打开查看详情');
    return `<article class="person" role="listitem" data-id="${esc(person.id)}">
      <button type="button" class="person-main" data-open="${esc(person.id)}" aria-label="查看 ${esc(person.name)} 的联系人详情">
        <span class="identity"><span class="avatar" aria-hidden="true">${esc(Array.from(person.name)[0] || '人')}</span><span class="identity-copy"><strong>${esc(person.name)}</strong><small>${person.favorite ? '星标联系人' : '联系人'}</small></span></span>
        <span class="detail-preview"><strong>${esc(preview)}</strong><small>${esc(secondary)}</small></span>
        <span class="company-preview"><strong>${esc(person.company || '—')}</strong><small>${esc(person.note || '暂无备注')}</small></span>
      </button>
      <button type="button" class="star ${person.favorite ? 'on' : ''}" data-star="${esc(person.id)}" aria-label="${person.favorite ? '取消' : '加入'} ${esc(person.name)}的星标" aria-pressed="${person.favorite ? 'true' : 'false'}"><span aria-hidden="true">${person.favorite ? '★' : '☆'}</span><span class="sr-only">${person.favorite ? '已星标' : '未星标'}</span></button>
    </article>`;
  }).join('');
}
function addMethodRow(method = {}) {
  const row = document.createElement('div');
  row.className = 'method-row';
  const selectedType = TYPE_ORDER.includes(method.type) ? method.type : 'phone';
  row.innerHTML = `<label>类型<select class="method-type" aria-label="联系方式类型">${TYPE_ORDER.map(type => `<option value="${type}" ${type === selectedType ? 'selected' : ''}>${TYPE_NAMES[type]}</option>`).join('')}</select></label>
    <label class="method-tag">标签<input class="method-label" maxlength="40" value="${esc(method.label || '')}" placeholder="个人 / 工作"></label>
    <label class="method-value">联系信息<input class="method-entry" maxlength="500" value="${esc(method.value || '')}" placeholder="电话、邮箱或账号"></label>
    <button type="button" class="remove-method" aria-label="删除这条联系方式">×</button>`;
  byId('method-rows').append(row);
}
function openEditor(person = null, trigger = document.activeElement) {
  editing = person?.id || null;
  editorTrigger = trigger;
  const form = byId('form');
  form.reset();
  byId('form-title').textContent = person ? '编辑联系人' : '新建联系人';
  byId('delete-contact').hidden = !person;
  byId('name-error').hidden = true;
  byId('methods-error').hidden = true;
  byId('method-rows').replaceChildren();
  if (person) {
    form.elements.name.value = person.name;
    form.elements.company.value = person.company || '';
    form.elements.note.value = person.note || '';
    form.elements.favorite.checked = !!person.favorite;
    methodsOf(person).forEach(addMethodRow);
  } else {
    addMethodRow({type:'phone'});
    addMethodRow({type:'email'});
  }
  byId('editor-dialog').showModal();
  form.elements.name.focus();
}
function closeEditor() {
  byId('editor-dialog').close();
  if (editorTrigger?.isConnected) editorTrigger.focus();
  else byId('add').focus();
}
function showDetails(person, trigger = document.activeElement, open = true) {
  detailId = person.id;
  if (trigger) detailTrigger = trigger;
  const methods = methodsOf(person);
  byId('detail-panel').innerHTML = `<header class="detail-head"><div><span class="eyebrow">A NOTE ABOUT SOMEONE</span><h2 id="detail-name">${esc(person.name)}</h2><p>${esc(person.company || '一位值得记住的人')}</p></div><button type="button" class="close" data-close-detail aria-label="关闭联系人详情">×</button></header>
    <div class="detail-actions"><button type="button" class="outline detail-favorite" data-detail-favorite aria-pressed="${person.favorite ? 'true' : 'false'}"><span aria-hidden="true">${person.favorite ? '★' : '☆'}</span> ${person.favorite ? '已加入星标' : '加入星标'}</button><button type="button" class="primary" data-edit-contact>编辑联系人</button></div>
    <section class="detail-section"><h3>联系方式 <span>${methods.length}</span></h3>${methods.length ? `<div class="method-list">${methods.map(method => `<div class="detail-method"><div><span class="method-kind">${esc(TYPE_NAMES[method.type] || '联系方式')}</span>${method.label ? `<span class="method-tag-value">${esc(method.label)}</span>` : ''}<p>${esc(method.value)}</p></div><button type="button" class="outline copy-method" data-copy="${esc(method.value)}" aria-label="复制${esc(TYPE_NAMES[method.type] || '联系方式')} ${esc(method.value)}">复制</button></div>`).join('')}</div>` : '<p class="muted">还没有添加联系方式。</p>'}</section>
    <section class="detail-section"><h3>公司与备注</h3><dl class="detail-meta"><div><dt>公司</dt><dd>${esc(person.company || '—')}</dd></div><div><dt>备注</dt><dd>${esc(person.note || '—')}</dd></div></dl></section>`;
  if (open) byId('detail-dialog').showModal();
}
function getDetailTrigger() {
  if (detailTrigger?.isConnected) return detailTrigger;
  const replacement = byId('list').querySelector(`[data-open="${CSS.escape(detailId)}"]`);
  return replacement || document.querySelector('.nav.active') || byId('add');
}
async function saveFavorite(person) {
  try {
    const detail = byId('detail-dialog');
    const fromDetails = detail.open && detailId === person.id;
    await request(`/api/contacts/${encodeURIComponent(person.id)}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...person, favorite:!person.favorite})});
    await refresh();
    if (fromDetails && detail.open && detailId === person.id) {
      const button = byId('detail-panel').querySelector('[data-detail-favorite]');
      button.classList.add('pop');
      button.focus({preventScroll:true});
    } else if (!fromDetails && !detail.open && !byId('editor-dialog').open && !byId('import-dialog').open) {
      const replacement = byId('list').querySelector(`[data-star="${CSS.escape(person.id)}"]`);
      replacement?.classList.add('pop');
      (replacement || document.querySelector('.nav.active'))?.focus({preventScroll:true});
    }
    toast(person.favorite ? '已取消星标' : '已加入星标');
  } catch (error) { toast(error.message); }
}
async function copyValue(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast('已复制联系方式');
  } catch { toast('浏览器未允许复制，请手动选择这条信息'); }
}

byId('add').addEventListener('click', event => openEditor(null, event.currentTarget));
byId('empty-add').addEventListener('click', event => openEditor(null, event.currentTarget));
byId('close-editor').addEventListener('click', closeEditor);
byId('cancel-editor').addEventListener('click', closeEditor);
byId('add-method').addEventListener('click', () => {
  addMethodRow();
  byId('method-rows').lastElementChild?.querySelector('select')?.focus();
});
byId('method-rows').addEventListener('click', event => {
  const remove = event.target.closest('.remove-method');
  if (remove) {
    const row = remove.closest('.method-row');
    const focusTarget = row.previousElementSibling?.querySelector('select') || row.nextElementSibling?.querySelector('select') || byId('add-method');
    row.remove();
    byId('methods-error').hidden = true;
    focusTarget.focus();
  }
});
byId('form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  if (!name) {
    byId('name-error').textContent = '请填写联系人姓名。';
    byId('name-error').hidden = false;
    form.elements.name.focus();
    return;
  }
  const methods = Array.from(document.querySelectorAll('.method-row')).map(row => ({
    type:row.querySelector('.method-type').value,
    label:row.querySelector('.method-label').value.trim(),
    value:row.querySelector('.method-entry').value.trim(),
  })).filter(method => method.value);
  const person = {
    name, methods,
    phones:methods.filter(method => method.type === 'phone').map(method => method.value),
    emails:methods.filter(method => method.type === 'email').map(method => method.value),
    address:methods.find(method => method.type === 'address')?.value || '',
    company:form.elements.company.value.trim(), note:form.elements.note.value.trim(), favorite:form.elements.favorite.checked,
  };
  const submit = form.querySelector('[type="submit"]');
  const editingId = editing;
  submit.disabled = true;
  submit.textContent = '正在保存…';
  byId('name-error').hidden = true;
  byId('methods-error').hidden = true;
  try {
    const saved = await request(editingId ? `/api/contacts/${encodeURIComponent(editingId)}` : '/api/contacts', {
      method:editingId ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(person),
    });
    byId('editor-dialog').close();
    await refresh();
    toast('联系人已保存');
    const replacement = byId('list').querySelector(`[data-open="${saved.id}"]`);
    if (replacement) replacement.focus();
    else byId('add').focus();
  } catch (error) {
    byId('name-error').textContent = error.message;
    byId('name-error').hidden = false;
    form.elements.name.focus();
  } finally {
    submit.disabled = false;
    submit.textContent = '保存联系人';
  }
});
byId('delete-contact').addEventListener('click', async () => {
  if (!editing || !confirm('确定删除这位联系人吗？此操作无法撤销。')) return;
  const button = byId('delete-contact');
  button.disabled = true;
  try {
    await request(`/api/contacts/${encodeURIComponent(editing)}`, {method:'DELETE'});
    byId('editor-dialog').close();
    await refresh();
    toast('联系人已删除');
    if (editorTrigger?.isConnected) editorTrigger.focus();
    else byId('add').focus();
  } catch (error) { byId('name-error').textContent = error.message; byId('name-error').hidden = false; }
  finally { button.disabled = false; }
});
byId('list').addEventListener('click', event => {
  const star = event.target.closest('[data-star]');
  if (star) {
    const person = contacts.find(item => item.id === star.dataset.star);
    if (person) saveFavorite(person);
    return;
  }
  const open = event.target.closest('[data-open]');
  if (open) {
    const person = contacts.find(item => item.id === open.dataset.open);
    if (person) showDetails(person, open);
  }
});
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('.nav').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  render();
}));
byId('search').addEventListener('compositionstart', () => { composingSearch = true; });
byId('search').addEventListener('compositionend', () => { composingSearch = false; render(); });
byId('search').addEventListener('input', () => { if (!composingSearch) render(); });
byId('retry-load').addEventListener('click', refresh);
byId('detail-dialog').addEventListener('close', event => {
  if (!event.currentTarget.open && !byId('editor-dialog').open) {
    getDetailTrigger().focus({preventScroll:true});
  }
});
byId('detail-panel').addEventListener('click', event => {
  if (event.target.closest('[data-close-detail]')) {
    byId('detail-dialog').close();
    return;
  }
  if (event.target.closest('[data-detail-favorite]')) {
    const person = contacts.find(item => item.id === detailId);
    if (person) saveFavorite(person);
  }
  if (event.target.closest('[data-edit-contact]')) {
    const person = contacts.find(item => item.id === detailId);
    const trigger = getDetailTrigger();
    byId('detail-dialog').close();
    if (person) openEditor(person, trigger);
  }
  const copy = event.target.closest('[data-copy]');
  if (copy) copyValue(copy.dataset.copy);
});
byId('import-btn').addEventListener('click', () => byId('file').click());
byId('file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  byId('import-error').hidden = true;
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    byId('import-error').textContent = '请选择 .xlsx 文件；旧版 .xls 暂不支持。';
    byId('import-error').hidden = false;
    byId('confirm-import').disabled = true;
    byId('import-dialog').showModal();
    event.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    byId('import-error').textContent = '文件超过 5 MB，请拆分后再导入。';
    byId('import-error').hidden = false;
    byId('confirm-import').disabled = true;
    byId('import-dialog').showModal();
    event.target.value = '';
    return;
  }
  const button = byId('import-btn');
  button.disabled = true;
  button.textContent = '正在读取…';
  try {
    const result = await request('/api/import/preview', {method:'POST', headers:{'Content-Type':'application/octet-stream'}, body:file});
    pendingImport = file;
    byId('import-summary').textContent = `识别到 ${result.count} 位联系人。`;
    byId('import-rows').innerHTML = result.preview.length ? result.preview.map((person, index) => `<div class="import-row"><span class="import-index">${index + 1}</span><strong>${esc(person.name)}</strong><small>${person.phones} 个电话 · ${person.emails} 个邮箱${person.favorite ? ' · 星标' : ''}</small></div>`).join('') : '<p class="muted">文件中没有可导入的联系人行。</p>';
    byId('confirm-import').disabled = result.count === 0;
    byId('import-dialog').showModal();
  } catch (error) {
    byId('import-error').textContent = error.message;
    byId('import-error').hidden = false;
    byId('confirm-import').disabled = true;
    byId('import-dialog').showModal();
  } finally {
    button.disabled = false;
    button.innerHTML = '<span aria-hidden="true">↑</span> 导入';
  }
});
async function closeImport() {
  byId('import-dialog').close();
  byId('file').value = '';
  pendingImport = null;
  byId('import-error').hidden = true;
}
byId('import-dialog').addEventListener('close', () => {
  byId('file').value = '';
  pendingImport = null;
});
byId('close-import').addEventListener('click', closeImport);
byId('cancel-import').addEventListener('click', closeImport);
byId('confirm-import').addEventListener('click', async () => {
  if (!pendingImport) return;
  const button = byId('confirm-import');
  button.disabled = true;
  button.textContent = '正在导入…';
  byId('import-error').hidden = true;
  try {
    const result = await request('/api/import', {method:'POST', headers:{'Content-Type':'application/octet-stream'}, body:pendingImport});
    await closeImport();
    await refresh();
    toast(`已导入 ${result.count} 位联系人`);
  } catch (error) {
    byId('import-error').textContent = error.message;
    byId('import-error').hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = '确认导入';
  }
});
byId('export-btn').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span aria-hidden="true">↓</span> 正在导出…';
  try {
    if (staticMode) {
      const blob = new Blob([AddressBookXlsx.exportFile(contacts)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = 'contacts.xlsx';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`已导出 ${contacts.length} 位联系人`);
      return;
    }
    const response = await fetch('/api/export');
    if (!response.ok) throw new Error('导出没有完成，请重试。');
    const blob = await response.blob();
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'contacts.xlsx';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`已导出 ${contacts.length} 位联系人`);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.innerHTML = '<span aria-hidden="true">↓</span> 导出'; }
});

if (staticMode) byId('privacy-note').textContent = '公开网页 · 联系人只保存在此浏览器，不会上传或在设备间同步。';
else byId('privacy-note').textContent = '本地通讯录 · 数据保存在此电脑，可随时导出 Excel 备份。';

refresh();
