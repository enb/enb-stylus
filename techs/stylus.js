// Support node 0.10: `postcss` uses promises
require('es6-promise').polyfill();

var path = require('path'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    FileList = enb.FileList || require('enb/lib/file-list'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    EOL = require('os').EOL;

/**
 * @class StylusTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds CSS from Stylus and CSS sources.<br/><br/>
 *
 * Files processing in 3 steps:<br/>
 * 1. Prepares list of @import sources (contain .styl and .css source code).<br/>
 * 2. Expands Stylus @import and processes it with the [Stylus renderer]{@link https://github.com/stylus/stylus}.<br/>
 * 3. Expands the remaining CSS @import and processes the received common CSS using
 * [Postcss]{@link https://github.com/postcss/postcss}.<br/><br/>
 *
 * Important: `prefix`, `includes`, `useNib` options are enabled only for Stylus source code.<br/>
 *
 * @param {Object}          [options]                                 Options
 * @param {String}          [options.filesTarget='?.files']           Path to target with
 *                                                                    [FileList]{@link http://bit.ly/1GTUOj0}
 * @param {String[]}        [options.sourceSuffixes=['styl', 'css']]  Files with specified suffixes involved in
 *                                                                    the assembly. Default: `styl`, `css`
 * @param {String|Boolean}  [options.url='rebase']                    Rebases or inlines url():<br/>
 *                                                                    - `rebase` – resolves a path relative to the
 *                                                                    bundle directory.<br/>
 *                                                                    - `inline` – inlines assets using base64 encoding.
 * @param {Boolean}         [options.comments=true]                   Adds CSS comment with path to source to a code
 *                                                                    block (above and below).<br/>
 * @param {String|Boolean}  [options.imports='include']               Allows to include(expand) @import or leave without
 *                                                                    changes.
 * @param {Boolean|String}  [options.sourcemap=false]                 Builds sourcemap:<br/>
 *                                                                    - `true` – builds ?.css.map.<br/>
 *                                                                    - `inline` – builds and inlining sourcemap into
 *                                                                    bundled CSS file.
 * @param {Boolean|Object}  [options.autoprefixer=false]              Adds vendor prefixes using autoprefixer:<br/>
 *                                                                    - `true` – enables autoprefixer and defines what
 *                                                                    prefixes should be used based on
 *                                                                    [CanIUse]{@link http://caniuse.com} data.<br/>
 *                                                                    - `{browsers: ['last 2 versions']}` – allows to
 *                                                                    set custom browsers.
 * @param {Boolean}         [options.compress=false]                  Minifies styles. Supports sourcemap.
 * @param {String}          [options.prefix='']                       Adds prefix to CSS classes.<br/>
 *                                                                    Important: Available for Stylus only.
 * @param {String[]}        [options.globals=[]]                      Imports `.styl` files with global variables,
 *                                                                    functions and mixins to the top.
 * @param {String[]}        [options.importPaths=[]]                  Adds additional path to import
 * @param {String[]}        [options.includes=[]]                     Adds additional path to resolve a path in @import
 *                                                                    and url().<br/>
 *                                                                    [Stylus: include]{@link http://bit.ly/1IpsoTh}
 *                                                                    <br/>
 *                                                                    Important: Available for Stylus only.
 * @param {Function[]}      [options.use=[]]                          Allows to use plugins for Stylus.<br/>
 * @param {Boolean}         [options.useNib=false]                    Allows to use Nib library for Stylus.<br/>
 *                                                                    Important: Available for Stylus only.
 *
 * @example
 * // Styles in file system before build:
 * // blocks/
 * // ├── block1.styl
 * // └── block2.css
 * //
 * // After build:
 * // bundle/
 * // └── bundle.css
 *
 * var stylusTech = require('enb-stylus/techs/stylus'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get FileList
 *         node.addTechs([
 *             [FileProvideTech, { target: '?.bemdecl.js' }],
 *             [bemTechs.levels, { levels: ['blocks'] }],
 *             bemTechs.deps,
 *             bemTechs.files
 *         ]);
 *
 *         // build css file
 *         node.addTech(stylusTech);
 *         node.addTarget('?.css');
 *     });
 * };
 */
module.exports = buildFlow.create()
    .name('stylus')
    .target('target', '?.css')
    .defineOption('url', 'rebase')
    .defineOption('comments', true)
    .defineOption('imports', 'include')
    .defineOption('sourcemap', false)
    .defineOption('autoprefixer', false)
    .defineOption('compress', false)
    .defineOption('prefix', '')
    .defineOption('importPaths', [])
    .defineOption('includes', [])
    .defineOption('globals', [])
    .defineOption('useNib', false)
    .defineOption('use', [])
    .useFileList(['styl', 'css'])
    .saveCache(function (cache) {
        cache.cacheFileList('global', this._globalFiles);
    })
    .needRebuild(function (cache) {
        this._globalFiles = this._filenamesToFileList(this._globals);

        return cache.needRebuildFileList('global', this._globalFiles);
    })
    .builder(function (sourceFiles) {
        var node = this.node,
            filename = node.resolvePath(path.basename(this._target)),
            stylesImports = this._prepareImports(sourceFiles);

        return this._processStylus(filename, stylesImports)
            .spread(function (css, sourcemap) {
                return this._processCss(filename, css, sourcemap);
            }, this)
            .then(function (result) {
                return this._writeMap(filename + '.map', result.map)
                    .then(function () {
                        return result.css;
                    });
            }, this);
    })

    .methods(/** @lends StylusTech.prototype */{
        /**
         * Imitates source files (FileList format).
         *
         * @param {String[]} filenames — paths to files
         * @see [FileList]{@link https://github.com/enb/enb/blob/master/lib/file-list.js}
         * @returns {FileList}
         */
        _filenamesToFileList: function (filenames) {
            var node = this.node,
                nodeDir = node.getDir();

            return filenames.map(function (filename) {
                var absolutePath = path.resolve(nodeDir, filename);

                return FileList.getFileInfo(absolutePath);
            });
        },

        /**
         * Filters source files.
         *
         * This is necessary when block has a lot of files that include styles.
         *
         * Case #1:
         * blocks/
         * ├── block.styl
         * └── block.css
         * Will be used `.styl`
         *
         * Case #2:
         * blocks/
         * ├── block.styl
         * ├── block.ie.styl
         * └── block.css
         * Will be used `.styl` and `.ie.styl`
         *
         * Case #3:
         * blocks/
         * ├── block.css
         * ├── block.ie.css
         * Will be used `.css` and `.ie.css`
         *
         * @param {FileList} sourceFiles — Objects with paths to the files that contain styles for processing.
         * @see [FileList]{@link https://github.com/enb/enb/blob/master/lib/file-list.js}
         * @returns {FileList}
         */
        _filterSourceFiles: function (sourceFiles) {
            var added = {};

            return sourceFiles.filter(function (file) {
                var basename = file.fullname.substring(0, file.fullname.lastIndexOf('.'));

                if (added[basename]) {
                    return false;
                }

                added[basename] = true;

                return true;
            });
        },

        /**
         * Returns CSS code with imports to specified files.
         *
         * @param {FileList} sourceFiles — Objects with paths to the files that contain styles for processing.
         * @see [FileList]{@link https://github.com/enb/enb/blob/master/lib/file-list.js}
         * @returns {String}
         */
        _composeImports: function (sourceFiles) {
            var node = this.node;

            return sourceFiles.map(function (file) {
                var url = node.relativePath(file.fullname),
                    pre = '',
                    post = '';

                if (this._comments) {
                    pre = '/* ' + url + ':begin */' + EOL;
                    post = '/* ' + url + ':end */' + EOL;
                }

                return pre + '@import "' + url + '";' + EOL + post;
            }, this).join(EOL);
        },

        /**
         * Prepares the list of @import sources.
         *
         * @private
         * @param {FileList} sourceFiles — Objects with paths to the files that contain styles for processing.
         * @see [FileList]{@link https://github.com/enb/enb/blob/master/lib/file-list.js}
         * @returns {String} – list of @import
         */
        _prepareImports: function (sourceFiles) {
            return this._composeImports([].concat(
                // add global files to the top
                this._globalFiles,
                // add source files after global files
                this._filterSourceFiles(sourceFiles)
            ));
        },

        /**
         * Configure Stylus renderer.
         * Could be used for overriding render options.
         *
         * @protected
         * @param {Object} renderer – instance of Stylus renderer class
         * @returns {Object} – instance of Stylus renderer class
         */
        _configureRenderer: function (renderer) {
            return renderer;
        },

        /**
         * Process Stylus files.
         *
         * @private
         * @param {String} filename – filename of the target
         * @param {String} stylesImports – list of @import to process
         * @returns {Promise[]} – promise with sourcemap of Stylus file and content with expanded @import with
         * Stylus sources and list of @import with CSS sources, that would expand on next step
         */
        _processStylus: function (filename, stylesImports) {
            var map = !!this._sourcemap;

            if (map) {
                map = {
                    basePath: path.dirname(filename),
                    inline: false,
                    comment: false
                };
            }

            var stylus = require('stylus');

            var renderer = stylus(stylesImports)
                .set('prefix', this._prefix)
                .set('filename', filename)
                .set('sourcemap', map);

            // rebase url() in all cases on stylus level
            if (['rebase', 'inline'].indexOf(this._url) !== -1) {
                renderer
                    .set('resolve url', true)
                    // set `nocheck` for fixed github.com/stylus/stylus/issues/1951
                    .define('url', stylus.resolver({ nocheck: true }));
            }

            if (this._includes) {
                this._includes.forEach(function (includePath) {
                    renderer.include(includePath);
                });
            }

            if (!Array.isArray(this._use)) {
                this._use = [this._use];
            }

            if (this._useNib) {
                var nib = require('nib');

                this._use.push(nib());
                this._importPaths.push(path.join(nib.path, 'nib'));
            }

            this._use.forEach(function (func) {
               renderer.use(func);
            });

            this._importPaths.forEach(function (importPath) {
                renderer.import(importPath);
            });

            var defer = vow.defer();

            this._configureRenderer(renderer).render(function (err, css) {
                err ? defer.reject(err) : defer.resolve([css, renderer.sourcemap]);
            });

            return defer.promise();
        },

        /**
         * Process CSS files.
         *
         * @private
         * @param {String} filename – filename of the target
         * @param {String} css – list of CSS @import to process and CSS code received after rendering Stylus source code
         * @param {Object} sourcemap – sourcemap of Stylus source code
         * @returns {Promise} – promise with processed css and sourcemap (options)
         */
        _processCss: function (filename, css, sourcemap) {
            var processor = require('postcss')(),
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
                    inline: this._sourcemap === 'inline',
                    annotation: true
                };
            }

            // expand imports with css
            if (this._imports === 'include') {
                processor.use(require('postcss-import')());
            }

            // rebase or inline urls in css
            if (['rebase', 'inline'].indexOf(urlMethod) > -1) {
                processor.use(require('postcss-url')({ url: urlMethod }));
            }

            // use autoprefixer
            if (this._autoprefixer) {
                var autoprefixer = require('autoprefixer');
                processor.use(
                    (typeof this._autoprefixer === 'object' ?
                        autoprefixer(this._autoprefixer) :
                        autoprefixer)
                );
            }

            // compress css
            if (this._compress) {
                processor.use(require('csswring')());
            }

            return processor.process(css, opts);
        },

        /**
         * Write sourcemap to file system in target directory
         *
         * @private
         * @param {String} filename – filename for map, e.g. /Users/project/bundle/bundle.css.map
         * @param {Object} data – data of sourcemap
         * @returns {Promise}
         */
        _writeMap: function (filename, data) {
            if (this._sourcemap && this._sourcemap !== 'inline') {
                return vfs.write(filename, JSON.stringify(data));
            }

            return vow.resolve();
        }
    })
    .createTech();
