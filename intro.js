export function burnOutline(cx,cy,radius,progress,points=180){
  return Array.from({length:points},(_,i)=>{
    const a=i/points*Math.PI*2;
    const rough=1+.035*Math.sin(a*13+progress*3)+.022*Math.sin(a*29-progress*5)+.014*Math.cos(a*47);
    const r=radius*rough;
    return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];
  });
}
export async function playIntro(overlay){
  if(!overlay)return;
  const canvas=overlay.querySelector('canvas'),ctx=canvas.getContext('2d');
  const inertElements=[...document.querySelectorAll('header,.controls,main,footer')];
  const originalInert=inertElements.map(el=>el.inert);
  inertElements.forEach(el=>el.inert=true);
  let finished=false,frameId,deadline;
  function finish(){if(finished)return;finished=true;cancelAnimationFrame(frameId);clearTimeout(deadline);window.removeEventListener('resize',resize);overlay.remove();inertElements.forEach((el,i)=>el.inert=originalInert[i]);try{sessionStorage.setItem('carta-intro-seen-v5','yes');}catch{}}
  if(!ctx){finish();return;}
  deadline=setTimeout(finish,5500);
  let w,h,dpr;
  function resize(){w=window.innerWidth;h=window.innerHeight;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize();window.addEventListener('resize',resize);
  const logo=new Image();logo.src='assets/logo.png';
  await Promise.race([logo.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1500))]);
  if(finished)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=performance.now(),hold=1000,duration=reduce?120:1250;
  const path=points=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
  function frame(now){
    if(finished)return;
    const elapsed=now-start,p=Math.max(0,Math.min(1,(elapsed-hold)/duration));
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    ctx.fillStyle='#0c0b09';ctx.fillRect(0,0,w,h);
    // A subtle paper grain remains stable between frames.
    ctx.fillStyle='#c09b4b';ctx.globalAlpha=.055;
    for(let i=0;i<220;i++){const x=(i*137.37)%w,y=(i*83.17)%h;ctx.fillRect(x,y,1,1);}
    ctx.globalAlpha=1;
    if(logo.complete&&logo.naturalWidth){
      const entrance=reduce?1:Math.min(1,elapsed/650);
      const scale=.94+.06*(1-Math.pow(1-entrance,3));
      const width=(w*.8)*scale;
      const height=width*logo.naturalHeight/logo.naturalWidth;
      ctx.globalAlpha=reduce?1:Math.min(1,elapsed/250);
      ctx.drawImage(logo,(w-width)/2,(h-height)/2,width,height);ctx.globalAlpha=1;
    }
    if(p>0&&reduce){ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=p;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}
    else if(p>0){
      const cx=w*.5,cy=h*.56,radius=Math.hypot(w,h)*.84*Math.pow(p,1.15);
      const points=burnOutline(cx,cy,radius,p);
      ctx.globalCompositeOperation='destination-out';path(points);ctx.fill();
      ctx.globalCompositeOperation='source-over';
      // Charred outer edge, orange ember glow and bright irregular burn front.
      ctx.strokeStyle='#24120b';ctx.lineWidth=12;path(points);ctx.stroke();
      ctx.shadowColor='#ff6716';ctx.shadowBlur=22;ctx.strokeStyle='#eb6b20';ctx.lineWidth=4;path(points);ctx.stroke();
      ctx.shadowBlur=8;ctx.strokeStyle='#ffe1a1';ctx.lineWidth=1.3;path(points);ctx.stroke();ctx.shadowBlur=0;
      for(let i=0;i<24;i++){
        const a=i/24*Math.PI*2+p*.6,r=radius+7+((i*13)%25),life=(Math.sin(p*18+i*4)+1)/2;
        ctx.globalAlpha=life*(1-p);ctx.fillStyle=i%3?'#ffad45':'#ffe8b9';
        ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r-p*26,1+(i%3)*.5,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    if(p>=1){finish();return;}
    frameId=requestAnimationFrame(frame);
  }
  frameId=requestAnimationFrame(frame);
}
