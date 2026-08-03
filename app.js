/* gmbhsanierung.de – Check-Flow, Reveals, Mini-Starter
   Tracking: dataLayer-Events (GTM-Einbindung folgt im Consent-Setup) */
(function () {
  'use strict';
  var dl = function (ev, data) {
    try { window.dataLayer.push(Object.assign({ event: ev }, data || {})); } catch (e) {}
  };

  /* ---------- Footer-Jahr ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      var k = state.answers.kontakt || {};
      html += '<p class="check-hint">Ihre Daten werden vertraulich behandelt.</p>' +
        '<div class="fields2">' +
        '<div class="field"><label for="f_name">Vor- und Zuname</label><input type="text" id="f_name" autocomplete="name" placeholder="Max Mustermann" value="' + (k.name || '') + '"></div>' +
        '<div class="field"><label for="f_firma">Unternehmensname</label><input type="text" id="f_firma" autocomplete="organization" placeholder="Mustermann GmbH" value="' + (k.firma || '') + '"></div>' +
        '<div class="field"><label for="f_email">E-Mail</label><input type="email" id="f_email" autocomplete="email" placeholder="name@firma.de" value="' + (k.email || '') + '"></div>' +
        '<div class="field"><label for="f_tel">Telefon</label><input type="tel" id="f_tel" autocomplete="tel" placeholder="+49 …" value="' + (k.tel || '') + '"></div>' +
        '</div>' +
        '<div class="msf__nav">' +
        '<button type="button" class="btn btn--ghost msf__back" id="checkBack">Zurück</button>' +
        '<button type="button" class="btn" id="checkSubmit">Check absenden</button>' +
        '</div>' +
        '<p class="form-legal">Mit dem Absenden stimmen Sie der Kontaktaufnahme zu. Es entstehen keine Kosten. Details in der <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a>.</p>';
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
    body.innerHTML = '<div class="msf__step">' + html + '</div>';
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
    var firma = document.getElementById('f_firma').value.trim();
    var email = document.getElementById('f_email').value.trim();
    var tel = document.getElementById('f_tel').value.trim();
    state.answers.kontakt = { name: name, firma: firma, email: email, tel: tel };
    if (!name || !firma || !email || !tel) {
      document.getElementById('checkSubmit').textContent = 'Bitte alle Felder ausfüllen';
      setTimeout(function () { document.getElementById('checkSubmit').textContent = 'Check absenden'; }, 1400);
      return;
    }
    var eventId = (window.eksTrack && window.eksTrack.uuid()) || (Date.now() + '-' + Math.random());
    dl('lead', {
      lead_value: 100, currency: 'EUR', event_id: eventId,
      external_id: window.eksTrack ? window.eksTrack.attrib.external_id : undefined
    });
    /* Lead-Daten für die /danke-Journey (Cal-Prefill) — nur sessionStorage, nichts in der URL */
    var labelFor = function (key, val) {
      var st = null;
      STEPS.forEach(function (x) { if (x.key === key) st = x; });
      if (!st || !st.opts) return val;
      var out = val;
      st.opts.forEach(function (o) { if (o[0] === val) out = o[1]; });
      return out;
    };
    var a = state.answers;
    var eks = {
      name: name, firma: firma, email: email, phone: tel,
      lage: labelFor('lage', a.lage),
      kerngeschaeft: labelFor('kerngeschaeft', a.kerngeschaeft),
      liquiditaet: labelFor('liquiditaet', a.liquiditaet),
      glaeubiger: (a.glaeubiger || []).map(function (v) { return labelFor('glaeubiger', v); }).join(', '),
      verbindlichkeiten: labelFor('verbindlichkeiten', a.verbindlichkeiten),
      groesse: labelFor('groesse', a.groesse),
      erreichbarkeit: (a.erreichbarkeit || {}).fenster || '',
      erreichbarkeit_tage: ((a.erreichbarkeit || {}).tage || []).join(', ')
    };
    eks.event_id = eventId;

    /* ---------- Lead an n8n → Pipedrive (Pipeline "Sanierung") ----------
       Feuert parallel zur Weiterleitung. keepalive sorgt dafür, dass der
       Request auch dann zu Ende läuft, wenn die Seite sofort wechselt.
       Fehler blockieren die Journey NICHT — der Nutzer kommt immer zu /danke. */
    try {
      var at = (window.eksTrack && window.eksTrack.attrib) || {};
      fetch('https://eschweiler.app.n8n.cloud/webhook/sanierung-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          name: name, firma: firma, email: email, tel: tel,
          lage: eks.lage, kerngeschaeft: eks.kerngeschaeft, liquiditaet: eks.liquiditaet,
          glaeubiger: eks.glaeubiger, verbindlichkeiten: eks.verbindlichkeiten,
          groesse: eks.groesse, erreichbarkeit: eks.erreichbarkeit,
          erreichbarkeit_tage: eks.erreichbarkeit_tage,
          quelle: 'gmbhsanierung.de', event_id: eventId,
          external_id: at.external_id || '', fbc: at.fbc || '', fbp: at.fbp || '',
          utm_source: at.utm_source || '', utm_medium: at.utm_medium || '',
          utm_campaign: at.utm_campaign || '', utm_content: at.utm_content || '',
          landing_url: location.href
        })
      }).catch(function () {});
    } catch (e) {}

    /* Kontaktdaten SHA-256-hashen (Meta-Normalisierung), DANN weiterleiten —
       die /danke-Seite seedet die Hashes synchron vor GTM in den dataLayer. */
    var go = function () {
      try { sessionStorage.setItem('eks_lead', JSON.stringify(eks)); } catch (e) {}
      window.location.href = '/danke';
    };
    if (window.eksTrack) {
      var done = false;
      var finish = function (h) {
        if (done) return; done = true;
        if (h) Object.assign(eks, h);
        go();
      };
      window.eksTrack.hashContact({ name: name, email: email, tel: tel })
        .then(finish, function () { finish(null); });
      setTimeout(function () { finish(null); }, 800); /* Sicherheitsnetz: nie am Hashing hängen bleiben */
    } else {
      go();
    }
  }

  /* ---------- Krisen-Timeline: Scroll-Scrubbing (vor & zurück) ----------
     Fortschritt haengt direkt an der Scrollposition: Karten + Verbinder
     bauen sich von links nach rechts auf, waehrend die Sektion nach oben
     wandert – und wieder ab, wenn man zurueckscrollt. */
  var tline = document.getElementById('tline');
  if (tline && !reduced && window.matchMedia('(min-width: 961px)').matches) {
    tline.classList.add('scrub');
    var tcards = [].slice.call(tline.querySelectorAll('.tcard'));
    var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    var ticking = false;
    var tupdate = function () {
      ticking = false;
      var vh = window.innerHeight;
      /* Jede Karte animiert anhand ihrer EIGENEN Viewport-Position:
         Einblendung, während die Karte zwischen 90 % und 62 % der
         Viewporthöhe steht — so ist die Animation immer sichtbar,
         egal wie hoch der Bildschirm ist. */
      tcards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var ci = clamp((vh * 0.9 - r.top) / (vh * 0.28), 0, 1);
        c.style.setProperty('--co', ci.toFixed(3));
        c.style.setProperty('--cy', (16 * (1 - ci)).toFixed(1) + 'px');
      });
    };
    var onTScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(tupdate); }
    };
    window.addEventListener('scroll', onTScroll, { passive: true });
    window.addEventListener('resize', onTScroll, { passive: true });
    tupdate();
  }

  /* ---------- Verfahrens-Schritte: Scroll-Scrub (wie Timeline) ----------
     Fortschrittslinie füllt sich, Karten 1–4 erscheinen nacheinander,
     der grüne Haken poppt am Ende. Rückwärts-Scrollen spult zurück. */
  var vsec = document.getElementById('verfahren');
  if (vsec && !reduced && window.matchMedia('(min-width: 961px)').matches) {
    vsec.classList.add('scrub');
    var vgrid = vsec.querySelector('.vgrid');
    var vcards = [].slice.call(vsec.querySelectorAll('.vcard'));
    var vsegs = [].slice.call(vsec.querySelectorAll('.vseg'));
    var vdots = [].slice.call(vsec.querySelectorAll('.vdot'));
    var vcheck = vsec.querySelector('.vcheck');
    var vN = vcards.length;
    var vclamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    var vticking = false;
    var vupdate = function () {
      vticking = false;
      var vh = window.innerHeight;
      /* Jede Zeile animiert anhand ihrer eigenen Viewport-Position
         (gleiche Mechanik wie die Warum-jetzt-Zeitachse) */
      var f = 0;
      var cis = vcards.map(function (c) {
        var r = c.getBoundingClientRect();
        return vclamp((vh * 0.9 - r.top) / (vh * 0.28), 0, 1);
      });
      vcards.forEach(function (c, i) {
        f += cis[i];
        c.style.setProperty('--co', cis[i].toFixed(3));
        c.style.setProperty('--cy', (14 * (1 - cis[i])).toFixed(1) + 'px');
      });
      vsegs.forEach(function (s, i) {
        s.style.setProperty('--sf', vclamp((cis[i] - 0.6) / 0.4, 0, 1).toFixed(3));
      });
      vdots.forEach(function (d, i) {
        d.classList.toggle('is-on', cis[i] >= 0.5);
      });
      if (vcheck) vcheck.classList.toggle('is-done', cis[vN - 1] >= 0.97);
    };
    var onVScroll = function () {
      if (!vticking) { vticking = true; requestAnimationFrame(vupdate); }
    };
    window.addEventListener('scroll', onVScroll, { passive: true });
    window.addEventListener('resize', onVScroll, { passive: true });
    vupdate();
  }

  /* ---------- Warnzeichen-Klickstrecke (Muster Hauptseite) ----------
     Auswahl bleibt lokal, nichts wird gespeichert oder übertragen. */
  var signs = [].slice.call(document.querySelectorAll('.wsign'));
  if (signs.length) {
    var resp = document.getElementById('warnResp');
    var ctaWrap = document.getElementById('warnCtaWrap');
    var wmsg = function (n) {
      if (n === 0) return 'Seien Sie ehrlich zu sich – niemand sieht Ihre Auswahl.';
      if (n === 1) return 'Ein Zeichen ist ein Signal. Beobachten Sie die nächsten Wochen sehr genau.';
      if (n === 2) return 'Zwei Zeichen sind kein Zufall. Jetzt ist der Moment für Klarheit – solange Sie noch alle Wege haben.';
      if (n <= 4) return 'Drei und mehr Zeichen: Die Krise ist meist längst da. Je früher Sie prüfen, desto mehr lässt sich retten.';
      return 'Sie tragen gerade sehr viel. Genau dafür sind wir da – diskret, ohne Urteil, mit einem klaren Plan.';
    };
    var pill = document.getElementById('warnPill');
    var pillCount = document.getElementById('warnPillCount');
    var pillText = document.getElementById('warnPillText');
    var pillArw = document.getElementById('warnPillArw');
    var warnInView = false;
    var pillMsg = function (n) {
      if (n === 1) return 'Ein Zeichen – im Blick behalten';
      if (n === 2) return 'Kein Zufall – Zeit für Klarheit';
      if (n <= 4) return 'Jetzt prüfen, was noch geht';
      return 'Wir sind für Sie da – diskret';
    };
    var updatePill = function (n) {
      if (!pill) return;
      if (pillCount) pillCount.textContent = n;
      if (pillText && n > 0) pillText.textContent = pillMsg(n);
      if (pillArw) pillArw.hidden = n < 2;
      pill.classList.toggle('is-hot', n >= 2 && n < 3);
      pill.classList.toggle('is-urgent', n >= 3);
      pill.classList.toggle('is-show', warnInView && n >= 1);
    };
    var warnWrap = document.querySelector('.warn');
    if (pill && warnWrap && 'IntersectionObserver' in window) {
      var pio = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          warnInView = en.isIntersecting;
          updatePill(signs.filter(function (s) { return s.classList.contains('is-on'); }).length);
        });
      }, { threshold: 0.05 });
      pio.observe(warnWrap);
    }
    var autoJumped = false;
    var wupdate = function () {
      var n = signs.filter(function (s) { return s.classList.contains('is-on'); }).length;
      if (ctaWrap) ctaWrap.classList.toggle('is-hot', n >= 2);
      updatePill(n);
      if (n >= 3 && !autoJumped) {
        autoJumped = true;
        dl('warnzeichen_drei', { anzahl: n });
        if (resp) resp.textContent = 'Drei Zeichen sind genug. Einen Moment – wir bringen Sie zum unverbindlichen Sanierungs-Check …';
        setTimeout(function () {
          var target = document.getElementById('check');
          if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }, 1400);
        return;
      }
      if (resp) resp.textContent = wmsg(n);
    };
    signs.forEach(function (s) {
      var toggle = function () {
        s.classList.toggle('is-on');
        s.setAttribute('aria-pressed', s.classList.contains('is-on') ? 'true' : 'false');
        wupdate();
      };
      s.addEventListener('click', toggle);
      s.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
    });
    wupdate();
    var wgrid = document.getElementById('warnGrid');
    if (wgrid && 'IntersectionObserver' in window && !reduced) {
      var wio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            signs.forEach(function (s, i) { setTimeout(function () { s.classList.add('in-view'); }, i * 80); });
            wio.disconnect();
          }
        });
      }, { threshold: 0.12 });
      wio.observe(wgrid);
    } else {
      signs.forEach(function (s) { s.classList.add('in-view'); });
    }
  }

  /* ---------- FAQ: immer nur ein Eintrag offen ---------- */
  var faqItems = [].slice.call(document.querySelectorAll('#faq details'));
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqItems.forEach(function (o) { if (o !== d && o.open) o.open = false; });
    });
  });

  /* ---------- 75%-Ring: zeichnet sich beim Einscrollen (synchron zum Zähler) ---------- */
  var donutArc = document.getElementById('donutArc');
  if (donutArc && 'IntersectionObserver' in window) {
    var DC = 2 * Math.PI * 92;           /* Umfang */
    var DTARGET = DC * 0.75;             /* 75 % */
    donutArc.style.strokeDasharray = '0 ' + DC.toFixed(1);
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dio.disconnect();
        if (reduced) { donutArc.style.strokeDasharray = DTARGET.toFixed(1) + ' ' + DC.toFixed(1); return; }
        var dur = 1600, t0 = performance.now();
        var dtick = function (t) {
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          donutArc.style.strokeDasharray = (DTARGET * eased).toFixed(1) + ' ' + DC.toFixed(1);
          if (p < 1) requestAnimationFrame(dtick);
        };
        requestAnimationFrame(dtick);
      });
    }, { threshold: 0.5 });
    dio.observe(donutArc);
  }

  /* ---------- Zähl-Animationen: alle Elemente mit data-count ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var fmt = function (n) { return n.toLocaleString('de-DE'); };
        if (reduced) { el.textContent = fmt(target); return; }
        el.style.minWidth = el.offsetWidth + 'px';
        var dur = 1600, t0 = performance.now();
        var tick = function (t) {
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Mini-Starter (Schluss-CTA) ---------- */
  var mini = document.getElementById('miniStarter');
  if (mini) {
    mini.querySelectorAll('[data-val]').forEach(function (p) {
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
  /* ---------- Formularfeld-Fokus + WhatsApp-Klick (Muster Hauptseite) ---------- */
  var seenFocus = {};
  document.addEventListener('focusin', function (e) {
    var id = e.target && e.target.id;
    if (id === 'f_name' && !seenFocus.name) { seenFocus.name = true; dl('formular_name'); }
    if (id === 'f_firma' && !seenFocus.firma) { seenFocus.firma = true; dl('formular_unternehmensname'); }
  });
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="https://wa.me"]') : null;
    if (a) dl('whatsapp_klick');
  });
})();
