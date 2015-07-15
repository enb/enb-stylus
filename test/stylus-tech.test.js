var fs = require('fs'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    mockFs = require('mock-fs'),
    mockFsHelper = require(path.join(__dirname, 'lib', 'mock-fs-helper')),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    StylusTech = require('../techs/stylus'),
    stylus = mockFsHelper.duplicateFSInMemory(path.join(__dirname, 'fixtures', 'stylus'));

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
                    'block.styl': '@require "../plugins/file.styl"\n' +
                                  '@require "../plugins/file.styl"'
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
                        'block.styl': 'body { background-image: url(images/block.jpg) }   ' +
                                      'div { background-image: url(images/block.png) }    ' +
                                      'section { background-image: url(images/block.gif) }'
                    }
                },
                expected = 'body{background-image:url(\"data:image/jpeg;base64,YmxvY2sgaW1hZ2U=\");}' +
                         'div{background-image:url(\"data:image/png;base64,YmxvY2sgaW1hZ2U=\");}' +
                         'section{background-image:url(\"data:image/gif;base64,YmxvY2sgaW1hZ2U=\");}';

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
                        'block.styl': 'body { background-image: url(http://foo.com/foo.css) } ' +
                                      'div { background-image: url(https://foo.com/foo.css) } ' +
                                      'section { background-image: url(//foo.com/foo.css) }   '
                    }
                },
                expected = 'body{background-image:url(\"http://foo.com/foo.css\");}' +
                           'div{background-image:url(\"https://foo.com/foo.css\");}' +
                           'section{background-image:url(\"//foo.com/foo.css\");}';

            return build(scheme, { url: 'rebase' }).then(function (actual) {
                actual.must.equal(expected);
            });
        });
    });

    describe('autoprefixer', function () {
        it('must add vendor prefixes from browserlist', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body {          ' +
                                      '  color: #000;  ' +
                                      '  display: flex;' +
                                      '}               '
                    }
                },
                expected = 'body{' +
                                'color:#000;' +
                                'display:-webkit-box;' +
                                'display:-webkit-flex;' +
                                'display:-ms-flexbox;' +
                                'display:flex;' +
                           '}';

            return build(scheme, { autoprefixer: true }).then(function (actual) {
                actual.must.equal(expected);
            });
        });

        it('must add vendor prefixes from browser config', function () {
            var scheme = {
                    blocks: {
                        'block.styl': 'body {          ' +
                        '  color: #000;  ' +
                        '  display: flex;' +
                        '}               '
                    }
                },
                expected = 'body{' +
                    'color:#000;' +
                    'display:-ms-flexbox;' +
                    'display:flex;' +
                    '}',
                browsersConfig = ['Explorer 10'];

            return build(scheme, { autoprefixer: { browsers: browsersConfig } }).then(function (actual) {
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
});

function build (scheme, options) {
    var baseScheme = {
            blocks: {},
            bundle: {},
            // jscs:disable
            node_modules: {
                stylus: stylus
            }
            // jscs:enable
        },
        commonScheme = deepExtend(baseScheme, scheme),
        commonOptions = deepExtend({ comments: false }, options);

    mockFs(commonScheme);

    var bundle = new MockNode('bundle'),
        fileList = new FileList();

    fileList.loadFromDirSync('blocks');
    bundle.provideTechData('?.files', fileList);

    return bundle.runTechAndGetContent(StylusTech, commonOptions).spread(function (content) {
        return normalizeContent(content);
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
