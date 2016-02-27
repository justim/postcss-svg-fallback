
/* global describe, beforeEach, it */
'use strict';

var fs = require('fs');

var expect = require('chai').expect;
var extend = require('extend');

var postcss = require('postcss');
var svgFallback = require('../index.js');


function transform(input, extraOptions) {
	var options = {
		basePath: 'test',
		dest: 'test',
	};

	if (extraOptions) {
		extend(true, options, extraOptions);
	}

	return postcss()
		.use(svgFallback(options))
		.process(input);
}

describe('svg-fallback', function() {

	describe('successful-file', function() {
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

	describe('successful-inline', function() {
		// same image as `test/images/email.svg`, but with removed new lines
		var inputCss = '.icon {\n' +
			'	background: url(data:image/svg+xml;utf8,<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="49.7 397.7 14.8 10.9" style="enable-background:new 49.7 397.7 14.8 10.9;" xml:space="preserve"><path d="M49.7,397.7v10.9h0h14.7h0v-10.9H49.7z M62.8,398.9l-5.7,4.4l-5.7-4.4H62.8z M51,400.2 l3.1,2.3l-3.1,3.1V400.2z M51,407.3l4-4l2.1,1.6l2.1-1.6l4,4H51L51,407.3z M63.2,405.6l-3.1-3.1l3.1-2.3V405.6z"/></svg>) no-repeat;\n' +
			'	background-size: 20px 20px;\n' +
			'}';

		// we expect the same input as output, plus an extra rule
		var expectedCssOutput = inputCss + '\n' +
			'.no-svg .icon {\n' +
			'	background-image: url(800f6893213eec77f13405f4a806b6c1-20x20.png);\n' +
			'}';

		var expectedImage = __dirname + '/images/expected-800f6893213eec77f13405f4a806b6c1-20x20.png';
		var generatedImagePath = __dirname + '/800f6893213eec77f13405f4a806b6c1-20x20.png';

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

		it('should not rewrite a file if hashes are equals', function(done) {
			return transform(inputCss).then(function() {
				fs.stat(generatedImagePath, function(generatedImageError, generatedStatsFirst) {
					if (!generatedImageError) {
						transform(inputCss).then(function() {
							fs.stat(generatedImagePath, function(generatedImageError, generatedStatsSecond) {
								if (!generatedImageError) {
									expect(generatedStatsSecond.mtime.getTime()).to.eql(generatedStatsFirst.mtime.getTime());
									done();
								} else {
									done(generatedImageError);
								}
							});
						});
					} else {
						done(generatedImageError);
					}
				});
			});
		});

	});

	describe('multiple-selector', function() {
		var inputCss = '.icon, .icon-2 {\n' +
			'	background: url(images/email.svg) no-repeat;\n' +
			'	background-size: 20px 20px;\n' +
			'}';

		// we expect the same input as output, plus an extra rule
		var expectedCssOutput = inputCss + '\n' +
			'.no-svg .icon, .no-svg .icon-2 {\n' +
			'	background-image: url(images/email-20x20.png);\n' +
			'}';
		var generatedImagePath = __dirname + '/images/email-20x20.png';

		// clean up side effects
		beforeEach(function(done) {
			fs.unlink(generatedImagePath, function() {
				done();
			});
		});

		it('should add prefix to each selector', function(done) {
			transform(inputCss).then(function(result) {
				expect(result.css).to.equal(expectedCssOutput);

				done();
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
