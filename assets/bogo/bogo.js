(()=>{
'use strict';
const pl=document.documentElement.lang==='pl', $=s=>document.querySelector(s);
const api='https://clearvision-giveaway-prod.arturteam1.workers.dev/bogo-claim';
const names={CV02:'CV02 Split Max',CV03:'CV03 Split Focus',CV05:'CV05 Edge'};
const msg={
 bogo_not_ready:pl?'Automatyczny odbiór BOGO jest w przygotowaniu. Skorzystaj z kontaktu poniżej.':'Automatic BOGO claims are being prepared. Please use the support contact below.',
 invalid_request:pl?'Sprawdź dane formularza.':'Please check the form details.',
 order_not_found:pl?'Nie znaleziono zakupu. Sprawdź numer zamówienia i wybraną kupioną tarczę.':'Purchase not found. Check the order number and purchased watch face.',
 purchase_not_eligible:pl?'Zakup nie spełnia warunków BOGO lub nie jest jeszcze przetworzony. Jeśli dopiero kupiłeś tarczę, spróbuj później.':'This purchase is not eligible or has not finished processing. If you just purchased it, try again later.',
 rate_limited:pl?'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.':'Too many attempts. Please wait and retry.',
 verification_failed:pl?'Ponów weryfikację Cloudflare i spróbuj ponownie.':'Complete Cloudflare verification again and retry.',
 already_fulfilled:pl?'Za ten zakup wydano już gratis. W razie problemu napisz do pomocy.':'A free watch face was already issued for this purchase. Contact support if you need help.',
 already_claimed:pl?'Za ten zakup wydano już kod. Odzyskaj go w przeglądarce użytej przy odbiorze lub napisz do pomocy.':'A code was already issued for this purchase. Recover it in the original browser or contact support.',
 sold_out:pl?'Pula wybranej tarczy jest wyczerpana. Wybierz inną tarczę.':'The selected watch face has no codes left. Please choose another.',
 temporarily_unavailable:pl?'Chwilowo nie możemy sprawdzić zakupu. Spróbuj ponownie — nie usuwaj danych tej witryny.':'We cannot verify the purchase right now. Retry later and keep this browser’s website data.',
 storage:pl?'Aby bezpiecznie odebrać i odzyskać kod, zezwól tej witrynie na zapis danych w przeglądarce.':'Allow this website to store browser data so you can safely claim and recover your code.'
};
let widget=null,token='',busy=false,currentCode='';
const tell=s=>{$('#message').textContent=s};
function update(){$('#submit').disabled=busy||!token}
function random(){const a=crypto.getRandomValues(new Uint8Array(32));return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}
async function identity(pkg,order){
 const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pkg+'|'+order)));
 const key='cv_bogo_recovery_v1_'+Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
 let recovery=localStorage.getItem(key);
 if(recovery&&!/^[A-Za-z0-9_-]{32,100}$/.test(recovery))throw Error('storage');
 if(!recovery){recovery=random();localStorage.setItem(key,recovery)}
 if(localStorage.getItem(key)!==recovery)throw Error('storage');
 return recovery;
}
function analytics(name,model){try{const c=JSON.parse(localStorage.getItem('clear_vision_analytics_consent'));if(c?.value==='granted'&&Number.isFinite(c.savedAt)&&Date.now()-c.savedAt>=0&&Date.now()-c.savedAt<180*86400000&&typeof window.gtag==='function')window.gtag('event',name,{model})}catch{}}
window.cvBogoTurnstileReady=()=>{widget=turnstile.render('#verification',{sitekey:'0x4AAAAAAGLpp7VCFaQjl258',action:'bogo',callback:t=>{token=t;update()},'expired-callback':()=>{token='';update();tell(msg.verification_failed)},'timeout-callback':()=>{token='';update();tell(msg.verification_failed)},'error-callback':()=>{token='';update();tell(msg.verification_failed)}})};
$('#message').textContent=msg.bogo_not_ready;
const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=cvBogoTurnstileReady&render=explicit';script.async=true;script.onerror=()=>tell(msg.verification_failed);document.head.appendChild(script);
$('#bogo-form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!token)return;
 const order=$('#order').value.trim(),purchasedModel=$('#purchased').value,model=$('input[name="gift"]:checked')?.value;
 if(!/^GPA\.[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{5}$/.test(order)||!['CV06','CV07','CV08'].includes(purchasedModel)||!names[model]){tell(msg.invalid_request);return}
 busy=true;$('#bogo-form fieldset').disabled=true;$('#purchased').disabled=true;$('#order').disabled=true;$('#result').hidden=true;currentCode='';update();tell(pl?'Sprawdzamy zakup w Google Play…':'Verifying your Google Play purchase…');
 try{
  let recovery;try{recovery=await identity(purchasedModel,order)}catch{throw Error('storage')}
  const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purchasedModel,model,orderId:order,recovery,requestId:random(),turnstile:token}),signal:AbortSignal.timeout(60000)});
  const d=await r.json();
  if(!r.ok||d?.ok!==true)throw Error(typeof d?.error==='string'?d.error:'temporarily_unavailable');
  if(!names[d.model]||typeof d.code!=='string'||!d.code||d.code.length>500)throw Error('temporarily_unavailable');
  currentCode=d.code;$('#code').textContent=d.code;$('#gift-name').textContent=names[d.model];$('#result').hidden=false;$('#result').focus();
  tell(d.replayed?(pl?'Odzyskano wcześniej przydzielony kod.':'Your previous code has been recovered.'):(pl?'Zakup potwierdzony. Twój kod jest gotowy.':'Purchase verified. Your code is ready.'));
  analytics(d.replayed?'bogo_recover':'bogo_claim',d.model);
 }catch(err){tell(msg[err.message]||msg.temporarily_unavailable)}
 finally{busy=false;token='';$('#bogo-form fieldset').disabled=false;$('#purchased').disabled=false;$('#order').disabled=false;try{if(widget!==null)turnstile.reset(widget)}catch{}update()}
});
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(currentCode);tell(pl?'Kod skopiowany.':'Code copied.')}catch{tell(pl?'Zaznacz i skopiuj kod ręcznie.':'Select and copy the code manually.')}};
$('#redeem').onclick=()=>{if(!currentCode)return;window.open('https://play.google.com/redeem?code='+encodeURIComponent(currentCode),'_blank','noopener,noreferrer');analytics('bogo_redeem_click',$('#gift-name').textContent.split(' ')[0])};
// Existing consent component uses a relative privacy URL; resolve it for /bogo/.
const privacyFix=()=>document.querySelectorAll('.consent-banner a').forEach(a=>{const href='../privacy.html#website-analytics';if(a.getAttribute('href')!==href)a.setAttribute('href',href)});
new MutationObserver(privacyFix).observe(document.body,{childList:true,subtree:true});
})();
