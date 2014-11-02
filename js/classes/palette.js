/**
 * palette class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Palette = function(editor, blocks, docLink) {
	this.editor = editor;
	this.blocks = blocks;
	this.docLink = docLink;
};

Palette.prototype.render = function() {
	this.$container = $('<div>');
	this.$container.addClass(BlockEditor._namespace + '-palette');

	// buttons
	// todo
//	this.$container.append('paleta');

	// blocks
	for (var id in this.blocks) {
		var b = new Block(id, this.blocks[id], this.editor, true);
		b._create();
		this.$container.append(b.$container);
	}

	this.editor.$container.append(this.$container);
};
