
'use strict';

var fs = require('fs');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var should = chai.should();

var postcss = require('postcss');
var svgFallback = require('../index.js');


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


function transform(input) {
	return postcss()
		.use(svgFallback({
			basePath: 'test',
			dest: 'test',
		}))
		.process(input);
}


describe('svg-fallback', function() {

	// clean up side effects
	beforeEach(function(done) {
		fs.unlink(expectedImagePath, function(err) {
			done();
		});
	});

	it('should convert css to include the newly added rule', function(done) {
		return transform(inputCss).should.eventually.to.have.property('css').that.equals(expectedCssOutput).notify(done);
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
