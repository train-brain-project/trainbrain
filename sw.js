// Service worker: офлайн-режим и быстрые обновления
importScripts('js/version.js');

// Имя кэша зависит от версии: новая версия = новый кэш
var CACHE_NAME = 'trainbrain-' + APP_VERSION;

// Файлы приложения (пути относительные: сайт лежит в подпапке)
var APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/version.js',
  'js/storage.js',
  'js/app.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Установка: кладём файлы в кэш (cache:'reload' = берём свежее с сервера)
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_FILES.map(function (url) {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(function () {
      return self.skipWaiting(); // не ждём закрытия старых вкладок
    })
  );
});

// Активация: удаляем старые кэши TrainBrain
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name.indexOf('trainbrain-') === 0 && name !== CACHE_NAME) {
          return caches.delete(name);
        }
      }));
    }).then(function () {
      return self.clients.claim(); // сразу управляем открытыми страницами
    })
  );
});

// Запросы: сначала сеть, если сети нет, то кэш
self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  if (new URL(request.url).origin !== self.location.origin) {
    return; // чужие сайты не трогаем
  }

  event.respondWith(
    fetch(request, { cache: 'no-store' }).then(function (response) {
      if (response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    }).catch(function () {
      // Сети нет: ищем в кэше
      return caches.match(request, { ignoreSearch: true }).then(function (cached) {
        if (cached) {
          return cached;
        }
        if (request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return Response.error();
      });
    })
  );
});
