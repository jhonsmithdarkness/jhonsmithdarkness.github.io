// AURORA — interações do portfólio (respeita prefers-reduced-motion)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // CUSTOM CURSOR
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    const dot = document.createElement('div'); dot.className='cursor-dot';
    const ring = document.createElement('div'); ring.className='cursor-ring';
    document.body.append(dot,ring);
    let rx=0,ry=0,mx=0,my=0;
    addEventListener('mousemove',e=>{
      mx=e.clientX;my=e.clientY;
      dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
    });
    (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop);})();
    document.querySelectorAll('a,button,.proj,.ba').forEach(el=>{
      el.addEventListener('mouseenter',()=>ring.classList.add('hot'));
      el.addEventListener('mouseleave',()=>ring.classList.remove('hot'));
    });
  }

  // REVEAL ON SCROLL
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // HERO PARALLAX
  const heroArt = document.querySelector('.hero .art');
  if (heroArt && !reduce){
    addEventListener('scroll',()=>{
      const y=scrollY; if(y<innerHeight) heroArt.style.transform=`translateY(${y*.18}px) scale(1.06)`;
    },{passive:true});
  }

  // BEFORE / AFTER SLIDER
  document.querySelectorAll('.ba').forEach(ba=>{
    const before=ba.querySelector('.before'); const handle=ba.querySelector('.handle');
    let dragging=false;
    const set=(x)=>{ const r=ba.getBoundingClientRect(); let p=((x-r.left)/r.width)*100; p=Math.max(2,Math.min(98,p));
      before.style.clipPath=`inset(0 ${100-p}% 0 0)`; handle.style.left=p+'%'; };
    const down=e=>{dragging=true; set((e.touches?e.touches[0]:e).clientX);};
    const move=e=>{ if(dragging) set((e.touches?e.touches[0]:e).clientX); };
    const up=()=>dragging=false;
    ba.addEventListener('mousedown',down); addEventListener('mousemove',move); addEventListener('mouseup',up);
    ba.addEventListener('touchstart',down,{passive:true}); addEventListener('touchmove',move,{passive:true}); addEventListener('touchend',up);
  });

  // MAGNETIC BUTTONS
  if(!reduce){
    document.querySelectorAll('.magnetic').forEach(b=>{
      b.addEventListener('mousemove',e=>{ const r=b.getBoundingClientRect();
        b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.3}px)`;});
      b.addEventListener('mouseleave',()=>b.style.transform='');
    });
  }
})();
