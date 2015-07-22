
/* global phantom, document */
'use strict';

var webpage = require('webpage');
var system = require('system');

var image = {
	image: system.args[1],
	size: {
		width: system.args[2],
		height: system.args[3]
	}
};

var dest = system.args[4];

var page = require('webpage').create();
page.open(image.image, function(status) {
	if (status !== 'success') {
		console.error('Could not open file');
		phantom.exit();
		return;
	}

	page.viewportSize = image.size;

	setTimeout(function() {
		page.render(dest);
		phantom.exit();
	}, 0);
});
