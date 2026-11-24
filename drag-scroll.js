/* Mouse dragging in the desktop preview; native touch remains unchanged. */
(() => {
  let gesture=null, suppressClickUntil=0;
  function chainFor(target,axis){
    const chain=[];
    for(let el=target;el&&el!==document.documentElement;el=el.parentElement){
      const style=getComputedStyle(el);
      const overflow=axis==='x'?style.overflowX:style.overflowY;
      const extra=axis==='x'?el.scrollWidth-el.clientWidth:el.scrollHeight-el.clientHeight;
      if(/(auto|scroll)/.test(overflow)&&extra>1)chain.push(el);
    }
    if(axis==='y'&&!document.querySelector('dialog[open]'))chain.push(document.scrollingElement);
    return chain;
  }
  function move(chain,amount,axis){
    const key=axis==='x'?'scrollLeft':'scrollTop';
    for(const el of chain){const before=el[key];el[key]+=amount;amount-=el[key]-before;if(Math.abs(amount)<.5)break;}
  }
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('input,textarea,select,[contenteditable="true"],summary')||e.target.matches('dialog'))return;
    gesture={id:e.pointerId,target:e.target,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,dragging:false};
  });
  document.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    if(!g.dragging){
      const dx=e.clientX-g.startX,dy=e.clientY-g.startY;
      if(Math.hypot(dx,dy)<7)return;
      g.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';g.chain=chainFor(g.target,g.axis);
      if(!g.chain.length){gesture=null;return;}
      g.dragging=true;g.target.setPointerCapture(e.pointerId);document.documentElement.classList.add('mouse-dragging');
    }
    e.preventDefault();move(g.chain,g.axis==='x'?g.x-e.clientX:g.y-e.clientY,g.axis);g.x=e.clientX;g.y=e.clientY;
  },{passive:false});
  function finish(e){
    if(!gesture||e.pointerId!==gesture.id)return;
    if(gesture.dragging){suppressClickUntil=performance.now()+250;if(gesture.target.hasPointerCapture(e.pointerId))gesture.target.releasePointerCapture(e.pointerId);}
    gesture=null;document.documentElement.classList.remove('mouse-dragging');
  }
  document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);
  window.addEventListener('blur',()=>{gesture=null;document.documentElement.classList.remove('mouse-dragging');});
  document.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('dragstart',e=>{if(gesture)e.preventDefault();});
})();
