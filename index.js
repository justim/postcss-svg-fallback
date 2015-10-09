
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
	var disableConvert;
	options = options || {};

	fallbackSelector = options.fallbackSelector || '.no-svg';
	disableConvert = options.disableConvert || false;

	return function (css, result) {
		var images = [];

		css.eachRule(function(rule) {
			var backgroundImage;
			var backgroundSize;
			var newImage;
			var newRule;
			var newDecl;
			var matchedBackgroundImageDecl;

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
						matchedBackgroundImageDecl = decl;
					}
				}

				if (decl.prop === 'background-size') {
					backgroundSizeMatch = backgroundSizeRegex.exec(decl.value);

					if (backgroundSizeMatch) {
						backgroundSize = {
							width: parseInt(backgroundSizeMatch[1]),
							height: parseInt(backgroundSizeMatch[3] || backgroundSizeMatch[1]),
						};
					}
				}
			});

			if (backgroundImage && backgroundSize) {
				newImage = backgroundImage.replace(/\.svg$/, '-' + backgroundSize.width + 'x' + backgroundSize.height + '.png');

				images.push({
					postcssResult: result,
					postcssRule: rule,
					image: backgroundImage,
					newImage: newImage,
					size: backgroundSize,
				});

				newRule = postcss.rule({ selector: fallbackSelector + ' ' + rule.selector });
				newRule.source = rule.source;

				newDecl = postcss.decl({
					prop: 'background-image',
					value: 'url(' + newImage + ')',
				});
				newDecl.source = matchedBackgroundImageDecl.source;

				newRule.append(newDecl);
				rule.parent.insertAfter(rule, newRule);
			}
		});

		if (disableConvert) {
			return when.resolve();
		}

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
		dest,
	];

	fs.stat(source, function(sourceErr, sourceStat) {
		if (sourceStat) {
			fs.stat(dest, function(destErr, destStat) {
				if (!destStat || sourceStat.mtime > destStat.mtime) {
					runPhantomJs(args, cb);
				} else {
					cb();
				}
			});
		} else {
			image.postcssResult.warn(
				'Could not find "' + image.image + '" at "' + source + '"',
				{ node: image.postcssRule });

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
