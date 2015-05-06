
'use strict';

var path = require('path');
var fs = require('fs');

var postcss = require('postcss');
var async = require('async');
var when = require('when');
var phantomjs = require('phantomjs');
var childProcess = require('child_process');

var phantomjsScript = path.resolve(__dirname, './phantomjs-script.js');

var backgroundImageRegex = /url\('?([^')]+\.svg)'?\)/;
var backgroundSizeRegex = /^(\d+)px( (\d+)px)?$/;

module.exports = postcss.plugin('postcss-svg-fallback', function(options) {
	var fallbackSelector;
	options = options || {};

	fallbackSelector = options.fallbackSelector || '.no-svg';

	return function (css, result) {
		var images = [];

		css.eachRule(function(rule) {
			var backgroundImage;
			var backgroundSize;
			var newImage;
			var newRule;
			var newDecl;

			// skip our added rules
			if (rule.selector.indexOf(fallbackSelector) !== -1) {
				return;
			}

			rule.eachDecl(function(decl) {
				var backgroundImageMatch;
				var backgroundSizeMatch;

				if (decl.prop.match(/^background(-image)?$/)) {
					backgroundImageMatch = backgroundImageRegex.exec(decl.value);

					if (backgroundImageMatch) {
						backgroundImage = backgroundImageMatch[1];
					}
				}

				if (decl.prop === 'background-size') {
					backgroundSizeMatch = backgroundSizeRegex.exec(decl.value);

					if (backgroundSizeMatch) {
						backgroundSize = {
							width: parseInt(backgroundSizeMatch[1]),
							height: parseInt(backgroundSizeMatch[3] || backgroundSizeMatch[1])
						};
					}
				}
			});

			if (backgroundImage && backgroundSize) {
				newImage = backgroundImage.replace(/\.svg$/, '-' + backgroundSize.width + 'x' + backgroundSize.height + '.png');

				images.push({
					image: backgroundImage,
					newImage: newImage,
					size: backgroundSize
				});

				newRule = postcss.rule({ selector: fallbackSelector + ' ' + rule.selector });
				newDecl = postcss.decl({
					prop: 'background-image',
					value: 'url(' + newImage + ')'
				});

				newRule.append(newDecl);
				rule.parent.insertAfter(rule, newRule);
			}
		});

		return when.promise(function(resolve, reject) {
			async.eachSeries(images, processImage.bind(null, options), function(err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	};
});

function processImage(options, image, cb) {
	var source = path.resolve(options.basePath || '', image.image);
	var dest = path.resolve(options.dest || '', image.newImage);

	var args = [
		phantomjsScript,
		source,
		image.size.width,
		image.size.height,
		dest
	];

	async.map([source, dest], fs.stat, function(err, rs) {
		if (rs[0]) {
			if (!rs[1] || rs[0].mtime > rs[1].mtime) {
				runPhantomJs(args, cb);
			} else {
				cb();
			}
		} else {
			cb();
		}
	});
}

function runPhantomJs(args, cb) {
	childProcess.execFile(phantomjs.path, args, function(err, stdout, stderr) {
		if (err) {
			cb(err);
		} else if (stdout.length) {
			cb(stdout.toString().trim());
		} else if (stderr.length) {
			cb(stderr.toString().trim());
		} else {
			cb();
		}
	});
}
