/**
 * Block Editor 2.0
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {HTMLElement} el - textarea element
 * @param {Array} [options]
 * @class
 */
var BlockEditor = function(el, options) {
	/** @property {jQuery} $el plugin data variable name */
    this.$el = $(el);
	this.debug = false;

	/** @property {string} defaults default options */
	this.defaults = {
		viewOnly: false,
		paletteData: '/admin/block-editor-palette.json',
		historyLimit: 1000, // count of remembered changes,
		splineTension: 0.3, // used to render connections, more means higher elasticity of connections
		canvasOffset: 30, // px start rendering blocks from top left corner of diagram - canvasOffset
		canvasExtraWidth: 1500, // px added to each side of diagram bounding box
		canvasExtraHeight: 1500, // px added to each side of diagram bounding box
		canvasSpeed: 2, // Mouse pan multiplication (when mouse moves by 1 px, canvas scrolls for pan_speed px).
		canvasBackgroundColor: '#fff',
		canvasBackgroundLineColor: '#eef',
		canvasBackgroundLineStep: 10 // px
	};

	// create namespaced storages
	this.session = new Storage(sessionStorage, BlockEditor._namespace);
	this.storage = new Storage(localStorage, BlockEditor._namespace);

	// options stored in data attribute
	var meta = this.$el.data(this._namespace + '-opts');

	// merge all options together
	this.options = $.extend(this.defaults, options, meta);

	// reference to self
    this.$el.data(BlockEditor._namespace, this);

	// init block editor
	this._createContainer();
	this._init();

	if (this.options.viewOnly && 'C2S' in window) {
		this.canvas.redraw();
	}
};

/** @property {string} _namespace plugin namespace */
BlockEditor._namespace = 'block-editor';

/**
 * Creates container
 */
BlockEditor.prototype._createContainer = function() {
	this.$container = $('<div>');
	this.$container.attr('class', BlockEditor._namespace);
	this.$container.css({
		width: this.$el.width(),
		height: this.$el.height()
	});
	this.$el.after(this.$container).hide();
};

/**
 * Initialization, loads palette data via AJAX
 *
 * @private
 */
BlockEditor.prototype._init = function() {
	// reset undo & redo history when URL changed (new block loaded)
	if (this.session.get('url') !== location.href) {
		this.session.set('url', location.href);
		this.session.reset('undo');
		this.session.reset('redo');
	}

	// reset zoom
	this.session.set('zoom', 1.0);

	// load palette data from cache and trigger reloading
	var self = this;
	var callback = function(data) {
		self.storage.set('palette', data, true);
		self.canvas = new Canvas(self); // create canvas
		self.palette = new Palette(self, data); // create blocks palette
		self.processData(); // load and process data from <textarea>
		self.box = self.getBoundingBox();
		self.canvas.render(self.box);
		self.palette.render();
		self.render();
		self.canvas.$container.scroll(); // force scroll event to save center of viewport
	};
	var palette = this.storage.get('palette', true);
	if (palette) {
		callback(palette); // load instantly from cache
		setTimeout(function() {
			self.palette.toolbar.$reload.click(); // and trigger reloading immediately
		}, 100);
	} else {
		$.get(this.options.paletteData).done(callback);
	}
};

/**
 * Parses <textarea> data and initializes parent block properties and child blocks
 */
BlockEditor.prototype.processData = function() {
	this.data = JSON.parse(this.$el.val());
	this.blocks = {};

	// parent block properties
	this.properties = {};
	for (var opt in this.data) {
		if (opt !== 'blocks') {
			this.properties[opt] = this.data[opt];
		}
	}

	// blocks
	if (this.data.blocks) {
		for (var id in this.data.blocks) {
			this.blocks[id] = new Block(id, this.data.blocks[id], this);
		}
	}
};

/**
 * Renders block editor
 */
BlockEditor.prototype.render = function() {
	// render all blocks first to get their offset
	for (var id in this.blocks) {
		this.blocks[id].render();
	}

	// then render connections
	var t0 = performance.now();
	for (var id in this.blocks) {
		this.blocks[id].renderConnections();
	}
	var t1 = performance.now();
	if (this.debug) {
		console.log("initial connections rendering: " + (t1 - t0) + " ms");
	}

	// scroll to top left corner of diagram bounding box
	var top = this.box.minY - this.options.canvasOffset + this.canvas.options.canvasExtraWidth;
	var left = this.box.minX - this.options.canvasOffset + this.canvas.options.canvasExtraHeight;
	this.canvas.$container.scrollTop(top);
	this.canvas.$container.scrollLeft(left);
};

/**
 * Finds diagram bounding box
 *
 * @param {boolean} [active] - Process all or only active blocks
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
 */
BlockEditor.prototype.getBoundingBox = function(active) {
	var minX = Infinity, maxX = -Infinity;
	var minY = Infinity, maxY = -Infinity;

	for (var id in this.blocks) {
		var b = this.blocks[id];
		if (active && !b.isActive()) {
			continue;
		}
		minX = Math.min(minX, b.x);
		maxX = Math.max(maxX, b.x + (b.$container ? b.$container.outerWidth() : 100));
		minY = Math.min(minY, b.y);
		maxY = Math.max(maxY, b.y + (b.$container ? b.$container.outerHeight() : 100));
	}

	return {
		minX: minX, maxX: maxX,
		minY: minY, maxY: maxY
	};
};

/**
 * Refreshes editor based on <textarea> data
 */
BlockEditor.prototype.refresh = function() {
	// remove old blocks
	for (var id in this.blocks) {
		this.blocks[id].$container.remove();
	}

	// update data
	this.processData();

	// redraw all blocks
	for (var id in this.blocks) {
		this.blocks[id].render();
	}

	// then re-render connections
	this.canvas.redraw();
};

/**
 * Adds new block to this editor instance
 *
 * @param {string} id - New block identification
 * @param {Object} data - JSON object with block data
 */
BlockEditor.prototype.addBlock = function(id, data) {
	this.blocks[id] = new Block(id, data, this);
	this.blocks[id].render();
	this.onChange();
};

/**
 * On change handler, propagates changes to <textarea>
 */
BlockEditor.prototype.onChange = function() {
	// normalize string from textarea
	var oldData = JSON.stringify(JSON.parse(this.$el.val()));
	var newData = this.serialize();
	if (oldData !== newData) {
		// save new history state
		var undo = this.session.get('undo', true);
		undo = undo || [];
		undo.push(oldData);
		if (undo.length > this.options.historyLimit) {
			undo.splice(0, undo.length - this.options.historyLimit);
		}
		this.session.set('undo', undo, true);
		this.session.reset('redo');
	}

	this.palette.toolbar.updateDisabledClasses();

	// set data to textarea
	this.$el.val(newData);
};

/**
 * Serializes all blocks and parent block information to JSON string
 *
 * @returns {string}
 */
BlockEditor.prototype.serialize = function() {
	var blocks = {};
	for (var i in this.blocks) {
		var b = this.blocks[i];
		blocks[b.id] = b.serialize();
	}

	var ret = {
		'_': this.properties._, // security
		'blocks': blocks
	};
	for (var t in this.properties) {
		ret[t] = this.properties[t];
	}

	return JSON.stringify(ret);
};

/**
 * Creates help modal window
 *
 * @private
 */
BlockEditor.prototype._createHelp = function() {
	var html = '<h2>Block Editor Help</h2>';
	html += '<ul>';
	html += '<li>Hold <kbd>ctrl</kbd> and drag canvas with mouse to move around</li>';
	html += '<li>To append new blocks to this fragment, move mouse cursor to the left side of editor to show palette; then drag block from palette to canvas</li>';
	html += '<li>To move block on canvas, drag it on its header</li>';
	html += '<li>To change block name or type, double click on it</li>';
	html += '<li>When selecting multiple blocks, selection from left to right will select only fully overlapping blocks. Selection from right to left will also select partially overlapping blocks. </li>';
	html += '</ul>';
	this.$help = $('<div>').addClass(BlockEditor._namespace + '-help-modal');
	this.$help.html(html);
	var $close = $('<a href="#close">&times;</a>');
	$close.addClass(BlockEditor._namespace + '-close');
	$close.on('click', function() {
		this.$help.remove();
		delete this.$help;
		return false;
	}.bind(this));
	this.$help.append($close);
	this.$container.append(this.$help);
};

BlockEditor.prototype.toggleHelp = function() {
	if (this.$help) {
		this.$help.remove();
		delete this.$help;
	} else {
		this._createHelp();
	}
};

/**
 * Removes editor instance
 *
 * @fixme fails when editor was not properly initialized (e.g. ajax load of palette not done yet)
 */
BlockEditor.prototype.destroy = function() {
	this.$container.remove();
	delete this.$container;
	$(document).off('keydown.palette');
	$(document).off('keydown.editor');
	this.$el.find('*').off('.' + this._namespace);
	this.$el.removeData(this._namespace);
	this.$el.show();
	this.$el = null;
};
