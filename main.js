// AURORA — interações do portfólio (respeita prefers-reduced-motion)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // INTRO — SEQUENCIA DE COLORIZACAO (4 etapas da mesma arte)
  (() => {
    const intro = document.getElementById('intro');
    if(!intro) return;
    if(sessionStorage.getItem('jlp_intro') === 'done'){ intro.remove(); return; }

    const stages = Array.from(document.querySelectorAll('.intro-stage'));
    const caption = document.getElementById('introCaption');
    const skip = document.getElementById('introSkip');
    intro.classList.add('intro-seq');

    let finished = false;
    const end = () => {
      if(finished) return; finished = true;
      intro.classList.add('done','end');
      sessionStorage.setItem('jlp_intro','done');
      setTimeout(()=>intro.remove(), 900);
    };
    skip.addEventListener('click', end);

    // prefers-reduced-motion: so a arte final, sem sequencia animada
    if(reduce || stages.length === 0){
      const last = stages[stages.length-1];
      if(last) last.classList.add('on');
      if(caption){ caption.textContent = 'FINAL ARTWORK'; caption.classList.add('on'); }
      intro.classList.add('play');
      setTimeout(()=>intro.classList.add('sweep'), 300);
      setTimeout(end, 2600);
      return;
    }

    // CARREGAMENTO REAL: a 1a imagem e preloaded; as outras entram depois,
    // porem so quando a anterior ja apareceu. Sem tela preta longa.
    const show = (i) => {
      if(i > 0){
        const nx = stages[i];
        if(nx && !nx.complete){
          // so troca quando a proxima ja tiver baixado
          const go = () => { stages[i-1].classList.remove('on'); nx.classList.add('on'); };
          nx.addEventListener('load', go, {once:true});
          nx.addEventListener('error', go, {once:true});
          setTimeout(go, 1200); // nao bloqueia se a rede demorar
        } else {
          stages[i-1].classList.remove('on'); nx.classList.add('on');
        }
      } else { stages[0].classList.add('on'); }
      if(caption){
        caption.textContent = stages[i].dataset.label || '';
        caption.classList.add('on');
      }
      // pré-carrega a seguinte
      const nx2 = stages[i+1];
      if(nx2){ const p = new Image(); p.src = nx2.src; }
    };

    // duracao total ~6.4s: 1.5s por etapa + 1.9s na final
    const HOLD = 1500, HOLD_FINAL = 1900;
    let t = 0;
    show(0);
    for(let i=1;i<stages.length;i++){
      t += (i === stages.length-1) ? HOLD_FINAL : HOLD;
      setTimeout(()=>show(i), t);
    }
    // logo JLP + sweep no fim (igual antes), e revela a pagina
    setTimeout(()=>{ intro.classList.add('play'); }, t + 350);
    setTimeout(()=>{ intro.classList.add('sweep'); }, t + 800);
    setTimeout(end, t + 2600);
    // timeout de seguranca
    setTimeout(end, 12000);
  })();

  // DIGITAL ART BOOK 3D (PageFlip; fallback simples se a lib falhar)
  (() => {
    const book = document.getElementById('abBook');
    const pagesEl = document.getElementById('abPages');
    if(!book || !pagesEl) return;
    const pageDivs = Array.from(pagesEl.querySelectorAll('.ab-page'));
    const total = pageDivs.length;
    const ind = document.getElementById('abInd');
    const prev = document.getElementById('abPrev');
    const next = document.getElementById('abNext');
    const open = document.getElementById('abOpen');
    let cur = 0, flip = null, inView = false;
    const setInd = (i) => { if(ind) ind.textContent = `${(Number.isFinite(i)?i:0)+1} / ${total}`; };
    const showPage = (i) => {
      cur = Math.max(0, Math.min(total-1, i));
      pageDivs.forEach((p,idx)=> p.style.display = idx===cur ? 'flex' : 'none');
      setInd(cur);
    };
    showPage(0);
    // um unico handler por controle: PageFlip quando existir, senao o fallback
    const go = (d) => { if(flip){ d<0 ? flip.flipPrev() : flip.flipNext(); } else showPage(cur+d); };
    const curIdx = () => flip ? flip.getCurrentPageIndex() : cur;
    if(prev) prev.addEventListener('click', ()=>go(-1));
    if(next) next.addEventListener('click', ()=>go(1));
    if('IntersectionObserver' in window){
      new IntersectionObserver(es=>{ inView = es[0].isIntersecting; }, {threshold:.35}).observe(book);
    }
    // setas do teclado so quando o livro esta visivel ou focado
    const area = book.closest('section') || book;
    document.addEventListener('keydown', (e)=>{
      if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
      if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target;
      if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|VIDEO)$/.test(t.tagName))) return;
      if(document.querySelector('.lightbox.open')) return;
      const focused = area.contains(document.activeElement) && document.activeElement !== document.body;
      if(!inView && !focused) return;
      e.preventDefault();
      go(e.key==='ArrowLeft' ? -1 : 1);
    });
    // swipe so no fallback (o PageFlip ja trata o arraste)
    let sx = 0;
    book.addEventListener('touchstart', e=>{ sx = e.changedTouches[0].clientX; }, {passive:true});
    book.addEventListener('touchend', e=>{
      if(flip) return;
      const dx = e.changedTouches[0].clientX - sx;
      if(dx>50) go(-1); else if(dx<-50) go(1);
    }, {passive:true});
    // ABRIR LIVRO: rola ate o livro e abre a capa
    if(open){
      open.addEventListener('click', (e)=>{
        e.stopPropagation();
        book.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
        setTimeout(()=>{ if(curIdx()===0) go(1); }, reduce ? 0 : 450);
      });
    }
    const tryFlip = () => {
      const PF = (typeof PageFlip !== 'undefined') ? PageFlip : (window.St && window.St.PageFlip);
      if(!PF) return;
      try {
        const f = new PF(pagesEl, {
          width: 500, height: 600, size: 'stretch',
          minWidth: 280, maxWidth: 700, minHeight: 400, maxHeight: 900,
          maxShadowOpacity: 0.5, showCover: true, mobileScrollSupport: false,
          usePortrait: true, autoCenter: true,
        });
        f.loadFromHTML(pageDivs);
        flip = f;
        setInd(f.getCurrentPageIndex());
        f.on('flip', (e)=> setInd(Number(e.data)));
      } catch(err) { console.warn('pageflip fail', err); }
    };
    if(document.readyState === 'complete') setTimeout(tryFlip, 300);
    else window.addEventListener('load', ()=>setTimeout(tryFlip, 300));
  })();

  // I18N e declarado com const no index.html (nao vira window.I18N), por isso o typeof
  const DICT = (typeof I18N !== 'undefined') ? I18N : (window.I18N || null);
  const applyLang = (lang) => {
    if(!DICT || !DICT[lang]) lang = 'pt';
    document.documentElement.lang = (lang === 'pt') ? 'pt-BR' : 'en';
    const tr = (DICT && DICT[lang]) || {};
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const t = tr[el.getAttribute('data-i18n')];
      if(t!==undefined && t!==null) el.textContent = t;
    });
    document.querySelectorAll('[data-i18n-src]').forEach(el=>{
      const t = tr[el.getAttribute('data-i18n-src')];
      if(t && el.getAttribute('src') !== t) el.setAttribute('src', t);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(el=>{
      const t = tr[el.getAttribute('data-i18n-alt')];
      if(t) el.setAttribute('alt', t);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
      const t = tr[el.getAttribute('data-i18n-aria')];
      if(t) el.setAttribute('aria-label', t);
    });
    document.querySelectorAll('.lang a').forEach(a=>a.classList.toggle('on', a.dataset.lang===lang));
    try{ localStorage.setItem('lang', lang); }catch(e){}
    if(tr.meta_title) document.title = tr.meta_title;
    const md = document.querySelector('meta[name="description"]');
    if(md && tr.meta_desc) md.setAttribute('content', tr.meta_desc);
    document.dispatchEvent(new CustomEvent('langchange', {detail: lang}));
  };
  const saved = (()=>{ try{return localStorage.getItem('lang');}catch(e){return null;} })();
  // padrao: portugues; so usa EN se o visitante escolheu antes
  applyLang(saved === 'en' ? 'en' : 'pt');
  document.querySelectorAll('.lang a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); applyLang(a.dataset.lang);}));

  const T = (k, fb) => { const l = document.documentElement.lang === 'en' ? 'en' : 'pt'; return (DICT && DICT[l] && DICT[l][k]) || fb; };

  // NAV: fundo/blur ao rolar + menu mobile
  const nav = document.getElementById('siteNav');
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if(nav){
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
  if(nav && burger && navLinks){
    const setMenu = (on) => {
      nav.classList.toggle('menu-open', on);
      document.body.classList.toggle('menu-lock', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    burger.addEventListener('click', ()=> setMenu(!nav.classList.contains('menu-open')));
    navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>setMenu(false)));
    addEventListener('keydown', e=>{ if(e.key==='Escape' && nav.classList.contains('menu-open')){ setMenu(false); burger.focus(); } });
    matchMedia('(min-width: 861px)').addEventListener('change', e=>{ if(e.matches) setMenu(false); });
  }

  // HERO: pausa e som
  const heroVid = document.getElementById('heroVid');
  const heroSound = document.getElementById('heroSound');
  const heroPause = document.getElementById('heroPause');
  const heroLabels = () => {
    if(!heroVid) return;
    if(heroSound){ heroSound.textContent = heroVid.muted ? T('hero_sound_on','🔇 SOM') : T('hero_sound_off','🔊 MUDO'); heroSound.setAttribute('aria-pressed', heroVid.muted ? 'false' : 'true'); }
    if(heroPause){ heroPause.textContent = heroVid.paused ? T('hero_play','▶ PLAY') : T('hero_pause','❚❚ PAUSAR'); heroPause.setAttribute('aria-pressed', heroVid.paused ? 'true' : 'false'); }
  };
  if(heroVid){
    if(reduce){ heroVid.removeAttribute('autoplay'); heroVid.pause(); }
    if(heroSound) heroSound.addEventListener('click', ()=>{
      heroVid.muted = !heroVid.muted;
      if(!heroVid.muted) heroVid.play().catch(()=>{});
      heroLabels();
    });
    if(heroPause) heroPause.addEventListener('click', ()=>{
      if(heroVid.paused) heroVid.play().catch(()=>{}); else heroVid.pause();
    });
    heroVid.addEventListener('play', heroLabels); heroVid.addEventListener('pause', heroLabels);
    document.addEventListener('langchange', heroLabels);
    heroLabels();
  }

  // LIGHTBOX (fecha com o botao, clique fora ou Esc; foco volta para onde estava)
  const lb=document.getElementById('lightbox'), lbImg=document.getElementById('lbImg'), lbClose=document.getElementById('lbClose');
  if(lb && lbImg && lbClose){
    let lastFocus = null;
    const abrir = (img) => {
      lastFocus = document.activeElement;
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
      lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
      setTimeout(()=>lbClose.focus(), 30);
    };
    const fechar = () => {
      if(!lb.classList.contains('open')) return;
      lb.classList.remove('open'); lb.setAttribute('aria-hidden','true');
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    };
    document.querySelectorAll('img.zoom').forEach(img=>{
      img.style.cursor='zoom-in';
      img.addEventListener('click',()=>abrir(img));
    });
    lbClose.addEventListener('click', fechar);
    lb.addEventListener('click', e=>{ if(e.target===lb) fechar(); });
    addEventListener('keydown', e=>{
      if(!lb.classList.contains('open')) return;
      if(e.key==='Escape') fechar();
      if(e.key==='Tab'){ e.preventDefault(); lbClose.focus(); }
    });
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
/* ETAPA 3b: thumbnails animadas dos servicos (toca so quando visivel; so poster com reduced-motion) */
(function(){
  var vids=document.querySelectorAll(".serv-vid");
  if(!vids.length) return;
  var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)");
  if((rm&&rm.matches)||!("IntersectionObserver" in window)) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;
    if(e.isIntersecting){v.preload="auto";var p=v.play();if(p&&p.catch)p.catch(function(){});}
    else if(!v.paused){v.pause();}
  });},{threshold:.35});
  vids.forEach(function(v){v.muted=true;io.observe(v);});
  if(rm&&rm.addEventListener) rm.addEventListener("change",function(){if(rm.matches){io.disconnect();vids.forEach(function(v){v.pause();v.load();});}});
})();
