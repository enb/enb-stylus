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
var Vow = require('vow');
var stylus = require('stylus');

module.exports = require('enb/lib/build-flow').create()
    .name('css-stylus')
    .target('target', '?.css')
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('variables')
    .useFileList(['css', 'styl'])
    .builder(function (sourceFiles) {
        var _this = this;
        var filename = this.node.resolvePath(this._target);
        var promise = Vow.promise();

        var css = sourceFiles.map(function (file) {
            var path = file.fullname;
            if (file.name.indexOf('.styl') !== -1) {
                return '/* ' + path + ':begin */\n' +
                    '@import "' + path + '";\n' +
                    '/* ' + path + ':end */\n';
            } else {
                return '@import "' + path + '";';
            }
        }).join('\n');

        var renderer = stylus(css, {
                compress: this._compress,
                prefix: this._prefix
            })
            .set('include css', true)
            .set('filename', filename)
            .define('url', stylus.resolver());

        if (this._variables) {
            var variables = this._variables;
            Object.keys(variables).forEach(function (key) {
                renderer.define(key, variables[key]);
            });
        }

        _this._configureRenderer(renderer)
            .render(function (err, css) {
                if (err) {
                    promise.reject(err);
                } else {
                    promise.fulfill(css);
                }
            });

        return promise;
    })
    .methods({
        _configureRenderer: function (renderer) {
            return renderer;
        }
    })
    .createTech();
