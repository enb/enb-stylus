enb-stylus [![Build Status](https://travis-ci.org/enb-make/enb-stylus.png?branch=master)](https://travis-ci.org/enb-make/enb-stylus) [![NPM version](https://badge.fury.io/js/enb-stylus.png)](http://badge.fury.io/js/enb-stylus)
===========

Поддержка Stylus для ENB. Пакет содержит технологии:
 * `enb-stylus/techs/css-stylus`
 * `enb-stylus/techs/css-stylus-with-nib`
 * `enb-stylus/techs/css-stylus-with-autoprefixer`

Установка:
----------

```
npm install enb-stylus
```

css-stylus
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
nodeConfig.addTech(require('enb-stylus/techs/css-stylus'));
```

css-stylus-with-nib
-------------------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
При сборке *styl*-файлов использует `nib`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *Boolean* **compress** - Минифицировать результирующий CSS. По умолчанию `false`.
* *String* **prefix** - Префикс, добавляемый классам в результирующем CSS. По умолчанию `''`.
* *Object* **variables** — Дополнительные переменные окружения для `stylus`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
  (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-stylus/techs/css-stylus-with-nib'));
```

css-stylus-with-autoprefixer
----------------------------

Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
Производит пост-обработку автопрефиксером.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию `?.css`.
* *Boolean* **compress** - Минифицировать результирующий CSS. По умолчанию `false`.
* *String* **prefix** - Префикс, добавляемый классам в результирующем CSS. По умолчанию `''`.
* *Object* **variables** — Дополнительные переменные окружения для `stylus`.
* *Array* **browsers** — Браузеры (опция автопрефиксера).
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
  (его предоставляет технология `files`). По умолчанию — `?.files`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-stylus/techs/css-stylus-with-autoprefixer'), {autoprefixerArguments: ['ie 7', 'ie 8']});
```
