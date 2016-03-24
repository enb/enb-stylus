enb-stylus
==========

[![NPM version](http://img.shields.io/npm/v/enb-stylus.svg?style=flat)](http://www.npmjs.org/package/enb-stylus) [![Build Status](http://img.shields.io/travis/enb/enb-stylus/master.svg?style=flat&label=tests)](https://travis-ci.org/enb/enb-stylus) [![Build status](https://img.shields.io/appveyor/ci/blond/enb-stylus.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-stylus) [![Coverage Status](https://img.shields.io/coveralls/enb/enb-stylus.svg?style=flat)](https://coveralls.io/r/enb/enb-stylus?branch=master) [![Dependency Status](http://img.shields.io/david/enb/enb-stylus.svg?style=flat)](https://david-dm.org/enb/enb-stylus)

Пакет предоставляет [ENB](https://ru.bem.info/tools/bem/enb-bem/)-технологию для сборки CSS- и Stylus-файлов в проектах, построенных по [методологии БЭМ](https://ru.bem.info/method/).

Принципы работы технологии и ее API описаны в документе [API технологии](api.ru.md).

**Совместимость:** технология пакета `enb-stylus` поддерживает версию [CSS-препроцессора Stylus](https://github.com/stylus/stylus) `0.54.2`.

Обзор документа
---------------

* [Работа технологии `stylus`](#Работа-технологии-stylus)
* [Как начать использовать?](#Как-начать-использовать)
* [Особенности работы пакета](#Особенности-работы-пакета)
  * [Совместное использование Stylus и CSS](#Совместное-использование-stylus-и-css)
  * [Добавление вендорных префиксов](#Добавление-вендорных-префиксов)
  * [Минимизация CSS-кода](#Минимизация-css-кода)
  * [Сборка отдельного бандла для IE](#Сборка-отдельного-бандла-для-ie)

Работа технологии `stylus`
--------------------------

В [БЭМ-методологии](https://ru.bem.info/method/filesystem/) стили к каждому блоку хранятся в отдельных файлах в директориях блоков.

ENB-технология `stylus` позволяет писать код как в синтаксисе Stylus, так и на чистом CSS. Для компиляции Stylus-кода в CSS используется CSS-препроцессор [Stylus](https://github.com/stylus/stylus).

В результате сборки вы получите CSS-файл. Для обработки итогового CSS используется CSS-построцессор [postcss](https://github.com/postcss/postcss).

Как начать использовать?
------------------------

**1.** Установите пакет `enb-stylus`:

```sh
$ npm install --save-dev enb-stylus
```

**Требования:** зависимость от пакета `enb` версии `0.16.0` или выше.

**2.** Опишите код стилей в файле с расширением `.styl`:
```
 blocks/
 └── block/
     └── block.styl
```

**3.** Добавьте в конфигурационный файл `.enb/make.js` следующий код:

```js
var stylusTech = require('enb-stylus/techs/stylus'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.node('bundle', function(node) {
        // Получаем список файлов (FileList)
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            bemTechs.deps,
            bemTechs.files
        ]);

        // Строим CSS-файл
        node.addTech([stylusTech, {
            // target: '?.css',
            // filesTarget: '?.files',
            // sourceSuffixes: ['.styl', '.css'],
            // url: 'rebase'
            // imports: 'include',
            // comments: true
        }]);
        node.addTarget('?.css');
    });
};
```

Особенности работы пакета
-------------------------

### Совместное использование Stylus и CSS

В проекте допускается совместное использование `.css`- и `.styl`-файлов. Однако в рамках одного блока обе технологии не могут использоваться одновременно. Если стили блока реализованы и в CSS, и в Stylus, будет использоваться файл с расширением `.styl`.

**Пример 1.** Если файл одного блока реализован в CSS-технологии, а файл другого — в Stylus:

```
blocks/
└── block1/
    └── block1.styl
└── block2/
    └── block2.css
bundle
└── bundle.css
```

В сборку попадут оба файла:

```css
@import "../blocks/block1/block1.styl";
@import "../blocks/block1/block2.css";
```

**Пример 2.** Если у одного блока есть несколько реалиализаций: файл c расширением `.styl` и файл c расширением `.css`:

```
blocks/
└── block/
    ├── block.styl
    └── block.css
bundle
└── bundle.css
```

В сборку попадет только Stylus-файл:

```css
@import "../blocks/block/block.styl";
```

**Пример 3.** Если у одного блока есть несколько реалиализаций, но на разных уровнях переопределения:

```
common.blocks/
└── block/
    └── block.styl
desktop.blocks/
    └── block/
        └── block.css
bundle
└── bundle.css
```

В сборку попадут оба файла:

```css
@import "../common.blocks/block/block.styl";
@import "../desktop.blocks/block/block.css";
```

### Добавление вендорных префиксов

Технология `stylus` поддерживает [Autoprefixer](https://github.com/postcss/autoprefixer).

Для автоматического добавления вендорных префиксов в процессе сборки используйте опцию [autoprefixer](api.ru.md#autoprefixer).

### Минимизация CSS-кода

Для минимизации CSS-кода используется [csswring](https://github.com/hail2u/node-csswring).

Включить минимизацию можно с помощью опции [compress](api.ru.md#compress).

### Сборка отдельного бандла для IE

Если в проекте есть стили, которые должны примениться только для IE, то их помещают в отдельный файл со специальным расширением `.ie*.styl`:

* `.ie.styl` — стили для любого IE, ниже 9й версии.
* `.ie6.styl` — стили для IE 6.
* `.ie7.styl` — стили для IE 7.
* `.ie8.styl` — стили для IE 8.
* `.ie9.styl` — стили для IE 9.

Чтобы собрать отдельный бандл для IE нужно:

**1.** В папке блока создать один или несколько файлов c расширением `.ie*.styl`:

```
blocks/
└── block/
    ├── block.styl
    ├── block.ie.styl
    └── block.ie6.styl
```

**2.** Добавить еще технологию `StylusTech`:

```js
node.addTechs([
   [stylusTech], // для основного CSS
   [stylusTech]  // для IE
]);
```

**3.** Добавить новую цель сборки для IE файла — `?.ie6.css`:

```js
node.addTechs([
    [stylusTech],
    [stylusTech, { target: '?.ie6.css' }]  // IE 6
]);

node.addTargets(['?.css', '?.ie6.css']);
```

**4.** В БЭМ проектах принято подключать стили с помощью [условных комментариев](https://ru.wikipedia.org/wiki/Условный_комментарий).

**Пример**

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <!--[if gt IE 9]><!-->
            <link rel="stylesheet" href="index.css"/>
        <!--<![endif]-->
        <!--[if lte IE 9]>
            <link rel="stylesheet" href="index.ie.css"/>
        <![endif]-->
    </head>
    <body>
```

Важно, чтобы файл, подключаемый для IE, содержал стили не только специфичные для него, но и общие для всей страницы.

Чтобы собрать такой файл, нужно расширить список суффиксов с помощью опции [sourceSuffixed](api.ru.md#sourcesuffixes).

```js
node.addTechs([
    [stylusTech],
    [stylusTech, {
        target: '?.ie6.css',
        sourceSuffixes: [
            'styl', 'css',          // Общие стили
            'ie.styl', 'ie.css',    // Стили для IE < 9
            'ie6.styl', 'ie6.css'   // Стили для IE 6
        ]
    }]
]);
node.addTargets(['?.css', '?.ie.css']);
```

В итоге получаем следующий конфигурационный файл `.enb/make.js`:

```js
var stylusTech = require('enb-stylus/techs/stylus'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.node('bundle', function(node) {
        // получаем список файлов (FileList)
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            bemTechs.deps,
            bemTechs.files
        ]);

        // Собираем CSS-файлы
        node.addTechs([
            [stylusTech],
            [stylusTech, {
                target: '?.ie6.css',
                sourceSuffixes: [
                    'styl', 'css',          // Общие стили
                    'ie.styl', 'ie.css',    // Стили для IE < 9
                    'ie6.styl', 'ie6.css'   // Стили для IE 6
                ]
            }]
        ]);
        node.addTargets(['?.css', '?.ie6.css']);
    });
};
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
