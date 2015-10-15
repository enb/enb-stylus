var fs = require('fs'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    vow = require('vow'),
    mockFs = require('mock-fs'),
    mockFsHelper = require(path.join(__dirname, 'lib', 'mock-fs-helper')),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    loadDirSync = require('mock-enb/utils/dir-utils').loadDirSync,
    StylusTech = require('../techs/stylus'),
    stylus = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'stylus')),
    csswring = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'csswring')),
    postcss = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'postcss')),
    nib = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'nib')),
    autoprefixer = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'autoprefixer')),
    EOL = require('os').EOL;

describe('stylus-tech', function () {
    afterEach(function () {
        mockFs.restore();
    });

    describe('@import', function () {
        it('must import .css file', function () {
            var scheme = {
                blocks: { 'block.styl': '@import "../plugins/file.css"\n' },
                plugins: { 'file.css': 'body { color: #000; }' }
            };

            return build(scheme).then(function (actual) {
                actual.must.equal('body{color:#000;}');
            });
        });

        it('must import .styl file', function () {
            var scheme = {
                blocks: { 'block.styl': '@import "../plugins/file.styl"\n' },
                plugins: { 'file.styl': 'body { color: #000; }' }
            };

            return build(scheme).then(function (actual) {
                actual.must.equal('body{color:#000;}');
            });
        });
    });

    describe('@require', function () {
        it('must require .styl file', function () {
            var scheme = {
                blocks: { 'block.styl': '@require "../plugins/file.styl"\n' },
                plugins: { 'file.styl': 'body { color: #000; }' }
            };

            return build(scheme).then(function (actual) {
                actual.must.equal('body{color:#000;}');
            });
        });

        it('must require .styl file once', function () {
            var scheme = {
                blocks: {
                    'block.styl': [
                        '@require "../plugins/file.styl"',
                        '@require "../plugins/file.styl"'
                    ].join(EOL)
                },
                plugins: { 'file.styl': 'body { color: #000; }' }
            };

            return build(scheme).then(function (actual) {
                actual.must.equal('body{color:#000;}');
            });
        });
    });

    describe('imports', function () {
        it('must rebase url()', function () {
            var scheme = {
                blocks: {
                    'block.jpg': new Buffer('block image'),
                    'block.styl': 'body { background-image: url(block.jpg) }'
                }
            };

            return build(scheme, { url: 'rebase' }).then(function (actual) {
                actual.must.equal('body{background-image:url(\"../blocks/block.jpg\");}');
            });
        });
    });

    describe('url()', function () {
        it('must rebase url()', function () {
            var scheme = {
                blocks: {
                    'block.jpg': new Buffer('block image'),
                    'block.styl': 'body { background-image: url(block.jpg) }'
                }
            };

            return build(scheme, { url: 'rebase' }).then(function (actual) {
                actual.must.equal('body{background-image:url(\"../blocks/block.jpg\");}');
            });
        });

        it('must inline url()', function () {
            var scheme = {
                    blocks: {
                        images: {
                            'block.jpg': new Buffer('block image'),
                            'block.png': new Buffer('block image'),
                            'block.gif': new Buffer('block image')
                        },
                        'block.styl': [
                            'body { background-image: url(images/block.jpg) }',
                            'div { background-image: url(images/block.png) }',
                            'section { background-image: url(images/block.gif) }'
                        ].join(EOL)
                    }
                },
                expected = [
                    'body{background-image:url(\"data:image/jpeg;base64,YmxvY2sgaW1hZ2U=\");}',
                    'div{background-image:url(\"data:image/png;base64,YmxvY2sgaW1hZ2U=\");}',
                    'section{background-image:url(\"data:image/gif;base64,YmxvY2sgaW1hZ2U=\");}'
                ].join('');

            return build(scheme, { url: 'inline' }).then(function (actual) {
                actual.must.equal(expected);
            });
        });

        it('must inline svg in url()', function () {
            var scheme = {
                blocks: {
                    images: {
                        'block.svg': new Buffer('block image')
                    },
                    'block.styl': 'body { background-image: url(images/block.svg) }'
                }
            };

            return build(scheme, { url: 'inline' }).then(function (actual) {
                actual.must.equal('body{background-image:url(\"data:image/svg+xml;charset=US-ASCII,block%20image\");}');
            });
        });

        it('must not rebase/inline absolute url()', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body { background-image: url(http://foo.com/foo.css) }',
                            'div { background-image: url(https://foo.com/foo.css) }',
                            'section { background-image: url(//foo.com/foo.css) }'
                        ].join(EOL)
                    }
                },
                expected = [
                    'body{background-image:url(\"http://foo.com/foo.css\");}',
                    'div{background-image:url(\"https://foo.com/foo.css\");}',
                    'section{background-image:url(\"//foo.com/foo.css\");}'
                ].join('');

            return build(scheme, { url: 'rebase' }).then(function (actual) {
                actual.must.equal(expected);
            });
        });
    });

    describe('globals', function () {
        it('must import global file by relative path', function () {
            var scheme = {
                blocks: {
                    'file.styl': '.col { width: $col-width; }'
                },
                globals: {
                    'vars.styl': '$col-width = 30px'
                }
            };

            return build(scheme, { globals: ['../globals/vars.styl'] }).then(function (actual) {
                actual.must.equal('.col{width:30px;}');
            });
        });

        it('must import global file by absolute path', function () {
            var scheme = {
                blocks: {
                    'file.styl': '.col { width: $col-width; }'
                },
                globals: {
                    'vars.styl': '$col-width = 30px'
                }
            };

            return build(scheme, { globals: [path.resolve('./globals/vars.styl')] }).then(function (actual) {
                actual.must.equal('.col{width:30px;}');
            });
        });
    });

    describe('autoprefixer', function () {
        it('must add vendor prefixes from browserlist', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body {          ',
                            '  color: #000;  ',
                            '  display: flex;',
                            '}               '
                        ].join(EOL)
                    }
                },
                expected = [
                    'body{',
                        'color:#000;',
                        'display:-webkit-box;',
                        'display:-webkit-flex;',
                        'display:-ms-flexbox;',
                        'display:flex;',
                    '}'
                ].join('');

            return build(scheme, { autoprefixer: true }).then(function (actual) {
                actual.must.equal(expected);
            });
        });

        it('must add vendor prefixes from browser config', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body {          ',
                            '  color: #000;  ',
                            '  display: flex;',
                            '}               '
                        ].join(EOL)
                    }
                },
                expected = [
                    'body{',
                        'color:#000;',
                        'display:-ms-flexbox;',
                        'display:flex;',
                    '}'
                ].join('');

            return build(scheme, { autoprefixer: { browsers: ['Explorer 10'] } })
                .then(function (actual) {
                    actual.must.equal(expected);
                });
        });
    });

    describe('sourcemap', function () {
        it('must create, save on fs and add link to sourcemap', function () {
            var scheme = {
                blocks: {
                    'block.styl': 'body { color: #000; }'
                }
            };

            return build(scheme, { sourcemap: true }).then(function (actual) {
                var isMapExists = fs.existsSync('./bundle/bundle.css.map');

                isMapExists.must.be.true();
                actual.must.equal('body{color:#000;}/*#sourceMappingURL=bundle.css.map*/');
            });
        });

        it('must create and inline sourcemap', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body { color: #000; }'
                    }
                },

                expected = 'body{color:#000;}/*#sourceMappingURL=data:application/json;base64,';

            return build(scheme, { sourcemap: 'inline' }).then(function (actual) {
                actual.must.contain(expected);
            });
        });
    });

    describe('nib', function () {
        it('must use mixins', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body { size: 5em 10em; }'
                    }
                },
                expected = [
                    'body{',
                        'width:5em;',
                        'height:10em;',
                    '}'
                ].join('');

            return build(scheme, { useNib: true }).then(function (actual) {
                actual.must.equal(expected);
            });
        });
    });

    describe('use', function () {
        var nibPlugin = require('nib');

        it('must use nib plugin as a part of plugins list', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body { size: 5em 10em; }'
                    }
                },
                expected = [
                    'body{',
                        'width:5em;',
                        'height:10em;',
                    '}'
                ].join('');

            return build(scheme, { use: [nibPlugin()] }).then(function (actual) {
                actual.must.equal(expected);
            });
        });

        it('must use single nib plugin identically as a part of plugins list', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body { size: 5em 10em; }'
                    }
                };

            return vow.all([
                build(scheme, { use: nibPlugin() }),
                build(scheme, { use: [nibPlugin()] })
            ]).then(function (values) {
                values[0].must.equal(values[1]);
            });
        });
    });

    describe('compress', function () {
        it('must compressed result css', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body {                            ',
                            '  color: #000;                    ',
                            '}                                 ',
                            'div {}                            ',
                            'div {                             ',
                            '  font-weight: normal;            ',
                            '  margin: 0px;                    ',
                            '  padding: 5px 0 5px 0;           ',
                            '  background: hsl(134, 50%, 50%); ',
                            '  padding: 5px 0 5px 0;           ',
                            '}                                 '
                        ].join(EOL)
                    }
                },
                expected = 'body{color:#000}div{font-weight:400;margin:0;background:#40bf5e;padding:5px 0}';

            return build(scheme, { compress: true }).then(function (actual) {
                actual.must.equal(expected);
            });
        });
    });

    describe('comments', function () {
        it('must added comments for Stylus', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body {',
                            '  color: #000;',
                            '}'
                        ].join(EOL)
                    }
                },

                expected = [
                    ['/* ..', 'blocks', 'block.styl:begin */'].join(path.sep),
                    'body {',
                    '  color: #000;',
                    '}',
                    ['/* ..', 'blocks', 'block.styl:end */'].join(path.sep)
                ].join('\n'); // Stylus uses \n for line break

            return build(scheme, { comments: true }).then(function (actual) {
                actual.must.contain(expected);
            });
        });

        it('must added comments for CSS file', function () {
            var scheme = {
                    blocks: {
                        'block.css': [
                            'body {',
                            '  color: #000;',
                            '}'
                        ].join(EOL)
                    }
                },

                expected = [
                    ['/* ..', 'blocks', 'block.css:begin */'].join(path.sep),
                    scheme.blocks['block.css'],
                    ['/* ..', 'blocks', 'block.css:end */'].join(path.sep)
                ].join('\n'); // Stylus uses \n for line break

            return build(scheme, { comments: true }).then(function (actual) {
                actual.must.contain(expected);
            });
        });

        it('must added comments for Stylus file with suffix', function () {
            var scheme = {
                    blocks: {
                        'block.styl': [
                            'body {',
                            '  color: #000;',
                            '}'
                        ].join(EOL),
                        'block.ie.styl': [
                            'body {',
                            '  color: #fff;',
                            '}'
                        ].join(EOL)
                    }
                },

                expected = [
                    ['/* ..', 'blocks', 'block.styl:begin */'].join(path.sep),
                    'body {',
                    '  color: #000;',
                    '}',
                    ['/* ..', 'blocks', 'block.styl:end */'].join(path.sep),
                    ['/* ..', 'blocks', 'block.ie.styl:begin */'].join(path.sep),
                    'body {',
                    '  color: #fff;',
                    '}',
                    ['/* ..', 'blocks', 'block.ie.styl:end */'].join(path.sep)
                ].join('\n'); // Stylus uses \n for line break

            return build(scheme, { comments: true, sourceSuffixes: ['styl', 'css', 'ie.styl'] })
                .then(function (actual) {
                    actual.must.contain(expected);
                });
        });
    });

    describe('other', function () {
        it('must use only .styl file if an entity has multiple files', function () {
            var scheme = {
                    blocks: {
                        'block.css': [
                            'body {',
                            '  color: #fff;',
                            '}'
                        ].join(EOL),
                        'block.styl': [
                            'body {',
                            '  color: #000;',
                            '}'
                        ].join(EOL)
                    }
                },

                expected = [
                    'body{',
                    'color:#000;',
                    '}'
                ].join('');

            return build(scheme).then(function (actual) {
                actual.must.contain(expected);
            });
        });
    });
});

function build (scheme, options) {
    var baseScheme = {
            blocks: {},
            bundle: {},
            // jscs:disable
            node_modules: {
                stylus: stylus,
                nib: nib,
                autoprefixer: autoprefixer,
                csswring: csswring,
                postcss: postcss
            }
            // jscs:enable
        },
        commonScheme = deepExtend(baseScheme, scheme),
        commonOptions = deepExtend({ comments: false }, options);

    mockFs(commonScheme);

    var bundle = new MockNode('bundle'),
        fileList = new FileList();

    fileList.addFiles(loadDirSync('blocks'));
    bundle.provideTechData('?.files', fileList);

    return bundle.runTechAndGetContent(StylusTech, commonOptions).spread(function (content) {
        return (commonOptions.compress || commonOptions.comments) ? content : normalizeContent(content);
    });
}

/**
 * Remove all /r from file for do more truth test
 * @param {String} str - source text
 * @returns {String}
 */
function normalizeContent(str) {
    return str.replace(/\s+/g, '').trim();
}
