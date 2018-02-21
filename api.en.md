# Stylus technology API

Collects the source files of style blocks written in Stylus syntax (files with the `.styl` extension) or in pure CSS (files with the `.CSS` extension).

Uses the [Stylus](https://github.com/stylus/stylus) CSS preprocessor  to compile Stylus files into CSS code.

The result of the build is a CSS file. The [postcss](https://github.com/postcss/postcss) post processor is used for processing the resulting CSS.

### Options

* [target](#target)
* [filesTarget](#filestarget)
* [sourceSuffixes](#sourcesuffixes)
* [URL](#url)
* [imports](#imports)
* [sourcemap](#sourcemap)
* [autoprefixer](#autoprefixer)
* [prefix](#prefix)
* [compress](#compress)
* [comments](#comments)
* [globals](#globals)
* [includes](#includes)
* [use](#use)
* [useNib](#usenib)
* [importPaths](#importpaths)
* [inlineMaxSize](#inlinemaxsize)

#### target

Type: `String`. Default: `?.css`.

The name of the file for saving the build result with the necessary `.styl` and `.css` project files.

#### filesTarget

Type: `String`. Default: `?.files`.

The name of the target for accessing the list of source files for the build. The file list is provided by the [files](https://github.com/enb/enb-bem-techs/blob/master/docs/api/api.en.md#files) technology in the [enb-bem-techs](https://github.com/enb/enb-bem-techs/blob/master/README.md) package.

#### sourceSuffixes

Type: `String | String[]`. Default: `['styl', 'css']`.

The suffixes to use for filtering style files for the build.

#### url

Type: `String`. Default: `rebase`.

Processing `url()` in `.styl` and `.css` files.

*Acceptable values:*

* **inline** — The file content will be `base64`-encoded.

  > **Important!**
  >
  > * The default maximum size is `14kb`. You can change it in the `inlineMaxSize` option.
  > * Encoding is not supported for `.svg` files with a hash. Example: `url(image.svg#hash)`. This type of `url()` won't be processed.

* **rebase** — Changes the path to the content relative to the target.

  **Example**

  ```bash
  blocks/
  └── block/
      ├── block.styl
      └── block.png
  bundle/
  └── bundle.css # target
  ```

   Source `block.styl` file:

   ```css
   .block
       background-image: url(block.png)
   ```

   File for connecting `bundle.css` to the page:

   ```css
   .block
   {
     background-image: url(../../blocks/block/block.png);
   }
   ```

#### imports

Type: `String`. Default: `include`.

Detects CSS `@import`s.

*Acceptable values:*

* **include** — Deletes `@import` and replaces it with its content in the compiled file.

#### sourcemap

Type: `String | Boolean`. Default: `false`.

The source map with information about the source files.

*Acceptable values:*

* **true** — The source map is stored in a separate file with the `.map` extension.
* **inline** — The map is embedded in a compiled file as a `base64` line.

#### autoprefixer

Type: `Object | Boolean`. Default: `false`.

Adds vendor prefixes using [autoprefixer](https://github.com/postcss/autoprefixer).

*Acceptable values:*

* **false** — Disables `autoprefixer`.
* **true** — Prefixes are added for the latest browser versions based on data from the [caniuse.com](http://caniuse.com) service.
* **options** — Sets the configuration if an exact list of supported browsers must be passed.

  **Example**

  ```js
  {
      autoprefixer: { browsers: ['Explorer 10', 'Opera 12'] }
  }
  ```

  > **Note.** For more information, see the [Autoprefixer](https://github.com/postcss/autoprefixer#options) documentation.

#### prefix

Type: `String`. Default: `''`.

Adding a prefix for CSS classes.

**Important!** The option only works for files with the `.styl` extension.

#### compress

Type: `Boolean`. Default: `false`.

CSS minification. Support source maps.

#### comments

Type: `Boolean`. Default: `true`.

Wrapping CSS code in comments in the file. Comments contain the relative path to the source file. This can be useful during project development.

**Example**

```css
/* ../../blocks/block/block.styl:begin */
.block
{
    background-image: url(../../blocks/block/block.png);
}
/* ../../blocks/block/block.styl:end */
```

#### globals

Type: `String | String[]`. Default: `[]`.

Links `.styl` files with global variables, methods, or mixins at the beginning of the file.

#### includes

Type: `String | String[]`. Default: `[]`.

Specifies the paths to use when processing `@import`  and `url()`.
You can use it to connect third-party libraries such as `nib`.

**Important!** The option only works for files with the `.styl` extension.

### use

Type: `Function | Function[]`. Default: `[]`.

Enables plugins or a single plugin for Stylus [ via use()](https://github.com/stylus/stylus/blob/dev/docs/js.md#usefn)

**Important!** The option only works for files with the `.styl` extension.

### useNib

Type: `Boolean`. Default: `false`.

Connects the [nib](https://github.com/tj/nib) library of CSS3 mixins for Stylus.

**Important!** The option only works for files with the `.styl` extension.

### importPaths

Type: `String[]`. Default: `[]`.

Connects `.styl` files or directories with `index.styl` [via import()](https://github.com/stylus/stylus/blob/dev/docs/js.md#importpath)

**Important!** The option only works for files with the `.styl` extension.

### inlineMaxSize

Type: `Number`. Default: ` 14`.

The maximum file size in kilobytes that can be base64-encoded in `inline` mode.

**Example**

```js
var stylusTech = require('enb-stylus/techs/stylus'),
    FileProvideTech = require('enb/techs/file-provider'),
    nib = require('nib'),
    rupture = require('rupture'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.node('bundle', function(node) {
        // Getting the file names (FileList)
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            bemTechs.deps,
            bemTechs.files
        ]);

        // Creating CSS files
        node.addTech([stylusTech, {
            use: [nib(), rupture()],
            importPaths: [nib.path + '/nib']
        }]);
        node.addTarget('?.css');
    });
};
```

**License**

© 2014 YANDEX LLC. Code released under the [Mozilla Public License 2.0](LICENSE.txt).
