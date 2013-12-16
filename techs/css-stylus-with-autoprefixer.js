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
 * * *Array* **autoprefixerArguments** — Аргументы для автопрефиксера.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(
 *     require('enb-stylus/techs/css-stylus-with-autoprefixer'),
 *     {autoprefixerArguments: ['ie 7', 'ie 8']}
 * );
 * ```
 */

var autoprefixerStylus = require('autoprefixer-stylus');

module.exports = require('./css-stylus').buildFlow()
    .name('css-stylus-with-autoprefixer')
    .defineOption('autoprefixerArguments')
    .methods({
        _configureRenderer: function (renderer) {
            renderer.use(autoprefixerStylus.apply(global, this._autoprefixerArguments || []));
            return renderer;
        }
    })
    .createTech();
