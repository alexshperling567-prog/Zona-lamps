/*
 * Zona for Lampa — v0.2
 * Пункт «Zona» в меню Lampa: открывает сайт во встроенном окне (iframe)
 * с управлением пультом, кнопкой «Назад», сменой адреса и запасным
 * открытием во внешнем браузере.
 *
 * Установка: выложить файл по HTTPS и добавить URL в
 * Lampa → Настройки → Расширения.
 *
 * Ограничение: если сайт запрещает встраивание (X-Frame-Options / CSP),
 * окно будет пустым — тогда используйте кнопку «В браузере».
 */
(function () {
    'use strict';

    var PLUGIN_ID = 'zona_lampa_v02';
    var STORAGE_KEY = 'zona_site_url';
    var DEFAULT_URL = 'https://w140.zona.plus/movies';

    if (window[PLUGIN_ID]) return;
    window[PLUGIN_ID] = true;

    function getUrl() {
        var v = '';
        try { v = Lampa.Storage.get(STORAGE_KEY, DEFAULT_URL); } catch (e) {}
        return v || DEFAULT_URL;
    }

    function setUrl(v) {
        try { Lampa.Storage.set(STORAGE_KEY, v); } catch (e) {}
    }

    function openExternal(url) {
        try {
            if (Lampa.Utils && Lampa.Utils.openLink) return Lampa.Utils.openLink(url);
        } catch (e) {}
        window.open(url, '_blank');
    }

    function normalizeUrl(v) {
        v = (v || '').trim();
        if (!v) return DEFAULT_URL;
        if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
        return v;
    }

    function ZonaScreen(object) {
        var root = $('<div class="zona-screen"></div>');
        var bar = $('<div class="zona-bar"></div>');
        var frame;
        var self = this;

        function button(text, handler) {
            var b = $('<div class="zona-btn selector"></div>').text(text);
            b.css({
                display: 'inline-block',
                padding: '0.6em 1.2em',
                margin: '0 0.6em 0.6em 0',
                'border-radius': '0.4em',
                background: 'rgba(255,255,255,.1)',
                'font-size': '1.1em'
            });
            b.on('hover:focus', function () { b.css('background', 'rgba(255,255,255,.3)'); });
            b.on('hover:hover hover:touch', function () { b.css('background', 'rgba(255,255,255,.3)'); });
            b.on('hover:enter', handler);
            b.on('mouseleave', function () { b.css('background', 'rgba(255,255,255,.1)'); });
            return b;
        }

        function load() {
            frame.attr('src', getUrl());
        }

        this.create = function () {
            root.css({ width: '100%', height: '100%', background: '#101116', color: '#fff' });
            bar.css({ padding: '1em 1.5em 0.4em' });

            bar.append(
                button('Обновить', load),
                button('В браузере', function () { openExternal(getUrl()); }),
                button('Адрес', function () {
                    Lampa.Input.edit({
                        title: 'Адрес сайта',
                        value: getUrl(),
                        free: true,
                        nosave: true
                    }, function (val) {
                        setUrl(normalizeUrl(val));
                        load();
                        self.toggle();
                    });
                })
            );

            frame = $('<iframe title="Zona"></iframe>');
            frame.attr('allow', 'autoplay; fullscreen; picture-in-picture');
            frame.attr('allowfullscreen', 'allowfullscreen');
            frame.css({
                display: 'block',
                width: '100%',
                height: 'calc(100vh - 9em)',
                border: '0',
                background: '#101116'
            });

            root.append(bar, frame);
            load();

            if (object && object.activity && object.activity.loader) object.activity.loader(false);
            return root;
        };

        this.render = function () { return root; };

        this.toggle = function () {
            Lampa.Controller.add('zona_screen', {
                toggle: function () {
                    Lampa.Controller.collectionSet(bar);
                    Lampa.Controller.collectionFocus(bar.find('.selector').eq(0)[0], bar);
                },
                left: function () {
                    if (window.Navigator && Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    if (window.Navigator && Navigator.canmove('right')) Navigator.move('right');
                },
                up: function () { Lampa.Controller.toggle('head'); },
                down: function () {},
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('zona_screen');
        };

        this.start = function () { this.toggle(); };
        this.pause = function () {};
        this.stop = function () {};

        this.destroy = function () {
            if (frame) {
                frame.attr('src', 'about:blank');
                frame.remove();
            }
            root.remove();
        };
    }

    function addMenu() {
        if ($('.zona-menu-item').length) return;

        var item = $(
            '<li class="menu__item selector zona-menu-item">' +
                '<div class="menu__ico">' +
                    '<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">' +
                        '<rect x="6" y="6" width="32" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="3"></rect>' +
                        '<path d="m19 15 10 7-10 7z" fill="currentColor"></path>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu__text">Zona</div>' +
            '</li>'
        );

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Zona',
                component: 'zona_screen',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
    }

    function init() {
        if (!window.Lampa) return;
        Lampa.Component.add('zona_screen', ZonaScreen);
        addMenu();
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
