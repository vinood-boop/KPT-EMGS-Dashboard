// Expanded fictional records share programme and applicant keys across dashboard views.
function seedDashboardExpansion() {
  const universityBody = document.querySelector('[data-table="universities"] tbody');
  const programmeBody = document.querySelector('[data-table="programmes"] tbody');
  const institutions = ['Selangor Horizon University','Johor Meridian University','Malacca Heritage University','Perak Innovation University','Pahang Green Valley University','Terengganu Coastal University','Kelantan Cultural University','Negeri Sembilan Gateway University','Sarawak Rainforest University','Sabah Oceanic University','Kedah Discovery University','Perlis Frontier University','Putrajaya International College','Langkawi Hospitality College','Kuantan Creative College','Kuching Technology College','Ipoh Community College','Muar Business College','Sandakan Skills College','Seremban Global College'];
  const cities = ['Shah Alam, Selangor','Johor Bahru, Johor','Melaka','Ipoh, Perak','Kuantan, Pahang','Kuala Terengganu, Terengganu','Kota Bharu, Kelantan','Seremban, Negeri Sembilan','Kuching, Sarawak','Kota Kinabalu, Sabah','Alor Setar, Kedah','Kangar, Perlis','Putrajaya','Langkawi, Kedah','Kuantan, Pahang','Kuching, Sarawak','Ipoh, Perak','Muar, Johor','Sandakan, Sabah','Seremban, Negeri Sembilan'];
  const contacts = ['Nur Aisyah Hassan','Daniel Lim','Priya Nair','Amir Farid','Mei Ling Tan','Farah Ismail','Arjun Kumar','Sarah Wong','Hakim Abdullah','Grace Lee','Nadia Rahman','Ravi Menon','Siti Hana Omar','Jason Ng','Amina Yusuf','Kevin Lau','Nur Iman Ali','Deepa Raj','Adam Chong','Liyana Aziz'];
  const stages = ['Pending Review','Clarification Requested','Account Created','Rejected'];
  const active=[];
  const dateBefore=days=>new Date(Date.UTC(2026,9,9)-days*86400000).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  // Keep existing application totals, while linking legacy approval rows to active profiles.
  const existingActive=[...universityBody.rows].filter(row=>row.dataset.status==='active');
  const snapshots=new Map(existingActive.map(row=>[row,universityProfileProgrammes(row)]));
  [...programmeBody.rows].forEach(row=>{
    let owner=existingActive.find(item=>getRowTitle(item)===row.cells[1].textContent.trim());
    if(!owner || !snapshots.get(owner).some(item=>item.name===getRowTitle(row))) {
      owner=existingActive.find(item=>snapshots.get(item).some(programme=>programme.name===getRowTitle(row))) || existingActive[0];
      row.cells[1].textContent=getRowTitle(owner);
    }
    const programmes=snapshots.get(owner);
    if(!programmes.some(item=>item.name===getRowTitle(row)))programmes.push({name:getRowTitle(row),category:row.cells[2].textContent.trim(),status:row.cells[3].textContent.trim(),applicants:0});
  });
  snapshots.forEach((programmes,row)=>{row.dataset.profileProgrammes=JSON.stringify(programmes);row.dataset.programmesCount=String(programmes.length);syncUniversityCounts(row);});
  institutions.forEach((name,index)=>{
    const status=index<12?'Active':stages[(index-12)%4];
    const slug=`institution-${index+7}`;
    const initials=name.split(' ').slice(0,2).map(word=>word[0]).join('');
    const colors=['#35634f','#365970','#68578c','#8b633b'];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="${colors[index%4]}"/><path d="M20 28h56M20 68h56" stroke="white" opacity=".4"/><text x="48" y="55" text-anchor="middle" fill="white" font-family="Arial" font-size="28">${initials}</text></svg>`;
    const logo='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const row=document.createElement('tr');
    const details={officialName:name,registration:`DEMO-MOHE-2026-${String(index+7).padStart(3,'0')}`,instituteType:index<12?'Private University':'College',campusAddress:`${20+index*3} Jalan Ilmu, ${cities[index]}`,website:`https://${slug}.example`,contactName:contacts[index],contactJob:['Director, International Office','Manager, Admissions Office','Coordinator, Global Engagement'][index%3],contactEmail:`contact@${slug}.example`,contactPhone:`+60 3 5551 ${String(1100+index)}`,contactRole:index%2?'University Coordinator':'University Administrator'};
    Object.assign(row.dataset,{demoExpanded:'true',status:status.toLowerCase(),compliance:'clear',responseTime:status==='Active'?`${1+index%5} days`:'Pending',programmesCount:'0',applicantsCount:'0',logo,registrationDetails:JSON.stringify(details),profileProgrammes:'[]'});
    if(status==='Clarification Requested')row.dataset.clarifications=JSON.stringify([{title:'KPT requested clarification',message:'Please confirm the campus address and primary contact appointment.',time:dateBefore(3)}]);
    if(status==='Rejected'){row.dataset.rejectionReason='Supporting registration documents require verification before reconsideration.';row.dataset.rejectionTime=dateBefore(7);}
    row.innerHTML=`<td><img class="registry-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(name)} sample logo"><span class="table-record-name">${escapeHtml(name)}</span><small>${escapeHtml(details.registration)}</small></td><td>${statusChip(status,universityStatusColor(status))}</td><td>0</td><td>0</td><td>${row.dataset.responseTime}</td><td>${dateBefore(index%15)}</td><td><button data-university-view>View</button></td>`;
    universityBody.append(row);syncUniversityCounts(row);if(status==='Active')active.push(row);
  });
  const themes=[['Rainforest Conservation Field School','Nature & Environment',['Guided biodiversity survey','Conservation workshop','Field journal'],['Identify local species','Apply ecological survey methods','Design a conservation project']],['Digital Enterprise Bootcamp','Business & Innovation',['Startup clinic','Marketing workshop','Innovation pitch'],['Build a business concept','Plan a digital campaign','Present an innovation pitch']],['Heritage and Culture Immersion','Culture & Heritage',['Heritage walk','Museum workshop','Community interview'],['Interpret heritage sites','Understand cultural practices','Present a cultural reflection']],['Smart Tourism Analytics Lab','Technology',['Data workshop','Tourism case study','Dashboard project'],['Analyse tourism data','Build a reporting dashboard','Present findings']],['Community Health Exchange','Health Sciences',['Health seminar','Community visit','Research workshop'],['Understand public health challenges','Evaluate community needs','Develop a health proposal']],['Creative Design Studio','Creative Arts',['Design workshop','Gallery visit','Portfolio review'],['Develop a creative concept','Apply design methods','Present a portfolio']],['Hospitality Leadership Camp','Hospitality',['Service workshop','Hotel visit','Team project'],['Plan visitor services','Apply hospitality standards','Present a service proposal']],['Malay Language Experience','Languages',['Language practice','Campus exchange','Cultural interview'],['Use everyday Malay','Understand communication etiquette','Deliver a short presentation']]];
  const approvalStages=['Pending KPT Approval','Changes Requested','Resubmitted','Approved','Rejected'];
  for(let index=0;index<80;index++){
    const owner=active[index%active.length];const theme=themes[index%themes.length];const institution=getRowTitle(owner);
    const name=`${theme[0]} - ${institution.split(' ')[0]} ${1+Math.floor(index/active.length)}`;
    const status=approvalStages[index%5],duration=10+(index%5)*5,fee=1800+(index%9)*300;
    const applicants=status==='Approved'?12+(index*7)%24:0;
    const profile=JSON.parse(owner.dataset.registrationDetails);
    const row=document.createElement('tr');
    Object.assign(row.dataset,{demoExpanded:'true',status:status.toLowerCase(),age:2+index%25>14?'over 14 days':2+index%25>7?'over 7 days':'any age',duration:`${duration} Days`,fee:`RM ${fee.toLocaleString('en-US')}`,language:index%8===7?'Malay':'English',languageLevel:index%2?'Intermediate':'Beginner',target:['General Public (including student)','Student only','Group'][index%3],credit:index%2?'Eligible':'Not eligible',activities:theme[2].join(', '),outcome:theme[3].join('. '),overview:`A ${duration}-day ${theme[1].toLowerCase()} programme hosted by ${institution}, combining guided workshops, local visits and a supervised project.`,programmeContent:`Participants spend ${duration} days at ${institution} taking part in ${theme[2].join(', ').toLowerCase()}. University facilitators guide the practical work and assess a final reflective project.`,learningOutcomes:JSON.stringify(theme[3]),inclusions:JSON.stringify(['Accommodation','Meals','Local transport',index%2?'Workshop materials':'Field equipment']),travel:`${institution.split(' ')[0]} Learning Tours Sdn Bhd`,certificate:'Certificate of Completion',pic:profile.contactName,picPhone:profile.contactPhone,picEmail:profile.contactEmail,conditionalQuestions:JSON.stringify(index%4===0?['Do you have any accessibility or dietary requirements?']:[])});
    if(status==='Changes Requested')row.dataset.kptNote='Please clarify the learning assessment and itemised programme fee.';
    if(status==='Rejected')row.dataset.kptNote='The proposed activities require a clearer academic learning scope.';
    row.innerHTML=`<td><span class="table-record-name">${escapeHtml(name)}</span></td><td>${escapeHtml(institution)}</td><td>${theme[1]}</td><td>${statusChip(status,universityStatusColor(status))}</td><td>${dateBefore(2+index%25)}</td><td>${['Approved','Rejected'].includes(status)?'-':`${2+index%25} days`}</td><td><button data-programme-view>View</button></td>`;
    programmeBody.append(row);
    const programmes=JSON.parse(owner.dataset.profileProgrammes);programmes.push({name,category:theme[1],status,applicants});owner.dataset.profileProgrammes=JSON.stringify(programmes);
    owner.dataset.programmesCount=String(programmes.length);owner.dataset.applicantsCount=String(programmes.reduce((sum,item)=>sum+item.applicants,0));syncUniversityCounts(owner);
  }
}
