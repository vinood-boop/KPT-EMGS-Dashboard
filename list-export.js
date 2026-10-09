/* Local Excel export: OOXML worksheets in a standards-compliant ZIP container. */
(() => {
  const titles = { universities: 'Universities', programmes: 'Programme Approvals', applications: 'Applications' };
  let activeTable, returnFocus;
  const modal = document.createElement('div');
  modal.className = 'request-modal list-export-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="request-modal-card" role="dialog" aria-modal="true" aria-labelledby="listExportTitle"><div class="modal-head"><h3 id="listExportTitle">Download list</h3><button class="modal-close" type="button" data-export-close aria-label="Close download options">&times;</button></div><p id="listExportSummary"></p><div class="list-export-selection"><span>Choose columns</span><button type="button" data-export-select="all">Select all</button><button type="button" data-export-select="none">Clear</button></div><div class="list-export-columns"></div><p class="list-export-hint">Excel workbook (.xlsx) with formatted headers, filters and a frozen header row.</p><div class="modal-actions"><button type="button" data-export-close>Cancel</button><button type="button" class="primary" id="downloadSelectedList">Download Excel</button></div></section>`;
  document.body.append(modal);
  const visibleRows = table => [...table.tBodies[0].rows].filter(row => !row.hidden);
  const columns = table => [...table.tHead.rows[0].cells].map((cell,index) => {
    const copy = cell.cloneNode(true); copy.querySelectorAll('button, .section-tooltip').forEach(item=>item.remove());
    return { index, title: copy.textContent.trim() };
  }).filter(column => column.title.toLowerCase() !== 'action');
  const close = () => { modal.hidden = true; returnFocus?.focus({preventScroll:true}); };
  const update = () => { modal.querySelector('#downloadSelectedList').disabled = !modal.querySelector('input:checked') || !visibleRows(activeTable).length; };
  Object.keys(titles).forEach(key => {
    const table = document.querySelector(`[data-table="${key}"]`);
    const toolbar = document.createElement('div'); toolbar.className='list-export-toolbar';
    toolbar.innerHTML=`<button class="list-export-icon" type="button" aria-label="Download ${titles[key]} list as Excel" aria-haspopup="dialog" aria-describedby="${key}ExportTooltip"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 21H4V3h10l4 4v4M14 3v5h4M7 11h5M7 15h5M9.5 11v7M17 13v8m-3-3 3 3 3-3"/></svg><span class="list-export-tooltip" id="${key}ExportTooltip" role="tooltip">Download Excel list</span></button>`;
    const filters = table.closest('[data-view]').querySelector('.filters');
    filters.classList.add('has-list-export');
    filters.append(toolbar);
    toolbar.firstChild.addEventListener('click', event => {
      activeTable=table; returnFocus=event.currentTarget;
      modal.querySelector('#listExportTitle').textContent=`Download ${titles[key].toLowerCase()}`;
      modal.querySelector('#listExportSummary').textContent=`Choose the table columns to include. ${visibleRows(table).length} records matching your current filters will be downloaded.`;
      modal.querySelector('.list-export-columns').innerHTML=columns(table).map(column=>`<label><input type="checkbox" value="${column.index}" checked><span>${escapeHtml(column.title)}</span></label>`).join('');
      modal.hidden=false; update(); modal.querySelector('input').focus();
    });
  });
  modal.addEventListener('change',update);
  modal.addEventListener('click',event=>{
    if(event.target===modal || event.target.closest('[data-export-close]')) close();
    const select=event.target.closest('[data-export-select]');
    if(select){modal.querySelectorAll('input').forEach(input=>input.checked=select.dataset.exportSelect==='all');update();}
  });
  modal.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
      const items=[...modal.querySelectorAll('button:not(:disabled),input')];const first=items[0],last=items.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  modal.querySelector('#downloadSelectedList').addEventListener('click',()=>{
    const chosen=new Set([...modal.querySelectorAll('input:checked')].map(input=>Number(input.value)));
    const selected=columns(activeTable).filter(column=>chosen.has(column.index));
    if(!selected.length || !visibleRows(activeTable).length)return;
    const records=visibleRows(activeTable).map(row=>selected.map(column=>{
      const cell=row.cells[column.index];
      const copy=cell.cloneNode(true);copy.querySelectorAll('img,button,.section-tooltip').forEach(item=>item.remove());
      copy.querySelectorAll('small').forEach(item=>item.before(document.createTextNode('\n')));
      return copy.textContent.trim();
    }));
    const key=activeTable.dataset.table;
    const blob=excelWorkbook(titles[key],selected.map(column=>column.title),records);
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${key}-${new Date().toISOString().slice(0,10)}.xlsx`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);close();
  });

  function excelWorkbook(title,headers,records){
    const xml=value=>String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    const col=index=>{let value='';for(index++;index;index=Math.floor((index-1)/26))value=String.fromCharCode(65+(index-1)%26)+value;return value;};
    const end=`${col(headers.length-1)}${records.length+1}`;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const cell=(value,r,c)=>{
      let style=r===0?1:r%2===0?3:2; let numeric=null;
      if(r && ['Programmes','Applicants'].includes(headers[c]) && /^\d+$/.test(value)){numeric=Number(value);style=r%2===0?7:6;}
      const date=r && /date|submitted|last activity|last updated/i.test(headers[c]) && /^(\d{1,2}) (\w{3,4}) (\d{4})$/.exec(value);
      if(date){const month=months.indexOf(date[2].slice(0,3));if(month>=0){numeric=(Date.UTC(Number(date[3]),month,Number(date[1]))-Date.UTC(1899,11,30))/86400000;style=r%2===0?5:4;}}
      const ref=`${col(c)}${r+1}`;
      return numeric!==null?`<c r="${ref}" s="${style}"><v>${numeric}</v></c>`:`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    };
    const rows=[headers,...records].map((values,r)=>{const height=r===0?32:Math.max(30,...values.map((value,c)=>{const width=['University','Programme','Applicant'].includes(headers[c])?42:26;return Math.max(...String(value).split('\n').map(line=>Math.ceil(line.length/width)))*(String(value).split('\n').length)*15+10;}));return `<row r="${r+1}" ht="${height}" customHeight="1">${values.map((value,c)=>cell(value,r,c)).join('')}</row>`;}).join('');
    const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const fonts='<fonts count="2"><font><sz val="11"/><color rgb="FF172536"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>';
    const fills='<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF172536"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F2"/><bgColor indexed="64"/></patternFill></fill></fills>';
    const xf=(font,fill,num=0,align='left')=>`<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`;
    const files={
      '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(title)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml':`<styleSheet xmlns="${ns}"><numFmts count="1"><numFmt numFmtId="164" formatCode="d mmm yyyy"/></numFmts>${fonts}${fills}<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8">${xf(0,0)}${xf(1,2,0,'center')}${xf(0,0)}${xf(0,3)}${xf(0,0,164)}${xf(0,3,164)}${xf(0,0,3,'right')}${xf(0,3,3,'right')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      'xl/worksheets/sheet1.xml':`<worksheet xmlns="${ns}"><dimension ref="A1:${end}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>${headers.map((header,c)=>`<col min="${c+1}" max="${c+1}" width="${['University','Programme','Applicant'].includes(header)?44:28}" customWidth="1"/>`).join('')}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${end}"/><printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>`
    };
    return zip(files);
  }
  function zip(files){
    const encoder=new TextEncoder(),parts=[],directory=[];let offset=0;
    const header=(size)=>({bytes:new Uint8Array(size),view:null});
    const crc=bytes=>{let value=0xffffffff;for(const byte of bytes){value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;};
    for(const [path,xml] of Object.entries(files)){
      const name=encoder.encode(path),data=encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+xml),sum=crc(data);
      const local=header(30);local.view=new DataView(local.bytes.buffer);const v=local.view;v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,sum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);parts.push(local.bytes,name,data);
      const central=header(46);const c=new DataView(central.bytes.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,sum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);directory.push(central.bytes,name);offset+=30+name.length+data.length;
    }
    const length=directory.reduce((sum,item)=>sum+item.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,Object.keys(files).length,true);e.setUint16(10,Object.keys(files).length,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);
    return new Blob([...parts,...directory,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
})();
