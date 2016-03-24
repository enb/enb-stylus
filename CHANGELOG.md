История изменений
=================

2.3.2
-----

### Исправления ошибок

* Исправлена опция [autoprefixer](./api.ru.md#autoprefixer) ([#125]).

2.3.1
-----

К сожалению, в `postcss-import` версии 8 было отрезано всё, что не вписывается в идеальную модель авторов модуля.

С учетом того, что при сборке `@import` попадают в центр файла, которые в версии 8 не раскрываются ([postcss/postcss-import#176](https://github.com/postcss/postcss-import/issues/176)) и использовать его
как есть далее не представляется возможным.

### Зависимости

* Обновление модуля `postcss-import@8.0.2` отменено, используется версия `7.1.3`.

2.3.0
-----

### Опции

* Добавлена опция [use](./api.ru.md#use) ([#111]).
* Добавлена опция [importPaths](./api.ru.md#importpaths) ([#111]).

### Зависимости

* Модуль `autoprefixer@6.0.3` обновлен до версии `6.3.4`.
* Модуль `csswring@4.0.0` обновлен до версии `4.2.2`.
* Модуль `es6-promise@3.0.2` обновлен до версии `3.1.2`.
* Модуль `postcss@5.0.10` обновлен до версии `5.0.19`.
* Модуль `postcss-import@7.1.0` обновлен до версии `8.0.2`.
* Модуль `postcss-url@5.0.2` обновлен до версии `5.1.1`.
* Модуль `stylus@0.52.0` обновлен до версии `0.54.2`.
* Модуль `vow@0.4.10` обновлен до версии `0.4.12`.

### Остальное

* Уменьшено время подключения технологий ([#120]).

2.2.0
-----

### Опции

* Добавлена опция [globals](api.ru.md#globals) ([#113]).

### Зависимости

* Модуль `postcss@4.1.16` обновлен до версии `5.0.10` ([#116]).
* Модуль `postcss-import@6.2.0` обновлен до версии `7.1.0` ([#116]).
* Модуль `postcss-url@4.0.1` обновлен до версии `5.0.2` ([#116]).
* Модуль `csswring@3.0.5` обновлен до версии `4.0.0` ([#116]).
* Вместо модуля `autoprefixer-core@5.2.1` используется `autoprefixer@6.0.3` ([#116]).

2.1.0
-----

* Добавлена поддержка `enb` версии `1.x` ([#109]).

2.0.0
-----

### Технологии

* [ __*major*__ ] Технологии `css-stylus`, `css-stylus-with-nib` и `css-stylus-with-autoprefixer` объединены в одну — [stylus](api.ru.md) ([#67], [#68]).

### Крупные изменения

* Добавлена поддержка карт кода (source maps) ([#60]).
* [ __*major*__ ] Для пост-обработки вместо [css-preprocessor](https://github.com/enb/enb/blob/v0.17.0/lib/preprocess/css-preprocessor.js) используется [postcss](https://github.com/postcss/postcss) ([#33]).
* [ __*major*__ ] Для минификации кода вместо модуля [stylus](https://github.com/stylus/stylus/blob/master/docs/executable.md) используется модуль [csswring](https://github.com/hail2u/node-csswring) ([#71]).
* [ __*major*__ ] Для добавления вендорных префиксов вместо [autoprefixer](https://github.com/postcss/autoprefixer) используется [autoprefixer-core](https://github.com/postcss/autoprefixer-core) ([#24]).
* [ __*major*__ ] Исправлена обработка CSS-файлов: если БЭМ-сущность на одном уровне переопределения реализована и в файле с расширением `.styl`, и в файле с расширением `.css`, то в сборку попадет только `.styl`-файл ([#73]).

### Опции

* [ __*major*__ ] Из технологии `stylus` удалена опция `variables` ([#36]).

В технологию `stylus` добавлены следующие опции:

* [sourcemap](api.ru.md#sourcemap) ([#60])
* [autoprefixer](api.ru.md#autoprefixer) ([#64])
* [compress](api.ru.md#compress) ([#71])
* [url](api.ru.md#url) ([#58])
* [imports](api.ru.md#imports) ([#57])
* [comments](api.ru.md#comments) ([#55])
* [useNib](api.ru.md#usenib) ([#65])
* [includes](api.ru.md#includes) ([#54])

### Зависимости

* [ __*major*__ ] Изменились требования к версии модуля `enb`. Теперь для корректной работы требуется `enb` версии `0.16.0` или выше.
* Модуль `stylus@0.50.0` обновлен до версии `0.52.0` ([#90]).
* Модуль `vow@0.4.8` обновлен до версии `0.4.10`.

### Engines

* Добавлена поддержка `io.js` ([#34]).
* Добавлена поддержка `node.js` версии `0.12` ([#35]).

### Тестирование

* Добавлены тесты для технологии `stylus` ([#36]).
* Добавлено тестирование под Windows в Continues Integration при помощи [AppVeyor](http://www.appveyor.com) ([#37]).

[#24]: https://github.com/enb/enb-stylus/issues/24
[#26]: https://github.com/enb/enb-stylus/issues/26
[#33]: https://github.com/enb/enb-stylus/issues/33
[#34]: https://github.com/enb/enb-stylus/issues/34
[#35]: https://github.com/enb/enb-stylus/issues/35
[#36]: https://github.com/enb/enb-stylus/issues/36
[#37]: https://github.com/enb/enb-stylus/issues/37
[#48]: https://github.com/enb/enb-stylus/issues/48
[#54]: https://github.com/enb/enb-stylus/issues/54
[#55]: https://github.com/enb/enb-stylus/issues/55
[#56]: https://github.com/enb/enb-stylus/issues/56
[#57]: https://github.com/enb/enb-stylus/issues/57
[#58]: https://github.com/enb/enb-stylus/issues/58
[#60]: https://github.com/enb/enb-stylus/issues/60
[#64]: https://github.com/enb/enb-stylus/issues/64
[#65]: https://github.com/enb/enb-stylus/issues/65
[#67]: https://github.com/enb/enb-stylus/issues/67
[#68]: https://github.com/enb/enb-stylus/issues/68
[#71]: https://github.com/enb/enb-stylus/issues/71
[#73]: https://github.com/enb/enb-stylus/issues/73
[#90]: https://github.com/enb/enb-stylus/issues/90
[#109]: https://github.com/enb/enb-stylus/pull/109
[#111]: https://github.com/enb/enb-stylus/pull/111
[#113]: https://github.com/enb/enb-stylus/issues/113
[#116]: https://github.com/enb/enb-stylus/pull/116
[#120]: https://github.com/enb/enb-stylus/pull/120
[#125]: https://github.com/enb/enb-stylus/pull/125
