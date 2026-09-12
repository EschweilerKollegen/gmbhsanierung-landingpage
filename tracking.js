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
      /* sessionStorage gilt nur fuer diesen Tab. Cal.com oeffnet die Terminbestaetigung
         haeufig in einem neuen, und ein Reload trifft dieselbe Luecke - deshalb liegen
         die Hashes zusaetzlich im localStorage (eks_match, mit Ablauf). */
      var match = {};
      try { match = JSON.parse(localStorage.getItem('eks_match') || '{}'); } catch (e) {}
      if (match.exp && Date.now() > match.exp) {
        try { localStorage.removeItem('eks_match'); } catch (e) {}
        match = {};
      }
      var seed = {
        external_id: attrib.external_id,
        lead_value: 100,
        currency: 'EUR'
      };
      ['em_h', 'ph_h', 'fn_h', 'ln_h'].forEach(function (k) {
        var v = lead[k] || match[k];
        if (v) seed[k] = v;
      });
      /* event_id bewusst NUR aus dem sessionStorage: eine alte ID aus dem
         localStorage wuerde ein neues Event faelschlich deduplizieren. */
      if (lead.event_id) seed.event_id = lead.event_id;
      if (attrib.fbc) seed.fbc = attrib.fbc;
      if (attrib.fbp) seed.fbp = attrib.fbp;
      Object.assign(seed, extra || {}); /* extra gewinnt (z. B. eigenes event_id des Termins) */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(seed);
      return seed;
    }
  };
})();


// Vercel Web Analytics: laedt /_vercel/insights/script.js auf jeder Seite (cookielos).
(function(){if(document.querySelector('script[src="/_vercel/insights/script.js"]'))return;var s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';document.head.appendChild(s);})();
// Vercel Custom Events: Check-Schritte aus dem dataLayer an Web Analytics spiegeln (Absprungpunkt im Funnel).
// Nur Event-Name plus max. zwei unkritische Eigenschaften (antwort, zweig) — keine Kontaktdaten, keine Hashes, keine IDs.
(function(){window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};var ALLOW=/^(check_gestartet|check_gestartet_unten|check_strecke|check_step_\d+|check_fertig|formular_name|formular_unternehmensname|formular_mail|formular_telefon|lead|lead_submit|whatsapp_klick|warnzeichen_drei)$/;var PROPS=['antwort','zweig'];function mirror(o){try{if(!o||typeof o.event!=='string'||!ALLOW.test(o.event))return;var n=o.event==='lead_submit'?'lead':o.event;if(n==='lead'){if(mirror.lead)return;mirror.lead=true;}var p={};PROPS.forEach(function(k){if(o[k]!=null&&o[k]!=='')p[k]=String(o[k]).slice(0,100);});window.va('event',{name:n,data:p});}catch(e){}}window.dataLayer=window.dataLayer||[];var orig=window.dataLayer.push;window.dataLayer.push=function(){for(var i=0;i<arguments.length;i++)mirror(arguments[i]);return orig.apply(window.dataLayer,arguments);};})();
