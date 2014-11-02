/**
 * palette class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Palette = function(editor, blocks, docLink) {
	this.editor = editor;
	this.canvas = editor.canvas;
	this.blocks = blocks;
	this.docLink = docLink;
};

Palette.prototype.render = function() {
	this.$container = $('<div>');
	this.$container.addClass(BlockEditor._namespace + '-palette');

	// buttons
	var $fullscreen = $('<a>');
	$fullscreen.text('F');
	$fullscreen.attr('href', '#fullscreen');
	$fullscreen.addClass(BlockEditor._namespace + '-fullscreen-toggle');
	$fullscreen.on('click', this._toggleFullScreen.bind(this));
	this.$container.append($fullscreen);

	// blocks
	for (var id in this.blocks) {
		var b = new Block(id, this.blocks[id], this.editor, true);
		b._create();
		this.$container.append(b.$container);
	}

	this.editor.$container.append(this.$container);
};

Palette.prototype._toggleFullScreen = function() {
	this.editor.$container.toggleClass(BlockEditor._namespace + '-fullscreen');
	this.canvas.$container.css({
		width: '100%',
		height: '100%'
	});
	this.canvas.redraw();

	return false;
};
