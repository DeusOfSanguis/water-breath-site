/* =====================================================================
   ПАКТ КРОВИ — скрипты сайта (без библиотек, чистый JavaScript).
   Файл копируется сборкой в assets/app.js. Править тут ничего не надо.
   Каждый блок сам проверяет, есть ли нужные элементы на странице.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Год в подвале ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Экран загрузки (только главная и только раз за сеанс) ----------
     Если человек уже открывал какую-то страницу сайта, экран пропускается:
     при переходе с другой страницы остаётся только шторка, без второй анимации. */
  (function () {
    var pre = document.querySelector(".preloader");
    if (!pre) return;
    if (document.documentElement.classList.contains("bp-seen")) { pre.remove(); return; }
    var num = pre.querySelector("[data-count]");
    var fill = pre.querySelector(".preloader__fill");
    document.body.style.overflow = "hidden";
    var start = performance.now(), dur = 1200;
    function tick(t) {
      var p = Math.min(1, (t - start) / dur);
      if (num) num.textContent = Math.round(p * 100) + "%";
      if (fill) fill.style.transform = "scaleX(" + p + ")";
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(function () {
        pre.classList.add("done");
        document.body.classList.add("ready");
        document.body.style.overflow = "";
        setTimeout(function () { pre.remove(); }, 1300);
      }, 300);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- Полоса прогресса + шапка при прокрутке + линия иерархии ---------- */
  (function () {
    var bar = document.querySelector(".progress");
    var nav = document.querySelector(".nav");
    var heroIn = document.querySelector(".hero__in");
    var heroCue = document.querySelector(".hero__cue");
    var heroMedia = document.querySelector(".hero__media");
    var rails = document.querySelectorAll(".timeline");
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && max > 0) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (nav) nav.classList.toggle("scrolled", y > 60);
      // лёгкий параллакс героя
      if (heroIn && y < window.innerHeight * 1.2) {
        heroIn.style.transform = "translateY(" + y * 0.25 + "px)";
        heroIn.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.7));
      }
      if (heroCue) heroCue.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.5));
      if (heroMedia && y < window.innerHeight) {
        heroMedia.style.transform = "translateY(" + y * 0.18 + "px) scale(" + (1 + y / window.innerHeight * 0.08) + ")";
      }
      // заливка линии иерархии по мере прокрутки
      rails.forEach(function (tl) {
        var fill = tl.querySelector(".timeline__fill");
        if (!fill) return;
        var r = tl.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = (vh * 0.75 - r.top) / (r.height + vh * 0.2);
        fill.style.transform = "scaleY(" + Math.max(0, Math.min(1, p)) + ")";
      });
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
    }, { passive: true });
    onScroll();
  })();

  /* ---------- Мобильное меню ---------- */
  (function () {
    var openBtn = document.querySelector("[data-menu-open]");
    var menu = document.querySelector(".mmenu");
    if (!openBtn || !menu) return;
    var closeBtn = menu.querySelector("[data-menu-close]");
    function open() { menu.classList.add("open"); document.body.style.overflow = "hidden"; }
    function close() { menu.classList.remove("open"); document.body.style.overflow = ""; }
    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
  })();

  /* ---------- Появление блоков при прокрутке ---------- */
  (function () {
    var els = document.querySelectorAll(".reveal, .shead");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Аккордеон: высота, и открыта только одна вкладка ---------- */
  (function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-acc]").forEach(function (group) {
      group.querySelectorAll("details").forEach(function (d) {
        var body = d.querySelector(".acc__body");
        var head = d.querySelector("summary");
        if (!body || !head || reduce) {
          d.addEventListener("toggle", function () {
            if (d.open) group.querySelectorAll("details").forEach(function (o) { if (o !== d) o.open = false; });
          });
          return;
        }
        body.style.overflow = "hidden";
        body.style.transition = "height 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
        body.style.height = d.open ? "auto" : "0px";
        function shut(item) {
          var b = item.querySelector(".acc__body");
          item._seq = (item._seq || 0) + 1;
          if (b) b.style.height = "0px";
          item.open = false;
        }
        head.addEventListener("click", function (e) {
          e.preventDefault();
          if (d.open) {
            var h = body.getBoundingClientRect().height;
            body.style.height = h + "px";
            d._seq = (d._seq || 0) + 1;
            var id = d._seq;
            requestAnimationFrame(function () {
              if (d._seq !== id) return;
              body.style.height = "0px";
            });
            setTimeout(function () {
              if (d._seq !== id) return;
              d.open = false;
              body.style.height = "0px";
            }, 460);
            return;
          }
          group.querySelectorAll("details").forEach(function (o) {
            if (o !== d && o.open) shut(o);
          });
          d._seq = (d._seq || 0) + 1;
          var id = d._seq;
          d.open = true;
          body.style.height = "0px";
          requestAnimationFrame(function () {
            if (d._seq !== id) return;
            body.style.height = body.scrollHeight + "px";
          });
          function opened(ev) {
            if (ev.propertyName !== "height" || d._seq !== id) return;
            body.style.height = "auto";
            body.removeEventListener("transitionend", opened);
          }
          body.addEventListener("transitionend", opened);
        });
      });
    });
  })();

  /* ---------- Вкладки привилегий ---------- */
  (function () {
    document.querySelectorAll("[data-tabs]").forEach(function (box) {
      var btns = box.querySelectorAll("[data-tab]");
      var panels = box.querySelectorAll("[data-panel]");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          btns.forEach(function (b) { b.classList.toggle("active", b === btn); });
          panels.forEach(function (p) {
            var on = p.getAttribute("data-panel") === btn.getAttribute("data-tab");
            p.classList.toggle("active", on);
          });
        });
      });
    });
  })();

  /* ---------- Готовность героя (буквы встают после прелоадера) ---------- */
  if (!document.querySelector(".preloader")) document.body.classList.add("ready");

  /* ---------- Печати разделов: активная в центре ленты ---------- */
  (function () {
    var box = document.querySelector("[data-seals]");
    var on = box && box.querySelector(".seal--on");
    if (!box || !on) return;
    var track = box.querySelector(".nav__seals-track") || box;
    var left = on.offsetLeft - (track.clientWidth - on.offsetWidth) / 2;
    track.scrollLeft = Math.max(0, left);
  })();

  /* ---------- Шкала главной ---------- */
  (function () {
    var links = document.querySelectorAll(".spine a[data-spy]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("data-spy")] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-spy") === id); });
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  })();

  /* ---------- Пометки «исключение / примечание» на свитках ---------- */
  (function () {
    document.querySelectorAll(".article p, .article li").forEach(function (el) {
      var t = (el.textContent || "").replace(/^\s+/, "");
      if (/^\[?\s*(исключен|примечан|пояснен|дополнен)/i.test(t)) el.classList.add("edict");
    });
  })();

  /* ---------- Закрыть кодекс по Escape ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var menu = document.querySelector(".mmenu.open");
    if (!menu) return;
    menu.classList.remove("open");
    document.body.style.overflow = "";
  });

  /* ---------- Переход между свитками: кровавая штора, не рябь ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    if (a.target && a.target !== "_self") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("javascript:") === 0) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(function () { location.href = a.href; }, 540);
  });
  window.addEventListener("pageshow", function () {
    document.body.classList.remove("leaving");
  });

  /* ---------- Свой курсор (только для мыши) ---------- */
  (function () {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    var c = document.querySelector(".cursor");
    if (!c) return;
    c.classList.add("on");
    var x = -100, y = -100, sx = -100, sy = -100;
    document.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      var t = e.target;
      c.classList.toggle("hover", !!(t && t.closest && t.closest("a, button, summary")));
    }, { passive: true });
    (function loop() {
      sx += (x - sx) * 0.25; sy += (y - sy) * 0.25;
      c.style.transform = "translate(" + sx + "px," + sy + "px)";
      requestAnimationFrame(loop);
    })();
  })();
})();
