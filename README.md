# svg-fallback [![Build Status](https://secure.travis-ci.org/justim/postcss-svg-fallback.png)](https://travis-ci.org/justim/postcss-svg-fallback)

> An automatic SVG converter for your CSS files, built on top of the [PostCSS] ecosystem.

## Usage

Right now it is only possible to use this as a [PostCSS] plugin:

```js
var postcss = require('postcss')
var svgFallback = require('postcss-svg-fallback')

var input = read(/* read some css */);
postcss()
	.use(svgFallback({
		// base path for the images found in the css
		// this is most likely the path to the css file you're processing
		// not setting this option might lead to unexpected behavior
		basePath: '',

		// destination for the generated SVGs
		// this is most likely the path to where the generated css file is outputted
		// not setting this option might lead to unexpected behavior
		dest: '',

		// selector that gets prefixed to selector
		fallbackSelector: '.no-svg',

		// when `true` only the css is changed (no new files created)
		disableConvert: false,
	})
	.process(input)
	.then(function(processor) {
		var output = processor.toString();
	});
```

> Note: we must use the async version of postcss

Converts this:

```css
.icon {
	background: url(images/sun-is-shining.svg) no-repeat;
	background-size: 20px 20px; /* background-size is mandatory */
}

.icon-inline {
	background: url(data:image/svg+xml; .. svg data ..) no-repeat;
	background-size: 20px 20px; /* background-size is mandatory */
}
```

to this:

```css
.icon {
	/* original declarations are untouched */
	background: url(images/sun-is-shining.svg) no-repeat;
	background-size: 20px 20px;
}

/* same selector, but with a prefix */
.no-svg .icon {
	/* a png image is generated and placed in the `dest` folder,
	 * with default settings, that's right next to the original SVG
	 */
	background-image: url(images/sun-is-shining-20x20.png);
}

.icon-inline {
	background: url(data:image/svg+xml; .. svg data ..) no-repeat;
	background-size: 20px 20px; /* background-size is mandatory */
}

.no-svg .icon-inline {
	/* filename contains the hash of the svg data */
	background-image: url(3547c094eaf671040650cdcab2ca70fd-20x20.png);
}
```

Converting is done with [PhantomJS] and is only done for images that actually need conversion (`background-size` & `mtime`).

[PostCSS]: https://github.com/postcss/postcss
[PhantomJS]: http://phantomjs.org
