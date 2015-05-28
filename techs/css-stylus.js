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
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-stylus/techs/css-stylus'));
 * ```
 */
var path = require('path'),
    vow = require('vow'),
    postcss = require('postcss'),
    atImport = require('postcss-import'),
    stylus = require('stylus');

module.exports = require('enb/lib/build-flow').create()
    .name('css-stylus')
    .target('target', '?.css')
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('variables')
    .useFileList(['styl', 'css'])
    .builder(function (sourceFiles) {
        var node = this.node,
            filename = node.resolvePath(path.basename(this._target)),
            defer = vow.defer(),
            added = {},
            css, renderer;

        css = sourceFiles
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

        renderer = stylus(css, {
                compress: this._compress,
                prefix: this._prefix
            })
            .set('resolve url', true)
            .set('filename', filename)
            .define('url', stylus.resolver());

        if (this._variables) {
            var variables = this._variables;

            Object.keys(variables).forEach(function (key) {
                renderer.define(key, variables[key]);
            });
        }

        this._configureRenderer(renderer)
            .render(function (err, css) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(css);
                }
            });

        return defer.promise()
            .then(function (css) {
                return postcss()
                    .use(atImport({
                        transform: function (content, filename) {
                            var url = node.relativePath(filename),
                                pre = '/* ' + url + ': begin */ /**/\n',
                                post = '/* ' + url + ': end */ /**/\n',
                                res = pre + content + post;

                            return res.replace(/\n/g, '\n    ');
                        }
                    }))
                    .process(css, {
                        from: filename
                    })
                    .css;
            });
    })
    .methods({
        _configureRenderer: function (renderer) {
            return renderer;
        }
    })
    .createTech();
