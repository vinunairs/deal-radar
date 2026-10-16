// deal-radar: renders everything from data/cruises.json (the daily run only edits that file)
fetch('data/cruises.json?v='+Date.now()).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(D=>{
document.getElementById('scope').textContent=D.scope||'';
document.getElementById('strip').innerHTML=(D.summary||[]).map((b,i)=>`<div class="box"><span class="lbl">${b.label}</span><strong${i===0?' id="dealcount"':''}>${b.title}</strong><p>${b.text}</p></div>`).join('');
document.getElementById('notes-date').textContent=D.notesDate||'';
document.getElementById('notes').innerHTML=(D.notes||[]).map(n=>`<li>${n}</li>`).join('');
document.getElementById('app').hidden=false;document.getElementById('loading').hidden=true;


const S=D.sailings.slice().sort((a,b)=>a.rank-b.rank);
const byId=Object.fromEntries(S.map(s=>[s.id,s]));
const $=id=>document.getElementById(id);
const money=v=>v==null?'—':'$'+v.toLocaleString('en-US');
const isDeal=s=>s.deal.startsWith('Deal')||s.drop;
const chipClass=s=>s.deal.startsWith('Deal')?'good':(s.drop||s.close)?'warn':'muted';
const fmtD=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const link4=f=>f&&f.link?`<a class="go" href="${f.link}" target="_blank" rel="noopener">Price for 4 →</a>`:'—';
$('updated').textContent=new Date(D.updated+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
$('dealcount').textContent=S.filter(isDeal).length+' of '+S.length+' sailings';
// Weekends are worked out from each sailing's departure date (grouped by that week's Thursday)
const MO={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const YR=+(D.updated||'2026').slice(0,4);
const depDate=s=>{const m=String(s.dep||'').match(/([A-Z][a-z]{2})\s+(\d{1,2})$/);if(!m)return null;let d=new Date(YR,MO[m[1]],+m[2]);if(d<new Date(D.updated+'T00:00:00')-200*864e5)d=new Date(YR+1,MO[m[1]],+m[2]);return d;};
const thu=d=>{const t=new Date(d);t.setDate(t.getDate()-((t.getDay()-4+7)%7));return t;};
const OFFD=Object.fromEntries(Object.entries(D.schoolOff||{}).map(([k,v])=>[k,new Date(k+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' off']));
const keyOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const groups=new Map();
S.forEach(s=>{const d=depDate(s);if(!d)return;const t=thu(d),k=keyOf(t);if(!groups.has(k))groups.set(k,{t,list:[]});groups.get(k).list.push(s);});
const weekList=[...groups.values()].sort((a,b)=>a.t-b.t);
$('weeks').innerHTML=weekList.map((g,i)=>{
  const end=new Date(g.t);end.setDate(end.getDate()+4);
  const f=x=>x.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const w=f(g.t)+' – '+f(end);
  const offs=[0,1,2,3,4].map(o=>{const x=new Date(g.t);x.setDate(x.getDate()+o);return OFFD[keyOf(x)];}).filter(Boolean);
  const holi={[i+1]:offs.join(', ')};
  const list=g.list;
  const best=list[0];
  const deals=list.filter(isDeal).length;
  return `<div class="wk${best&&best.deal.startsWith('Deal')?' hasdeal':''}">
    <span class="lbl">Weekend ${i+1}${holi[i+1]?' · '+holi[i+1]:''}</span>
    <span class="when">${w}</span>
    ${best?`<span class="best">${best.ship} · ${best.port}</span>
    <span class="price">int ${money(best.int)} · bal ${money(best.bal)} · ${best.dep}</span>
    ${best.fam&&best.fam.int?`<span class="price">for 4: ≈ ${money(best.fam.int)} interior</span>`:''}
    <span><span class="chip ${chipClass(best)}">${best.deal}</span> <span class="small">${list.length} tracked, ${deals} deal${deals===1?'':'s'}</span></span>`:'<span class="small">No tracked sailings found</span>'}
  </div>`}).join('');
function famCell(f){
  if(!f) return '—';
  if(f.na) return `<span class="small">${f.na} (${fmtD(f.date)})</span>`;
  return `${f.int?'int ≈ '+money(f.int):'int sold out'}<br>bal ${money(f.bal)}<div class="small">RC site, ${fmtD(f.date)}</div>`;
}
function render(port){
  $('rows').innerHTML=S.filter(s=>port==='all'||s.port===port).map(s=>`<tr>
    <td><div class="ship">${s.ship}</div><div class="small">${s.line} · ${s.n} nights</div></td>
    <td>${s.port}</td>
    <td style="white-space:nowrap">${s.dep} → ${s.ret}</td>
    <td>${s.calls}${s.note?`<div class="small">${s.note}</div>`:''}</td>
    <td class="num">${money(s.int)}</td>
    <td class="num">${money(s.bal)}${s.tax?'<div class="small">incl. taxes</div>':''}</td>
    <td class="num">${famCell(s.fam)}</td>
    <td>${link4(s.fam)}</td>
    <td><span class="chip ${chipClass(s)}">${s.deal}</span></td>
    <td>${s.school?`<span class="chip ${s.schoolGood?'good':'muted'}">${s.school}</span>`:''}</td>
    <td><a href="${s.src}" target="_blank" rel="noopener">${s.srcName}</a></td></tr>`).join('');
}
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');render(b.dataset.port);
}));
render('all');
$('reported').innerHTML=D.reported.slice().reverse().map(r=>{const s=byId[r.id];return `<tr><td><span class="ship">${s?s.ship:r.id}</span> <span class="small">${s?s.port+' · '+s.dep:'(departed)'}</span></td><td class="num">${r.date}</td><td>${r.cabin}</td><td class="num">${r.price}</td></tr>`}).join('');
$('fam').innerHTML=D.famHistory.map(f=>{const s=byId[f.id];return `<tr><td><span class="ship">${s?s.ship:f.id}</span> <span class="small">${s?s.dep:''}</span></td><td class="num">${f.date}</td><td class="num">${f.note?f.note:(f.int?'≈ '+money(f.int):'sold out')}</td><td class="num">${f.note?'':money(f.bal)}</td><td>${link4(s&&s.fam)}</td></tr>`}).join('');
const dates=D.history.dates;
$('histhead').innerHTML='<tr><th>Sailing</th>'+dates.map(d=>`<th>${d}</th>`).join('')+'</tr>';
$('hist').innerHTML=S.map(s=>{
  const h=D.history.rows[s.id]||[];
  const cells=dates.map((d,i)=>{const v=h[i];return `<td class="num">${v?money(v[0])+' / '+money(v[1]):'—'}</td>`}).join('');
  return `<tr><td><span class="ship">${s.ship}</span> <span class="small">${s.dep}</span></td>${cells}</tr>`;
}).join('');


(function(){
const S=D.sailings.slice().sort((a,b)=>a.rank-b.rank);
const $=id=>document.getElementById(id);
const money=v=>v==null?'—':'$'+Math.round(v).toLocaleString('en-US');
const MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const YEAR=+(D.updated||'2026').slice(0,4);
const pd=s=>{const m=String(s||'').match(/([A-Z][a-z]{2})\s+(\d{1,2})$/);return m?new Date(YEAR,MON[m[1]],+m[2]):null;};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const OFF=D.schoolOff||{'2026-10-12':'Columbus Day (no school)','2026-11-11':'Veterans Day (no school)','2026-11-23':'Fall Break','2026-11-24':'Fall Break','2026-11-25':'Fall Break','2026-11-26':'Thanksgiving','2026-11-27':'Fall Break'};
const status=s=>{const d=(s.deal||'').toLowerCase();
  if(d.startsWith('deal')||s.drop) return 'deal';
  if(s.close||d.startsWith('close')) return 'close';
  if(/sold out|only suites/.test(d)&&s.int==null&&s.bal==null) return 'out';
  return 'no';};
const lineCls=s=>/royal/i.test(s.line)?'ln-rc':/msc/i.test(s.line)?'ln-msc':'ln-dis';
const short=s=>s.ship.replace(' of the Seas','').replace('MSC ','').replace('Disney ','');
let mode='pp', filt='all', sel=null;

// weekends: derive Thursdays from the sailings' departure dates
const thursOf=d=>{const t=new Date(d);const back=(t.getDay()-4+7)%7;t.setDate(t.getDate()-back);return t;};
const wkMap=new Map();
S.forEach(s=>{const dd=pd(s.dep);if(!dd)return;const th=thursOf(dd);const k=iso(th);if(!wkMap.has(k))wkMap.set(k,{th,items:[]});wkMap.get(k).items.push(s);});
const weekends=[...wkMap.values()].sort((a,b)=>a.th-b.th);

function priceOf(s){
  if(mode==='fam'){const f=s.fam;if(!f)return {v:null,lab:'no quote yet'};
    if(f.int) return {v:f.int,lab:'interior, all 4'}; if(f.bal) return {v:f.bal,lab:'balcony, all 4'}; return {v:null,lab:'no quote'};}
  const c=[s.int,s.bal].filter(v=>v!=null); if(!c.length) return {v:null,lab:''};
  const v=Math.min(...c); return {v,lab:(v===s.int?'interior':'balcony')+' pp'};
}
function lastDrop(s){const h=(D.history.rows||{})[s.id];if(!h)return 0;const pts=h.filter(Boolean).map(x=>Math.min(...x.filter(v=>v!=null))).filter(v=>isFinite(v));if(pts.length<2)return 0;return pts[pts.length-2]-pts[pts.length-1];}

function render(){
  let html='<div class="cal-head"><div>Weekend</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div><div>Mon</div></div>';
  weekends.forEach(w=>{
    const items=w.items.filter(s=>filt==='all'||(filt==='deals'?status(s)==='deal':s.line===filt));
    const days=[0,1,2,3,4].map(o=>{const d=new Date(w.th);d.setDate(d.getDate()+o);return d;});
    const prices=items.map(s=>priceOf(s).v).filter(v=>v!=null);
    const best=prices.length?Math.min(...prices):null;
    const lab=days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'});
    html+=`<div class="wkrow"><div class="wklabel"><span class="n">${lab}</span>${best!=null?`<span class="best">from ${money(best)}</span><span class="none">${mode==='fam'?'for all 4':'per person'}</span>`:`<span class="none">${items.length?'no price':'nothing tracked'}</span>`}</div><div class="days">`;
    days.forEach((d,ci)=>{const k=iso(d);const off=OFF[k];
      html+=`<div class="daybg${off?' off':''}" style="grid-column:${ci+1};grid-row:1 / span ${Math.max(items.length,1)+1}" ${off?`title="${off}"`:''}></div>`;
      html+=`<div class="daynum" style="grid-column:${ci+1}">${d.getDate()}${off?` <b>${off.length>12?'off':off}</b>`:''}</div>`;});
    items.forEach((s,li)=>{
      const a=pd(s.dep),b=pd(s.ret);if(!a)return;
      let c0=Math.round((a-w.th)/864e5), c1=b?Math.round((b-w.th)/864e5):c0+3;
      c0=Math.max(0,c0); c1=Math.min(4,c1);
      const st=status(s), pr=priceOf(s), dr=lastDrop(s);
      html+=`<button type="button" class="bar ${st}${sel===s.id?' sel':''}" data-id="${s.id}" style="grid-column:${c0+1} / ${c1+2};grid-row:${li+2}" aria-label="${s.ship}, ${s.dep} to ${s.ret}, ${s.port}, ${pr.v!=null?money(pr.v)+' '+pr.lab:'no price'}">
        <span class="t"><span class="dot ${lineCls(s)}"></span>${short(s)} <small>· ${s.port.replace('Port Canaveral','Canaveral').replace('Fort Lauderdale','Ft Laud.')}</small></span>
        <span class="p">${pr.v!=null?money(pr.v):(st==='out'?'sold out':'—')}${dr>=15&&mode==='pp'?`<span class="drop">▼${money(dr)}</span>`:''}</span></button>`;
    });
    if(!items.length) html+=`<div style="grid-column:1 / -1;grid-row:2;padding:4px 10px" class="hint">No ${filt==='deals'?'deals':'sailings'} this weekend</div>`;
    html+='</div></div>';
  });
  $('cal').innerHTML=html;
  $('cal').querySelectorAll('.bar').forEach(b=>b.addEventListener('click',()=>{sel=b.dataset.id;render();showDetail(sel,true);}));
}

function spark(s){
  const h=(D.history.rows||{})[s.id]; const dates=D.history.dates||[];
  if(!h) return '<p class="cap">No price history yet.</p>';
  const ser=[0,1].map(k=>dates.map((d,i)=>h[i]&&h[i][k]!=null?{x:i,y:h[i][k]}:null).filter(Boolean));
  const all=ser.flat(); if(all.length<2) return '<p class="cap">Not enough checks yet for a trend.</p>';
  const W=320,H=120,P={l:40,r:10,t:10,b:22};
  let lo=Math.min(...all.map(p=>p.y)),hi=Math.max(...all.map(p=>p.y)); if(hi-lo<20){hi+=10;lo-=10;}
  const X=i=>P.l+(i/(Math.max(1,dates.length-1)))*(W-P.l-P.r), Y=v=>P.t+(1-(v-lo)/(hi-lo))*(H-P.t-P.b);
  const cols=['var(--accent)','var(--good)'];
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price trend per person">`;
  [lo,(lo+hi)/2,hi].forEach(v=>{g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${P.l-4}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="var(--muted)" font-family="IBM Plex Mono,monospace">$${Math.round(v)}</text>`;});
  [0,dates.length-1].forEach(i=>{g+=`<text x="${X(i)}" y="${H-6}" font-size="10" text-anchor="${i?'end':'start'}" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${new Date(dates[i]+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</text>`;});
  ser.forEach((pts,k)=>{if(!pts.length)return;g+=`<polyline fill="none" stroke="${cols[k]}" stroke-width="2" points="${pts.map(p=>X(p.x)+','+Y(p.y)).join(' ')}"/>`;const e=pts[pts.length-1];g+=`<circle cx="${X(e.x)}" cy="${Y(e.y)}" r="3.5" fill="${cols[k]}"/>`;});
  g+='</svg>';
  return g+`<p class="cap"><span style="color:var(--accent)">━</span> interior &nbsp; <span style="color:var(--good)">━</span> balcony · per person, by check date</p>`;
}

function showDetail(id,scroll){
  const s=S.find(x=>x.id===id); if(!s) return; const f=s.fam;
  const drive=/Canaveral/.test(s.port)?'≈ 2¼ h drive':'≈ 4 h drive';
  $('detail').hidden=false;
  $('detail').innerHTML=`<div>
    <span class="lbl">${s.line} · ${s.n} nights</span>
    <h3>${s.ship}</h3>
    <p class="meta">${s.dep} → ${s.ret} · ${s.port} (${drive}) · ${s.calls}${s.school?` · <span class="chip ${s.schoolGood?'good':'muted'}">${s.school}</span>`:''}</p>
    <div class="kv">
      <div><span>Interior pp</span><b>${money(s.int)}</b></div>
      <div><span>Balcony pp</span><b>${money(s.bal)}</b></div>
      <div><span>All 4, one room</span><b>${f?(f.int?'≈ '+money(f.int):money(f.bal)):'—'}</b><span>${f?(f.int?'interior':'balcony')+' · quoted '+new Date(f.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'not quoted yet'}</span></div>
    </div>
    <p style="margin:10px 0 0"><span class="chip ${({deal:'good',close:'warn',out:'bad',no:'muted'})[status(s)]}">${s.deal}</span>${s.note?` <span class="small">${s.note}</span>`:''}</p>
    <div class="links">${f&&f.link?`<a class="go" href="${f.link}" target="_blank" rel="noopener">Price for 4 on the cruise line's site →</a>`:''}<a href="${s.src}" target="_blank" rel="noopener">Source: ${s.srcName}</a></div>
  </div><div class="spark"><span class="lbl">Price trend</span>${spark(s)}</div>`;
  if(scroll) $('detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',x===b));render();}));
document.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{filt=b.dataset.f;document.querySelectorAll('[data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));render();}));
document.querySelectorAll('[role=tab]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x===t));
  document.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==t.dataset.view);
  try{localStorage.setItem('cw-view',t.dataset.view)}catch(e){}
}));
try{const v=localStorage.getItem('cw-view');if(v&&v!=='cal'){const t=document.querySelector(`[data-view="${v}"]`);t&&t.click();}}catch(e){}
render();
const first=S.find(s=>status(s)==='deal'); if(first){sel=first.id;render();showDetail(first.id);}
})();

}).catch(e=>{document.getElementById('loading').textContent='Could not load the latest prices ('+e.message+'). Try refreshing.';});
