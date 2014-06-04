/**
 * css-stylus-with-autoprefixer
 * ============================
 *
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 * Производит пост-обработку автопрефиксером.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *Object* **variables** — Дополнительные переменные окружения для `stylus`.
 * * *Array* **browsers** — Браузеры (опция автопрефиксера).
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(
 *     require('enb-stylus/techs/css-stylus-with-autoprefixer'),
 *     {browsers: ['ie 7', 'ie 8']}
 * );
 * ```
 */

var autoprefixer = require('autoprefixer');

module.exports = require('./css-stylus').buildFlow()
    .name('css-stylus-with-autoprefixer')
    .defineOption('browsers')
    .defineOption('autoprefixerArguments')
    .methods({
        _configureRenderer: function (renderer) {
            var args = this._browsers || this._autoprefixerArguments;
            renderer.use(function (style) {
                this.on('end', function (err, css) {
                    return args ?
                        autoprefixer.apply(this, args).process(css).css :
                        autoprefixer.process(css).css;
                });
            });
            return renderer;
        }
    })
    .createTech();
