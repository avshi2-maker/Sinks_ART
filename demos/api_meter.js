// api_meter.js
// ──────────────────────────────────────────────────────────────────────────
// Marble Art Sinks — universal API cost meter.
// Version: 02052026-v1
//
// PURPOSE
//   Display a small fixed-position widget that tracks the cost of every API
//   call (ElevenLabs, Anthropic, Cloudinary). Updates after each call.
//   Persists session totals across page reloads via localStorage.
//
// HOW TO USE
//   1. Include this script in your HTML BEFORE any other code:
//        <script src="api_meter.js"></script>
//
//   2. Call MARBLE_METER.init() once on page load:
//        MARBLE_METER.init();
//
//   3. After every API call, log the usage:
//        MARBLE_METER.log({ api: 'elevenlabs', durationSeconds: 1668 });
//        MARBLE_METER.log({ api: 'anthropic', inputTokens: 5000, outputTokens: 800 });
//        MARBLE_METER.log({ api: 'cloudinary', credits: 0.5 });
//
//   The widget appears in the top-right corner showing:
//     - Last call: which API + cost
//     - Session total: cumulative cost since session started
//     - Lifetime total (localStorage): all-time cost across browser sessions
//
// PRICING (verified April 2026 — update here if rates change)
//   ElevenLabs Scribe v1:  $0.22 per hour of audio
//   Anthropic Sonnet 4.5/4.6:  $3.00 / $15.00 per million tokens (input/output)
//   Anthropic Haiku 4.5:  $1.00 / $5.00 per million tokens
//   Anthropic Opus 4.6/4.7:  $5.00 / $25.00 per million tokens
//   Cloudinary: free tier = 25 credits/month, ~1 credit per minute of video
//
// PRIVACY
//   All data stays in the browser. Nothing sent to any server.
//   localStorage keys: marble_meter_session_total, marble_meter_lifetime_total
// ──────────────────────────────────────────────────────────────────────────

(function (root) {
  'use strict';

  // ── Pricing table (USD) ───────────────────────────────────────────────
  var PRICING = {
    elevenlabs_scribe: {
      perHour: 0.22,           // dollars per hour of audio transcribed
    },
    anthropic_sonnet: {
      inputPerMillion: 3.00,
      outputPerMillion: 15.00,
    },
    anthropic_haiku: {
      inputPerMillion: 1.00,
      outputPerMillion: 5.00,
    },
    anthropic_opus: {
      inputPerMillion: 5.00,
      outputPerMillion: 25.00,
    },
    cloudinary: {
      perCredit: 0,            // free tier, no dollar cost; just track credit usage
    },
  };

  // Default Anthropic model = sonnet (most common in our use case)
  var DEFAULT_ANTHROPIC_MODEL = 'sonnet';

  // ── State ─────────────────────────────────────────────────────────────
  var state = {
    sessionTotal: 0,
    lifetimeTotal: 0,
    lastCall: null,
    cloudinaryCreditsUsed: 0,
    callCount: 0,
  };

  var widgetEl = null;

  // ── Cost calculators ──────────────────────────────────────────────────
  function calcElevenLabsCost(durationSeconds) {
    var hours = durationSeconds / 3600;
    return hours * PRICING.elevenlabs_scribe.perHour;
  }

  function calcAnthropicCost(inputTokens, outputTokens, model) {
    model = model || DEFAULT_ANTHROPIC_MODEL;
    var rates = PRICING['anthropic_' + model];
    if (!rates) {
      console.warn('Unknown Anthropic model:', model, '— using sonnet rates.');
      rates = PRICING.anthropic_sonnet;
    }
    var inputCost = (inputTokens / 1000000) * rates.inputPerMillion;
    var outputCost = (outputTokens / 1000000) * rates.outputPerMillion;
    return inputCost + outputCost;
  }

  // ── Public API ────────────────────────────────────────────────────────
  function log(opts) {
    if (!opts || !opts.api) {
      console.error('MARBLE_METER.log: missing required field "api"');
      return;
    }

    var cost = 0;
    var details = '';

    if (opts.api === 'elevenlabs') {
      var seconds = opts.durationSeconds || 0;
      cost = calcElevenLabsCost(seconds);
      details = formatDuration(seconds);
    } else if (opts.api === 'anthropic') {
      var inT = opts.inputTokens || 0;
      var outT = opts.outputTokens || 0;
      cost = calcAnthropicCost(inT, outT, opts.model);
      details = inT.toLocaleString() + ' in / ' + outT.toLocaleString() + ' out';
    } else if (opts.api === 'cloudinary') {
      var credits = opts.credits || 0;
      cost = credits * PRICING.cloudinary.perCredit;
      state.cloudinaryCreditsUsed += credits;
      details = credits.toFixed(2) + ' credits';
    } else {
      console.warn('MARBLE_METER.log: unknown api', opts.api);
      return;
    }

    state.sessionTotal += cost;
    state.lifetimeTotal += cost;
    state.callCount += 1;
    state.lastCall = {
      api: opts.api,
      cost: cost,
      details: details,
      timestamp: new Date(),
      label: opts.label || '',
    };

    persistState();
    renderWidget();
  }

  function reset() {
    if (!confirm('Reset session counters? (Lifetime total will be preserved.)')) {
      return;
    }
    state.sessionTotal = 0;
    state.lastCall = null;
    state.cloudinaryCreditsUsed = 0;
    state.callCount = 0;
    persistState();
    renderWidget();
  }

  function resetLifetime() {
    if (!confirm('Reset LIFETIME total? This deletes all historical cost data. Cannot be undone.')) {
      return;
    }
    state.lifetimeTotal = 0;
    persistState();
    renderWidget();
  }

  // ── Persistence ───────────────────────────────────────────────────────
  function persistState() {
    try {
      localStorage.setItem('marble_meter_session_total', state.sessionTotal.toString());
      localStorage.setItem('marble_meter_lifetime_total', state.lifetimeTotal.toString());
      localStorage.setItem('marble_meter_session_count', state.callCount.toString());
      localStorage.setItem('marble_meter_cloudinary_credits', state.cloudinaryCreditsUsed.toString());
    } catch (e) {
      // localStorage may be disabled (incognito mode etc.) — fail silently
    }
  }

  function loadState() {
    try {
      state.sessionTotal = parseFloat(localStorage.getItem('marble_meter_session_total')) || 0;
      state.lifetimeTotal = parseFloat(localStorage.getItem('marble_meter_lifetime_total')) || 0;
      state.callCount = parseInt(localStorage.getItem('marble_meter_session_count'), 10) || 0;
      state.cloudinaryCreditsUsed = parseFloat(localStorage.getItem('marble_meter_cloudinary_credits')) || 0;
    } catch (e) {
      // ignore
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────
  function init(options) {
    options = options || {};
    loadState();
    createWidget();
    renderWidget();
    if (options.startFresh) {
      // For testing: clear session total but not lifetime
      state.sessionTotal = 0;
      state.callCount = 0;
      state.cloudinaryCreditsUsed = 0;
      state.lastCall = null;
      persistState();
      renderWidget();
    }
  }

  function createWidget() {
    if (widgetEl) return;
    widgetEl = document.createElement('div');
    widgetEl.id = 'marble-meter-widget';
    widgetEl.style.cssText = [
      'position: fixed',
      'top: 12px',
      'right: 12px',
      'background: rgba(13, 31, 54, 0.95)',
      'color: #f4eddc',
      'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      'font-size: 11px',
      'padding: 10px 14px',
      'border-radius: 6px',
      'border: 1px solid #b8860b',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.2)',
      'z-index: 99999',
      'min-width: 220px',
      'max-width: 280px',
      'line-height: 1.5',
      'direction: ltr',
      'text-align: left',
    ].join(';');
    document.body.appendChild(widgetEl);
  }

  function renderWidget() {
    if (!widgetEl) return;
    var lastCallHtml = '';
    if (state.lastCall) {
      var apiLabel = state.lastCall.api.toUpperCase();
      var costStr = formatDollars(state.lastCall.cost);
      lastCallHtml =
        '<div style="border-top:1px solid #b8860b;margin-top:6px;padding-top:6px;">' +
          '<div style="color:#b8860b;font-weight:bold;">LAST CALL</div>' +
          '<div>' + apiLabel + ': ' + costStr + '</div>' +
          '<div style="opacity:0.7;font-size:10px;">' + escapeHtml(state.lastCall.details) + '</div>' +
          (state.lastCall.label ? '<div style="opacity:0.7;font-size:10px;">' + escapeHtml(state.lastCall.label) + '</div>' : '') +
        '</div>';
    }
    var cloudinaryHtml = '';
    if (state.cloudinaryCreditsUsed > 0) {
      cloudinaryHtml =
        '<div style="margin-top:4px;font-size:10px;opacity:0.85;">' +
          'Cloudinary: ' + state.cloudinaryCreditsUsed.toFixed(2) + ' credits this session' +
        '</div>';
    }
    widgetEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="color:#b8860b;font-weight:bold;">API METER</span>' +
        '<span style="opacity:0.6;font-size:10px;">v1</span>' +
      '</div>' +
      '<div style="margin-top:6px;">' +
        '<div>Session: <strong>' + formatDollars(state.sessionTotal) + '</strong> ' +
          '<span style="opacity:0.6;">(' + state.callCount + ' calls)</span></div>' +
        '<div>Lifetime: <strong>' + formatDollars(state.lifetimeTotal) + '</strong></div>' +
      '</div>' +
      cloudinaryHtml +
      lastCallHtml +
      '<div style="margin-top:8px;display:flex;gap:6px;">' +
        '<button onclick="MARBLE_METER.reset()" style="background:transparent;color:#f4eddc;border:1px solid #5f5e5a;border-radius:3px;padding:2px 6px;font-size:10px;cursor:pointer;font-family:inherit;">Reset session</button>' +
        '<button onclick="MARBLE_METER.toggleMinimize()" style="background:transparent;color:#f4eddc;border:1px solid #5f5e5a;border-radius:3px;padding:2px 6px;font-size:10px;cursor:pointer;font-family:inherit;">−</button>' +
      '</div>';
  }

  // ── Minimize / restore ────────────────────────────────────────────────
  var isMinimized = false;

  function toggleMinimize() {
    isMinimized = !isMinimized;
    if (isMinimized) {
      widgetEl.innerHTML =
        '<div onclick="MARBLE_METER.toggleMinimize()" style="cursor:pointer;color:#b8860b;font-weight:bold;">' +
          '$ ' + formatDollars(state.sessionTotal) + ' &nbsp;[+]' +
        '</div>';
      widgetEl.style.minWidth = 'auto';
    } else {
      renderWidget();
      widgetEl.style.minWidth = '220px';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  function formatDollars(amount) {
    if (amount < 0.01) {
      return '$' + amount.toFixed(4);
    }
    if (amount < 1) {
      return '$' + amount.toFixed(3);
    }
    return '$' + amount.toFixed(2);
  }

  function formatDuration(seconds) {
    if (seconds < 60) return seconds.toFixed(0) + 's';
    var minutes = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    if (minutes < 60) return minutes + 'm ' + s + 's';
    var hours = Math.floor(minutes / 60);
    var m = minutes % 60;
    return hours + 'h ' + m + 'm';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Export ────────────────────────────────────────────────────────────
  var api = {
    init:           init,
    log:            log,
    reset:          reset,
    resetLifetime:  resetLifetime,
    toggleMinimize: toggleMinimize,
    getState:       function () { return Object.assign({}, state); },
    PRICING:        PRICING,
    VERSION:        '02052026-v1',
  };

  if (typeof window !== 'undefined') {
    window.MARBLE_METER = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(this);
