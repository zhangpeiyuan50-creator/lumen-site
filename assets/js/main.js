/* ============================================================
   识光 LUMEN — 交互脚本（零依赖）v2
   原则：动效只用平涂、位移、切线、扫描。无发光、无渐变、无粒子。
   v2：所有区块动效可重复触发（滚走重置、滚回重播）；
       切回标签页触发全局"重采样"。
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HOVER = window.matchMedia("(hover: hover)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 光圈 mark 生成（8 段 · 45° · 中心点，同 lumen-mark.svg 几何） ---------- */
  function polar(cx, cy, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function segPath(cx, cy, r1, r2, a0, a1) {
    var p1 = polar(cx, cy, r2, a0), p2 = polar(cx, cy, r2, a1);
    var p3 = polar(cx, cy, r1, a1), p4 = polar(cx, cy, r1, a0);
    var laf = (a1 - a0) > 180 ? 1 : 0;
    return "M" + p1[0].toFixed(2) + " " + p1[1].toFixed(2) +
      " A" + r2 + " " + r2 + " 0 " + laf + " 1 " + p2[0].toFixed(2) + " " + p2[1].toFixed(2) +
      " L" + p3[0].toFixed(2) + " " + p3[1].toFixed(2) +
      " A" + r1 + " " + r1 + " 0 " + laf + " 0 " + p4[0].toFixed(2) + " " + p4[1].toFixed(2) + " Z";
  }
  function buildMark(el, size) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    var segs = [], i;
    for (i = 0; i < 8; i++) {
      var a0 = i * 45 + 4.5, a1 = (i + 1) * 45 - 4.5;
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", segPath(60, 60, 26, 44, a0, a1));
      p.setAttribute("fill", i === 1 ? "#2B37FF" : "#F2F1EC");
      p.setAttribute("class", "seg");
      svg.appendChild(p);
      segs.push(p);
    }
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", "60"); dot.setAttribute("cy", "60"); dot.setAttribute("r", "9");
    dot.setAttribute("fill", "#F2F1EC");
    dot.setAttribute("class", "core-dot");
    svg.appendChild(dot);
    el.appendChild(svg);
    return { svg: svg, segs: segs, dot: dot };
  }

  /* ---------- 预加载 → 入场 ---------- */
  var preloader = $("#preloader");
  function revealHero() { document.body.classList.add("loaded"); }
  if (preloader && !REDUCED) {
    var pm = buildMark($("#preloaderMark"), 96);
    var pct = $("#pct");
    var t0 = performance.now(), DUR = 1000;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / DUR);
      pct.textContent = ("00" + Math.round(k * 100)).slice(-3);
      var lit = Math.floor(k * 8);
      for (var i = 0; i < 8; i++) pm.segs[i].classList.toggle("on", i < lit);
      if (k < 1) requestAnimationFrame(tick);
      else setTimeout(function () {
        preloader.classList.add("is-done");
        revealHero();
        setTimeout(function () { preloader.remove(); }, 700);
      }, 140);
    })(t0);
  } else {
    if (preloader) preloader.remove();
    revealHero();
  }

  /* ---------- 采样计数（全局可跳增） ---------- */
  var qCount = $("#qCount");
  var q = 12486;
  var today = $("#today");
  var now = new Date();
  if (today) today.textContent = ("0" + now.getDate()).slice(-2) + "." + ("0" + (now.getMonth() + 1)).slice(-2) + "." + now.getFullYear();
  function qJump(n) {
    q += n;
    if (qCount) qCount.textContent = q.toLocaleString("en-US");
  }
  if (qCount && !REDUCED) setInterval(function () { qJump(Math.floor(Math.random() * 6) + 1); }, 2400);

  /* ---------- HERO 光圈：自转 + 鼠标视差 + 滚动耦合 + 周期/手动采样 ---------- */
  var hero = $("#hero");
  var heroMarkWrap = $("#heroMark");
  var scanStatus = $("#scanStatus");
  var segFlashTimers = [];
  function flashSeg(seg) {
    var prev = seg.getAttribute("fill");
    seg.setAttribute("fill", "#D4FF00");
    segFlashTimers.push(setTimeout(function () { seg.setAttribute("fill", prev); }, 420));
  }
  if (heroMarkWrap) {
    var hm = buildMark(heroMarkWrap, 460);
    var ring = hm.svg;
    var deg = 0, targetTilt = 0, tilt = 0;
    if (!REDUCED) {
      window.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        targetTilt = ((e.clientX - r.left) / r.width - .5) * 16;
      }, { passive: true });
      (function spin() {
        deg += 0.03 + window.scrollY * 0.00012; /* 滚动越深转越快 */
        tilt += (targetTilt - tilt) * 0.04;
        ring.style.transform = "rotate(" + (deg + tilt) + "deg)";
        ring.style.transformOrigin = "50% 50%";
        requestAnimationFrame(spin);
      })();
    }
    /* 周期采样 */
    if (!REDUCED) {
      setInterval(function () {
        hero.classList.remove("scanning");
        void hero.offsetWidth;
        hero.classList.add("scanning");
        var idx = Math.floor(Math.random() * 8);
        flashSeg(hm.segs[idx]);
        if (scanStatus) scanStatus.textContent = "STATUS / SAMPLING · SEG 0" + (idx + 1);
        segFlashTimers.push(setTimeout(function () {
          if (scanStatus) scanStatus.textContent = "STATUS / STANDBY";
        }, 900));
      }, 6000);
    }
    /* 手动采样：点击光圈，全段依次闪 + 计数跳增 */
    heroMarkWrap.style.cursor = "pointer";
    heroMarkWrap.setAttribute("title", "手动采样 / MANUAL SAMPLING");
    heroMarkWrap.addEventListener("click", function () {
      hm.segs.forEach(function (seg, i) {
        segFlashTimers.push(setTimeout(function () { flashSeg(seg); }, i * 70));
      });
      qJump(20 + Math.floor(Math.random() * 60));
      hero.classList.remove("scanning");
      void hero.offsetWidth;
      hero.classList.add("scanning");
      if (scanStatus) {
        scanStatus.textContent = "STATUS / MANUAL SAMPLING";
        clearTimeout(heroMarkWrap._t);
        heroMarkWrap._t = setTimeout(function () { if (scanStatus) scanStatus.textContent = "STATUS / STANDBY"; }, 1400);
      }
    });
  }

  /* ---------- 自定义光标 ---------- */
  var dot = $("#cursorDot"), ringC = $("#cursorRing");
  if (dot && ringC && !REDUCED && HOVER) {
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      ringC.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    $$("a, button, .hero-mark").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ringC.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ringC.classList.remove("is-active"); });
    });
  } else if (dot && ringC) { dot.remove(); ringC.remove(); }

  /* ---------- 可重复触发：滚走重置、滚回重播 ---------- */
  function runBars(bars) {
    $$(".fill", bars).forEach(function (f) {
      var w = f.getAttribute("data-w");
      f.style.setProperty("--w", w);
      f.style.width = w;
    });
    $$(".v", bars).forEach(function (v) {
      var n = parseInt(v.getAttribute("data-n"), 10), s = performance.now();
      v._raf && cancelAnimationFrame(v._raf);
      (function step(now2) {
        var k = Math.min(1, (now2 - s) / 1000);
        v.textContent = Math.round(n * (1 - Math.pow(1 - k, 3)));
        if (k < 1) v._raf = requestAnimationFrame(step);
      })(s);
    });
  }
  function resetBars(bars) {
    $$(".fill", bars).forEach(function (f) { f.style.width = "0"; });
    $$(".v", bars).forEach(function (v) { v.textContent = "0"; });
  }
  var rio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var el = en.target;
      if (en.isIntersecting) {
        el.classList.add("is-in");
        if (el.id === "bars") runBars(el);
      } else {
        el.classList.remove("is-in");
        if (el.id === "bars") resetBars(el);
      }
    });
  }, { threshold: .15 });
  $$(".rv, .trim, .scan, #bars").forEach(function (el) { rio.observe(el); });

  /* ---------- 内核导语：逐字点亮（滚动驱动，天然可逆） ---------- */
  var intro = $("#coreIntro");
  if (intro) {
    var units = [];
    Array.prototype.slice.call(intro.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        Array.prototype.slice.call(node.textContent).forEach(function (ch) {
          if (ch.trim() === "") { frag.appendChild(document.createTextNode(ch)); return; }
          var s = document.createElement("span");
          s.className = "w"; s.textContent = ch;
          frag.appendChild(s); units.push(s);
        });
        intro.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add("lit");
      }
    });
    if (!REDUCED && units.length) {
      var kw = $$(".kw", intro);
      function litUpdate() {
        var r = intro.getBoundingClientRect();
        var vh = window.innerHeight;
        var k = Math.min(1, Math.max(0, (vh * .82 - r.top) / (vh * .55)));
        var lit = Math.floor(k * units.length);
        units.forEach(function (u, i) {
          if (kw.indexOf(u) > -1) return;
          u.classList.toggle("lit", i < lit);
        });
      }
      window.addEventListener("scroll", litUpdate, { passive: true });
      litUpdate();
    } else {
      $$(".w", intro).forEach(function (u) { u.classList.add("lit"); });
    }
  }

  /* ---------- H1 字符重采样：hover 单字闪 Beam ---------- */
  var h1 = $(".hero h1");
  if (h1) {
    (function split(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.prototype.slice.call(node.textContent).forEach(function (ch) {
            if (ch.trim() === "") { frag.appendChild(document.createTextNode(ch)); return; }
            var s = document.createElement("span");
            s.className = "ch"; s.textContent = ch;
            frag.appendChild(s);
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName !== "BR") {
          split(node);
        }
      });
    })(h1);
    h1.addEventListener("mouseover", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("ch") || t._flashing) return;
      t._flashing = true;
      var prev = t.style.color;
      t.style.color = "#2B37FF";
      setTimeout(function () { t.style.color = prev; t._flashing = false; }, 380);
    });
  }

  /* ---------- 磁吸按钮 ---------- */
  if (HOVER && !REDUCED) {
    $$(".hero .cta-row a, .contact .cta").forEach(function (btn) {
      btn.classList.add("magnetic");
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * .18;
        var dy = (e.clientY - r.top - r.height / 2) * .3;
        btn.style.transition = "none";
        btn.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform .3s cubic-bezier(.2,.8,.3,1.15)";
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- 品牌主张双行视差 + 顶栏采样进度线 ---------- */
  var claimL1 = $(".claim h2 .l1"), claimL2 = $(".claim h2 .l2");
  var progress = $("#scrollProgress");
  if (!REDUCED) {
    (function onScroll() {
      var vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ")";
      if (claimL1 && claimL2) {
        var r = claimL1.parentElement.getBoundingClientRect();
        var off = (r.top + r.height / 2 - vh / 2) / vh; /* -0.5..0.5 视口位置 */
        claimL1.style.transform = "translateY(" + (off * -26).toFixed(1) + "px)";
        claimL2.style.transform = "translateY(" + (off * -58).toFixed(1) + "px)";
      }
      requestAnimationFrame(onScroll);
    })();
  } else if (progress) {
    progress.style.transform = "scaleX(0)";
  }

  /* ---------- ORB 状态机 ---------- */
  var orbImgs = $$(".orb-stage img");
  var orbBtns = $$(".orb-states button");
  var orbTitle = $("#orbTitle"), orbBody = $("#orbBody"), orbRead = $("#orbRead");
  var ORB = {
    neutral:  { t: "待机 / NEUTRAL",  b: "ORB 是识光的采样单元。待机时它只监听：引擎在回答什么，答案里有没有你。", r: "STATE / 01 · LISTENING" },
    scanning: { t: "采样中 / SCANNING", b: "跨引擎、跨模型、跨时间地批量查询。每一次采样都被结构化记录，可复现、可验证。", r: "STATE / 02 · SAMPLING" },
    captured: { t: "已捕获 / CAPTURED", b: "品牌信号被捕获：被提及、被引用、位次与份额落成一条可读的曲线。光不可见，但可度量。", r: "STATE / 03 · CAPTURED" }
  };
  function setOrb(state) {
    orbImgs.forEach(function (im) { im.classList.toggle("on", im.getAttribute("data-state") === state); });
    orbBtns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-state") === state); });
    orbTitle.textContent = ORB[state].t;
    orbBody.textContent = ORB[state].b;
    orbRead.textContent = ORB[state].r;
  }
  var orbOrder = ["neutral", "scanning", "captured"], orbIdx = 0, orbAuto = null;
  if (orbImgs.length) {
    orbBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (orbAuto) { clearInterval(orbAuto); orbAuto = null; }
        setOrb(b.getAttribute("data-state"));
      });
    });
    if (!REDUCED) {
      orbAuto = setInterval(function () {
        orbIdx = (orbIdx + 1) % 3;
        setOrb(orbOrder[orbIdx]);
      }, 3600);
    }
  }

  /* ---------- 切回页面 → 全局重采样 ---------- */
  var lastResample = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    var nowTs = Date.now();
    if (nowTs - lastResample < 4000) return;
    lastResample = nowTs;
    /* 掠线 */
    if (hero && !REDUCED) {
      hero.classList.remove("scanning");
      void hero.offsetWidth;
      hero.classList.add("scanning");
    }
    /* 光圈全段依次闪 */
    if (window._heroSegs) { /* 占位：heroMarkWrap 作用域内已在闭包，走下方 */ }
    var heroSegs = $$("#heroMark .seg");
    if (!REDUCED && heroSegs.length) {
      heroSegs.forEach(function (seg, i) {
        setTimeout(function () {
          var prev = seg.getAttribute("fill");
          seg.setAttribute("fill", "#D4FF00");
          setTimeout(function () { seg.setAttribute("fill", prev); }, 320);
        }, i * 60);
      });
    }
    qJump(8 + Math.floor(Math.random() * 30));
    if (scanStatus) {
      scanStatus.textContent = "STATUS / RESAMPLED · WELCOME BACK";
      setTimeout(function () { if (scanStatus) scanStatus.textContent = "STATUS / STANDBY"; }, 1800);
    }
    /* 扫描字区若在视口内则重播 */
    var scanSec = $("#scan");
    if (scanSec) {
      scanSec.classList.remove("is-in");
      void scanSec.offsetWidth;
      var r = scanSec.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) scanSec.classList.add("is-in");
    }
  });

})();
