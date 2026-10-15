/* =====================================================================
   ДЫХАНИЕ ВОДЫ — скрипты сайта (без библиотек, чистый JavaScript).
   Файл копируется сборкой в assets/app.js.

   Разделы:
     01 год в подвале            07 вкладки-разделы в шапке
     02 экран загрузки           08 шкала главной
     03 прогресс и шапка         09 ката: ленивое видео
     04 мобильный кодекс         10 водный курсор
     05 появление блоков         11 переходы между страницами (шторa-волна)
     06 аккордеон, печати
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- 01. Год в подвале ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 02. Экран загрузки (только раз за сеанс) ---------- */
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

  /* ---------- 03. Полоса прогресса + шапка + линия иерархии ---------- */
  (function () {
    var bar = document.querySelector(".progress");
    var nav = document.querySelector(".nav");
    var heroCue = document.querySelector(".hero__cue");
    var rails = document.querySelectorAll(".timeline, .hb-river");
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && max > 0) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (nav) nav.classList.toggle("scrolled", y > 60);
      if (heroCue) heroCue.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.5));
      rails.forEach(function (tl) {
        var fill = tl.querySelector(".timeline__fill, .hb-river__fill");
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

  /* ---------- 04. Мобильный кодекс ---------- */
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

  /* ---------- 05. Появление блоков при прокрутке ---------- */
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

  /* ---------- 06a. Аккордеон: открыта одна вкладка ---------- */
  (function () {
    document.querySelectorAll("[data-acc]").forEach(function (group) {
      group.querySelectorAll("details").forEach(function (d) {
        var body = d.querySelector(".acc__body");
        var head = d.querySelector("summary");
        if (!body || !head || reduceMotion) {
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
          var sid = d._seq;
          d.open = true;
          body.style.height = "0px";
          requestAnimationFrame(function () {
            if (d._seq !== sid) return;
            body.style.height = body.scrollHeight + "px";
          });
          function opened(ev) {
            if (ev.propertyName !== "height" || d._seq !== sid) return;
            body.style.height = "auto";
            body.removeEventListener("transitionend", opened);
          }
          body.addEventListener("transitionend", opened);
        });
      });
    });
  })();

  /* ---------- 06b. Вкладки привилегий (внутри страниц) ---------- */
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

  /* ---------- 06c. Готовность героя ---------- */
  if (!document.querySelector(".preloader")) document.body.classList.add("ready");

  /* ---------- 07. Вкладки-разделы в шапке ----------
     Капля-подсветка едет за активной вкладкой; при наведении над вкладкой
     всплывает капелька; лента сама подкручивается так, чтобы активная
     вкладка была видна.                                                     */
  (function () {
    var bar = document.querySelector("[data-seals]");
    if (!bar) return;
    var track = bar.querySelector("[data-tabs-track]");
    var ink = bar.querySelector("[data-tabs-ink]");
    var drop = bar.querySelector("[data-tabs-drop]");
    var tabs = Array.prototype.slice.call(track ? track.querySelectorAll(".ntab") : []);
    if (!track || !ink || !tabs.length) return;

    function center(el) {
      var left = el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
      track.scrollLeft = Math.max(0, left);
    }
    function move(el, instant) {
      ink.style.width = el.offsetWidth + "px";
      ink.style.height = el.offsetHeight + "px";
      ink.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)";
      if (instant) {
        ink.classList.add("is-jump");
        void ink.offsetWidth;
        requestAnimationFrame(function () { ink.classList.remove("is-jump"); });
      }
      ink.classList.add("is-ready");
      if (drop) drop.style.left = el.offsetLeft + el.offsetWidth / 2 + "px";
    }
    var active = bar.querySelector(".ntab.is-on") || tabs[0];
    // первый показ — без анимации, чтобы капля не уезжала из нуля
    move(active, true);
    center(active);

    tabs.forEach(function (tab) {
      tab.addEventListener("mouseenter", function () {
        bar.classList.add("is-hovering");
        if (drop) drop.style.left = tab.offsetLeft + tab.offsetWidth / 2 + "px";
      });
      tab.addEventListener("focus", function () { bar.classList.add("is-hovering"); });
      tab.addEventListener("blur", function () { bar.classList.remove("is-hovering"); });
      tab.addEventListener("click", function () { move(tab); center(tab); });
    });
    bar.addEventListener("mouseleave", function () { bar.classList.remove("is-hovering"); });

    var reflowTimer = null;
    function reflow() {
      clearTimeout(reflowTimer);
      reflowTimer = setTimeout(function () {
        active = bar.querySelector(".ntab.is-on") || active;
        move(active, true);
        center(active);
      }, 120);
    }
    window.addEventListener("resize", reflow);
    window.addEventListener("orientationchange", reflow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflow).catch(function () {});
    window.addEventListener("load", reflow);
  })();

  /* ---------- 08. Шкала главной ---------- */
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

  /* ---------- 09. Ката: ленивые видео ----------
     Ролик грузится только когда блок подъехал к экрану. Мышь — превью играет
     при наведении; тап/клик — играет или ставит на паузу. Кнопок и подписей
     в плеере нет. Одновременно играет одна анимация, уход из окна — пауза.

     Тип указателя берём из Pointer Events (event.pointerType), а не из
     «(pointer: fine)»: медиазапрос врёт в части браузеров и в headless.      */
  (function () {
    var figures = document.querySelectorAll("[data-kata-media]");
    if (!figures.length) return;

    function activate(video) {
      if (!video || video.dataset.loaded === "1") return;
      var sources = video.querySelectorAll("source[data-src]");
      if (!sources.length) return;
      sources.forEach(function (s) {
        s.src = s.getAttribute("data-src");
        s.removeAttribute("data-src");
      });
      video.dataset.loaded = "1";
      try { video.load(); } catch (e) {}
    }
    function play(video) {
      if (!video) return;
      activate(video);
      document.querySelectorAll("[data-kata-video]").forEach(function (v) { if (v !== video) pause(v); });
      video.muted = true;
      try {
        var p = video.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      } catch (e) {}
      var f = video.closest("[data-kata-media]");
      if (f) f.classList.add("is-playing");
    }
    function pause(video) {
      if (!video) return;
      var f = video.closest("[data-kata-media]");
      if (f) f.classList.remove("is-playing");
      if (!video.paused) video.pause();
    }
    function toggle(video) { if (video.paused) play(video); else pause(video); }

    figures.forEach(function (figure) {
      var video = figure.querySelector("video[data-kata-video]");
      if (!video) return;
      var zone = figure.closest("[data-kata-card], .hb-kata__preview") || figure;
      var lastToggle = 0;
      var lastTouchAt = 0;

      // На части телефонов тап приходит только как pointerup/touchend, без click
      // (например, если страница „переехала“ под пальцем). Поэтому ловим оба
      // события, а от двойного переключения спасает окно в 400 мс.
      function toggleOnce(e) {
        if (e.target && e.target.closest && e.target.closest("a")) return;
        var now = performance.now();
        if (now - lastToggle < 400) return;
        lastToggle = now;
        toggle(video);
      }

      // Наведение — только для настоящей мыши. После тача браузеры шлют
      // совместимые «мышиные» события, поэтому касание ставит метку и
      // hover-запуск в это окно игнорируется (иначе тап включал бы и выключал).
      zone.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        if (performance.now() - lastTouchAt < 700) return;
        play(video);
      });
      zone.addEventListener("pointerleave", function (e) {
        if (e.pointerType !== "mouse") return;
        if (performance.now() - lastTouchAt < 700) return;
        pause(video);
      });

      zone.addEventListener("pointerup", function (e) {
        if (e.pointerType === "mouse") return;   // мышь обрабатывает click ниже
        lastTouchAt = performance.now();
        toggleOnce(e);                            // палец: играем / пауза
      });
      zone.addEventListener("click", function (e) {
        toggleOnce(e);                      // мышь и клавиатура
      });
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target.querySelector("video[data-kata-video]");
          if (!video) return;
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.35) activate(video);
            else if (entry.intersectionRatio === 0) pause(video);
          } else {
            pause(video);
          }
        });
      }, { threshold: [0, 0.35], rootMargin: "300px 0px" });
      figures.forEach(function (figure) { io.observe(figure); });
    } else {
      document.querySelectorAll("video[data-kata-video]").forEach(activate);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) document.querySelectorAll("[data-kata-video]").forEach(pause);
    });
  })();

  /* ---------- 10. Водный курсор ----------
     Свечение, кольцо и капля идут за мышью с разной задержкой (эффект воды).
     Клик — рябь и брызги, быстрое движение — капли-след.

     Включается по первому движению НАСТОЯЩЕЙ мыши (pointerType === "mouse"):
     на телефоне и планшете курсора просто не будет, и не важно, что
     сообщает медиазапрос про «(pointer: fine)».                              */
  (function () {
    var cur = document.querySelector("[data-cursor]");
    if (!cur) return;
    if (reduceMotion) { cur.remove(); return; }

    var fx = cur.querySelector("[data-cursor-fx]") || cur;
    var glow = cur.querySelector(".wcur__glow");
    var ring = cur.querySelector(".wcur__ring");
    var dot = cur.querySelector(".wcur__dot");

    var mx = -200, my = -200;              // цель
    var gx = mx, gy = my;                  // свечение (самое ленивое)
    var rx = mx, ry = my;                  // кольцо
    var dx = mx, dy = my;                  // капля
    var lastX = mx, lastY = my, lastT = 0, trailAt = 0;
    var active = false, bound = false;

    var HOT = "a, button, summary, .ntab, .kata-card, .hb-card, .hb-vow, .hb-principle, " +
              ".hb-kata__chip, .hb-rank, .hb-stop, .codex__card, input, textarea, select";

    function spawn(cls, x, y, vars, life) {
      var el = document.createElement("span");
      el.className = cls;
      el.style.left = x + "px";
      el.style.top = y + "px";
      if (vars) Object.keys(vars).forEach(function (k) { el.style.setProperty(k, vars[k]); });
      fx.appendChild(el);
      setTimeout(function () { el.remove(); }, life);
      while (fx.childElementCount > 40) fx.firstElementChild.remove();   // страховка от накопления
    }
    function ripple(x, y, delay) {
      var el = document.createElement("span");
      el.className = "wcur__ripple";
      el.style.left = x + "px";
      el.style.top = y + "px";
      if (delay) el.style.animationDelay = delay + "ms";
      fx.appendChild(el);
      setTimeout(function () { el.remove(); }, 1200);
    }
    function splash(x, y) {
      for (var i = 0; i < 7; i++) {
        var a = (Math.PI * 2 * i) / 7 + Math.random() * 0.5;
        var d = 26 + Math.random() * 34;
        spawn("wcur__spray", x, y, {
          "--dx": (Math.cos(a) * d).toFixed(1) + "px",
          "--dy": (Math.sin(a) * d - 8).toFixed(1) + "px"
        }, 800);
      }
      ripple(x, y, 110);
      ripple(x, y, 0);
    }
    function trail(x, y, speed) {
      var now = performance.now();
      if (speed < 0.9 || now - trailAt < 70) return;
      trailAt = now;
      spawn("wcur__drop", x + (Math.random() * 14 - 7), y + (Math.random() * 10 - 5), {
        "--dx": (Math.random() * 16 - 8).toFixed(1) + "px",
        "--dy": (10 + Math.random() * 16).toFixed(1) + "px"
      }, 1000);
    }

    function loop() {
      if (!active) return;
      gx += (mx - gx) * 0.055;
      gy += (my - gy) * 0.055;
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dx += (mx - dx) * 0.42;
      dy += (my - dy) * 0.42;
      if (glow) glow.style.transform = "translate(" + gx + "px," + gy + "px)";
      if (ring) ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      if (dot) dot.style.transform = "translate(" + dx + "px," + dy + "px)";
      requestAnimationFrame(loop);
    }

    function onMove(e) {
      var type = e.pointerType;
      if (type !== "mouse") {
        // пустой pointerType бывает у старых браузеров: доверяем только
        // устройству без тачскрина
        if (type || "ontouchstart" in window || navigator.maxTouchPoints > 0) return;
      }
      if (!bound) bind();
      var now = performance.now();
      var dt = Math.max(1, now - lastT);
      var speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      mx = e.clientX; my = e.clientY;
      trail(e.clientX, e.clientY, speed);
      var hot = !!(e.target && e.target.closest && e.target.closest(HOT));
      cur.classList.toggle("is-hot", hot);
      cur.classList.remove("is-out");
    }
    function bind() {
      bound = true; active = true;
      window.addEventListener("pointerdown", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        cur.classList.add("is-down");
        splash(e.clientX, e.clientY);
      });
      window.addEventListener("pointerup", function () { cur.classList.remove("is-down"); });
      document.addEventListener("mouseleave", function () { cur.classList.add("is-out"); });
      document.addEventListener("mouseenter", function () { cur.classList.remove("is-out"); });
      window.addEventListener("blur", function () { active = false; });
      window.addEventListener("focus", function () { if (!active) { active = true; loop(); } });
      requestAnimationFrame(loop);
    }

    function dropIfTouch(e) {
      if (bound) return;                       // мышь уже включила курсор
      var t = (e && e.pointerType) || "";
      if (t && t === "mouse") return;
      if (e && e.type === "touchstart") { cur.remove(); return; }
      if (t) cur.remove();                      // pointerdown от пальца/стилуса
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", dropIfTouch, { passive: true, once: true });
    window.addEventListener("touchstart", dropIfTouch, { passive: true, once: true });
  })();

  /* ---------- 11. Переход между страницами ----------
     Уходим: вода поднимается снизу и накрывает экран (шторка-волна), затем
     переход. Приходим: штора уже накрыта (html.veil-cover, ставится в <head>),
     показывает иероглиф и название страницы и уезжает вверх — новая страница
     как будто выплывает. Без JS шторку убирает CSS-анимация.                */
  (function () {
    var root = document.documentElement;
    var veil = document.querySelector("[data-veil]");

    function read(key, fallback) {
      try { return sessionStorage.getItem(key) || fallback; } catch (e) { return fallback; }
    }
    function write(key, value) {
      try { sessionStorage.setItem(key, value); } catch (e) {}
    }

    if (veil) {
      /* приход */
      if (root.classList.contains("veil-cover") && !reduceMotion) {
        var label = veil.querySelector("[data-veil-label]");
        var kanji = veil.querySelector("[data-veil-kanji]");
        if (label) label.textContent = read("wb-nav-label", "Дыхание воды");
        if (kanji) kanji.textContent = read("wb-nav-sigil", "水");
      }
      var done = function () {
        if (veil.classList.contains("is-cover")) return;   // уже уходим на другую страницу
        root.classList.remove("veil-cover");
        root.classList.add("veil-done");
        veil.classList.remove("is-cover");
        veil.classList.remove("is-away");
        document.body.classList.remove("is-leaving");
      };
      var panel = veil.querySelector(".veil__panel");
      if (panel) panel.addEventListener("animationend", function (e) {
        if (e.animationName === "veilAway") done();
      });
      setTimeout(done, reduceMotion ? 30 : 2400);

      /* уход */
      function leave(href, title, sigil) {
        if (reduceMotion) { window.location.href = href; return; }
        write("wb-nav", "1");
        if (title) write("wb-nav-label", title);
        if (sigil) write("wb-nav-sigil", sigil);
        var label = veil.querySelector("[data-veil-label]");
        var kanji = veil.querySelector("[data-veil-kanji]");
        if (label && title) label.textContent = title;
        if (kanji && sigil) kanji.textContent = sigil;
        root.classList.remove("veil-done");
        veil.classList.remove("is-away");
        void veil.offsetWidth;
        veil.classList.add("is-cover");
        document.body.classList.add("is-leaving");
        setTimeout(function () { window.location.href = href; }, 880);
      }

      document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;
        if (a.target && a.target !== "_self") return;
        if (a.hasAttribute("download")) return;
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;
        var url;
        try { url = new URL(a.href, window.location.href); } catch (err) { return; }
        if (url.protocol !== window.location.protocol) return;
        if (url.host !== window.location.host) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        e.preventDefault();
        var title = a.getAttribute("data-nav-title") || (a.textContent || "").trim().slice(0, 40);
        var sigil = a.getAttribute("data-nav-sigil") || "";
        var tab = a.closest && a.closest("[data-seals]");
        if (tab && tab.querySelector("[data-tabs-ink]")) {
          var ink = tab.querySelector("[data-tabs-ink]");
          ink.style.width = a.offsetWidth + "px";
          ink.style.height = a.offsetHeight + "px";
          ink.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
        }
        leave(a.href, title, sigil);
      }, false);

      /* возврат «назад» из кэша браузера */
      window.addEventListener("pageshow", function (e) {
        if (!e.persisted) return;
        done();
      });
    }
  })();

})();
