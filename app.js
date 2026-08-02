/* gmbhsanierung.de – Check-Flow, Reveals, Mini-Starter
   Tracking: dataLayer-Events (GTM-Einbindung folgt im Consent-Setup) */
(function () {
  'use strict';
  var dl = function (ev, data) {
    try { window.dataLayer.push(Object.assign({ event: ev }, data || {})); } catch (e) {}
  };

  /* ---------- Header: transparent → stuck ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll-Reveals (reduced-motion-safe) ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Sanierungs-Check ---------- */
  var STEPS = [
    { key: 'lage', q: 'Wo steht Ihr Unternehmen gerade?', opts: [
      ['stabil', 'Umsatz stabil, aber Altlasten drücken'],
      ['ruecklaeufig', 'Umsatz rückläufig'],
      ['eingebrochen', 'Umsatz stark eingebrochen'],
      ['druck', 'Akuter Druck durch einzelne Gläubiger']] },
    { key: 'kerngeschaeft', q: 'Trägt sich das Kerngeschäft, wenn man die Altschulden wegdenkt?', opts: [
      ['ja', 'Ja, klar'], ['knapp', 'Knapp'], ['nein', 'Nein'], ['unklar', 'Schwer zu sagen']] },
    { key: 'liquiditaet', q: 'Können Sie aktuell alle fälligen Zahlungen leisten?', opts: [
      ['ja', 'Ja, problemlos'], ['eng', 'Ja, aber es wird eng'], ['teilweise', 'Teilweise nicht mehr']],
      note: { teilweise: 'Wichtig: Ob bereits Zahlungsunfähigkeit vorliegt, prüfen wir vorrangig — das entscheidet über die verfügbaren Wege.' } },
    { key: 'glaeubiger', q: 'Wer sind Ihre größten Gläubiger?', multi: true, opts: [
      ['bank', 'Bank'], ['finanzamt', 'Finanzamt'], ['krankenkasse', 'Krankenkassen / Sozialversicherung'],
      ['lieferanten', 'Lieferanten'], ['mehrere', 'Sonstige / mehrere']] },
    { key: 'verbindlichkeiten', q: 'Verbindlichkeiten insgesamt (grob):', opts: [
      ['u100', 'unter 100.000 €'], ['100-250', '100.000 – 250.000 €'], ['250-500', '250.000 – 500.000 €'],
      ['500-1m', '500.000 € – 1 Mio. €'], ['ue1m', 'über 1 Mio. €']] },
    { key: 'groesse', q: 'Größenordnung Ihres Unternehmens (Mitarbeiter):', opts: [
      ['bis5', 'bis 5 Mitarbeiter'], ['6-20', '6 – 20'], ['21-50', '21 – 50'], ['ue50', 'über 50']] },
    { key: 'erreichbarkeit', q: 'Wann erreichen wir Sie am besten?', reach: true },
    { key: 'kontakt', q: 'Wohin dürfen wir die Einschätzung senden?', form: true }
  ];
  var LABELS = ['Ihre Situation', 'Kerngeschäft', 'Liquidität', 'Gläubiger', 'Verbindlichkeiten', 'Größenordnung', 'Erreichbarkeit', 'Kontakt'];
  var FENSTER = ['08:00 – 12:00 Uhr', '12:00 – 15:00 Uhr', 'ab 17:00 Uhr', 'Ganztags flexibel'];
  var TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  var state = { step: 0, answers: {}, started: false };
  var body = document.getElementById('checkBody');
  var progress = document.getElementById('checkProgress');
  if (!body) return;

  for (var i = 0; i < STEPS.length; i++) {
    var bar = document.createElement('i');
    progress.appendChild(bar);
  }

  function renderProgress() {
    var bars = progress.children;
    for (var i = 0; i < bars.length; i++) bars[i].className = i <= state.step ? 'on' : '';
  }

  function render() {
    renderProgress();
    var s = STEPS[state.step];
    var remaining = STEPS.length - state.step;
    var metaLeft = remaining > 1 ? 'Nur noch ' + remaining + ' kurze Schritte' : 'Letzter Schritt';
    var html = '<div class="check-meta"><span>' + metaLeft + '</span><span>' + LABELS[state.step] + '</span></div>' +
      '<p class="check-q">' + s.q + '</p>';
    if (s.reach) {
      var r = state.answers.erreichbarkeit || { fenster: '', tage: [] };
      html += '<p class="check-hint">Wir rufen nur in Ihrem Wunschfenster an – diskret.</p>' +
        '<div class="gfield"><div class="grouplabel">Uhrzeitfenster</div><div class="opts opts--2" role="radiogroup" aria-label="Erreichbarkeit">';
      FENSTER.forEach(function (f, i) {
        html += '<div class="opt"><input type="radio" name="fenster" id="fen' + i + '" value="' + f + '"' + (r.fenster === f ? ' checked' : '') + '><label for="fen' + i + '"><span class="rdot"></span> ' + f + '</label></div>';
      });
      html += '</div></div><div class="gfield"><div class="grouplabel">An welchen Tagen? <span class="soft">(mehrere möglich)</span></div><div class="days" role="group" aria-label="Bevorzugte Wochentage">';
      TAGE.forEach(function (t, i) {
        html += '<span class="day"><input type="checkbox" name="tage" id="tag' + i + '" value="' + t + '"' + (r.tage.indexOf(t) > -1 ? ' checked' : '') + '><label for="tag' + i + '">' + t + '</label></span>';
      });
      html += '</div></div>' +
        '<div class="msf__nav">' +
        '<button type="button" class="btn btn--ghost msf__back" id="checkBack">Zurück</button>' +
        '<button type="button" class="btn" id="checkNext">Weiter <span class="arw">→</span></button>' +
        '</div>';
    } else if (s.form) {
      html += '<p class="check-hint">Ihre Daten werden vertraulich behandelt.</p>' +
        '<input type="text" id="f_name" placeholder="Vor- und Zuname" autocomplete="name">' +
        '<input type="email" id="f_email" placeholder="E-Mail-Adresse" autocomplete="email">' +
        '<input type="tel" id="f_tel" placeholder="Telefonnummer" autocomplete="tel">' +
        '<div class="msf__nav">' +
        '<button type="button" class="btn btn--ghost msf__back" id="checkBack">Zurück</button>' +
        '<button type="button" class="btn" id="checkSubmit">Ersteinschätzung anfordern <span class="arw">→</span></button>' +
        '</div>' +
        '<p class="privacy">Vertraulich &amp; unverbindlich. Mit dem Absenden akzeptieren Sie unsere <a href="/datenschutz" style="color:#8fb0e8">Datenschutzerklärung</a>.</p>';
    } else {
      html += '<div class="check-opts">';
      s.opts.forEach(function (o) {
        var sel = s.multi
          ? (state.answers[s.key] || []).indexOf(o[0]) > -1
          : state.answers[s.key] === o[0];
        html += '<button type="button" class="check-opt' + (sel ? ' sel' : '') + '" data-val="' + o[0] + '"><span class="dot"></span>' + o[1] + '</button>';
      });
      html += '</div>';
      if (s.note && state.answers[s.key] && s.note[state.answers[s.key]]) {
        html += '<div class="check-note">' + s.note[state.answers[s.key]] + '</div>';
      }
      if (state.step === 0) {
        html += '<div class="msf__nav"><button type="button" class="btn btn--block" id="checkNext">Weiter <span class="arw">→</span></button></div>';
      } else {
        html += '<div class="msf__nav">' +
          '<button type="button" class="btn btn--ghost msf__back" id="checkBack">Zurück</button>' +
          '<button type="button" class="btn" id="checkNext">Weiter <span class="arw">→</span></button>' +
          '</div>';
      }
    }
    body.innerHTML = html;
    bind();
  }

  function bind() {
    var s = STEPS[state.step];
    body.querySelectorAll('.check-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-val');
        if (!state.started) { state.started = true; dl('check_gestartet'); }
        if (s.multi) {
          var arr = state.answers[s.key] || [];
          var ix = arr.indexOf(val);
          if (ix > -1) arr.splice(ix, 1); else arr.push(val);
          state.answers[s.key] = arr;
          btn.classList.toggle('sel');
        } else {
          state.answers[s.key] = val;
          render();
        }
      });
    });
    var nextBtn = document.getElementById('checkNext');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var hasVal, ev;
      if (s.reach) {
        var fen = (body.querySelector('input[name="fenster"]:checked') || {}).value || '';
        var tage = [].slice.call(body.querySelectorAll('input[name="tage"]:checked')).map(function (i) { return i.value; });
        state.answers.erreichbarkeit = { fenster: fen, tage: tage };
        hasVal = !!fen && tage.length > 0;
        ev = fen + ' / ' + tage.join(',');
        if (!hasVal) {
          nextBtn.innerHTML = !fen ? 'Bitte Zeitfenster wählen' : 'Bitte Tag(e) wählen';
          setTimeout(function () { nextBtn.innerHTML = 'Weiter <span class="arw">→</span>'; }, 1400);
          return;
        }
      } else {
        var val = state.answers[s.key];
        hasVal = s.multi ? (val || []).length > 0 : !!val;
        ev = s.multi ? (val || []).join(',') : val;
        if (!hasVal) {
          nextBtn.innerHTML = 'Bitte eine Antwort wählen';
          setTimeout(function () { nextBtn.innerHTML = 'Weiter <span class="arw">→</span>'; }, 1400);
          return;
        }
      }
      dl('check_step_' + (state.step + 1), { antwort: ev });
      next();
    });
    var backBtn = document.getElementById('checkBack');
    if (backBtn) backBtn.addEventListener('click', function () { state.step = Math.max(0, state.step - 1); render(); });
    var submit = document.getElementById('checkSubmit');
    if (submit) submit.addEventListener('click', onSubmit);
  }

  function next() {
    if (state.step < STEPS.length - 1) { state.step++; render(); }
  }

  function onSubmit() {
    var name = document.getElementById('f_name').value.trim();
    var email = document.getElementById('f_email').value.trim();
    var tel = document.getElementById('f_tel').value.trim();
    if (!name || !email || !tel) {
      document.getElementById('checkSubmit').textContent = 'Bitte alle Felder ausfüllen';
      return;
    }
    state.answers.kontakt = { name: name, email: email, tel: tel };
    /* TODO (Schritt 6 Blueprint): Webhook-Anbindung analog Hauptseite
       (Payload: Antworten + fbclid/fbc/fbp/gclid/UTMs/landing_url/first_touch) */
    dl('lead', { lead_value: 1000, currency: 'EUR' });
    renderProgress();
    body.innerHTML = '<div class="check-success"><div class="big">✓</div>' +
      '<p class="check-q">Danke — wir melden uns innerhalb von 24 Stunden mit einer ersten Einschätzung.</p>' +
      '<p style="font-size:.92rem">Für eine verbindliche Aussage werten wir anschließend Ihre BWA/Bilanz aus — Sie können die Unterlagen einfach zum Gespräch mitbringen.</p></div>';
    /* TODO: Redirect /danke (Cal-Prefill) nach Webhook-Anbindung */
  }

  /* ---------- Mini-Starter (Schluss-CTA) ---------- */
  var mini = document.getElementById('miniStarter');
  if (mini) {
    mini.querySelectorAll('.pill').forEach(function (p) {
      p.addEventListener('click', function () {
        state.answers.lage = p.getAttribute('data-val');
        state.step = 1;
        state.started = true;
        dl('check_gestartet_unten', { antwort: p.getAttribute('data-val') });
        render();
        document.getElementById('check').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  render();
})();
