'use strict';
const $=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cards=Array.from($('collection-grid').children);
function filter(){
 const q=$('search').value.trim().toLowerCase().replace(/^#/,''), family=$('family').value;
 let n=0;
 for(const c of cards){
  const match=(!q||(/^\d+$/.test(q)?Number(q)===Number(c.dataset.number):c.dataset.search.includes(q)))&&(family==='all'||c.dataset.family===family);
  c.hidden=!match;if(match)n++;
 }
 $('result-count').textContent=n+' edition'+(n===1?'':'s');$('no-results').hidden=n>0;
}
$('search').addEventListener('input',filter);$('family').addEventListener('change',filter);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('collection-grid').classList.toggle('list',b.dataset.view==='list');
}));
// Keep the artwork browse-only. Horizontal touch gestures tilt; the browser owns scrolling.
const surfaces=[...document.querySelectorAll('.tilt-shell,.tile-art')];
const visible=new Set(), held=new Set();
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
let sensorX=0,sensorY=0,frame=0,neutral=null,permission='idle';
function draw(s,x,y){
 const style=s.firstElementChild.style;
 style.setProperty('--rx',x.toFixed(1)+'deg');
 style.setProperty('--ry',y.toFixed(1)+'deg');
 style.setProperty('--light',clamp(50+y*2,12,88).toFixed(1)+'%');
}
function paint(){frame=0;if(!reduced.matches&&!document.hidden) for(const s of visible) if(!held.has(s))draw(s,sensorX,sensorY)}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
const observer=new IntersectionObserver(entries=>{
 for(const {target,isIntersecting} of entries){if(isIntersecting)visible.add(target);else visible.delete(target)}
 schedule()
});
const orientation=window.DeviceOrientationEvent;
const gated=window.isSecureContext && typeof orientation?.requestPermission==='function';
const hint=document.createElement('span');
hint.className='touch-tip';
function updateHint(){hint.textContent=gated && permission==='idle'?'Drag to tilt · Tap for phone motion':'Drag to tilt'}
updateHint();document.querySelector('.edition-caption')?.append(hint);
function listen(){window.addEventListener('deviceorientation',sense,{passive:true})}
function sense(e){
 if(document.hidden||reduced.matches||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
 const angle=screen.orientation?.angle ?? window.orientation ?? 0;
 if(!neutral||neutral.angle!==angle)neutral={b:e.beta,g:e.gamma,angle};
 const wrap=n=>((n+540)%360)-180,a=angle*Math.PI/180,b=wrap(e.beta-neutral.b),g=wrap(e.gamma-neutral.g);
 sensorX=clamp((-b*Math.cos(a)+g*Math.sin(a))*.8,-18,18);
 sensorY=clamp((g*Math.cos(a)+b*Math.sin(a))*.9,-22,22);
 schedule();
}
if(window.isSecureContext && orientation && !gated)listen();
async function allowMotion(){
 if(!gated||permission!=='idle'||reduced.matches)return;
 permission='pending';
 try{permission=await orientation.requestPermission();if(permission==='granted')listen()}
 catch{permission='unavailable'}
 updateHint();
}
for(const s of surfaces){
 observer.observe(s);
 let pointer=null, startX=0,startY=0,drag=false;
 function point(e){
  const r=s.getBoundingClientRect();
  const u=clamp((e.clientX-r.left)/r.width,0,1),v=clamp((e.clientY-r.top)/r.height,0,1);
  draw(s,(.5-v)*34,(u-.5)*44);
 }
 s.addEventListener('pointerdown',e=>{
  if(reduced.matches||!e.isPrimary||e.button!==0)return;
  pointer=e.pointerId;startX=e.clientX;startY=e.clientY;drag=false;
  held.add(s);s.setPointerCapture(e.pointerId);point(e)
 });
 s.addEventListener('pointermove',e=>{
  if(reduced.matches||!e.isPrimary)return;
  if(e.pointerType!=='mouse'&&pointer!==e.pointerId)return;
  if(Math.hypot(e.clientX-startX,e.clientY-startY)>8)drag=true;
  held.add(s);point(e)
 });
 function release(){pointer=null;held.delete(s);draw(s,sensorX,sensorY)}
 s.addEventListener('pointerup',e=>{
  if(pointer!==e.pointerId)return;
  if(!drag&&e.pointerType==='touch')allowMotion();
  release()
 });
 s.addEventListener('pointercancel',release);
 s.addEventListener('lostpointercapture',()=>{if(pointer!==null)release()});
 s.addEventListener('pointerleave',()=>{if(pointer===null)release()});
}
function resetMotion(){neutral=null;sensorX=0;sensorY=0;held.clear();schedule()}
document.addEventListener('visibilitychange',()=>{
 document.documentElement.classList.toggle('motion-paused',document.hidden);resetMotion()
});
reduced.addEventListener('change',resetMotion);
