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

	/** @property {string} defaults default options */
	this.defaults = {
		paletteData: '/admin/block-editor-palette.json',
		historyLimit: 1000, // count of remembered changes,
		canvasOffset: 30, // px start rendering blocks from top left corner of diagram - canvasOffset
		canvasExtraWidth: 1000, // px added to each side of diagram bounding box
		canvasExtraHeight: 1000, // px added to each side of diagram bounding box
		canvasSpeed: 2, // Mouse pan multiplication (when mouse moves by 1 px, canvas scrolls for pan_speed px).
		canvasBackgroundColor: '#fff',
		canvasBackgroundLineColor: '#eef',
		canvasBackgroundLineStep: 10 // px
	};

	// options stored in data attribute
	var meta = this.$el.data(this._namespace + '-opts');

	// merge all options together
	this.options = $.extend(this.defaults, options, meta);

	// reference to self
    this.$el.data(BlockEditor._namespace, this);

	// init block editor
	this._createContainer();
	this._init();
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
	if (sessionStorage.url !== location.href) {
		sessionStorage.url = location.href;
		sessionStorage.removeItem('undo');
		sessionStorage.removeItem('redo');
	}

	// reset zoom
	sessionStorage.zoom = 1.0;

	// load palette data from cache and trigger reloading
	var self = this;
	var callback = function(data) {
		localStorage.palette = JSON.stringify(data);
		self.canvas = new Canvas(self); // create canvas
		self.palette = new Palette(self, data); // create blocks palette
		self.processData(); // load and process data from textarea
		self.box = self._getBoundingBox();
		self.canvas.render(self.box);
		self.palette.render();
		self.render();
		self.canvas.$container.scroll(); // force scroll event to save center of viewport
	};
	if (localStorage.palette) {
		callback(JSON.parse(localStorage.palette)); // load instantly from cache
		setTimeout(function() {
			self.palette.toolbar.$reload.click(); // and trigger reloading immediately
		}, 100);
	} else {
		$.get(this.options.paletteData).done(callback);
	}
};

/**
 * Parses textarea data and initializes parent block properties and child blocks
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
	for (var id in this.blocks) {
		this.blocks[id].renderConnections();
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
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
 * @private
 */
BlockEditor.prototype._getBoundingBox = function() {
	var minX = Infinity, maxX = -Infinity;
	var minY = Infinity, maxY = -Infinity;

	for (var id in this.blocks) {
		minX = Math.min(minX, this.blocks[id].x);
		maxX = Math.max(maxX, this.blocks[id].x);
		minY = Math.min(minY, this.blocks[id].y);
		maxY = Math.max(maxY, this.blocks[id].y);
	}

	return {
		minX: minX, maxX: maxX,
		minY: minY, maxY: maxY
	};
};

/**
 * Refreshes editor based on textarea data
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
 * On change handler, propagates changes to textarea
 */
BlockEditor.prototype.onChange = function() {
	// normalize string from textarea
	var oldData = JSON.stringify(JSON.parse(this.$el.val()));
	var newData = this.serialize();
	if (oldData !== newData) {
		// save new history state
		var undo = sessionStorage.undo ? JSON.parse(sessionStorage.undo) : [];
		undo.push(oldData);
		if (undo.length > this.options.historyLimit) {
			undo.splice(0, undo.length - this.options.historyLimit);
		}
		sessionStorage.undo = JSON.stringify(undo);
		sessionStorage.removeItem('redo');
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
