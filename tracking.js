/* gmbhsanierung.de – Tracking-Grundlage (Muster gmbhabwicklung.de)
   Attribution (external_id, fbc/fbp, UTM) + SHA-256-Hashing + event_id.
   Läuft auf allen Seiten VOR den Conversion-Ereignissen; die Danke-Seiten
   seeden die gehashten Werte synchron aus sessionStorage in den dataLayer. */
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : '';
  }

  /* ---------- Attribution erfassen (localStorage ek_attrib) ----------
     GLEICHER Storage-Key wie die Hauptseite → markenübergreifende
     Wiedererkennung desselben Browsers. */
  function captureAttribution() {
    var a = {};
    try { a = JSON.parse(localStorage.getItem('ek_attrib') || '{}'); } catch (e) {}
    if (!a.external_id) a.external_id = uuid();

    var params = new URLSearchParams(location.search);
    var fbclid = params.get('fbclid');
    if (fbclid) a.fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    if (!a.fbc && getCookie('_fbc')) a.fbc = getCookie('_fbc');
    if (getCookie('_fbp')) a.fbp = getCookie('_fbp');

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = params.get(k);
      if (v) a[k] = v;
    });
    try { localStorage.setItem('ek_attrib', JSON.stringify(a)); } catch (e) {}
    return a;
  }
  var attrib = captureAttribution();

  /* ---------- Normalisierung + SHA-256 ----------
     Meta-Konventionen: E-Mail trim+lowercase; Telefon NUR Ziffern mit
     Ländervorwahl OHNE "+" (Learning 21.07.: Google bräuchte E.164 MIT "+"
     → bei Enhanced Conversions später separat behandeln). */
  function normEmail(v) { return String(v || '').trim().toLowerCase(); }
  function normPhone(v) {
    var t = String(v || '').replace(/[^\d+]/g, '');
    if (/^00/.test(t)) t = t.slice(2);
    else if (/^0[1-9]/.test(t)) t = '49' + t.slice(1);
    else if (/^\+/.test(t)) t = t.slice(1);
    return t.replace(/\D/g, '');
  }
  function normName(v) { return String(v || '').trim().toLowerCase(); }

  function sha256(str) {
    if (!str) return Promise.resolve('');
    if (!(window.crypto && crypto.subtle)) return Promise.resolve('');
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  /* Kontaktdaten hashen → Objekt {em_h, ph_h, fn_h, ln_h} */
  function hashContact(contact) {
    var name = String(contact.name || '').trim();
    var fn = name.split(/\s+/)[0] || '';
    var ln = name.split(/\s+/).slice(1).join(' ') || '';
    return Promise.all([
      sha256(normEmail(contact.email)),
      sha256(normPhone(contact.tel || contact.phone)),
      sha256(normName(fn)),
      sha256(normName(ln))
    ]).then(function (r) {
      return { em_h: r[0], ph_h: r[1], fn_h: r[2], ln_h: r[3] };
    });
  }

  /* ---------- Öffentliche API ---------- */
  window.eksTrack = {
    attrib: attrib,
    uuid: uuid,
    hashContact: hashContact,
    /* Seed-Payload für die Danke-Seiten: synchron aus sessionStorage lesbar */
    seedFromLead: function (storageKey, extra) {
      var lead = {};
      try { lead = JSON.parse(sessionStorage.getItem(storageKey || 'eks_lead') || '{}'); } catch (e) {}
      var seed = {
        external_id: attrib.external_id,
        lead_value: 100,
        currency: 'EUR'
      };
      ['em_h', 'ph_h', 'fn_h', 'ln_h', 'event_id'].forEach(function (k) {
        if (lead[k]) seed[k] = lead[k];
      });
      if (attrib.fbc) seed.fbc = attrib.fbc;
      if (attrib.fbp) seed.fbp = attrib.fbp;
      Object.assign(seed, extra || {}); /* extra gewinnt (z. B. eigenes event_id des Termins) */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(seed);
      return seed;
    }
  };
})();
