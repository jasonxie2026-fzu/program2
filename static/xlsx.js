/* Buildless XLSX support for the public, browser-local edition. XLSX cells are
   written as inline strings; imports accept shared strings and deflate/store ZIPs. */
(() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const TYPE_LABELS = {phone:'电话', email:'邮箱', social:'社交方式', address:'地址', other:'其他方式'};
  const TYPES = ['phone', 'email', 'social', 'address', 'other'];
  const xml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const colName = index => { let result=''; for (index++; index; index=Math.floor((index-1)/26)) result=String.fromCharCode(65+(index-1)%26)+result; return result; };
  const cellText = value => `<c t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  const crcTable = (() => { const table = new Uint32Array(256); for (let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;} return table; })();
  function crc32(bytes) { let crc=0xffffffff; for (const byte of bytes) crc=crcTable[(crc^byte)&255]^(crc>>>8); return (crc^0xffffffff)>>>0; }
  function zipStore(files) {
    const local=[], central=[]; let offset=0;
    for (const [name, content] of Object.entries(files)) {
      const nameBytes=encoder.encode(name), data=encoder.encode(content), crc=crc32(data), header=new Uint8Array(30+nameBytes.length), view=new DataView(header.buffer);
      view.setUint32(0,0x04034b50,true); view.setUint16(4,20,true); view.setUint16(6,0x0800,true); view.setUint16(8,0,true); view.setUint32(14,crc,true); view.setUint32(18,data.length,true); view.setUint32(22,data.length,true); view.setUint16(26,nameBytes.length,true); header.set(nameBytes,30); local.push(header,data);
      const c=new Uint8Array(46+nameBytes.length), cv=new DataView(c.buffer); cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true); cv.setUint16(8,0x0800,true); cv.setUint16(10,0,true); cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true); cv.setUint16(28,nameBytes.length,true); cv.setUint32(42,offset,true); c.set(nameBytes,46); central.push(c); offset += header.length+data.length;
    }
    const centralSize=central.reduce((sum,b)=>sum+b.length,0), end=new Uint8Array(22), ev=new DataView(end.buffer); ev.setUint32(0,0x06054b50,true); ev.setUint16(8,central.length,true); ev.setUint16(10,central.length,true); ev.setUint32(12,centralSize,true); ev.setUint32(16,offset,true);
    const all=[...local,...central,end], total=all.reduce((sum,b)=>sum+b.length,0), result=new Uint8Array(total); let cursor=0; for(const bytes of all){result.set(bytes,cursor);cursor+=bytes.length;} return result;
  }
  async function unzip(bytes) {
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); let end=-1;
    for(let i=Math.max(0,bytes.length-65557);i<=bytes.length-22;i++) if(view.getUint32(i,true)===0x06054b50) end=i;
    if(end<0) throw new Error('文件不是有效的 .xlsx 工作簿');
    const count=view.getUint16(end+10,true), start=view.getUint32(end+16,true), files=new Map(); let at=start, total=0;
    for(let i=0;i<count;i++) {
      if(view.getUint32(at,true)!==0x02014b50) throw new Error('无法读取 Excel 压缩目录');
      const method=view.getUint16(at+10,true), packed=view.getUint32(at+20,true), raw=view.getUint32(at+24,true), nameLen=view.getUint16(at+28,true), extraLen=view.getUint16(at+30,true), commentLen=view.getUint16(at+32,true), localOffset=view.getUint32(at+42,true);
      const name=decoder.decode(bytes.subarray(at+46,at+46+nameLen)); at+=46+nameLen+extraLen+commentLen; total+=raw;
      if(total>20_000_000) throw new Error('Excel 解压后超过 20 MB，请拆分文件后重试');
      if(!['[Content_Types].xml','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/sharedStrings.xml'].includes(name) && !/^xl\/worksheets\/[^/]+\.xml$/.test(name)) continue;
      const localNameLen=view.getUint16(localOffset+26,true), localExtraLen=view.getUint16(localOffset+28,true), dataAt=localOffset+30+localNameLen+localExtraLen, packedData=bytes.subarray(dataAt,dataAt+packed);
      if(method===0) files.set(name,packedData);
      else if(method===8 && typeof DecompressionStream==='function') {
        const stream=new Blob([packedData]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        files.set(name,await awaitResponse(stream));
      } else if(method===8) throw new Error('当前浏览器不支持读取压缩 Excel，请用本应用导出的工作簿或更新浏览器');
      else throw new Error('Excel 使用了暂不支持的 ZIP 压缩方式');
    }
    return files;
  }
  // The ZIP entries are extracted asynchronously so native browser decompression stays streaming.
  async function awaitResponse(stream) { return new Uint8Array(await new Response(stream).arrayBuffer()); }
  function textOf(node) { return Array.from(node.getElementsByTagNameNS('*','t')).map(item=>item.textContent||'').join(''); }
  function parseSheet(files) {
    const get = name => files.has(name) ? decoder.decode(files.get(name)) : '';
    const workbook = new DOMParser().parseFromString(get('xl/workbook.xml'),'application/xml');
    const rels = new DOMParser().parseFromString(get('xl/_rels/workbook.xml.rels'),'application/xml');
    const sheet = workbook.getElementsByTagNameNS('*','sheet')[0];
    if(!sheet) throw new Error('工作簿中没有联系人表格');
    const relationship = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id') || sheet.getAttribute('r:id');
    const rel = Array.from(rels.getElementsByTagNameNS('*','Relationship')).find(item=>item.getAttribute('Id')===relationship);
    if(!rel) throw new Error('无法定位 Excel 工作表');
    const target=rel.getAttribute('Target')||'';
    const sheetPath=new URL(target,'https://renjian.invalid/xl/workbook.xml').pathname.slice(1);
    const doc=new DOMParser().parseFromString(get(sheetPath),'application/xml');
    if(doc.getElementsByTagName('parsererror').length) throw new Error('无法解析 Excel 工作表内容');
    const sharedDoc=get('xl/sharedStrings.xml') ? new DOMParser().parseFromString(get('xl/sharedStrings.xml'),'application/xml') : null;
    const shared=sharedDoc?Array.from(sharedDoc.getElementsByTagNameNS('*','si')).map(textOf):[];
    return Array.from(doc.getElementsByTagNameNS(NS,'row')).map(row=>{
      const cells={};
      for(const cell of Array.from(row.getElementsByTagNameNS(NS,'c'))) {
        const ref=(cell.getAttribute('r')||'').match(/^[A-Z]+/); if(!ref) continue;
        const index=Array.from(ref[0]).reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0)-1;
        const type=cell.getAttribute('t'); let value='';
        if(type==='inlineStr') value=textOf(cell);
        else { const v=cell.getElementsByTagNameNS(NS,'v')[0]; value=v?.textContent||''; if(type==='s') value=shared[Number(value)]??''; }
        cells[index]=value;
      }
      return cells;
    });
  }
  function importRows(rows) {
    if(!rows.length || rows[0][0]!=='姓名') throw new Error('首列必须是“姓名”，请使用导出的模板');
    const headers=Object.fromEntries(Object.entries(rows[0]).map(([index,value])=>[String(value).trim(),Number(index)]));
    const dynamic=Object.keys(headers).some(label=>/^(电话|邮箱|社交方式|地址|其他方式)\s+\d+/.test(label)) || [0,1,2,3].map(i=>rows[0][i]).join('|')==='姓名|收藏|公司|备注';
    const result=[];
    for(const row of rows.slice(1)) {
      if(!Object.values(row).some(value=>String(value).trim())) continue;
      const split=value=>String(value||'').split(/[\n;；]/).map(x=>x.trim()).filter(Boolean);
      let methods=[];
      if(dynamic) {
        for(const [kind,label] of [['phone','电话'],['email','邮箱'],['social','社交方式'],['address','地址']]) {
          for(const [header,column] of Object.entries(headers)) {
            const match=header.match(new RegExp(`^${label}\\s+(\\d+)$`)); if(!match) continue;
            const suffix=match[1], value=String(row[column]||'').trim(), methodLabel=String(row[headers[`${label} ${suffix} 标签`]]||'').trim();
            if(value) methods.push({type:kind,label:methodLabel,value});
          }
        }
        for(const [header,column] of Object.entries(headers)) {
          const match=header.match(/^其他方式\s+(\d+)\s+类型$/); if(!match) continue;
          const suffix=match[1], type=String(row[column]||'other').trim(), value=String(row[headers[`其他方式 ${suffix}`]]||'').trim(), label=String(row[headers[`其他方式 ${suffix} 标签`]]||'').trim();
          if(value) methods.push({type:TYPES.includes(type)?type:'other',label,value});
        }
      } else {
        methods=[...split(row[1]).map(value=>({type:'phone',label:'',value})),...split(row[2]).map(value=>({type:'email',label:'',value}))];
        if(String(row[4]||'').trim()) methods.push({type:'address',label:'',value:String(row[4]).trim()});
      }
      const name=String(row[headers['姓名']??0]||'').trim();
      if(!name) continue;
      const favorite=String(row[headers['收藏']??6]||'').trim().toLowerCase();
      result.push({id:crypto.randomUUID(),name,methods,phones:methods.filter(m=>m.type==='phone').map(m=>m.value),emails:methods.filter(m=>m.type==='email').map(m=>m.value),address:methods.find(m=>m.type==='address')?.value||'',company:String(row[headers['公司']??3]||'').trim(),note:String(row[headers['备注']??5]||'').trim(),favorite:['是','yes','true','1'].includes(favorite)});
    }
    return result;
  }
  async function importFile(file) {
    const files=await unzip(new Uint8Array(await file.arrayBuffer()));
    return importRows(parseSheet(files));
  }
  function exportFile(contacts) {
    const people=contacts.map(person=>({...person,methods:Array.isArray(person.methods)?person.methods:[]}));
    const order=[['phone','电话'],['email','邮箱'],['social','社交方式'],['address','地址'],['other','其他方式']];
    const counts=Object.fromEntries(order.map(([type])=>[type,Math.max(0,...people.map(p=>p.methods.filter(m=>m.type===type).length))]));
    const headers=['姓名','收藏','公司','备注'];
    for(const [type,label] of order) for(let i=1;i<=counts[type];i++) headers.push(...(type==='other'?[`${label} ${i} 类型`,`${label} ${i}`,`${label} ${i} 标签`]:[`${label} ${i}`,`${label} ${i} 标签`]));
    const rows=[headers,...people.map(person=>{
      const row=[person.name,person.favorite?'是':'否',person.company||'',person.note||''];
      for(const [type] of order) { const values=person.methods.filter(m=>m.type===type); for(let i=0;i<counts[type];i++){const value=values[i]||{}; if(type==='other') row.push(TYPE_LABELS[value.type]||value.type||'',value.value||'',value.label||''); else row.push(value.value||'',value.label||'');} }
      return row;
    })];
    const sheet='<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rows.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>`<c r="${colName(c)}${r+1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')}</row>`).join('')+'</sheetData></worksheet>';
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="联系人" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml':sheet,
    };
    return zipStore(files);
  }
  window.AddressBookXlsx={importFile,exportFile};
})();
