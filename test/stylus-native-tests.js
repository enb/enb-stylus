/**
 * Running of the original tests of stylus module
 */

var fs = require('fs'),
    path = require('path'),
    mockFs = require('mock-fs'),
    mockFsHelper = require(path.join(__dirname, 'lib', 'mock-fs-helper')),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    StylusTech = require('../techs/stylus'),
    stylusDir = path.join(__dirname, 'fixtures', 'stylus', 'test'),
    casesMock = mockFsHelper.duplicateFSInMemory(path.join(stylusDir, 'cases')),
    imagesMock = mockFsHelper.duplicateFSInMemory(path.join(stylusDir, 'images')),
    stylus = mockFsHelper.duplicateFSInMemory(path.join(__dirname, 'fixtures', 'stylus')),
    postcss = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'postcss')),
    postcssImport = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'postcss-import')),
    postcssUrl = mockFsHelper.duplicateFSInMemory(path.resolve('node_modules', 'postcss-url')),
    stylusCasesIgnores = [
        // File is`t included in the test cases
        'index',

        // it is expected in advance is`t valid css, which then cannot be parse by postcss
        'bifs.remove',
        'escape',
        'for.complex',
        'object',
        'operators',

        // not use native stylus compress option,
        // by default, compression is a `postcss` plugin `csswring`
        'atrules.compressed',
        'compress.units',
        'regression.248.compressed',
        'compress.comments',

        // enb-technology `stylus` not use option `hoist atrules`
        'hoist.at-rules',

        // skip this test, because on BEM project we don't need to check
        // for the file while you override links on stylus
        // for history: https://github.com/stylus/stylus/issues/1951
        'import.include.resolver.nested',

        // The skipped tests cases for which written tests inside the package enb-stylus.
        // It need to take into account the work stylus + postcss
        'functions.url',
        'import.include.complex',
        'import.include.function',
        'import.include.in.function',
        'import.include.resolver.absolute',
        'import.include.resolver.images',
        'import.include.megacomplex',
        'require.include',

        // Does not work when disclosure @import
        'bifs.selector.exitsts',
        'introspection',
        'media.complex',
        'object.complex',
        'supports',

        // Does not work in NodeJS 4
        'bifs.use',
        'import.lookup'
    ];

addSuite('cases', readDir(stylusDir + '/cases', '.styl'), function (test, done) {
    // Expected css for this test
    // stylusDir + '/cases/' + test + '.css'
    var css = mockFsHelper.readFile(path.join(stylusDir, 'cases', test + '.css'), true),
        // base scheme for mock, contain requiring images and cases
        fsScheme = {
            cases: casesMock,
            images: imagesMock,
            // jscs:disable
            node_modules: {
                stylus: stylus,
                postcss: postcss,
                'postcss-import': postcssImport,
                'postcss-url': postcssUrl
            }
            // jscs:enable
        };

    // mock file system
    mockFs(fsScheme);

    var node = new MockNode('cases'),
        fileList = new FileList();

    fileList.addFiles([{
        fullname: 'cases/' + test + '.styl',
        name: test + '.styl',
        suffix: 'styl'
    }]);
    node.provideTechData('?.files', fileList);

    node.runTechAndGetContent(
        StylusTech, {
            includes: ['./images', './cases/import.basic'],
            prefix: test.indexOf('prefix.') !== -1 && 'prefix-',

            // non stylus option
            comments: false,
            imports: (test.indexOf('include') !== -1 || test.indexOf('import.include.resolver.css-file') !== -1) &&
                'include',
            url: test.indexOf('resolver') !== -1 && 'rebase' || test.indexOf('functions.url') !== -1 && 'inline'
        }
    )
    .spread(function (source) {
        var processedSource = mockFsHelper.normalizeFile(source),
            processedCss = mockFsHelper.normalizeFile(css);

        processedSource.must.eql(processedCss);
        mockFs.restore();
        done();
    })
    .fail(function (err) {
        mockFs.restore();
        done(err);
    });
}, stylusCasesIgnores);

/**
 * Helper for generating test by passed arguments
 * @param {String} desc - description
 * @param {String[]} cases - case names
 * @param {Function} fn - callback
 * @param {String[]} ignores — case names to ignore
 */
function addSuite(desc, cases, fn, ignores) {
    describe(desc, function () {
        cases.forEach(function (test) {
            var name = normalizeTestName(test);

            // skip some test, that non important for working enb-stylus technology
            if (ignores && ignores.indexOf(test) === -1) {
                it(name, function (done) {
                    fn(test, done);
                });
            }
        });
    });
}

/**
 * Helper for reading and filter files in passed dir by extensions
 * @param {String} dir - dir filename
 * @param {String} ext - extention
 * @returns {*}
 */
function readDir(dir, ext) {
    ext = ext || '.styl';

    return fs.readdirSync(dir)
        .filter(function (file) {
            return file.indexOf(ext) !== -1;
        })
        .map(function (file) {
            return file.replace(ext, '');
        });
}

/**
 * Normalize name for add title to test, remove dash and dots
 * @param {String} name - source name of test file
 * @returns {String}
 */
function normalizeTestName(name) {
    return name.replace(/[-.]/g, ' ');
}
