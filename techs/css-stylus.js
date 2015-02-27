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
var vow = require('vow');
var postcss = require('postcss');
var atImport = require('postcss-import');
var stylus = require('stylus');

module.exports = require('enb/lib/build-flow').create()
    .name('css-stylus')
    .target('target', '?.css')
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('variables')
    .useFileList(['css', 'styl'])
    .builder(function (sourceFiles) {
        var node = this.node;
        var filename = node.resolvePath(this._target);
        var defer = vow.defer();

        var css = sourceFiles.map(function (file) {
            var url = node.relativePath(file.fullname);

            if (file.name.indexOf('.styl') !== -1) {
                return '/* ' + url + ':begin */\n' +
                    '@import "' + url + '";\n' +
                    '/* ' + url + ':end */\n';
            } else {
                return '@import "' + url + '";';
            }
        }).join('\n');

        var renderer = stylus(css, {
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
                            var url = node.relativePath(filename);
                            var pre = '/* ' + url + ': begin */ /**/\n';
                            var post = '/* ' + url + ': end */ /**/\n';
                            var res = pre + content + post;

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
