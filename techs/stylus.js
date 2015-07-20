/**
 * stylus
 * ==========
 *
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 *
 * * *String|Boolean* **imports** — Раскрытие css @import-ов. По умолчанию `include`.
 *      *String* **include** – css @import будут раскрыты
 *      *Boolean* **false** - css @import будут проигнорированы и попадут в результирующий таргет как есть
 *
 * * *String* **url** – Определяем каким образом будут обработы `url()` в `styl` файле.
 *      *String* **rebase** – пути изменятся относительно собранного таргета.
 *      было: background: url('block_image.png')
 *      станет: background: url('../../common.block/block/block_image.png')
 *      *String* **inline** – файл будет закодирован в base64 код
 *
 * * *Boolean* **comments** — Добавляет разделяющие комментарии между стилями,
 * содержащие относительный путь до исходного файла.
 *    По умолчанию `true`
 *
 * * *Boolean|Object* **sourcemap** — Включает генерацию `sourcemap`. По умолчанию `false`.
 *      *Boolean* **true** – генерация `sourcemap`.
 *      *String* **inline** – генерация инлайнового `sourcemap`.
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * * *Boolean|Object* **autoprefixer** - Использовать `autoprefixer` при сборке `css`. По умолчанию `false`.
 * *    *Array* **autoprefixer.browsers** - Браузеры (опция автопрефиксера).
 *
 * * *Boolean* **compress** – Минифицирует результат рендеринга stylus, по умолчанию `false`
 *
 * * *String* **prefix** – Добавляет префикс ко всем css классам,  по умолчанию `false`
 *
 * * *Array* **includes** — Дополнительные пути, которые будут использованы при обработки `@import` и `url()`.
 *    В основном может быть использовано при подключении сторонних библиотек, например `nib`
 *
 * * *Boolean* **hoist** – Перенос всех @import-ов и @charset-ов в начало файла.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-stylus/techs/stylus'));
 * ```
 */
var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    postcss = require('postcss'),
    atImport = require('postcss-import'),
    url = require('postcss-url'),
    stylus = require('stylus'),
    autoprefixer = require('autoprefixer-core'),
    nib = require('nib'),
    EOL = require('os').EOL;

module.exports = require('enb/lib/build-flow').create()
    .name('stylus')
    .target('target', '?.css')
    .defineOption('url', 'rebase')
    .defineOption('comments', true)
    .defineOption('imports', 'include')
    .defineOption('sourcemap', false)
    .defineOption('autoprefixer', false)
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('includes', [])
    .defineOption('hoist', false)
    .defineOption('useNib', false)
    .useFileList(['styl', 'css'])
    .builder(function (sourceFiles) {
        var node = this.node,
            filename = node.resolvePath(path.basename(this._target));

        return this._processStylus(filename, this._prepareImports(sourceFiles))
            .spread(function (renderer, css) {
                return this._processCss(filename, css, renderer);
            }, this)
            .then(function (result) {
                return this._writeMap(filename + '.map', result.map)
                    .then(function () {
                        return result.css;
                    });
            }, this);
    })

    .methods({
        _prepareImports: function (sourceFiles) {
            var added = {},
                node = this.node;

            return sourceFiles
                .filter(function (file) {
                    var basename = file.fullname.substring(0, file.fullname.lastIndexOf('.'));

                    if (added[basename]) {
                        return false;
                    }

                    added[basename] = true;

                    return true;
                })
                .map(function (file) {
                    var url = node.relativePath(file.fullname),
                        pre = '',
                        post = '';

                    if (file.suffix === 'styl') {
                        if (this._comments) {
                            pre = '/* ' + url + ':begin */' + EOL;
                            post = '/* ' + url + ':end */' + EOL;
                        }

                        return pre + '@import "' + url + '";' + EOL + post;
                    }

                    // postcss adds surrounding comments itself so don't add them here
                    return '@import "' + url + '";' + EOL;
                }, this).join(EOL);
        },

        _configureRenderer: function (renderer) {
            return renderer;
        },

        _processStylus: function (filename, content) {
            var map = !!this._sourcemap;

            if (map) {
                map = {
                    basePath: path.dirname(filename),
                    inline: false
                };
            }

            var renderer = stylus(content)
                .set('compress', this._compress)
                .set('prefix', this._prefix)
                .set('filename', filename)
                .set('sourcemap', map)
                .set('hoist atrules', this._hoist);

            // rebase url() in all cases on stylus level
            if (['rebase', 'inline'].indexOf(this._url) !== -1) {
                // only rebase url() on stylus level
                renderer
                    .set('resolve url', true)
                    // set `nocheck` for fixed github.com/stylus/stylus/issues/1951
                    .define('url', stylus.resolver({ nocheck: true }));
            }

            if (this._includes) {
                this._includes.forEach(function (path) {
                    renderer.include(path);
                });
            }

            if (this._useNib) {
                renderer
                    .use(nib())
                    .import(nib.path + '/nib');
            }

            var defer = vow.defer();

            this._configureRenderer(renderer).render(function (err, css) {
                err ? defer.reject(err) : defer.resolve([renderer.sourcemap, css]);
            });

            return defer.promise();
        },

        _processCss: function (filename, css, sourcemap) {
            var _this = this,
                processor = postcss(),
                urlMethod = this._url,

                // base opts to resolve urls
                opts = {
                    from: filename,
                    to: filename
                };

            // add options to build sourcemap
            if (this._sourcemap) {
                opts.map = {
                    prev: JSON.stringify(sourcemap),
                    inline: this._sourcemap === 'inline'
                };
            }

            // expand imports with css
            if (this._imports === 'include') {
                processor.use(atImport({
                    transform: function (content, filename) {
                        var url = _this.node.relativePath(filename),
                            pre = '',
                            post = '',
                            res;

                        if (_this._comments) {
                            pre = '/* ' + url + ':begin */' + EOL;
                            post = '/* ' + url + ':end */' + EOL;
                        }

                        res = pre + content + post;

                        return res;
                    }
                }));
            }

            // rebase or inline urls in css
            if (['rebase', 'inline'].indexOf(urlMethod) > -1) {
                processor.use(url({ url: urlMethod }));
            }

            // use autoprefixer
            if (this._autoprefixer) {
                processor.use(
                    (this._autoprefixer.browsers ?
                        autoprefixer({ browsers: this._autoprefixer.browsers }) :
                        autoprefixer)
                );
            }

            return processor.process(css, opts);
        },

        _writeMap: function (filename, map) {
            if (this._sourcemap && !this._sourcemap.inline) {
                return vfs.write(filename, JSON.stringify(map));
            }

            return vow.resolve();
        }
    })
    .createTech();
