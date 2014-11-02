/*
 * Block Editor 2.0
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var BlockEditor = function(el, options) {
	// plugin data variable name
    this.$el = $(el);

	// default options
	this.defaults = {
		paletteData: '/admin/block-editor-palette.json',
		canvasOffset: 500, // px start rendering blocks from top left corner + canvasOffset
		canvasWidth: 2000,
		canvasHeight: 2000,
		canvasSpeed: 2, // Mouse pan multiplication (when mouse moves by 1 px, canvas scrolls for pan_speed px).
		canvasBackgroundColor: '#fff',
		canvasBackgroundLineColor: '#eeeeff',
		canvasBackgroundLineStep: 10 // px
	};

	// options stored in data attribute
	var meta = this.$el.data(this._namespace + '-opts');

	// merge all options together
	this.options = $.extend(this.defaults, options, meta);

	// reference to self
    this.$el.data(this._namespace, this);

	// init block editor
	this.init();
};

// plugin namespace
BlockEditor._namespace = 'block-editor';

BlockEditor.prototype.init = function() {
	// create container
	this.$container = $('<div>');
	this.$container.attr('class', BlockEditor._namespace);
	this.$el.after(this.$container).hide();

	this.canvas = new Canvas(this); // create canvas
//	this._bind();

	var self = this;
	$.get(this.options.paletteData).done(function(data) {
		self.palette = new Palette(self, data, self.$el.data('doc_link')); // create blocks palette
		self.palette.render();
		self.processData(); // load and process data from textarea
		self.render();
	});
};

BlockEditor.prototype.processData = function() {
	this.data = JSON.parse(this.$el.val());
	this.blocks = {};
	if (this.data.blocks) {
		for (var id in this.data.blocks) {
			this.blocks[id] = new Block(id, this.data.blocks[id], this);
		}
	}
};

BlockEditor.prototype.render = function() {
	// render all blocks first to get their offset
	for (var id in this.blocks) {
		this.blocks[id].render();
	}

	// then render connections
	for (var id in this.blocks) {
		this.blocks[id].renderConnections();
	}

	// scroll to relative zero
	this.canvas.$container.scrollTop(this.options.canvasOffset - 45);
	this.canvas.$container.scrollLeft(this.options.canvasOffset - 45);
};

// todo
//BlockEditor.prototype.destroy = function() {
//	this.$el.off('.' + this._namespace);
//	this.$el.find('*').off('.' + this._namespace);
//	this.$el.removeData(this._namespace);
//	this.$el = null;
//};
