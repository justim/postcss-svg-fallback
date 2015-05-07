# svg-fallback

> An automatic SVG converter for your CSS files, built on top of the [PostCSS] ecosystem.

## Usage

Right now it is only possible to use this as a [PostCSS] plugin:

```js
var postcss = require('postcss')
var svgFallback = require('postcss-svg-fallback')

var input = read(/* read some css */);
var output = postcss()
	.use(svgFallback({
		basePath: '', // base path for the images found in the css
		dest: '', // destination for the generated SVGs
		fallbackSelector: '.no-svg', // selector that gets prefixed to selector
	})
	.process(input)
	.toString();
```

Converts this:

```css
.icon {
	background: url(images/sun-is-shining.svg) no-repeat;
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
```

Converting is done with [PhantomJS] and is only done for images that actually need conversion (`background-size` & `mtime`).

[PostCSS]: https://github.com/postcss/postcss
[PhantomJS]: http://phantomjs.org
