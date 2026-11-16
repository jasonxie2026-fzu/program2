const $ = s => document.querySelector(s);
let contacts = [], filter = 'all', editing = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(url, opts = {}) { const res = await fetch(url, opts); if (!res.ok) { const body = await res.json(); throw new Error(body.error || '操作失败'); } return res.json(); }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); }
async function refresh() { try { contacts = await request('/api/contacts'); render(); } catch(e) { toast(e.message); } }
function render() {
  const q = $('#search').value.trim().toLowerCase();
  const shown = contacts.filter(p => (filter !== 'favorites' || p.favorite) && (!q || [p.name,p.company,p.address,p.note,...p.phones,...p.emails].join(' ').toLowerCase().includes(q)));
  $('#all-count').textContent = $('#summary-total').textContent = contacts.length;
  $('#favorite-count').textContent = $('#summary-star').textContent = contacts.filter(p => p.favorite).length;
  $('#visible-count').textContent = shown.length;
  $('#title').textContent = filter === 'all' ? '全部联系人' : '星标联系人';
  $('#subtitle').textContent = filter === 'all' ? '所有值得记住的人，都在这里。' : '把常联系的人，放在更近的地方。';
  $('#empty').hidden = shown.length > 0;
  $('#empty h3').textContent = q ? '没有找到联系人' : '这里还是空的';
  $('#empty p').textContent = q ? '换个关键词再试试。' : '添加一位联系人，让故事从这里开始。';
  $('#empty-add').hidden = !!q;
  $('#list').innerHTML = shown.map(p => `<div class="person" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="编辑 ${esc(p.name)}"><div class="identity"><span class="avatar">${esc(Array.from(p.name)[0] || '人')}</span><span><strong>${esc(p.name)}</strong><small>${p.favorite ? '星标联系人' : '联系人'}</small></span></div><div class="detail"><strong>${esc(p.phones[0] || p.emails[0] || '—')}</strong><small>${esc(p.phones.length > 1 ? `另有 ${p.phones.length-1} 个号码` : (p.emails[0] || '暂无邮箱'))}</small></div><div class="detail company"><strong>${esc(p.company || '—')}</strong><small>${esc(p.note || '暂无备注')}</small></div><button type="button" class="star ${p.favorite ? 'on' : ''}" data-star="${esc(p.id)}" aria-label="${p.favorite ? '取消星标' : '添加星标'}">${p.favorite ? '★' : '☆'}</button></div>`).join('');
}
function openForm(p = null) { editing = p?.id || null; $('#form').reset(); $('#form-title').textContent = p ? '编辑联系人' : '新建联系人'; $('#delete').hidden = !p; if (p) { for (const k of ['name','company','address','note']) $('#form').elements[k].value = p[k]; for (const k of ['phones','emails']) $('#form').elements[k].value = p[k].join('\n'); $('#form').elements.favorite.checked = p.favorite; } $('#dialog').showModal(); $('#form').elements.name.focus(); }
$('#add').onclick = $('#empty-add').onclick = () => openForm();
$('#close').onclick = $('#cancel').onclick = () => $('#dialog').close();
$('#search').oninput = render;
document.querySelectorAll('.nav').forEach(b => b.onclick = () => {filter = b.dataset.filter; document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active',x === b)); render();});
$('#list').onclick = async e => { const star = e.target.closest('[data-star]'); if (star) { e.stopPropagation(); const p = contacts.find(x => x.id === star.dataset.star); try { await request('/api/contacts/'+p.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,favorite:!p.favorite})}); await refresh(); toast(p.favorite ? '已取消星标' : '已加入星标'); } catch(err){toast(err.message);} return; } const row = e.target.closest('[data-id]'); if(row) openForm(contacts.find(x => x.id === row.dataset.id)); };
$('#list').onkeydown = e => {if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.person')) {e.preventDefault(); e.target.click();}};
$('#form').onsubmit = async e => { e.preventDefault(); const f = e.target.elements; const split = s => s.split(/[\n;；]/).map(x=>x.trim()).filter(Boolean); const p={name:f.name.value,phones:split(f.phones.value),emails:split(f.emails.value),company:f.company.value,address:f.address.value,note:f.note.value,favorite:f.favorite.checked}; try {await request(editing ? '/api/contacts/'+editing : '/api/contacts',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); $('#dialog').close(); await refresh(); toast('联系人已保存');} catch(err){toast(err.message);} };
$('#delete').onclick = async () => { if (!confirm('确定删除这位联系人吗？此操作无法撤销。')) return; try { await request('/api/contacts/'+editing,{method:'DELETE'}); $('#dialog').close(); await refresh(); toast('联系人已删除'); } catch(e){toast(e.message);} };
$('#import-btn').onclick = () => $('#file').click();
$('#file').onchange = async e => {const file=e.target.files[0]; if(!file)return; try {const result = await request('/api/import',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file}); await refresh(); toast(`已导入 ${result.count} 位联系人`);} catch(err){toast(err.message);} finally {e.target.value='';}};
refresh();
