
'use strict';

var fs = require('fs');

var expect = require('chai').expect;

var postcss = require('postcss');
var svgFallback = require('../index.js');


function transform(input) {
	return postcss()
		.use(svgFallback({
			basePath: 'test',
			dest: 'test',
		}))
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
		var expectedImagePath = __dirname + '/images/email-20x20.png';

		// clean up side effects
		beforeEach(function(done) {
			fs.unlink(expectedImagePath, function() {
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
				fs.readFile(expectedImagePath, function(err, actualContents) {
					if (!err) {
						fs.readFile(expectedImage, function(err, expectedContents) {
							if (err) {
								done(err);
							} else if (actualContents.compare(expectedContents) !== 0) {
								done(new Error('png contents are not the same as expected'));
							} else {
								done();
							}
						});
					} else {
						done(err);
					}
				});
			});
		});

	});

});
