# API технологии `stylus`

Собирает исходные файлы блоков со стилями, написанными в синтаксисе Stylus (файлы с расширением `.styl`), или на чистом CSS (файлы с расширением `.css`).

Использует CSS-препроцессор [Stylus](https://github.com/stylus/stylus) для компиляции Stylus-файлов в CSS-код.

Результатом сборки является CSS-файл. Для обработки итогового CSS используется CSS-построцессор [postcss](https://github.com/postcss/postcss).

### Опции

* [target](#target)
* [filesTarget](#filestarget)
* [sourceSuffixes](#sourcesuffixes)
* [url](#url)
* [imports](#imports)
* [sourcemap](#sourcemap)
* [autoprefixer](#autoprefixer)
* [prefix](#prefix)
* [compress](#compress)
* [comments](#comments)
* [globals](#globals)
* [includes](#includes)
* [use](#use)
* [useNib](#usenib)
* [importPaths](#importPaths)

#### target

Тип: `String`. По умолчанию: `?.css`.

Имя файла, куда будет записан результат сборки необходимых `.styl`- и `.css`-файлов проекта.

#### filesTarget

Тип: `String`. По умолчанию: `?.files`.

Имя таргета, откуда будет доступен список исходных файлов для сборки. Список файлов предоставляет технология [files](https://github.com/enb-bem/enb-bem-techs/blob/master/docs/api.ru.md#files) пакета [enb-bem-techs](https://github.com/enb-bem/enb-bem-techs/blob/master/README.md).

#### sourceSuffixes

Тип: `String | String[]`. По умолчанию: `['styl', 'css']`.

Суффиксы, по которым отбираются файлы с стилей для дальнейшей сборки.

#### url

Тип: `String`. По умолчанию: `rebase`.

Oбработка `url()` внутри файлов `.styl` и `.css`.

*Допустимые значения:*

- **inline:** содержимое файла будет закодировано в `base64`.

    **Важно:**

    - Размер не должен превышать `14kb`.
    - Не поддерживается кодирование `.svg`-файлов с хешем. Например: `url(image.svg#hash)`. Такие `url()` не будут обработаны.

    --------------------------------------

- **rebase:** изменение пути к содержимому относительно таргета.

  Пример:

  ```
  blocks/
  └── block/
      ├── block.styl
      └── block.png
  bundle/
  └── bundle.css # таргет
  ```

  Исходный файл `block.styl`:

  ```css
  .block
      background-image: url(block.png)
  ```

  Файл для подключения на страницу `bundle.css`:

  ```css
  .block
  {
    background-image: url(../../blocks/block/block.png);
  }
  ```

#### imports

Тип: `String`. По умолчанию: `include`.

Раскрытие CSS `@import`-ов.

*Допустимые значения:*

- **include:** `@import` будет удален, вместо него в собираемый файл будет добавлено его содержимое.

#### sourcemap

Тип: `String | Boolean`. По умолчанию: `false`.

Построение карт кода (sourcemap) с информацией об исходных файлах.

*Допустимые значения:*

- **true:** карта хранится в отдельном файле с расширение `.map`.  
- **inline:** карта встраивается в скомпилированный файл в виде закодированной строки в формате `base64`.  

#### autoprefixer

Тип: `Object | Boolean`. По умолчанию: `false`.

Добавление вендорных префиксов с помощью [autoprefixer](https://github.com/postcss/autoprefixer).

*Допустимые значения:*

- **false:** отключает `autoprefixer`.
- **true:** префиксы добавляются для самых актуальных версий браузеров на основании данных сервиса [caniuse.com](http://caniuse.com).
- **options:** задание конфигурации в случае, если требуется передать точный список поддерживаемых браузеров.

  **Пример**

  ```js
  {
      autoprefixer: { browsers: ['Explorer 10', 'Opera 12'] }
  }
  ```

  Подробнее в документации [autoprefixer](https://github.com/postcss/autoprefixer#options).

#### prefix

Тип: `String`. По умолчанию: `''`.

Добавление префикса для CSS-классов.

**Важно!** Опция работает только для файлов с расширением `.styl`.

#### compress

Тип: `Boolean`. По умолчанию: `false`.

Минификация CSS-кода. Поддерживает карты кода (sourcemap).

#### comments

Тип: `Boolean`. По умолчанию: `true`.

Обрамление комментариями CSS-кода в собранном файле. Комментарии cодержат относительный путь до исходного файла. Может быть использовано при разработке проекта.

**Пример**

```css
/* ../../blocks/block/block.styl:begin */
.block
{
    background-image: url(../../blocks/block/block.png);
}
/* ../../blocks/block/block.styl:end */
```

#### globals

Тип: `String | String[]`. По умолчанию: `[]`.

Подключает `.styl`-файлы с глобальными переменными, методами или миксинами в начало.

#### includes

Тип: `String | String[]`. По умолчанию: `[]`.

Задает пути, которые будут использованы при обработке `@import` и `url()`.
Может быть использовано при подключении сторонних библиотек, например, `nib`.

**Важно!** Опция работает только для файлов с расширением `.styl`.

### use

Тип: `Function | Function[]`. По умолчанию: `[]`.

Подключение плагинов или одного плагина для Stylus [через use()](https://github.com/stylus/stylus/blob/dev/docs/js.md#usefn)

**Важно!** Опция работает только для файлов с расширением `.styl`.

### useNib

Тип: `Boolean`. По умолчанию: `false`.

Подключение библиотеки CSS3-миксинов для Stylus – [nib](https://github.com/tj/nib).

**Важно!** Опция работает только для файлов с расширением `.styl`.

### importPaths

Тип: `String[]`. По умолчанию: `[]`.

Подключение `.styl` файлов или директорий c `index.styl` [через import()](https://github.com/stylus/stylus/blob/dev/docs/js.md#importpath)

**Важно!** Опция работает только для файлов с расширением `.styl`.

--------------------------------------

## Пример использования технологии

```js
var stylusTech = require('enb-stylus/techs/stylus'),
    FileProvideTech = require('enb/techs/file-provider'),
    nib = require('nib'),
    rupture = require('rupture'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.node('bundle', function(node) {
        // Получаем имена файлов (FileList)
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            bemTechs.deps,
            bemTechs.files
        ]);

        // Создаем CSS-файлы
        node.addTech([stylusTech, {
            use: [nib(), rupture()],
            importPaths: [nib.path + '/nib']
        }]);
        node.addTarget('?.css');
    });
};
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
