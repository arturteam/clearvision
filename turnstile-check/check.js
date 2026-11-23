(()=>{'use strict';
 const endpoint='https://clearvision-giveaway-prod.arturteam1.workers.dev/bogo-test/turnstile';
 const $=id=>document.getElementById(id);let widget=null,phase='idle';
 const message=s=>{$('message').textContent=s};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function check(scenario,token){
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario,token}),redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});
  const d=await r.json();const pass=r.ok&&d.ok===true&&d.pass===true;
  $(scenario).textContent=scenario+': '+(pass?'PASS':'FAIL');
  if(!pass)throw Error('test_failed');
 }
 function stop(){phase='stopped';try{if(widget!==null)window.turnstile.remove(widget)}catch{}message('Test zatrzymany: FAIL. Nie wydano kodu. Nie kopiuj tokenów ani sekretów.');}
 async function tokenReady(value){
  if(!['fresh','expired-token'].includes(phase))return;
  let token=value;
  try{
   if(phase==='fresh'){
    phase='busy';await check('FRESH',token);message('Sprawdzanie ponownego użycia…');await sleep(6000);await check('REUSED',token);token='';
    phase='expired-token';message('Potwierdź Cloudflare ponownie, jeśli poprosi. Następnie test sam odczeka na wygaśnięcie.');window.turnstile.reset(widget);
   }else{
    phase='holding';const started=performance.now();
    while(performance.now()-started<310000){const left=Math.ceil((310000-(performance.now()-started))/1000);message('Test wygaśnięcia — pozostało '+left+' s. Nie zamykaj tej karty.');await sleep(1000);}
    await check('EXPIRED',token);token='';phase='done';window.turnstile.remove(widget);message('PASS: wszystkie cztery testy Turnstile. Nie wydano kodu i nie sprawdzano zakupów.');
   }
  }catch{stop()}finally{token='';}
 }
 function render(){widget=window.turnstile.render($('widget'),{sitekey:'0x4AAAAAAGLpp7VCFaQjl258',action:'bogo',callback:tokenReady,'error-callback':stop,'expired-callback':()=>{if(phase!=='holding')stop()}});}
 $('start').onclick=async()=>{
  if(phase!=='idle')return;
  if(location.origin!=='https://arturteam.github.io'){message('Test rzeczywisty wymaga domeny arturteam.github.io.');return;}
  $('start').disabled=true;phase='initial';
  try{
   await check('EMPTY','');phase='fresh';message('Potwierdź widget Cloudflare, jeśli poprosi.');
   if(window.turnstile)render();else{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=render;script.onerror=stop;document.head.append(script);}
  }catch{stop()}
 };
})();
