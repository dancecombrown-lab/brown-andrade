(function () {
  "use strict";

  var cfg = window.BROWN_CONFIG || { kiwify: {}, social: {} };
  var COURSES = ["charme", "ritmos", "zeroaoritmo"];
  var COURSE_NAME = { charme: "Passinhos Charme", ritmos: "Ritmos", zeroaoritmo: "Do Zero ao Ritmo" };

  // Parâmetros de campanha preservados nos links de checkout
  var KEEP = /^(utm_[a-z_]+|src|sck|s[1-3]|fbclid|gclid|ttclid)$/i;

  function withTracking(url) {
    var here = new URLSearchParams(window.location.search);
    var out = new URL(url, window.location.href);
    here.forEach(function (value, key) {
      if (KEEP.test(key) && !out.searchParams.has(key)) out.searchParams.set(key, value);
    });
    return out.toString();
  }

  // ---- Toast (avisos de link pendente) ----
  var toast = document.querySelector(".toast");
  var toastTimer;
  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 3500);
  }

  var header = document.querySelector(".header");

  // ---- Seletor de cursos ----
  var journey = document.querySelector(".journey");
  var active = "charme";

  // Vídeo de cada curso: toca ao abrir o curso (clique) e pausa ao sair
  function courseVideo(course) {
    return document.querySelector("#curso-" + course + " .cvideo iframe");
  }
  function videoCommand(frame, func) {
    if (frame && frame.src) {
      frame.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: [] }), "*");
    }
  }

  function setCourse(course, autoplay) {
    if (COURSES.indexOf(course) < 0) return;
    var changed = course !== active || !!(journey && !journey.getAttribute("data-course"));
    active = course;
    if (journey) journey.setAttribute("data-course", course);
    COURSES.forEach(function (c) {
      var panel = document.getElementById("curso-" + c);
      if (panel) panel.hidden = c !== course;
      if (c !== course) videoCommand(courseVideo(c), "pauseVideo");
    });
    var frame = courseVideo(course);
    if (!frame || !autoplay) return;
    if (!frame.src) {
      frame.src = frame.getAttribute("data-src") + "&autoplay=1";
    } else if (changed) {
      videoCommand(frame, "playVideo");
    }
  }

  function scrollToEl(el) {
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTabs() {
    scrollToEl(document.getElementById("cursos"));
  }

  // Curso inicial: ?curso=ritmos ou #ritmos / #curso-ritmos / #planos-ritmos
  function courseFromUrl() {
    var q = new URLSearchParams(window.location.search).get("curso");
    if (COURSES.indexOf(q) >= 0) return q;
    var m = /^#(?:curso-|planos-|beneficios-|para-quem-)?(charme|ritmos|zeroaoritmo)$/.exec(window.location.hash);
    return m ? m[1] : null;
  }
  var initial = courseFromUrl();
  if (initial) {
    setCourse(initial);
    if (/^#(planos-|beneficios-|para-quem-)/.test(window.location.hash)) {
      window.addEventListener("load", function () { scrollToEl(document.getElementById(window.location.hash.slice(1))); });
    } else if (window.location.hash) {
      window.addEventListener("load", scrollToTabs);
    }
  }

  // Links "conhecer o curso" / "ver planos": levam à descrição ou aos planos do curso escolhido
  document.querySelectorAll("[data-goto]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var course = el.getAttribute("data-course") || active;
      var target = el.getAttribute("data-goto"); // "curso" ou "planos"
      e.preventDefault();
      setCourse(course, true);
      scrollToEl(document.getElementById(target + "-" + course));
    });
  });

  // ---- Botões de compra -> ofertas Kiwify ----
  document.querySelectorAll("[data-plan]").forEach(function (el) {
    var plan = el.getAttribute("data-plan");
    var course = el.getAttribute("data-course");
    var link = cfg.kiwify && cfg.kiwify[course] && cfg.kiwify[course][plan];

    if (link) {
      el.href = withTracking(link);
      el.target = "_blank";
      el.rel = "noopener";
    }

    el.addEventListener("click", function (e) {
      if (window.dataLayer) window.dataLayer.push({ event: "checkout_click", course: course, plan: plan });
      if (!link) {
        e.preventDefault();
        notify("Link da oferta " + COURSE_NAME[course] + " / " + plan + " ainda não configurado (js/config.js).");
      }
    });
  });

  // ---- Redes sociais ----
  document.querySelectorAll("[data-social]").forEach(function (el) {
    var url = cfg.social && cfg.social[el.getAttribute("data-social")];
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener";
    } else {
      el.addEventListener("click", function (e) { e.preventDefault(); notify("Link de rede social ainda não configurado."); });
    }
  });

  // ---- Links institucionais pendentes ----
  document.querySelectorAll("a[data-todo]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); notify("Pendente: " + el.getAttribute("data-todo") + "."); });
  });

  // ---- Header: borda ao rolar ----
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Animação de entrada ----
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
