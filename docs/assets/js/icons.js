/* PNG Sequence Preview — minimal inline SVG icons */
var Icons = (function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';

    var PATHS = {
        'chevron-right': '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M6 4l4 4-4 4"/>',
        'chevron-left': '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M10 4L6 8l4 4"/>',
        'play': '<path fill="currentColor" d="M6 4.5v7l6-3.5z"/>',
        'pause': '<path fill="currentColor" d="M5 4h2.5v8H5zm3.5 0H11v8H8.5z"/>',
        'folder-plus': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" d="M2 4.5V12a1 1 0 001 1h10a1 1 0 001-1V6.5a1 1 0 00-1-1H7.5L6 4H3a1 1 0 00-1 .5z"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M8 8v3M6.5 9.5h3"/>',
        'trash': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M3 5h10M5.5 5V4a1 1 0 011-1h3a1 1 0 011 1v1M6 5v7.5M10 5v7.5M4 5l.5 8a1 1 0 001 1h5a1 1 0 001-1L12 5"/>',
        'palette': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M8 14a6 6 0 100-12 6 6 0 000 12z"/><circle cx="5.5" cy="7" r=".75" fill="currentColor"/><circle cx="8" cy="5" r=".75" fill="currentColor"/><circle cx="10.5" cy="7" r=".75" fill="currentColor"/>',
        'search': '<circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.3"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M10 10l3 3"/>',
        'loop': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M11 3.5A5 5 0 104 8.5M4 5.5V3h2.5"/>',
        'download': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M8 3v7M5.5 7.5L8 10l2.5-2.5M3 13h10"/>',
        'close': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M4 4l8 8M12 4l-8 8"/>',
        'expand': '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M2 4.5h5M2 8h5M2 11.5h5"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M9.5 4.5L12 7l2.5-2.5M9.5 9L12 11.5l2.5-2.5"/>',
        'collapse': '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M2 4.5h5M2 8h5M2 11.5h5"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M9.5 11.5L12 9l2.5 2.5M9.5 7L12 4.5l2.5 2.5"/>',
        'root': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" d="M2 4.5V12a1 1 0 001 1h10a1 1 0 001-1V6.5a1 1 0 00-1-1H7.5L6 4H3a1 1 0 00-1 .5z"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M2 7h12"/>',
        'folder': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" d="M2 4.5V12a1 1 0 001 1h10a1 1 0 001-1V6.5a1 1 0 00-1-1H7.5L6 4H3a1 1 0 00-1 .5z"/>',
        'sequence': '<rect x="2" y="3" width="12" height="2.5" rx=".5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="6.75" width="12" height="2.5" rx=".5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="10.5" width="12" height="2.5" rx=".5" fill="none" stroke="currentColor" stroke-width="1.2"/>',
        'gif': '<rect x="2" y="3.5" width="12" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path fill="none" stroke="currentColor" stroke-width="1" d="M2 6.5h12"/><circle cx="5.5" cy="9.5" r=".75" fill="currentColor"/><circle cx="10.5" cy="9.5" r=".75" fill="currentColor"/>',
        'export': '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M3 10v3h10v-3M8 3v7M5.5 7.5L8 10l2.5-2.5"/>'
    };

    function create(name, extraClass) {
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('class', 'ico-svg' + (extraClass ? ' ' + extraClass : ''));
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = PATHS[name] || '';
        return svg;
    }

    function into(el, name, extraClass) {
        while (el.firstChild) el.removeChild(el.firstChild);
        el.appendChild(create(name, extraClass));
        return el;
    }

    function setIcon(el, name) {
        var svg = el.querySelector ? el.querySelector('.ico-svg') : null;
        if (svg) svg.innerHTML = PATHS[name] || '';
        else into(el, name);
    }

    function setPlayButton(btn, playing) {
        if (!btn) return;
        var iconName = playing ? 'pause' : 'play';
        var svg = btn.querySelector('.ico-svg');
        if (!svg) {
            svg = create(iconName);
            var label = btn.querySelector('.btn-label');
            btn.insertBefore(svg, label || btn.firstChild);
        } else {
            svg.innerHTML = PATHS[iconName] || '';
        }
        var label = btn.querySelector('.btn-label');
        if (label && typeof I18n !== 'undefined') {
            label.textContent = I18n.t(playing ? 'pause' : 'play');
        }
    }

    return { create: create, into: into, setIcon: setIcon, setPlayButton: setPlayButton };
})();
