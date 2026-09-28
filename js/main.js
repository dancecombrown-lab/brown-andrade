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

  // ---- Seletor de cursos (abas) ----
  var journey = document.querySelector(".journey");
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var active = "charme";

  function setCourse(course) {
    if (COURSES.indexOf(course) < 0) return;
    active = course;
    if (journey) journey.setAttribute("data-course", course);
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === course;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    COURSES.forEach(function (c) {
      var panel = document.getElementById("curso-" + c);
      if (panel) panel.hidden = c !== course;
    });
  }

  function scrollToEl(el) {
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTabs() {
    scrollToEl(document.getElementById("cursos"));
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      setCourse(tab.getAttribute("data-tab"));
      history.replaceState(null, "", "#curso-" + active);
      // Se o visitante estava no meio do curso anterior, volta ao início do novo
      var headerH = header ? header.offsetHeight : 0;
      var top = journey.getBoundingClientRect().top + window.scrollY - headerH;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "instant" });
    });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      next.click();
      e.preventDefault();
    });
  });

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

  // Links "ver planos": levam aos planos do curso escolhido
  document.querySelectorAll("[data-goto='planos']").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var course = el.getAttribute("data-course") || active;
      e.preventDefault();
      setCourse(course);
      scrollToEl(document.getElementById("planos-" + course));
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
