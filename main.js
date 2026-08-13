// AURORA — interações do portfólio (respeita prefers-reduced-motion)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DIGITAL ART BOOK 3D
  (() => {
    const book = document.getElementById('abBook');
    if(!book) return;
    const pagesEl = document.getElementById('abPages');
    if(!pagesEl) return;
    const pageDivs = Array.from(pagesEl.querySelectorAll('.ab-page'));
    const total = pageDivs.length;
    const ind = document.getElementById('abInd');
    const prev = document.getElementById('abPrev');
    const next = document.getElementById('abNext');
    const fallback = document.getElementById('abFallback');
    let cur = 0;
    const showPage = (i) => {
      cur = Math.max(0, Math.min(total-1, i));
      pageDivs.forEach((p,idx)=> p.style.display = idx===cur ? 'flex' : 'none');
      if(ind) ind.textContent = `${cur+1} / ${total}`;
    };
    showPage(0);
    if(prev) prev.addEventListener('click', ()=>showPage(cur-1));
    if(next) next.addEventListener('click', ()=>showPage(cur+1));
    document.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowLeft') showPage(cur-1);
      if(e.key==='ArrowRight') showPage(cur+1);
    });
    // swipe mobile
    let sx=0;
    book.addEventListener('touchstart', e=>{ sx=e.changedTouches[0].clientX; }, {passive:true});
    book.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - sx;
      if(dx>50) showPage(cur-1); else if(dx<-50) showPage(cur+1);
    }, {passive:true});
    // Tenta PageFlip 3D se a lib estiver carregada
    const tryFlip = () => {
      const PF = (typeof PageFlip !== 'undefined') ? PageFlip : (window.St && window.St.PageFlip);
      if(!PF) return;
      try {
        const flip = new PF(pagesEl, {
          width: 500, height: 600, size: 'stretch',
          minWidth: 280, maxWidth: 700, minHeight: 400, maxHeight: 900,
          maxShadowOpacity: 0.5, showCover: true, mobileScrollSupport: false,
          usePortrait: true, autoCenter: true,
        });
        flip.loadFromHTML(pageDivs);
        if(ind) ind.textContent = `${flip.pageNumber+1} / ${total}`;
        flip.on('flip', (e)=>{ if(ind) ind.textContent = `${e.data+1} / ${total}`; });
        if(prev) prev.addEventListener('click', ()=>flip.flipPrev());
        if(next) next.addEventListener('click', ()=>flip.flipNext());
        document.addEventListener('keydown', (e)=>{
          if(e.key==='ArrowLeft') flip.flipPrev();
          if(e.key==='ArrowRight') flip.flipNext();
        });
      } catch(err) { console.warn('pageflip fail', err); }
    };
    if(document.readyState === 'complete') setTimeout(tryFlip, 300);
    else window.addEventListener('load', ()=>setTimeout(tryFlip, 300));
  })();

  // FILME & MOTION — modal + filtros
  (() => {
    const film = document.querySelector('.film');
    if(!film) return;
    // Modal
    const modal = document.createElement('div');
    modal.className = 'vmodal';
    modal.innerHTML = '<button class="vclose" aria-label="Close">×</button><div><video controls preload="metadata"></video><div class="vinfo"></div></div>';
    document.body.appendChild(modal);
    const vEl = modal.querySelector('video');
    const vInfo = modal.querySelector('.vinfo');
    const openVideo = (src, info) => {
      vEl.src = src; vInfo.textContent = info || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      vEl.play().catch(()=>{});
    };
    const closeModal = () => {
      modal.classList.remove('open');
      vEl.pause(); vEl.removeAttribute('src'); vEl.load();
      document.body.style.overflow = '';
    };
    modal.querySelector('.vclose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });
    film.querySelectorAll('[data-video]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const src = el.getAttribute('data-video');
        const title = el.querySelector('h4') ? el.querySelector('h4').textContent : (el.querySelector('.vf-feat-info h4') ? el.querySelector('.vf-feat-info h4').textContent : '');
        openVideo(src, title);
      });
    });
    // Filtros
    const btns = film.querySelectorAll('.vf-btn');
    const cards = film.querySelectorAll('.vf-card');
    btns.forEach(b=>{
      b.addEventListener('click', ()=>{
        btns.forEach(x=>x.classList.remove('on'));
        b.classList.add('on');
        const cat = b.getAttribute('data-cat');
        cards.forEach(c=>{
          c.style.display = (cat==='ALL' || c.getAttribute('data-cat')===cat) ? '' : 'none';
        });
      });
    });
    if(btns[0]) btns[0].classList.add('on');
  })();

  const applyLang = (lang) => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const t = (window.I18N && I18N[lang] && I18N[lang][key]);
      if(t!==undefined && t!==null) el.textContent = t;
    });
    document.querySelectorAll('.lang a').forEach(a=>a.classList.toggle('on', a.dataset.lang===lang));
    try{ localStorage.setItem('lang', lang); }catch(e){}
  };
  const saved = (()=>{ try{return localStorage.getItem('lang');}catch(e){return null;} })();
  applyLang(saved || 'pt');
  document.querySelectorAll('.lang a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); applyLang(a.dataset.lang);}));

  // HERO SOUND TOGGLE
  const heroVid = document.getElementById('heroVid');
  const heroSound = document.getElementById('heroSound');
  if (heroVid && heroSound){
    heroSound.addEventListener('click',()=>{
      heroVid.muted = !heroVid.muted;
      if(!heroVid.muted){ heroVid.play().catch(()=>{}); heroSound.textContent='🔊 MUDO'; }
      else { heroSound.textContent='🔇 SOM'; }
    });
  }

  // LIGHTBOX
  const lb=document.getElementById('lightbox'), lbImg=document.getElementById('lbImg'), lbClose=document.getElementById('lbClose');
  if(lb){
    document.querySelectorAll('img.zoom').forEach(img=>{
      img.style.cursor='zoom-in';
      img.addEventListener('click',()=>{ lbImg.src=img.src; lb.classList.add('open'); });
    });
    const fechar=()=>lb.classList.remove('open');
    lbClose.addEventListener('click',fechar);
    lb.addEventListener('click',e=>{ if(e.target===lb) fechar(); });
    addEventListener('keydown',e=>{ if(e.key==='Escape') fechar(); });
  }

  // LIVRO (Outros Trabalhos)
  const bookCover=document.getElementById('bookCover');
  const book=document.getElementById('book');
  if(bookCover && book){
    bookCover.addEventListener('click',()=>book.classList.toggle('open'));
    // navegação de páginas
    const track=document.getElementById('pagesTrack');
    const prev=document.getElementById('pagePrev');
    const next=document.getElementById('pageNext');
    const count=document.getElementById('pageCount');
    const pages=track?track.children:[];
    let cur=0;
    const show=()=>{
      if(!track) return;
      track.style.transform=`translateX(-${cur*100}%)`;
      if(count) count.textContent=`${cur+1} / ${pages.length}`;
    };
    if(track && pages.length){
      show();
      prev.addEventListener('click',e=>{e.stopPropagation();cur=(cur-1+pages.length)%pages.length;show();});
      next.addEventListener('click',e=>{e.stopPropagation();cur=(cur+1)%pages.length;show();});
    }
  }

  // CUSTOM CURSOR
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    const dot=document.createElement('div'); dot.className='cursor-dot';
    const ring=document.createElement('div'); ring.className='cursor-ring';
    document.body.append(dot,ring);
    let rx=0,ry=0,mx=0,my=0;
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;});
    (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop);})();
    document.querySelectorAll('a,button,.proj,.ba').forEach(el=>{el.addEventListener('mouseenter',()=>ring.classList.add('hot'));el.addEventListener('mouseleave',()=>ring.classList.remove('hot'));});
  }

  // REVEAL
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // HERO PARALLAX
  const heroArt=document.querySelector('.hero .art');
  if(heroArt&&!reduce){addEventListener('scroll',()=>{const y=scrollY;if(y<innerHeight)heroArt.style.transform=`translateY(${y*.18}px) scale(1.06)`;},{passive:true});}

  // BEFORE/AFTER
  document.querySelectorAll('.ba').forEach(ba=>{
    const before=ba.querySelector('.before'),handle=ba.querySelector('.handle');let dragging=false;
    const set=x=>{const r=ba.getBoundingClientRect();let p=((x-r.left)/r.width)*100;p=Math.max(2,Math.min(98,p));before.style.clipPath=`inset(0 ${100-p}% 0 0)`;handle.style.left=p+'%';};
    const down=e=>{dragging=true;set((e.touches?e.touches[0]:e).clientX);};
    const move=e=>{if(dragging)set((e.touches?e.touches[0]:e).clientX);};
    ba.addEventListener('mousedown',down);addEventListener('mousemove',move);addEventListener('mouseup',()=>dragging=false);
    ba.addEventListener('touchstart',down,{passive:true});addEventListener('touchmove',move,{passive:true});addEventListener('touchend',()=>dragging=false);
  });

  // MAGNETIC
  if(!reduce){document.querySelectorAll('.magnetic').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.3}px)`;});b.addEventListener('mouseleave',()=>b.style.transform='');});}
})();
