
/* global describe, beforeEach, it */
'use strict';

var fs = require('fs');

var expect = require('chai').expect;

var postcss = require('postcss');
var svgFallback = require('../index.js');


function transform(input, extraOptions) {
	var options = {
		basePath: 'test',
		dest: 'test',
	};

	if (extraOptions && extraOptions.disableConvert) {
		options = extraOptions.disableConvert;
	}

	return postcss()
		.use(svgFallback(options))
		.process(input);
}


describe('svg-fallback', function() {

	describe('successful', function() {
		var inputCss = '.icon {\n' +
			'	background: url(images/email.svg) no-repeat;\n' +
			'	background-size: 20px 20px;\n' +
			'}';

		// we expect the same input as output, plus an extra rule
		var expectedCssOutput = inputCss + '\n' +
			'.no-svg .icon {\n' +
			'	background-image: url(images/email-20x20.png);\n' +
			'}';

		var expectedImage = __dirname + '/images/expected-email-20x20.png';
		var generatedImagePath = __dirname + '/images/email-20x20.png';

		// clean up side effects
		beforeEach(function(done) {
			fs.unlink(generatedImagePath, function() {
				done();
			});
		});

		it('should convert css to include the newly added rule', function(done) {
			transform(inputCss).then(function(result) {
				expect(result.css).to.equal(expectedCssOutput);

				done();
			}).catch(done);
		});

		it('should create a correct png file as a side effect', function(done) {
			return transform(inputCss).then(function() {
				fs.readFile(generatedImagePath, function(generatedImageError, actualContents) {
					if (!generatedImageError) {
						fs.readFile(expectedImage, function(expectedImageError, expectedContents) {
							if (expectedImageError) {
								done(expectedImageError);
							} else if (actualContents.compare(expectedContents) !== 0) {
								done(new Error('png contents are not the same as expected'));
							} else {
								done();
							}
						});
					} else {
						done(generatedImageError);
					}
				});
			});
		});

		it ('should change the css without create new files (when option set)', function(done) {
			var options = {
				disableConvert: true,
			};

			return transform(inputCss, options).then(function(result) {
				expect(result.css).to.equal(expectedCssOutput);

				fs.stat(generatedImagePath, function(generatedImageError) {
					if (generatedImageError) {
						done();
					} else {
						done(new Error('file was created when expected not to'));
					}
				});
			}).catch(done);
		});

	});

	describe('warnings', function() {

		it ('should emit one warning when file is not found', function(done) {
			var input = '.icon {\n' +
				'	background: url(images/non-existent.svg) no-repeat;\n' +
				'	background-size: 20px 20px;\n' +
				'}';

			return transform(input).then(function(result) {
				var totalWarnings = result.warnings().length;

				if (totalWarnings === 1) {
					done();
				} else if (totalWarnings === 0) {
					done(new Error('no warnings were emitted'));
				} else {
					done(new Error('too many warnings were emitted: ' + totalWarnings));
				}
			}).catch(done);
		});

	});

});
