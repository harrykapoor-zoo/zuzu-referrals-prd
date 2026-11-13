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
function bindTilt(root){root.querySelectorAll('.tilt-shell').forEach(shell=>{shell.onpointermove=e=>{if(reduced.matches||e.pointerType==='touch')return;const r=shell.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;tilt(shell,(.5-y)*16,(x-.5)*20,x*100)};shell.onpointerleave=()=>tilt(shell,0,0,50)})}
function tilt(shell,x,y,light){const c=shell.querySelector('.member-card');if(!c)return;c.style.setProperty('--rx',x+'deg');c.style.setProperty('--ry',y+'deg');c.style.setProperty('--light',light+'%')}
bindTilt(document);
// Automatic artwork motion is always the baseline; sensors are optional and never prompt.
let baseline=null;
if(window.isSecureContext&&window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission!=='function'){
 window.addEventListener('deviceorientation',e=>{
  if(document.hidden||reduced.matches||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
  if(!baseline)baseline={b:e.beta,g:e.gamma};
  const wrap=n=>((n+180)%360+360)%360-180,b=wrap(e.beta-baseline.b),g=wrap(e.gamma-baseline.g),a=(screen.orientation?.angle||0)*Math.PI/180;
  const x=Math.max(-12,Math.min(12,(-b*Math.cos(a)+g*Math.sin(a))*.45)),y=Math.max(-14,Math.min(14,(g*Math.cos(a)+b*Math.sin(a))*.45));
  document.querySelectorAll('.tilt-shell').forEach(shell=>tilt(shell,x,y,50+y*2));
 },{passive:true});
}
document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('motion-paused',document.hidden);baseline=null});
