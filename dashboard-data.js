// Dashboard summaries use complete source tables, independent of list filters.
function dashboardRecords() {
  return {
    universities: [...document.querySelectorAll('[data-table="universities"] tbody tr')],
    programmes: [...document.querySelectorAll('[data-table="programmes"] tbody tr')],
    applications: [...document.querySelectorAll('[data-table="applications"] tbody tr')]
  };
}
function dashboardDate(value) {
  const match=/^(\d{1,2}) (\w{3,4}) (\d{4})$/.exec(value || '');
  if(!match)return null;
  const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[2].slice(0,3));
  return month<0?null:Date.UTC(Number(match[3]),month,Number(match[1]));
}
function dashboardAttentionRecords() {
  const records=dashboardRecords();
  const oldest=rows=>[...rows].sort((a,b)=>(parseInt(b.cells[5].textContent)||0)-(parseInt(a.cells[5].textContent)||0))[0];
  const pending=oldest(records.programmes.filter(row=>row.dataset.status==='pending kpt approval'));
  const changes=oldest(records.programmes.filter(row=>row.dataset.status==='changes requested'));
  const delayed=records.applications.filter(row=>applicationAgeValue(row)>=60).sort((a,b)=>applicationAgeValue(b)-applicationAgeValue(a))[0];
  const university=records.universities.find(row=>['pending review','clarification requested'].includes(row.dataset.status)) || records.universities.find(row=>row.dataset.status==='account created');
  return [
    pending && {row:pending,view:'programmes',title:'Programme awaiting review',description:`${getRowTitle(pending)} — ${pending.cells[5].textContent} since submission.`,label:'Review'},
    changes && {row:changes,view:'programmes',title:'Programme changes requested',description:`${getRowTitle(changes)} — ${changes.cells[5].textContent} awaiting follow-up.`,label:'Follow up'},
    delayed && {row:delayed,view:'applications',title:'Delayed application case',description:`${delayed.cells[0].childNodes[0].textContent.trim()} (${delayed.querySelector('small').textContent}) — ${applicationAgeValue(delayed)} days since the last action.`,label:'Escalate'},
    university && {row:university,view:'universities',title:university.dataset.status==='account created'?'University awaiting activation':'University registration review',description:`${getRowTitle(university)} — ${university.cells[1].textContent.trim()}.`,label:'Review'}
  ].filter(Boolean);
}
function seedDashboardNotifications() {
  const list=document.querySelector('.notification-list');
  list.innerHTML=dashboardAttentionRecords().map(item=>`<button class="notification-item unread" type="button" data-notification-target="${item.view}" data-default-unread="true"><span class="dashboard-notification-title">${escapeHtml(item.title)}</span><span>${escapeHtml(item.description)}</span><small>${item.view==='programmes'?'Programme':item.view==='applications'?'Application':'University'} - Demo records</small></button>`).join('');
}
function renderDashboardData() {
  const panel=document.querySelector('[data-view="dashboard"]');if(!panel)return;
  const {universities,programmes,applications}=dashboardRecords();
  const snapshot=Date.UTC(2026,9,9),day=86400000,start=snapshot-6*day;
  const countries=new Map();applications.forEach(row=>{const country=row.cells[0].querySelectorAll('small')[1]?.textContent.trim() || 'Not stated';countries.set(country,(countries.get(country)||0)+1);});
  const distribution=[...countries].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const weekly=applications.filter(row=>{const date=dashboardDate(row.dataset.appliedDate);return date!==null && date>=start && date<=snapshot;}).length;
  const active=universities.filter(row=>row.dataset.status==='active').length;
  const reviewing=universities.filter(row=>['pending review','clarification requested'].includes(row.dataset.status)).length;
  const awaiting=programmes.filter(row=>['pending kpt approval','resubmitted'].includes(row.dataset.status)).length;
  const metrics=[['Registered universities',universities.length,`${active} active · ${reviewing} awaiting review`],['Programme approvals',programmes.length,`${awaiting} awaiting KPT review`],['Applications this week',weekly,`3–9 Oct 2026 · ${applications.length} total applications`],['Top source country',distribution[0]?.[0]||'No applicants',distribution.length?`${distribution[0][1]} applicants · ${(distribution[0][1]/applications.length*100).toFixed(1)}% of total`:'No application records']];
  panel.querySelectorAll('.metrics .metric').forEach((metric,index)=>{const [title,value,note]=metrics[index];metric.innerHTML=`<span>${title}</span><span class="dashboard-metric-value">${escapeHtml(value)}</span><small>${escapeHtml(note)}</small>`;});
  const chart=panel.querySelector('.bar-chart');
  const trend=Array.from({length:7},(_,index)=>{const date=start+index*day;return {date,count:applications.filter(row=>dashboardDate(row.dataset.appliedDate)===date).length};});
  const max=Math.max(1,...trend.map(item=>item.count));
  chart.closest('article').querySelector('.panel-head p').textContent='Applications by applied date, 3–9 Oct 2026.';
  chart.innerHTML=trend.map(item=>{const label=new Date(item.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});return `<div><i style="--h:${item.count/max*85}%" data-value="${item.count}" title="${label}: ${item.count} applications" aria-label="${label}: ${item.count} applications"></i><span class="dashboard-bar-value">${item.count}</span><span>${label}</span></div>`;}).join('');
  const statuses=['Pending KPT Approval','Changes Requested','Resubmitted','Approved','Rejected'],dots=['sky','peach','lavender','mint','red'];
  const counts=statuses.map(status=>programmes.filter(row=>row.dataset.status===status.toLowerCase()).length);
  const pipeline=panel.querySelector('.pipeline-list');pipeline.closest('article').querySelector('.panel-pill').textContent=`${programmes.length} total`;
  pipeline.innerHTML=statuses.map((status,index)=>`<div><i class="${dots[index]}-dot"></i><span>${status}</span><span class="dashboard-pipeline-count">${counts[index]}</span><small>${programmes.length?Math.round(counts[index]/programmes.length*100):0}%</small></div>`).join('');
  const stack=panel.querySelector('.pipeline-stack');stack.style.gridTemplateColumns=counts.filter(count=>count>0).map(count=>`${count}fr`).join(' ');stack.innerHTML=counts.map((count,index)=>`<span ${count?'':'hidden'} title="${statuses[index]}: ${count}"></span>`).join('');
  const notices=pipeline.closest('article').querySelectorAll('.notice-row');
  const lateChanges=programmes.filter(row=>row.dataset.status==='changes requested' && parseInt(row.cells[5].textContent)>7).length;
  notices[0].innerHTML=`<span>${lateChanges} change requests older than 7 days</span><button type="button" data-dashboard-filter="changes">Review</button>`;
  const accountCreated=universities.filter(row=>row.dataset.status==='account created').length;
  notices[1].innerHTML=`<span>${accountCreated} universities awaiting account activation</span><button type="button" data-dashboard-filter="accounts">Review</button>`;
  panel.querySelector('.activity-list').innerHTML=dashboardAttentionRecords().map((item,index)=>`<div><span class="dashboard-record-title">${item.title}</span><span>${escapeHtml(item.description)}</span><small>${item.view==='programmes'?'Programme':item.view==='applications'?'Application':'University'}</small><button type="button" data-dashboard-record="${index}">${item.label}</button></div>`).join('') || '<p>No items require attention.</p>';
  const countryPanel=panel.querySelector('.dashboard-country-panel');countryPanel.querySelector('h2').textContent='Source Countries';countryPanel.querySelector('.panel-head p').textContent=`${applications.length} applicants across ${countries.size} source countries.`;
  countryPanel.querySelector('.horizontal-bars').innerHTML=distribution.slice(0,10).map(([country,count])=>`<div style="--bar:${count/(distribution[0]?.[1]||1)*100}%"><span>${escapeHtml(country)}</span><i></i><span class="dashboard-country-count">${count}</span></div>`).join('');
}
function initializeDashboardData() {
  renderDashboardData();
  let scheduled=false;
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;renderDashboardData();});});
  Object.values(dashboardRecords()).forEach(rows=>{if(rows[0])observer.observe(rows[0].parentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-status','data-stage','data-applied-date']});});
  document.querySelector('[data-view="dashboard"]').addEventListener('click',event=>{
    const record=event.target.closest('[data-dashboard-record]'),filter=event.target.closest('[data-dashboard-filter]');
    if(!record && !filter)return;
    const item=record?dashboardAttentionRecords()[Number(record.dataset.dashboardRecord)]:null;
    const view=item?.view || (filter.dataset.dashboardFilter==='changes'?'programmes':'universities');
    const target=document.querySelector(`[data-view="${view}"]`);
    target.querySelectorAll('input[type="search"]').forEach(input=>input.value='');target.querySelectorAll('.filters select').forEach(select=>select.selectedIndex=0);
    setActiveView(view);history.replaceState(null,'',`#${view}`);
    if(filter){if(view==='programmes'){ document.querySelector('#programmeStatusFilter').value='Changes Requested'; document.querySelector('#programmeAgeFilter').value='Over 7 days'; }else document.querySelector('#universityStatusFilter').value='Account Created';}
    if(view==='applications')filterApplications();else filterCurrentPanel(target.querySelector('.filters'));
    if(item){if(view==='programmes')renderProgrammeSidePanel(item.row);else if(view==='universities')renderUniversitySidePanel(item.row);else openApplicationSidePanel(item.row);}
  });
}
