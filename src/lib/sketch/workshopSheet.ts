// src/lib/sketch/workshopSheet.ts
// Standalone per-module workshop sheet (self-contained HTML → print/Save-as-PDF).
// Generated on demand from a saved sketch's spec. No dependencies.

export interface WorkshopSpecInput {
  modelName?: string;
  lengthMm?: number; widthMm?: number; heightMm?: number;
  basinDepthMm?: number; wallThicknessMm?: number; wallLeftMm?: number; dividerMm?: number;
  basinCount?: number; floorType?: string;
  pitchPct?: number; pitchLeftPct?: number;
  drainRadiusMm?: number; exteriorStone?: string;
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>שרטוט סדנה — __TITLE__</title>
<style>
  :root{ --ink:#161616; --gold:#c9a24a; --line:#c9c4b8; --dim:#6b6456; --paper:#fff; --soft:#f6f4ee; --warn:#b91c1c; }
  *{box-sizing:border-box;}
  body{margin:0;background:#e9e6de;color:#1c1917;font-family:"Segoe UI",Arial,"Noto Sans Hebrew",sans-serif;font-size:13px;line-height:1.5;}
  .sheet{max-width:900px;margin:14px auto;background:var(--paper);border:1px solid var(--line);padding:22px 26px;}
  h1{font-size:20px;margin:0;}
  h2{font-size:14px;margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--ink);letter-spacing:.02em;}
  .titleblock{display:flex;justify-content:space-between;align-items:flex-start;border:2px solid var(--ink);border-radius:6px;overflow:hidden;}
  .titleblock .l{padding:10px 14px;}
  .titleblock .r{background:var(--ink);color:#efe9d8;padding:10px 14px;text-align:left;font-size:12px;min-width:210px;}
  .titleblock .r b{color:var(--gold);}
  .brand{font-family:'Frank Ruhl Libre',serif;font-weight:800;font-size:18px;}
  .sub{color:var(--dim);font-size:12px;}
  .warn{background:#fef2f2;border:1px solid #fecaca;color:var(--warn);border-radius:6px;padding:8px 12px;font-size:12px;margin:10px 0;}
  .note{background:var(--soft);border:1px solid var(--line);border-radius:6px;padding:10px 12px;font-size:12px;}
  .draw{border:1px solid var(--line);border-radius:6px;padding:6px;margin:8px 0;background:#fff;}
  .draw .cap{font-size:12px;font-weight:700;color:var(--ink);margin:2px 6px 4px;}
  svg{width:100%;height:auto;display:block;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0;}
  th,td{border:1px solid var(--line);padding:5px 7px;text-align:center;}
  th{background:var(--ink);color:#efe9d8;font-weight:600;}
  tbody tr:nth-child(even){background:var(--soft);}
  td.r{text-align:right;}
  ol.steps{margin:6px 0;padding-inline-start:20px;}
  ol.steps li{margin-bottom:6px;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .kpi{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}
  .kpi div{background:var(--soft);border:1px solid var(--line);border-radius:6px;padding:6px 10px;font-size:12px;}
  .kpi b{display:block;font-size:15px;color:var(--ink);}
  .foot{margin-top:18px;border-top:2px solid var(--gold);padding-top:8px;color:var(--dim);font-size:11px;display:flex;justify-content:space-between;}
  .wsprint{position:fixed;top:10px;left:10px;z-index:99;background:var(--ink);color:var(--gold);border:none;border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);}
  @media print{ .wsprint{display:none;} }
  @media print{ body{background:#fff;} .sheet{border:none;margin:0;max-width:none;} @page{size:A4;margin:12mm;} h2{break-after:avoid;} .draw,table{break-inside:avoid;} }
</style>
</head>
<body>
<button class="wsprint" onclick="window.print()">🖨️ הדפס / שמור כ-PDF</button>
<div class="sheet">
  <div class="titleblock">
    <div class="l">
      <div class="brand">א.ק עבודות גמר · ARVO</div>
      <div class="sub">שרטוט סדנה · הוראות ייצור והרכבה A–Z</div>
      <h1 style="margin-top:6px" id="h1"></h1>
      <div class="sub" id="subt"></div>
    </div>
    <div class="r">
      <div>שרטוט מס׳ <b id="dno"></b></div>
      <div>חומר: <b>פורצלן 5 מ"מ</b> · לוח 1200×2800</div>
      <div>מידות במ"מ · קנ"מ לא לפי סרגל</div>
      <div>סטטוס: <b>טיוטה — לאישור אלס</b></div>
    </div>
  </div>

  <div class="warn">⚠️ <b>לאישור אלס (היצרן):</b> הגאומטריה, המידות ומרכזי הניקוז מדויקים מהמודל. <b>שיטת הבנייה וסוג החומר — לאישור/התאמה של אלס.</b> תלייה לקיר טעונה אישור מהנדס קונסטרוקציה מול הקיר בפועל.</div>

  <div class="kpi" id="kpi"></div>

  <h2>1 · הרכבה כללית — מבט על (PLAN)</h2>
  <div class="draw"><div class="cap">מבט על · שרשרת מידות · מרכזי ניקוז</div><div id="plan"></div></div>
  <div class="grid2">
    <div class="draw"><div class="cap">חתך אורך (LONGITUDINAL)</div><div id="lsec"></div></div>
    <div class="draw"><div class="cap">חתך רוחב בכיור (CROSS)</div><div id="xsec"></div></div>
  </div>

  <h2>2 · פרט כיור בודד (BASIN DETAIL)</h2>
  <div class="draw"><div class="cap" id="basinCap"></div><div id="basin"></div></div>

  <h2>3 · רשימת חיתוך (CUT LIST) — פורצלן 5 מ"מ</h2>
  <table id="cutlist"><thead><tr><th>#</th><th>רכיב</th><th>כמות</th><th>אורך (מ"מ)</th><th>רוחב (מ"מ)</th><th>עובי</th><th>הערה</th></tr></thead><tbody></tbody></table>
  <div class="note" id="matsum"></div>

  <h2>4 · לוח ניקוזים (DRAIN SCHEDULE)</h2>
  <table id="drains"><thead><tr><th>כיור #</th><th>מרכז ניקוז X (מ"מ)</th><th>רוחב כיור</th><th>תחתית</th><th>קדח ניקוז</th></tr></thead><tbody></tbody></table>

  <h2>5 · תוכנית ניסור וכמות לוחות — לוח 1200×2800 @ 5 מ"מ</h2>
  <div class="note" id="nest"></div>
  <div class="draw"><div class="cap">פריסת ניסור (הדמיה סכמטית)</div><div id="nestDraw"></div></div>

  <h2>6 · רצף ייצור והרכבה (A–Z)</h2>
  <ol class="steps" id="steps"></ol>

  <h2>7 · הערות ייצור</h2>
  <ul id="notes"></ul>

  <div class="foot"><span>א.ק עבודות גמר — ARVO · Marble Art</span><span id="stamp"></span></div>
</div>

<script>
"use strict";
const M = __M__;
const SHEET={w:1200,l:2800}, SHEET_AREA=3.36, NS='http://www.w3.org/2000/svg';
const usable=M.L-M.wallEnd*2-(M.n-1)*M.divider, bw=Math.round(usable/M.n), cavD=M.D-M.rim*2;
const flat=M.floor==='flat';
const fall = flat?0:Math.round((bw/2)*(M.pitch/100)*10)/10;
const wallH = M.basinDepth + (flat?0:Math.ceil(fall));
const bottomLen = flat?bw:Math.round(2*Math.hypot(bw/2,fall));
const basins=[]; let cur=M.wallEnd;
for(let i=0;i<M.n;i++){ basins.push({i:i+1,x1:cur,x2:cur+bw,center:Math.round(cur+bw/2)}); cur+=bw+M.divider; }

document.title='שרטוט סדנה — '+M.name+' · '+M.n+' כיורים';
document.getElementById('h1').textContent=M.name+' · '+M.n+' כיורים — כיור שיש רב-כיורי';
document.getElementById('subt').textContent='תעלה אחת · '+M.n+' כיורים נפרדים · ניקוז לכל כיור · '+(flat?'תחתית ישרה 90°':'תחתית משופעת '+M.pitch+'%');
document.getElementById('dno').textContent='WS-'+(M.name==='נשים'?'FEM'+M.n:'MAL'+M.n);
document.getElementById('basinCap').textContent='כיור טיפוסי '+bw+'×'+cavD+' · עומק '+M.basinDepth+' · '+(flat?'תחתית ישרה 90°':'שיפוע '+M.pitch+'% לניקוז')+' Ø'+M.drainDia;

document.getElementById('kpi').innerHTML=[
 ['אורך כולל',M.L+' מ"מ'],['רוחב',M.D+' מ"מ'],['גובה',M.H+' מ"מ'],
 ['כיורים',M.n+' × '+bw+' מ"מ'],['עומק כיור',M.basinDepth+' מ"מ'],
 ['תחתית',flat?'ישרה 90°':(M.pitch+'% · ירידה '+fall+' מ"מ')],['ניקוזים',M.n+' × Ø'+M.drainDia]
].map(function(a){return '<div>'+a[0]+'<b>'+a[1]+'</b></div>';}).join('');

function dimH(x1,x2,y,lbl){return '<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke="#6b6456"/><line x1="'+x1+'" y1="'+(y-4)+'" x2="'+x1+'" y2="'+(y+4)+'" stroke="#6b6456"/><line x1="'+x2+'" y1="'+(y-4)+'" x2="'+x2+'" y2="'+(y+4)+'" stroke="#6b6456"/><text x="'+((x1+x2)/2)+'" y="'+(y-4)+'" text-anchor="middle" font-size="10" fill="#6b6456" font-family="monospace">'+lbl+'</text>';}
function dimV(y1,y2,x,lbl){return '<line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'" stroke="#6b6456"/><line x1="'+(x-4)+'" y1="'+y1+'" x2="'+(x+4)+'" y2="'+y1+'" stroke="#6b6456"/><line x1="'+(x-4)+'" y1="'+y2+'" x2="'+(x+4)+'" y2="'+y2+'" stroke="#6b6456"/><text x="'+x+'" y="'+((y1+y2)/2)+'" text-anchor="middle" font-size="10" fill="#6b6456" font-family="monospace" transform="rotate(-90 '+x+' '+((y1+y2)/2)+')">'+lbl+'</text>';}

// PLAN
(function(){
  var VW=960,VH=250,padX=60,padTop=54,padBot=70,drawW=VW-padX*2,blockH=VH-padTop-padBot;
  var sx=M.L/drawW, px=function(mm){return padX+mm/sx;};
  var g='<rect x="'+padX+'" y="'+padTop+'" width="'+drawW+'" height="'+blockH+'" fill="#f2f0ec" stroke="#1e293b" stroke-width="1.4"/>';
  g+='<rect x="'+padX+'" y="'+padTop+'" width="'+(M.wallEnd/sx)+'" height="'+blockH+'" fill="#00000012"/>';
  g+='<rect x="'+px(M.L-M.wallEnd)+'" y="'+padTop+'" width="'+(M.wallEnd/sx)+'" height="'+blockH+'" fill="#00000012"/>';
  var rimPx=M.rim/(M.D/blockH);
  basins.forEach(function(b){
    var bx=px(b.x1),bwid=(b.x2-b.x1)/sx;
    g+='<rect x="'+bx+'" y="'+(padTop+rimPx)+'" width="'+bwid+'" height="'+(blockH-rimPx*2)+'" fill="#e2e8f0" stroke="#334155" stroke-dasharray="4 2"/>';
    var cx=px(b.center),cy=padTop+blockH/2;
    g+='<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
    g+='<text x="'+(bx+bwid/2)+'" y="'+(padTop+blockH/2-12)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#3a352c">'+b.i+'</text>';
    g+='<text x="'+cx+'" y="'+(padTop+blockH+14)+'" text-anchor="middle" font-size="9" fill="#6b6456" font-family="monospace">'+b.center+'</text>';
    if(b.i<M.n){var dv=px(b.x2+M.divider/2);g+='<line x1="'+dv+'" y1="'+padTop+'" x2="'+dv+'" y2="'+(padTop+blockH)+'" stroke="#7a7466" stroke-width="2"/>';}
  });
  var y0=padTop-14;
  g+=dimH(px(0),px(M.wallEnd),y0,''+M.wallEnd);
  basins.forEach(function(b,i){ g+=dimH(px(b.x1),px(b.x2),y0,''+bw); if(i<M.n-1)g+=dimH(px(b.x2),px(b.x2+M.divider),y0,''+M.divider); });
  g+=dimH(px(M.L-M.wallEnd),px(M.L),y0,''+M.wallEnd);
  g+=dimH(padX,padX+drawW,padTop+blockH+40,M.L+' (אורך כולל)');
  g+=dimV(padTop,padTop+blockH,padX-16,''+M.D);
  document.getElementById('plan').innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" xmlns="'+NS+'" style="direction:ltr">'+g+'</svg>';
})();

// LONGITUDINAL
(function(){
  var VW=470,VH=210,padX=44,padTop=40,padBot=48,drawW=VW-padX*2,boxH=VH-padTop-padBot;
  var sx=M.L/drawW,px=function(mm){return padX+mm/sx;},scY=boxH/M.H;
  var floorY=padTop+boxH-(M.slab*scY), basinTopY=padTop+(M.H-M.basinDepth)*scY;
  var g='<rect x="'+padX+'" y="'+padTop+'" width="'+drawW+'" height="'+boxH+'" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.3"/>';
  basins.forEach(function(b,i){
    var xL=px(b.x1),xR=px(b.x2),cx=px(b.center);
    if(flat){
      g+='<path d="M '+xL+' '+basinTopY+' L '+xR+' '+basinTopY+' L '+xR+' '+floorY+' L '+xL+' '+floorY+' Z" fill="#fff" stroke="#334155" stroke-width="1"/>';
      g+='<circle cx="'+cx+'" cy="'+(floorY-2)+'" r="2.5" fill="none" stroke="#1e293b"/>';
      g+='<text x="'+cx+'" y="'+(basinTopY-3)+'" text-anchor="middle" font-size="8" fill="#6b6456" font-family="monospace" font-style="italic">90°</text>';
    } else {
      var drop=Math.max((bw/2)*(M.pitch/100)*scY,7), low=floorY+drop;
      g+='<path d="M '+xL+' '+basinTopY+' L '+xR+' '+basinTopY+' L '+xR+' '+floorY+' L '+cx+' '+low+' L '+xL+' '+floorY+' Z" fill="#fff" stroke="#334155" stroke-width="1"/>';
      g+='<circle cx="'+cx+'" cy="'+(low-2)+'" r="2.5" fill="none" stroke="#1e293b"/>';
      g+='<text x="'+cx+'" y="'+(basinTopY-3)+'" text-anchor="middle" font-size="8" fill="#6b6456" font-family="monospace" font-style="italic">'+M.pitch+'%</text>';
    }
    if(i<M.n-1){var r=px(b.x2);g+='<rect x="'+r+'" y="'+basinTopY+'" width="'+(M.divider/sx)+'" height="'+(floorY-basinTopY)+'" fill="#e2e8f0" stroke="#334155"/>';}
  });
  g+='<line x1="'+(padX-8)+'" y1="'+(padTop-4)+'" x2="'+(padX-8)+'" y2="'+(padTop+boxH+4)+'" stroke="#1e293b" stroke-width="2"/>';
  g+=dimV(padTop,padTop+boxH,padX+drawW+14,''+M.H);
  document.getElementById('lsec').innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" xmlns="'+NS+'" style="direction:ltr">'+g+'</svg>';
})();

// CROSS
(function(){
  var VW=470,VH=210,padX=70,padTop=30,padBot=40,drawW=VW-padX*2,boxH=VH-padTop-padBot;
  var scY=boxH/M.H,scX=drawW/M.D,px=function(mm){return padX+mm*scX;};
  var slabY=M.slab*scY,basinTopY=padTop+(M.H-M.basinDepth)*scY;
  var g='<rect x="'+padX+'" y="'+padTop+'" width="'+drawW+'" height="'+boxH+'" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.3"/>';
  g+='<rect x="'+px(M.rim)+'" y="'+basinTopY+'" width="'+(cavD*scX)+'" height="'+(boxH-(M.basinDepth*scY))+'" fill="#fff" stroke="#334155"/>';
  g+='<line x1="'+(padX-4)+'" y1="'+(padTop-8)+'" x2="'+(padX+drawW+4)+'" y2="'+(padTop-8)+'" stroke="#1e293b" stroke-width="2"/>';
  g+='<text x="'+(padX+drawW/2)+'" y="'+(padTop-11)+'" text-anchor="middle" font-size="8" fill="#6b6456">קיר · תלייה</text>';
  g+=dimH(padX,padX+drawW,padTop+boxH+22,''+M.D);
  g+=dimV(padTop,padTop+boxH,padX-16,''+M.H);
  g+=dimV(basinTopY,padTop+boxH-slabY,px(M.rim)-8,''+M.basinDepth);
  g+='<text x="'+px(M.D/2)+'" y="'+(padTop+boxH-6)+'" text-anchor="middle" font-size="8" fill="#6b6456">אפרון '+(M.H-M.basinDepth)+' · לוח '+M.slab+' מ"מ</text>';
  document.getElementById('xsec').innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" xmlns="'+NS+'" style="direction:ltr">'+g+'</svg>';
})();

// BASIN DETAIL
(function(){
  var VW=760,VH=210,padX=60,padTop=36,padBot=44,drawW=VW-padX*2,boxH=VH-padTop-padBot;
  var cx=padX+drawW/2;
  var g;
  if(flat){
    var by=padTop+8;
    g='<path d="M '+padX+' '+padTop+' L '+(padX+drawW)+' '+padTop+' L '+(padX+drawW)+' '+(padTop+boxH)+' L '+padX+' '+(padTop+boxH)+' Z" fill="#fff" stroke="#1e293b" stroke-width="1.4"/>';
    g+='<circle cx="'+cx+'" cy="'+(padTop+boxH-3)+'" r="6" fill="none" stroke="#1e293b" stroke-width="1.3"/><text x="'+(cx+10)+'" y="'+(padTop+boxH)+'" font-size="9" fill="#6b6456" font-family="monospace">Ø'+M.drainDia+'</text>';
    g+='<text x="'+cx+'" y="'+(padTop-8)+'" text-anchor="middle" font-size="10" fill="#6b6456" font-style="italic" font-family="monospace">תחתית ישרה 90° · עומק אחיד '+M.basinDepth+'</text>';
    g+=dimH(padX,padX+drawW,padTop+boxH+22,bw+' (אורך כיור)');
  } else {
    var drop=Math.max((bw/2)*(M.pitch/100)*(boxH/M.basinDepth),16),edgeY=padTop+8,low=edgeY+drop;
    g='<path d="M '+padX+' '+padTop+' L '+(padX+drawW)+' '+padTop+' L '+(padX+drawW)+' '+edgeY+' L '+cx+' '+low+' L '+padX+' '+edgeY+' Z" fill="#fff" stroke="#1e293b" stroke-width="1.4"/>';
    g+='<circle cx="'+cx+'" cy="'+(low-3)+'" r="6" fill="none" stroke="#1e293b" stroke-width="1.3"/><text x="'+(cx+10)+'" y="'+low+'" font-size="9" fill="#6b6456" font-family="monospace">Ø'+M.drainDia+'</text>';
    g+='<text x="'+(padX+drawW*0.25)+'" y="'+(edgeY-4)+'" font-size="9" fill="#6b6456" font-style="italic" font-family="monospace">'+M.pitch+'%</text>';
    g+='<text x="'+(padX+drawW*0.72)+'" y="'+(edgeY-4)+'" font-size="9" fill="#6b6456" font-style="italic" font-family="monospace">'+M.pitch+'%</text>';
    g+=dimH(padX,padX+drawW,padTop+boxH+22,bw+' (אורך כיור)');
    g+='<text x="'+cx+'" y="'+(low+18)+'" text-anchor="middle" font-size="9" fill="#6b6456">ירידה '+fall+' מ"מ לכל צד · עומק בניקוז '+M.basinDepth+'</text>';
  }
  document.getElementById('basin').innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" xmlns="'+NS+'" style="direction:ltr">'+g+'</svg>';
})();

// NESTING engine
function toRects(panels){var R=[];panels.forEach(function(p){for(var q=0;q<p.qty;q++){var lo=Math.max(p.w,p.h),sh=Math.min(p.w,p.h);if(lo<=SHEET.l&&sh<=SHEET.w){R.push({w:sh,h:lo});}else{var pc=Math.ceil(lo/SHEET.l),pl=Math.round(lo/pc);for(var k=0;k<pc;k++)R.push({w:sh,h:pl});}}});return R;}
function nest(rects){var rs=rects.slice().sort(function(a,b){return b.h-a.h;});var sheets=[],used=0;rs.forEach(function(r){var placed=false;for(var si=0;si<sheets.length;si++){var s=sheets[si];for(var j=0;j<s.shelves.length;j++){if(r.h<=s.shelves[j].h&&s.shelves[j].x+r.w<=SHEET.w){s.shelves[j].x+=r.w;placed=true;break;}}if(placed)break;var uL=s.shelves.reduce(function(a,x){return a+x.h;},0);if(uL+r.h<=SHEET.l){s.shelves.push({h:r.h,x:r.w});placed=true;break;}}if(!placed)sheets.push({shelves:[{h:r.h,x:r.w}]});used+=r.w*r.h;});return {sheets:sheets.length,util:used/(sheets.length*SHEET.w*SHEET.l),areaM2:used/1e6,layout:sheets};}
var PAN=[
  {label:'חזית (אפרון)',w:M.L,h:M.H,qty:1},
  {label:'גב (צד קיר)',w:M.L,h:M.H,qty:1},
  {label:'צד קצה',w:M.D,h:M.H,qty:2},
  {label:'דק (משטח עליון)',w:M.L,h:M.D,qty:1},
  {label:'תחתית כיור',w:bottomLen,h:cavD,qty:M.n},
  {label:'דופן כיור אורכית',w:bw,h:wallH,qty:M.n*2},
  {label:'דופן/מחיצה רוחבית',w:cavD,h:wallH,qty:M.n+1}
];
var MOD=nest(toRects(PAN));

// CUT LIST
(function(){
  var rows=[
    ['1','חזית (אפרון)',1,M.L,M.H,'ניסור לחלקים ≤2800 · תפר נסתר'],
    ['2','גב (צד קיר)',1,M.L,M.H,'ניסור לחלקים ≤2800'],
    ['3','צד קצה',2,M.D,M.H,'—'],
    ['4','משטח עליון (דק)',1,M.L,M.D,M.n+' חיתוכי כיור '+bw+'×'+cavD],
    ['5','תחתית כיור ('+(flat?'ישרה':'משופעת')+')',M.n,bottomLen,cavD,(flat?'ישרה 90°':'שיפוע '+M.pitch+'%')+' · קדח Ø'+M.drainDia],
    ['6','דופן כיור אורכית',M.n*2,bw,wallH,'2 לכל כיור'+(flat?'':' · גובה כולל מפל')],
    ['7','דופן/מחיצה רוחבית',M.n+1,cavD,wallH,'קצוות + '+(M.n-1)+' מחיצות']
  ];
  document.querySelector('#cutlist tbody').innerHTML=rows.map(function(r){return '<tr><td>'+r[0]+'</td><td class="r">'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+M.slab+'</td><td class="r">'+r[5]+'</td></tr>';}).join('');
  document.getElementById('matsum').innerHTML='<b>שטח לוחות נטו (שכבה בודדת):</b> ≈ '+MOD.areaM2.toFixed(2)+' מ"ר · עובי 5 מ"מ. פירוט ניסור וכמות לוחות — בסעיף 5.';
})();

// DRAINS
document.querySelector('#drains tbody').innerHTML=basins.map(function(b){return '<tr><td>'+b.i+'</td><td>'+b.center+'</td><td>'+bw+'</td><td>'+(flat?'ישרה 90°':M.pitch+'%')+'</td><td>Ø'+M.drainDia+'</td></tr>';}).join('');

// NEST note + diagram
var waste=flat?1.10:1.25, boards=Math.ceil(MOD.areaM2*waste/SHEET_AREA);
document.getElementById('nest').innerHTML='<b>'+M.name+' · '+M.n+' כיורים ('+(flat?'ישר 90°':'משופע')+'):</b> שטח לוחות נטו ≈ <b>'+MOD.areaM2.toFixed(2)+' מ"ר</b> · לוחות מעל 2800 מ"מ מנוסרים לחלקים עם תפר נסתר · מקדם פחת '+waste+' · '+
  'קינון בלוחות 1200×2800 (3.36 מ"ר): <b>'+boards+' לוחות</b> לשכבה בודדת · מולחם ×2 (10 מ"מ): <b>'+(boards*2)+' לוחות</b>. '+
  '<span style="color:#6b6456">החומר בהספקת המזמין · קינון שמרני — מפעל CNC יצמצם.</span>';
(function(){
  var L=MOD.layout,per=Math.min(L.length,7),sw=110,gap=12,sh=Math.round(sw*SHEET.l/SHEET.w/2),VW=per*(sw+gap)+gap,VH=sh+34,g='';
  L.slice(0,per).forEach(function(s,i){var x0=gap+i*(sw+gap),y0=22;g+='<rect x="'+x0+'" y="'+y0+'" width="'+sw+'" height="'+sh+'" fill="#f6f4ee" stroke="#1e293b" stroke-width="1.1"/>';var cy=y0;s.shelves.forEach(function(shf){var bh=shf.h/SHEET.l*sh,w2=Math.min(shf.x/SHEET.w,1)*sw;g+='<rect x="'+x0+'" y="'+cy+'" width="'+w2+'" height="'+bh+'" fill="#dbe4ee" stroke="#7a7466" stroke-width="0.5"/>';cy+=bh;});g+='<text x="'+(x0+sw/2)+'" y="'+(y0-6)+'" text-anchor="middle" font-size="9" fill="#6b6456">לוח '+(i+1)+'</text>';});
  if(L.length>per)g+='<text x="'+(VW-4)+'" y="'+(VH-4)+'" text-anchor="end" font-size="9" fill="#6b6456">+'+(L.length-per)+' נוספים</text>';
  document.getElementById('nestDraw').innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" xmlns="'+NS+'" style="direction:ltr">'+g+'</svg>';
})();

// STEPS
(function(){
  var centersTxt=basins.map(function(b){return b.center;}).join(' / ');
  var floorStep=flat?'תחתית ישרה 90° — ללא שיפוע. דפנות פנים אנכיות; ודא פילוס מושלם לפני איטום.':'בנה תחתית משופעת '+M.pitch+'% למרכז כל כיור (ירידה ~'+fall+' מ"מ). בדוק בפלס ובמים לפני איטום.';
  var steps=[
    '<b>חיתוך:</b> נסר את כל הלוחות לפי רשימת החיתוך (מסור-מים/CNC). דיוק ±1 מ"מ.',
    '<b>למינציה (אם ×2):</b> הדבק זוגות 5+5 מ"מ ל-10 מ"מ, ייבוש בלחץ.',
    '<b>לכסון 45°:</b> קצוות חיבור חזית/גב/צדדים/דק לתפרים נסתרים.',
    '<b>מעטפת:</b> הרכב חזית+גב+2 צדדים לקופסה '+M.L+'×'+M.D+'×'+M.H+'. זוויות 90°.',
    '<b>חלונות דק:</b> פתח '+M.n+' חלונות '+bw+'×'+cavD+' לפי מרכזים: '+centersTxt+'.',
    '<b>כיורים:</b> לכל כיור תחתית + 2 דפנות אורכיות + דפנות רוחב. קדח ניקוז Ø'+M.drainDia+' במרכז.',
    '<b>תחתית:</b> '+floorStep,
    '<b>שיקוע והרכבה:</b> שקע '+M.n+' הכיורים בחלונות הדק, הדבק ואטום תפרים.',
    '<b>מחיצות:</b> התקן '+(M.n-1)+' מחיצות ('+M.divider+' מ"מ) בין הכיורים.',
    '<b>איטום וגימור:</b> אטום תפרים בדבק אבן תואם-גוון, השחז והברק.',
    '<b>ניקוזים/סיפונים:</b> '+M.n+' ניקוזים + סיפונים.',
    '<b>תלייה:</b> מסילת תלייה/זוויתני פלדה לפי חישוב משקל — ⚠️ לאישור מהנדס מול הקיר בפועל.',
    '<b>QC:</b> מידות, פילוס/שיפועים, מבחן הצפת-מים לאטימות, גימור.'
  ];
  document.getElementById('steps').innerHTML=steps.map(function(t){return '<li>'+t+'</li>';}).join('');
})();

// NOTES
(function(){
  var n=[
    'חיבורים: לכסון 45° + הדבקה קונסטרוקטיבית; תפרים נסתרים תואמי-גוון.',
    'אורך כולל '+M.L+' מ"מ '+(M.L>2800?'> אורך לוח (2800) — ניסור לחלקים עם תפר מוסתר לנשיאה ולהובלה.':'.'),
    'ניקוז: קדח Ø'+M.drainDia+' מתאים לסיפון 1½". לאשר קוטר מול הסיפון בפועל.',
    flat?'תחתית ישרה 90° — ללא שיפוע גרביטציוני; דרושה שיפולת מקומית סביב הפתח או פילוס מדויק.':'שיפוע נמדד עד לנקודת הניקוז. עומק בקצה ≈ '+(M.basinDepth-Math.round(fall))+' מ"מ · בניקוז '+M.basinDepth+' מ"מ.',
    'החומר (לוחות 1200×2800 @ 5 מ"מ) בהספקת המזמין. סבולת ±1 מ"מ לחיתוך.'
  ];
  document.getElementById('notes').innerHTML=n.map(function(t){return '<li>'+t+'</li>';}).join('');
})();

document.getElementById('stamp').textContent='שרטוט WS-'+(M.name==='נשים'?'FEM':'MAL')+M.n+' · שיש חוץ: '+M.stoneExt;
</script>
</body>
</html>`;

export function buildWorkshopHtml(spec: WorkshopSpecInput): string {
  const flat = spec.floorType === 'flat';
  const M = {
    name: ((spec.modelName || 'כיור').split('·')[0].trim()) || 'כיור',
    L: Math.round(spec.lengthMm || 0),
    D: Math.round(spec.widthMm || 0),
    H: Math.round(spec.heightMm || 0),
    basinDepth: Math.round(spec.basinDepthMm || 0),
    wallEnd: Math.round(spec.wallLeftMm || spec.wallThicknessMm || 30),
    divider: Math.round(spec.dividerMm || spec.wallThicknessMm || 40),
    slab: 5,
    n: Math.max(1, Math.min(10, Math.round(spec.basinCount || 1))),
    pitch: flat ? 0 : (spec.pitchLeftPct ?? spec.pitchPct ?? 2),
    floor: flat ? 'flat' : 'sloped',
    drainDia: spec.drainRadiusMm ? Math.max(30, Math.round(spec.drainRadiusMm * 2)) : 40,
    rim: 50,
    stoneExt: spec.exteriorStone || 'שיש',
  };
  const title = M.name + ' · ' + M.n + ' כיורים';
  return TEMPLATE.replace('__M__', JSON.stringify(M)).split('__TITLE__').join(title);
}
