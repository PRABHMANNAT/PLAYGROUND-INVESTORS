(() => {
  'use strict';
  const DATA = window.PLAYGROUND_DATA;
  const STORAGE_KEY = 'playground-investors-v1';
  const STATUSES = ['To research','Ready to reach out','Contacted','In conversation','Won','Archived'];
  const TASKS = [
    {label:'Review investment thesis',detail:'Read the fund’s focus and the Playground fit notes.'},
    {label:'Confirm eligibility & overlap',detail:'Check stage, ANZ requirements, and adjacent portfolio companies.'},
    {label:'Prepare a relevant pitch',detail:'Tailor your deck and demo to the investor’s mandate.'},
    {label:'Personalize your outreach',detail:'Choose the right contact and explain the specific connection.'},
    {label:'Send via the preferred route',detail:'Use the official pitch route or the correctly attributed business contact.'},
    {label:'Plan your follow-up',detail:'Choose a follow-up date and record the next step.'}
  ];
  const icons = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    columns:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
    checkSquare:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bookmark:'<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4Z"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',upload:'<path d="M12 15V3m-4 4 4-4 4 4M4 16v4h16v-4"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',arrowUpRight:'<path d="M7 17 17 7M7 7h10v10"/>',arrowRight:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',list:'<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
    pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    x:'<path d="m6 6 12 12M18 6 6 18"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',phone:'<path d="M21 17v3a1 1 0 0 1-1 1C11 21 3 13 3 4a1 1 0 0 1 1-1h3l2 5-2 2a15 15 0 0 0 7 7l2-2 5 2Z"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/>',
    sliders:'<path d="M4 7h5m4 0h7M4 17h9m4 0h3"/><circle cx="11" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',check:'<path d="m5 12 4 4L19 6"/>'
  };
  const $ = id => document.getElementById(id);
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const display = value => String(value ?? '').replace(/([A-Za-z])\uFFFD([A-Za-z])/g,"$1’$2").replace(/\uFFFD/g,'–');
  const text = value => esc(display(value));
  const url = value => {try{const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const external = (href,label,cls='') => {const u=url(href); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="${cls}">${label}</a>` : '';};
  const emailList = value => [...String(value || '').matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0]);
  const hasPhone = value => /^\+?[\d ()-]{7,}$/.test(String(value));
  const initials = name => name.replace(/Venture Capital|Ventures|Capital|Australia/g,'').trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  let storageOK = true, db={version:1,states:{},customLeads:[]}, view='leads',layout='cards',openId=null,detailTab='overview',previousFocus=null,toastTimer;
  try {const saved=localStorage.getItem(STORAGE_KEY); if(saved) db=validateBackup(JSON.parse(saved));}catch{storageOK=false;}
  function validateBackup(value){
    if(!value || value.version!==1 || !value.states || typeof value.states!=='object' || Array.isArray(value.states) || !Array.isArray(value.customLeads) || value.customLeads.length>500) throw new Error('Unsupported backup format');
    const states={};
    for(const [id,s] of Object.entries(value.states)){
      if(!/^(F\d+|C[a-zA-Z0-9-]+)$/.test(id) || !s || typeof s!=='object') continue;
      states[id]={status:STATUSES.includes(s.status)?s.status:STATUSES[0],checks:Array.from({length:TASKS.length},(_,i)=>s.checks?.[i]===true),starred:s.starred===true,notes:typeof s.notes==='string'?s.notes.slice(0,10000):'',due:/^\d{4}-\d{2}-\d{2}$/.test(s.due || '')?s.due:'',updatedAt:typeof s.updatedAt==='string'?s.updatedAt:''};
    }
    const allowedFields=['id','name','fit','glassesFit','stage','recommended','focus','why','glassesWhy','experience','watchouts','cheque','email','emailOwner','phone','phoneOwner','pitch','website','linkedin','accounts','location','checkedOn'];
    const ids=new Set();
    const customLeads=value.customLeads.map(l=>{
      if(!l || !/^C[a-zA-Z0-9-]+$/.test(l.id) || !l.name || typeof l.name!=='string' || ids.has(l.id)) throw new Error('Invalid custom lead');
      ids.add(l.id);const result=Object.fromEntries(allowedFields.map(k=>[k,typeof l[k]==='string'?l[k].slice(0,5000):'']));result.evidence={};return result;
    });
    return {version:1,states,customLeads};
  }
  const allLeads = () => [...DATA.leads,...db.customLeads];
  const getLead = id => allLeads().find(l=>l.id===id);
  const state = id => db.states[id] || {status:STATUSES[0],checks:Array(TASKS.length).fill(false),starred:false,notes:'',due:''};
  const completed = id => state(id).checks.filter(Boolean).length;
  const percent = id => Math.round(completed(id)/TASKS.length*100);
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db));storageOK=true;$('save-label').textContent='Saved on this device';}
    catch{storageOK=false;$('save-label').textContent='Backup needed · storage unavailable';showToast('Browser storage is unavailable. Back up your workspace to keep your changes.');}
  }
  function change(id,patch){db.states[id]={...state(id),...patch,updatedAt:new Date().toISOString()};save();}
  function showToast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
  function fitBadge(l){const cl=l.fit==='Strong'?'':l.fit.startsWith('Conditional')?'conditional':'later';return `<span class="fit-badge ${cl}"><i></i>${text(l.fit==='Strong'?'Strong fit':l.fit==='Conditional'?'Conditional fit':l.fit.replace(';',' ·'))}</span>`;}
  function fundLogo(l){const i=allLeads().findIndex(x=>x.id===l.id);return `<span class="fund-logo logo-${i%6}" aria-hidden="true">${esc(initials(l.name))}</span>`;}
  function bookmark(l){const on=state(l.id).starred;return `<button class="bookmark-button icon-button ${on?'saved':''}" data-bookmark="${esc(l.id)}" aria-label="${on?'Remove '+esc(l.name)+' from':'Add '+esc(l.name)+' to'} shortlist" aria-pressed="${on}">${icon('bookmark')}</button>`;}
  const statusClass = status => ({Contacted:'contacted','In conversation':'conversation',Won:'won'}[status] || '');
  const statusOptions = current => STATUSES.map(s=>`<option ${s===current?'selected':''}>${esc(s)}</option>`).join('');
  const dateText = date => date?new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short'}).format(new Date(date+'T12:00:00')):'';
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function dueLabel(id){const s=state(id);return s.due&&!['Won','Archived'].includes(s.status)?`<span class="due-label ${s.due<today()?'overdue':''}">${s.due<today()?'Overdue · ':''}${dateText(s.due)}</span>`:'';}
  function filters(){return {search:$('search-input').value.toLowerCase().trim(),fit:$('fit-filter').value,status:$('status-filter').value,sort:$('sort-select').value};}
  function filteredLeads(){
    const f=filters();const result=allLeads().filter(l=>{
      if(view==='shortlist'&&!state(l.id).starred)return false;
      if(f.fit==='Strong'&&l.fit!=='Strong')return false;
      if(f.fit==='Conditional'&&!l.fit.startsWith('Conditional'))return false;
      if(f.fit==='Later'&&!/Later|after revenue/i.test(l.fit))return false;
      if(f.status!=='all'&&state(l.id).status!==f.status)return false;
      const people=DATA.people.filter(p=>p.organisation===l.name).map(p=>[p.name,p.role,p.background].join(' ')).join(' ');
      return !f.search || [l.name,l.focus,l.why,l.stage,l.recommended,people].join(' ').toLowerCase().includes(f.search);
    });
    if(f.sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
    if(f.sort==='progress')result.sort((a,b)=>completed(b.id)-completed(a.id));
    if(f.sort==='due')result.sort((a,b)=>(state(a.id).due||'9999').localeCompare(state(b.id).due||'9999'));
    return result;
  }
  function filteredPeople(){const f=filters(),ids=new Set(filteredLeads().map(l=>l.name));return DATA.people.filter(p=>ids.has(p.organisation)&&(!f.search||[p.name,p.role,p.organisation,p.background].join(' ').toLowerCase().includes(f.search)));}
  function renderMetrics(){
    const leads=allLeads(),finished=leads.reduce((n,l)=>n+completed(l.id),0),strong=leads.filter(l=>l.fit==='Strong').length;
    const metrics=[['Investors',leads.length,`${DATA.people.length} named contacts`,'grid'],['Strong matches',strong,'Aligned with Playground','spark'],['Checklist steps',`${finished}<small>/ ${leads.length*TASKS.length}</small>`,'Completed across all investors','checkSquare']];
    $('metrics').innerHTML=metrics.map(([label,value,foot,ic])=>`<div class="metric"><div class="metric-label">${label}${icon(ic)}</div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`).join('');
    $('lead-nav-count').textContent=leads.length;$('shortlist-count').textContent=leads.filter(l=>state(l.id).starred).length;$('strong-caption').textContent=strong;
  }
  function card(l){
    const s=state(l.id),stage=/pre-seed/i.test(l.stage)?'Pre-seed +':/growth/i.test(l.stage)?'Growth stage':/early/i.test(l.stage)?'Early stage':'Venture capital';
    return `<article class="lead-card"><div class="card-top">${fundLogo(l)}${bookmark(l)}</div><button class="lead-name" data-open="${esc(l.id)}">${text(l.name)}</button><div class="card-meta">${icon('pin')}<span>${l.id.startsWith('C')?'Location not set':'Sydney'}</span><span>·</span><span>${stage}</span></div><div>${fitBadge(l)}</div><p class="card-desc">${text(l.why || 'Add your fit notes to this investor profile.')}</p><div class="card-progress"><span>Checklist</span><div class="progress-bar"><span class="progress-fill" style="width:${percent(l.id)}%"></span></div><span>${completed(l.id)} of ${TASKS.length}</span></div>${s.due?`<div class="card-due">Follow-up ${dueLabel(l.id)}</div>`:''}<div class="card-footer"><span class="card-status"><i class="status-dot ${statusClass(s.status)}"></i>${esc(s.status)}</span><button data-open="${esc(l.id)}" class="open-card">View profile${icon('arrowUpRight')}</button></div></article>`;
  }
  function table(leads){return `<div class="table-wrap"><table><thead><tr><th>Investor organization</th><th>Playground fit</th><th>Outreach status</th><th>Checklist</th><th>Follow-up</th><th>Shortlist</th></tr></thead><tbody>${leads.map(l=>`<tr><td><button class="table-name" data-open="${esc(l.id)}">${fundLogo(l)}<span>${text(l.name)}<small>${text(l.recommended || 'No contact added')}</small></span></button></td><td>${fitBadge(l)}</td><td><select class="inline-status" data-status="${esc(l.id)}" aria-label="Status for ${esc(l.name)}">${statusOptions(state(l.id).status)}</select></td><td><div class="table-progress"><div class="progress-bar"><span class="progress-fill" style="width:${percent(l.id)}%"></span></div><span>${completed(l.id)}/${TASKS.length}</span></div></td><td>${dueLabel(l.id)||'—'}</td><td>${bookmark(l)}</td></tr>`).join('')}</tbody></table></div>`;}
  function empty(title,description,ic='search'){return `<div class="empty-state">${icon(ic)}<h3>${title}</h3><p>${description}</p><button class="button button-light" data-reset>Show all investors${icon('arrowRight')}</button></div>`;}
  function pipeline(leads){return `<p class="pipeline-help">Change an investor’s status to move them forward.</p><div class="pipeline-board">${STATUSES.map(s=>{const group=leads.filter(l=>state(l.id).status===s);return `<section class="pipeline-column"><h3 class="column-heading">${esc(s)}<span>${group.length}</span></h3>${group.map(l=>`<article class="pipeline-card"><button class="pipeline-name" data-open="${esc(l.id)}">${text(l.name)}</button><div>${fitBadge(l)}</div><div class="card-progress"><div class="progress-bar"><span class="progress-fill" style="width:${percent(l.id)}%"></span></div><span>${completed(l.id)}/${TASKS.length}</span></div>${dueLabel(l.id)}<select data-status="${esc(l.id)}" aria-label="Status for ${esc(l.name)}">${statusOptions(s)}</select></article>`).join('')||'<div class="pipeline-placeholder">No investors at this stage.</div>'}</section>`;}).join('')}</div>`;}
  function checkItem(id,i,detailed=false){const on=state(id).checks[i];return `<label class="check-item ${on?'done':''}"><input type="checkbox" data-check="${esc(id)}" data-task="${i}" ${on?'checked':''}><span>${TASKS[i].label}${detailed?`<small class="check-detail">${TASKS[i].detail}</small>`:''}</span></label>`;}
  function checklist(leads){return `<div class="checklist-groups">${leads.map(l=>`<article class="checklist-group"><div class="checklist-group-head"><button data-open="${esc(l.id)}">${fundLogo(l)}${text(l.name)}</button><span class="checklist-total">${completed(l.id)} of ${TASKS.length} complete</span></div><div class="checklist-inline">${TASKS.map((t,i)=>checkItem(l.id,i)).join('')}</div></article>`).join('')}</div>`;}
  function peopleCards(people){return `<div class="people-grid">${people.map((p,i)=>{const lead=allLeads().find(l=>l.name===p.organisation),emails=emailList(p.email);return `<article class="person-card"><div class="person-heading"><span class="person-avatar logo-${i%6}">${esc(initials(p.name))}</span><div><h3>${text(p.name)}</h3><div class="person-role">${text(p.role)}</div></div></div><button class="person-fund" data-open-tab="contacts" data-open="${esc(lead.id)}">${text(p.organisation)} ↗</button><p>${text(p.background)}</p><div class="person-links">${external(p.linkedin,`${icon('arrowUpRight')}LinkedIn`)}${emails.map(e=>`<a href="mailto:${esc(e)}" aria-label="Draft email to ${esc(p.name)}">${icon('mail')}Email</a>`).join('')}<button data-open="${esc(lead.id)}" data-open-tab="contacts" class="person-route">Profile${icon('arrowUpRight')}</button></div></article>`;}).join('')}</div>`;}
  const configs={
    leads:['Investors','Investors','Your investors','Investors from your Sydney research.','Find the right people. Keep your next steps in one place.'],
    pipeline:['Outreach','Outreach','Your pipeline','Outreach status for each investor.','See where every conversation stands.'],
    checklist:['Checklists','Checklists','Investor checklists','Six steps for each investor.','A clear next step for every investor.'],
    contacts:['Contacts','Contacts','Your contacts','31 contacts from your investor research.','Find the people behind each fund.'],
    shortlist:['Shortlist','Shortlist','Saved investors','Investors you have bookmarked.','Keep your most promising connections close.']
  };
  function render(){
    renderMetrics();const c=configs[view],leads=filteredLeads(),people=view==='contacts'?filteredPeople():[],f=filters();
    $('breadcrumb-title').textContent=c[0];$('page-title').textContent=c[1];$('page-subtitle').textContent=c[4];
    $('section-title').innerHTML=`${c[2]}<span class="section-count" id="result-count">${view==='contacts'?people.length:leads.length}</span>`;$('section-description').textContent=c[3];
    $('metrics').hidden=view!=='leads';$('view-switch').hidden=!['leads','shortlist'].includes(view);$('quick-filters').hidden=!['leads','shortlist'].includes(view);
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
    document.querySelectorAll('[data-fit]').forEach(b=>{b.classList.toggle('active',b.dataset.fit===f.fit);b.setAttribute('aria-pressed',String(b.dataset.fit===f.fit));});
    const count=Number(f.fit!=='all')+Number(f.status!=='all')+Number(f.sort!=='source');$('filter-count').hidden=!count;$('filter-count').textContent=count;
    $('active-filters').innerHTML=[!['all','Strong'].includes(f.fit)?`<button class="filter-chip" data-clear="fit">${esc(f.fit==='Later'?'Later stage':f.fit+' fit')}${icon('x')}</button>`:'',f.status!=='all'?`<button class="filter-chip" data-clear="status">${esc(f.status)}${icon('x')}</button>`:'',(f.status!=='all'||!['all','Strong'].includes(f.fit)||f.search)?'<button class="text-button" data-reset>Clear filters</button>':''].join('');
    let html='';
    if(view==='contacts')html=people.length?peopleCards(people):empty('No contacts found','Try a different name or organization.','users');
    else if(!leads.length)html=view==='shortlist'&&!allLeads().some(l=>state(l.id).starred)?empty('Your shortlist is empty','Use the bookmark on an investor card to save it here.','bookmark'):empty('No investors found','Try a different search or clear your filters.');
    else if(view==='pipeline')html=pipeline(leads);
    else if(view==='checklist')html=checklist(leads);
    else html=layout==='table'?table(leads):`<div class="lead-grid">${leads.map(card).join('')}</div>`;
    $('view-content').innerHTML=(!storageOK?'<div class="storage-warning">Browser storage is unavailable. Download a backup to keep your changes.</div>':'')+html;
    document.querySelectorAll('[data-layout]').forEach(b=>{b.classList.toggle('active',b.dataset.layout===layout);b.setAttribute('aria-pressed',String(b.dataset.layout===layout));});
  }
  function setView(next){if(!configs[next])next='leads';view=next;location.hash=next;$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');$('filter-options').open=false;render();}
  function resetFilters(){ $('search-input').value='';$('fit-filter').value='all';$('status-filter').value='all';$('sort-select').value='source';render(); }
  function openDetail(id,tab='overview'){
    if(!getLead(id))return;
    previousFocus=document.activeElement;openId=id;detailTab=['overview','checklist','contacts','notes'].includes(tab)?tab:'overview';
    $('filter-options').open=false;$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');
    $('drawer-overlay').hidden=false;$('detail-drawer').hidden=false;document.body.classList.add('modal-open');document.querySelector('.app-shell').inert=true;renderDetail();$('close-detail').focus();
  }
  function closeDetail(){openId=null;$('drawer-overlay').hidden=true;$('detail-drawer').hidden=true;document.body.classList.remove('modal-open');document.querySelector('.app-shell').inert=false;previousFocus?.isConnected?previousFocus.focus():$('search-input').focus();}
  function renderDetail(){
    if(!openId)return;
    const l=getLead(openId),s=state(l.id),people=DATA.people.filter(p=>p.organisation===l.name),emails=emailList(l.email);
    const overview=`<section class="detail-section"><h3>Why Playground fits</h3><p>${text(l.why || 'No fit notes added yet.')}</p><div class="overview-details"><div><h4>Investment stage</h4><p>${text(l.stage || 'Not supplied')}</p></div><div><h4>Published cheque size</h4><p>${text(l.cheque || 'Not supplied')}</p></div></div>${l.watchouts?`<div class="watchouts"><h4>Before you reach out</h4><p>${text(l.watchouts)}</p></div>`:''}<details class="secondary-detail"><summary>More research & sources</summary><div class="secondary-detail-content"><h4>Investment focus</h4><p>${text(l.focus || 'Not supplied')}</p>${l.experience?`<h4>Relevant experience & portfolio</h4><p>${text(l.experience)}</p>`:''}${l.glassesWhy?`<h4>Smart glasses · ${text(l.glassesFit)}</h4><p>${text(l.glassesWhy)}</p>`:''}<h4>Evidence links</h4><div class="source-links">${Object.entries(l.evidence || {}).map(([key,href])=>external(href,`${{location:'Sydney presence',focus:'Investment focus',contact:'Contact details',other:'Additional evidence'}[key] || 'Evidence'}${icon('arrowUpRight')}`)).join('')}</div></div></details><p class="detail-source-date">${l.id.startsWith('C')?'Added by you.':'From '+esc(DATA.sourceName)+' · 13 Oct 2026'}</p></section>`;
    const checklistPanel=`<section class="detail-section"><h3>Your checklist<small>${completed(l.id)} of ${TASKS.length} complete</small></h3><div class="progress-bar"><span class="progress-fill" style="width:${percent(l.id)}%"></span></div><div class="detail-checklist">${TASKS.map((t,i)=>checkItem(l.id,i,true)).join('')}</div></section>`;
    const contacts=`<section class="detail-section"><h3>Contact routes</h3><div class="contact-box"><p class="contact-name">Organization contact</p>${emails.length?emails.map(e=>`<div class="contact-row">${icon('mail')}<a href="mailto:${esc(e)}">${esc(e)}</a></div>`).join(''):`<p>${text(l.email || 'No business email supplied')}</p>`}<div class="contact-owner">${text(l.emailOwner)}</div>${hasPhone(l.phone)?`<div class="contact-row">${icon('phone')}<a href="tel:${esc(l.phone.replace(/[^+\d]/g,''))}">${esc(l.phone)}</a></div>`:`<p>${text(l.phone || 'No phone supplied')}</p>`}<div class="contact-owner">${text(l.phoneOwner)}</div>${external(l.pitch,'Preferred pitch or contact page ↗')}</div>${people.map(p=>{const pe=emailList(p.email);return `<div class="contact-box"><p class="contact-name">${text(p.name)}</p><div class="person-role">${text(p.role)}</div><p>${text(p.background)}</p>${pe.map(e=>`<div class="contact-row">${icon('mail')}<a href="mailto:${esc(e)}">${esc(e)}</a></div>`).join('')}${hasPhone(p.phone)?`<div class="contact-row">${icon('phone')}<a href="tel:${esc(p.phone.replace(/[^+\d]/g,''))}">${esc(p.phone)}</a></div>`:''}${external(p.linkedin,'LinkedIn profile ↗')}${p.notes?`<p class="contact-note">${text(p.notes)}</p>`:''}${p.accounts&&!p.accounts.startsWith('No additional')?`<p>${text(p.accounts)}</p>`:''}<div class="contact-source-links">${external(p.biographySource,'Biography source ↗')}${external(p.contactSource,'Contact source ↗')}</div></div>`;}).join('')}</section>`;
    const notes=`<section class="detail-section"><h3>Your notes</h3><label class="notes-label"><span class="visually-hidden">Notes for ${esc(l.name)}</span><textarea data-notes="${esc(l.id)}" placeholder="Conversations, introductions, next steps…" maxlength="10000">${esc(s.notes)}</textarea></label><p class="notes-help">Saved on this device as you type.</p></section>`;
    const panels={overview,checklist:checklistPanel,contacts,notes};
    const tabs=[['overview','Overview'],['checklist','Checklist'],['contacts','Contacts'],['notes','Notes']];
    $('detail-drawer').innerHTML=`<div class="drawer-header"><div>Investor profile<span class="shortcut-note">${esc(l.id)}</span></div><button class="icon-button" id="close-detail" aria-label="Close investor profile">${icon('x')}</button></div><div class="drawer-body"><div class="detail-top">${fundLogo(l)}${bookmark(l)}</div><h2 id="detail-title">${text(l.name)}</h2>${fitBadge(l)}<p class="detail-location">${icon('pin')}${text(l.location || 'Location not supplied')}</p><div class="detail-actions">${external(l.pitch,`Open pitch page${icon('arrowUpRight')}`,'button button-dark')}${external(l.website,'Website ↗','button button-light')}${external(l.linkedin,'LinkedIn ↗','button button-light')}</div><div class="detail-controls"><label>Outreach status<select data-status="${esc(l.id)}">${statusOptions(s.status)}</select></label><label>Follow-up date<input type="date" value="${esc(s.due)}" data-due="${esc(l.id)}" aria-label="Follow-up date"></label></div><div class="detail-tabs" role="tablist" aria-label="Investor profile sections">${tabs.map(([key,label])=>`<button class="detail-tab ${detailTab===key?'active':''}" role="tab" id="detail-tab-${key}" data-detail-tab="${key}" aria-selected="${detailTab===key}" aria-controls="detail-panel" tabindex="${detailTab===key?'0':'-1'}">${label}</button>`).join('')}</div><div class="detail-panel" id="detail-panel" role="tabpanel" aria-labelledby="detail-tab-${detailTab}">${panels[detailTab]}</div></div>`;
  }
  function download(filename,body,type){const blob=new Blob([body],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
  function csvCell(value){let s=String(value??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function exportCSV(){
    const isPeople=view==='contacts',leads=filteredLeads();
    const headers=isPeople?['Name','Organization','Role','Direct business email','Direct business phone','LinkedIn','Contact notes','Biography source','Contact source']:['ID','Organization','Playground fit','Smart-glasses fit','Stage','Focus','Why Playground','Eligibility notes','Published cheque terms','Public business email','Email owner / purpose','Public business phone','Phone owner / purpose','Pitch route','Website','Source checked on','Outreach status','Shortlisted','Checklist complete','Follow-up date','Notes',...TASKS.map(t=>t.label)];
    const rows=isPeople?filteredPeople().map(p=>[p.name,p.organisation,p.role,p.email,p.phone,p.linkedin,p.notes,p.biographySource,p.contactSource]):leads.map(l=>{const s=state(l.id);return [l.id,l.name,l.fit,l.glassesFit,l.stage,l.focus,l.why,l.watchouts,l.cheque,l.email,l.emailOwner,l.phone,l.phoneOwner,l.pitch,l.website,l.checkedOn,s.status,s.starred?'Yes':'No',`${completed(l.id)}/${TASKS.length}`,s.due,s.notes,...s.checks.map(v=>v?'Done':'Not done')];});
    download(`playground-${isPeople?'contacts':'investors'}-${today()}.csv`,'\ufeff'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');showToast(`${rows.length} ${isPeople?'contacts':'investors'} exported.`);
  }
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  $('status-filter').insertAdjacentHTML('beforeend',STATUSES.map(s=>`<option>${s}</option>`).join(''));
  document.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el)return;
    if(el.dataset.view){setView(el.dataset.view);return;}
    if(el.dataset.open){openDetail(el.dataset.open,el.dataset.openTab);return;}
    if(el.dataset.fit){$('fit-filter').value=el.dataset.fit;$('filter-options').open=false;render();return;}
    if(el.dataset.detailTab){detailTab=el.dataset.detailTab;renderDetail();$('detail-drawer').querySelector('[data-detail-tab="'+detailTab+'"]').focus();return;}
    if(el.dataset.bookmark){const id=el.dataset.bookmark;change(id,{starred:!state(id).starred});render();if(openId){renderDetail();$('detail-drawer').querySelector('[data-bookmark]')?.focus();}return;}
    if(el.dataset.layout){layout=el.dataset.layout;render();return;}
    if(el.hasAttribute('data-reset')){resetFilters();if(view==='shortlist'&&!allLeads().some(l=>state(l.id).starred))setView('leads');return;}
    if(el.dataset.clear){$(el.dataset.clear==='fit'?'fit-filter':'status-filter').value='all';render();return;}
    if(el.id==='close-detail')closeDetail();
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.status){change(el.dataset.status,{status:el.value});render();if(openId)renderDetail();showToast('Outreach status updated.');}
    if(el.dataset.due){change(el.dataset.due,{due:el.value});render();}
    if(el.dataset.check){const id=el.dataset.check,i=Number(el.dataset.task),checks=[...state(id).checks];checks[i]=el.checked;change(id,{checks});render();if(openId)renderDetail();const scope=openId?$('detail-drawer'):$('view-content');scope.querySelector(`[data-check="${id}"][data-task="${i}"]`)?.focus();}
    if(['fit-filter','status-filter','sort-select'].includes(el.id))render();
  });
  document.addEventListener('input',event=>{const el=event.target;if(el.id==='search-input')render();if(el.dataset.notes)change(el.dataset.notes,{notes:el.value});});
  $('drawer-overlay').addEventListener('click',closeDetail);
  $('detail-drawer').addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeDetail();return;}
    if(e.key==='Tab'){const els=[...$('detail-drawer').querySelectorAll('button,a[href],input,select,textarea,summary')].filter(el=>el.offsetParent!==null);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!openId&&!document.querySelector('dialog[open]')){e.preventDefault();$('search-input').focus();}if(e.key==='Escape')$('sidebar').classList.remove('open');});
  $('menu-button').addEventListener('click',()=>{$('sidebar').classList.toggle('open');$('menu-button').setAttribute('aria-expanded',String($('sidebar').classList.contains('open')));});
  document.addEventListener('click',e=>{
    if(!e.target.closest('.filter-options'))$('filter-options').open=false;
    if(!e.target.closest('#sidebar')&&!e.target.closest('#menu-button')){$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');}
  });
  $('detail-drawer').addEventListener('keydown',e=>{
    if(!e.target.matches('[data-detail-tab]'))return;
    const tabs=['overview','checklist','contacts','notes'],index=tabs.indexOf(detailTab);
    if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();detailTab=e.key==='Home'?tabs[0]:e.key==='End'?tabs[3]:tabs[(index+(e.key==='ArrowRight'?1:3))%4];renderDetail();$('detail-drawer').querySelector('[data-detail-tab="'+detailTab+'"]').focus();}
  });
  $('export-button').addEventListener('click',exportCSV);
  $('backup-button').addEventListener('click',()=>{download(`playground-workspace-${today()}.json`,JSON.stringify({...db,exportedAt:new Date().toISOString(),sourceName:DATA.sourceName},null,2),'application/json');showToast('Workspace backup downloaded.');});
  $('restore-button').addEventListener('click',()=>$('restore-input').click());
  $('restore-input').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>3e6)throw new Error('Too large');const restored=validateBackup(JSON.parse(await file.text()));if(!confirm('Restore this backup and replace the current checklist, outreach, notes, and custom investor data?'))return;
      download(`playground-before-restore-${today()}.json`,JSON.stringify(db,null,2),'application/json');db=restored;save();render();showToast('Backup restored. Your previous workspace was also downloaded.');
    }catch{showToast('Could not restore this file. Choose a valid Playground workspace backup.');}finally{e.target.value='';}
  });
  $('add-lead-button').addEventListener('click',()=>$('add-dialog').showModal());$('close-add').addEventListener('click',()=>$('add-dialog').close());
  $('add-form').addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.target),name=f.get('name').trim();if(!name){showToast('Please enter an organization name.');return;}
    const id='C'+crypto.randomUUID();const l={id,name,fit:f.get('fit'),stage:f.get('stage').trim(),focus:f.get('focus').trim(),why:f.get('why').trim(),email:f.get('email').trim(),emailOwner:'Added by you. Confirm contact ownership before outreach.',website:url(f.get('website')),pitch:url(f.get('pitch')),phone:'',phoneOwner:'',glassesFit:'Not assessed',cheque:'Not supplied',location:'',recommended:'',experience:'',watchouts:'',linkedin:'',evidence:{},checkedOn:today()};
    db.customLeads.push(l);save();$('add-dialog').close();e.target.reset();resetFilters();setView('leads');openDetail(id);showToast('Investor added to your workspace.');
  });
  $('storage-info').addEventListener('click',()=>$('info-dialog').showModal());$('close-info').addEventListener('click',()=>$('info-dialog').close());
  window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(configs[next]&&next!==view){view=next;render();}});
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue){try{db=validateBackup(JSON.parse(e.newValue));render();if(openId)renderDetail();}catch{}}});
  view=configs[location.hash.slice(1)]?location.hash.slice(1):'leads';render();
})();
