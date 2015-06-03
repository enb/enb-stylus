/**
 * css-stylus
 * ==========
 *
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *Object* **variables** — Дополнительные переменные окружения для `stylus`.
 * * *Bool|Object* **sourcemap** — Включает генерацию sourcemap. По умолчанию `false`. Для генерации
 *    инлайнового sourcemap нужно передать объект со свойством `inline` в значении `true`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *Boolean|Object* **autoprefixer** - Использовать `autoprefixer` при сборке `css`. По умолчанию `false`.
 * * *Array* **autoprefixer.browsers** - Браузеры (опция автопрефиксера).
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-stylus/techs/css-stylus'));
 * ```
 */
var path = require('path'),
    vow = require('vow'),
    fs = require('enb/lib/fs/async-fs'),
    postcss = require('postcss'),
    atImport = require('postcss-import'),
    url = require('postcss-url'),
    stylus = require('stylus'),
    autoprefixer = require('autoprefixer-core');

module.exports = require('enb/lib/build-flow').create()
    .name('css-stylus')
    .target('target', '?.css')
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('variables')
    .defineOption('autoprefixer', false)
    .defineOption('sourcemap', false)
    .useFileList(['styl', 'css'])
    .builder(function (sourceFiles) {
        var node = this.node,
            _this = this,
            filename = node.resolvePath(path.basename(this._target));

        return this._processStylus(filename, this._prepareImports(sourceFiles))
            .spread(function (renderer, css) {
                return _this._processCss(filename, css, renderer);
            })
            .then(function (result) {
                return _this._writeMap(filename + '.map', result.map)
                    .then(function () {
                        return result.css;
                    });
            });
    })
    .methods({
        _prepareImports: function (sourceFiles) {
            var added = {},
                node = this.node;

            return sourceFiles
                .filter(function (file) {
                    var basename = file.fullname.slice(0, -(file.suffix.length + 1));
                    if (added[basename]) {
                        return false;
                    }

                    added[basename] = true;
                    return true;
                })
                .map(function (file) {
                    var url = node.relativePath(file.fullname);

                    if (file.suffix === 'styl') {
                        return '/* ' + url + ':begin */\n' +
                            '@import "' + url + '";\n' +
                            '/* ' + url + ':end */\n';
                    } else {
                        // postcss adds surrounding comments itself so don't add them here
                        return '@import "' + url + '";';
                    }
                }).join('\n');
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

            var renderer = stylus(content, {
                    compress: this._compress,
                    prefix: this._prefix
                })
                .set('resolve url', true)
                .set('filename', filename)
                .set('sourcemap', map)
                .define('url', stylus.resolver());

            if (this._variables) {
                var variables = this._variables;

                Object.keys(variables).forEach(function (key) {
                    renderer.define(key, variables[key]);
                });
            }

            var defer = vow.defer();
            this._configureRenderer(renderer)
                .render(function (err, css) {
                    if (err) {
                        defer.reject(err);
                    } else {
                        defer.resolve([renderer.sourcemap, css]);
                    }
                });

            return defer.promise();
        },

        _processCss: function (filename, css, sourcemap) {
            var _this = this,
                opts = {
                    from: filename,
                    to: filename
                };

            if (this._sourcemap) {
                opts.map = {
                    prev: JSON.stringify(sourcemap),
                    inline: !!this._sourcemap.inline
                };
            }

            var processor = postcss()
                .use(atImport({
                    transform: function (content, filename) {
                        var url = _this.node.relativePath(filename),
                            pre = '/* ' + url + ': begin */ /**/\n',
                            post = '/* ' + url + ': end */ /**/\n',
                            res = pre + content + post;

                        return res.replace(/\n/g, '\n    ');
                    }
                }))
                .use(url({
                    url: 'rebase'
                }));

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
                return fs.write(filename, JSON.stringify(map));
            }

            return vow.resolve();
        }
    })
    .createTech();
