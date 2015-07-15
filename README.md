enb-stylus
==========

[![NPM version](http://img.shields.io/npm/v/enb-stylus.svg?style=flat)](http://www.npmjs.org/package/enb-stylus) [![Build Status](http://img.shields.io/travis/enb-make/enb-stylus/master.svg?style=flat&label=tests)](https://travis-ci.org/enb-make/enb-stylus) [![Build status](https://img.shields.io/appveyor/ci/blond/enb-stylus.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-stylus) [![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-stylus.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-stylus?branch=master) [![Dependency Status](http://img.shields.io/david/enb-make/enb-stylus.svg?style=flat)](https://david-dm.org/enb-make/enb-stylus)

Поддержка Stylus для ENB. Пакет содержит технологии:
 * `enb-stylus/techs/stylus`

Установка:
----------

```
npm install enb-stylus
```

stylus
----------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *Boolean* **compress** - Минифицировать результирующий CSS. По умолчанию `false`.
* *String* **prefix** - Префикс, добавляемый классам в результирующем CSS. По умолчанию `''`.
* *Object* **variables** — Дополнительные переменные окружения для `stylus`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
  (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-stylus/techs/stylus'));
```
