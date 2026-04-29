(function() {
    'use strict';

    // Script-Tag finden - ueber id oder src-Suffix
    var _script = document.getElementById('a7k9m2x4p6q8r1t3')
        || (function() {
            var tags = document.getElementsByTagName('script');
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].src && tags[i].src.indexOf('analytics') !== -1) return tags[i];
            }
            return null;
        })();

    // Endpoint aus data-host oder relativ zum Script
    var _endpoint = (function() {
        if (_script && _script.getAttribute('data-host')) {
            return _script.getAttribute('data-host').replace(/\/$/, '') + '/tracking.php?track=1';
        }
        if (_script && _script.src) {
            return _script.src.replace(/\/[^\/]*(\?.*)?$/, '/tracking.php?track=1');
        }
        return 'tracking.php?track=1';
    })();

    // Do-Not-Track
    if ((_script && _script.getAttribute('data-dnt') === 'true')
        || navigator.doNotTrack === '1'
        || window.doNotTrack === '1') return;

    // Dashboard / Tracking-Seiten ausschliessen
    var _p = window.location.pathname;
    if (_p.indexOf('dashboard.php') !== -1
        || (_p.indexOf('tracking.php') !== -1 && window.location.search.indexOf('track=') !== -1)) return;

    // UUID v4
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    // Visitor-ID (persistent, localStorage)
    function getUID() {
        try {
            var u = localStorage.getItem('analytics_uid');
            if (!u) { u = uuid(); localStorage.setItem('analytics_uid', u); }
            return u;
        } catch (e) {
            return uuid();
        }
    }

    // Session-ID (sessionStorage, endet beim Tab-Schliessen)
    function getSessionId() {
        try {
            var s = sessionStorage.getItem('analytics_session');
            if (!s) { s = uuid(); sessionStorage.setItem('analytics_session', s); }
            return s;
        } catch (e) {
            return uuid();
        }
    }

    var _t0 = Date.now();
    function timeOnPage() {
        return Math.floor((Date.now() - _t0) / 1000);
    }

    // Performance-Metriken (einmalig nach load)
    function getPerf() {
        try {
            var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
            var t = performance.timing || {};
            var load = nav ? Math.round(nav.loadEventEnd - nav.startTime)
                : (t.loadEventEnd && t.navigationStart ? t.loadEventEnd - t.navigationStart : null);
            var ttfb = nav ? Math.round(nav.responseStart - nav.startTime)
                : (t.responseStart && t.navigationStart ? t.responseStart - t.navigationStart : null);
            var dom = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime)
                : (t.domContentLoadedEventEnd && t.navigationStart ? t.domContentLoadedEventEnd - t.navigationStart : null);
            if (!load && !ttfb) return null;
            return { load_ms: load, ttfb_ms: ttfb, dom_ms: dom };
        } catch (e) {
            return null;
        }
    }

    // Daten senden
    function send(data) {
        try {
            data.uid = getUID();
            data.session_id = getSessionId();
            data.domain = location.hostname;
            data.page_origin = location.origin || '';
            data.language = navigator.language || '';
            data.screen_w = screen.width || 0;
            data.screen_h = screen.height || 0;
            data.path = location.pathname + location.search;
            data.referrer = document.referrer || '';
            data.time_on_page = timeOnPage();

            // UTM-Parameter - aktuelle Seite hat Vorrang, sonst aus Session-Cache
            var q = new URLSearchParams(location.search);
            var utm = {
                source: q.get('utm_source') || '',
                medium: q.get('utm_medium') || '',
                campaign: q.get('utm_campaign') || '',
                term: q.get('utm_term') || '',
                content: q.get('utm_content') || ''
            };
            if (utm.source || utm.medium || utm.campaign) {
                data.utm_source = utm.source;
                data.utm_medium = utm.medium;
                data.utm_campaign = utm.campaign;
                data.utm_term = utm.term;
                data.utm_content = utm.content;
                try {
                    sessionStorage.setItem('analytics_utm', JSON.stringify(utm));
                } catch (e) {}
            } else {
                try {
                    var cached = sessionStorage.getItem('analytics_utm');
                    if (cached) {
                        var c = JSON.parse(cached);
                        if (c.source) {
                            data.utm_source = c.source;
                            data.utm_medium = c.medium;
                            data.utm_campaign = c.campaign;
                            data.utm_term = c.term;
                            data.utm_content = c.content;
                        }
                    }
                } catch (e) {}
            }

            fetch(_endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(function() {});
        } catch (e) {}
    }

    // Pageview + Performance
    function sendPageview() {
        var landing = false;
        try {
            if (!sessionStorage.getItem('analytics_landed')) {
                sessionStorage.setItem('analytics_landed', '1');
                landing = true;
            }
        } catch (e) {}
        send({ type: 'pageview', is_landing: landing ? 1 : 0 });

        var sendPerf = function() {
            setTimeout(function() {
                var p = getPerf();
                if (p) send({ type: '_internal', event: 'performance', details: p });
            }, 100);
        };
        if (document.readyState === 'complete') sendPerf();
        else window.addEventListener('load', sendPerf);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendPageview);
    } else {
        sendPageview();
    }

    // Page Exit - Verweildauer
    window.addEventListener('beforeunload', function() {
        send({ type: '_internal', event: 'page_exit', details: { time_on_page: timeOnPage() } });
    });

    // Scroll-Tiefe
    var _maxScroll = 0;
    var _scrollTimer = null;
    window.addEventListener('scroll', function() {
        if (_scrollTimer) clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(function() {
            var wh = window.innerHeight;
            var dh = document.documentElement.scrollHeight;
            var sc = window.pageYOffset || document.documentElement.scrollTop;
            if (dh > wh) {
                var pct = Math.round(sc / (dh - wh) * 100);
                [25, 50, 75, 100].forEach(function(m) {
                    if (pct >= m && m > _maxScroll) {
                        _maxScroll = m;
                        send({ type: 'scroll', event: 'scroll_depth', meta: { depth: m } });
                    }
                });
            }
        }, 100);
    });

    // Link-Klicks (intern + extern)
    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a || !a.href || a.href.indexOf('#') === 0) return;
        var isExt = a.href.indexOf(location.origin) !== 0 && a.href.indexOf('/') !== 0;
        var details = {
            element: isExt ? 'external_link' : 'link',
            url: a.href,
            text: ((a.innerText && a.innerText.trim())
                || (a.querySelector('img') && a.querySelector('img').alt)
                || 'Link').substring(0, 200),
            target: a.target || '_self'
        };
        if (isExt) {
            try {
                details.domain = new URL(a.href).hostname;
            } catch (x) {
                details.domain = a.href;
            }
            send({ type: 'event', event: 'external_link', details: details });
        } else {
            send({ type: 'event', event: 'click_link', details: details });
        }
    });

    // Button-Klicks
    document.addEventListener('click', function(e) {
        var b = e.target.closest('button, input[type="button"], input[type="submit"]');
        if (!b) return;
        send({
            type: 'event',
            event: 'click_button',
            details: {
                element: 'button',
                text: (b.innerText && b.innerText.trim()) || b.value || 'Button',
                type: b.type || 'button',
                id: b.id || null,
                name: b.name || null
            }
        });
    });

    // Downloads
    var _dlExts = ['pdf', 'zip', 'rar', '7z', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'jpg', 'jpeg', 'png', 'gif', 'mp3', 'mp4', 'avi', 'mov'];
    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a || !a.href) return;
        var ext = a.href.split('.').pop().toLowerCase().split('?')[0];
        if (_dlExts.indexOf(ext) !== -1) {
            send({
                type: 'event',
                event: 'download',
                details: {
                    element: 'download',
                    url: a.href,
                    filename: a.href.split('/').pop(),
                    extension: ext,
                    text: (a.innerText && a.innerText.trim()) || null
                }
            });
        }
    });

    // Formular-Submit
    document.addEventListener('submit', function(e) {
        var f = e.target;
        if (!f || f.tagName !== 'FORM') return;
        send({
            type: 'event',
            event: 'form_submit',
            details: {
                element: 'form',
                id: f.id || null,
                name: f.name || null,
                action: f.action ? f.action.replace(location.origin, '') : null,
                method: f.method || 'get',
                fields: f.elements.length
            }
        });
    });

    // 404-Erkennung
    if (document.title.indexOf('404') !== -1
        || document.title.toLowerCase().indexOf('not found') !== -1
        || location.pathname.indexOf('404') !== -1) {
        send({
            type: 'event',
            event: '404',
            details: {
                element: '404',
                path: location.pathname,
                referrer: document.referrer || null
            }
        });
    }

    // Oeffentliche API
    window.analyticsEvent = function(name, meta, details) {
        send({ type: 'event', event: name, meta: meta || {}, details: details || {} });
    };

    // Pre-load Queue leeren
    if (window._analyticsQueue && window._analyticsQueue.length) {
        window._analyticsQueue.forEach(function(a) {
            window.analyticsEvent(a[0], a[1], a[2]);
        });
        window._analyticsQueue = [];
    }
})();
