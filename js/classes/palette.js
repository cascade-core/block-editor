/**
 * palette class
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {BlockEditor} editor - plugin instance
 * @class
 * @todo autocomplete filter vedle selectu
 * @todo dummy block bez typy na zacatek palety - zvyraznit pokud ma neexistujici typ
 */
var Palette = function(editor, blocks) {
	this.editor = editor;
	this.canvas = editor.canvas;
	this.blocks = blocks;
	this.toolbar = new Toolbar(editor, this);
};

/**
 * Creates palette filter
 *
 * @returns {jQuery}
 * @private
 */
Palette.prototype._createFilter = function() {
	this.$filter = $('<select>');

	var opts = {'*': '*'};
	for (var type in this.blocks) {
		var t = type.replace(/\/[^\/]*$/, '').replace(/\//g, '-');
		opts[t] = type.replace(/\/[^\/]*$/, '');
	}
	for (var t in opts) {
		var $option = $('<option>').text(opts[t]);
		$option.val(t);
		this.$filter.append($option);
	}

	var className = BlockEditor._namespace + '-filter';
	this.$filter.addClass(className);
	$(document).off('change.palette', 'select.' + className).on('change.palette', 'select.' + className, this._filter.bind(this));
	return this.$filter;
};

/**
 * Renders palette
 */
Palette.prototype.render = function() {
	if (this.$container) {
		this.$container.remove();
	}

	this.$container = $('<div>');
	this.$container.addClass(BlockEditor._namespace + '-palette');

	// toolbar
	this.toolbar.render(this.editor.$container);

	// filter
	var $filter = this._createFilter();
	this.$container.append($filter);

	// blocks
	for (var id in this.blocks) {
		var b = new Placeholder(id, this.blocks[id], this.editor);
		b._create();
		this.$container.append(b.$container);
	}

	this.editor.$container.append(this.$container);
};

/**
 * Filters blocks inside palette
 *
 * @param {MouseEvent} e - Event
 * @returns {boolean}
 * @private
 */
Palette.prototype._filter = function(e) {
	if ($(e.target).val() === '*') {
		var className = BlockEditor._namespace + '-block';
	} else {
		var className = BlockEditor._namespace + '-filter-' + $(e.target).val();
	}

	this.$container.find('.' + BlockEditor._namespace + '-block').hide();
	this.$container.find('.' + className).show();

	return false;
};

/**
 * Reloads palette data via AJAX
 *
 * @param {function} callback - triggered when loading done
 */
Palette.prototype.reload = function(callback) {
	var self = this;
	$.get(this.editor.options.paletteData).done(function(data) {
		if (self.editor.storage.get('palette', true) !== data) {
			self.blocks = data;
			self.render();
		}
		callback.call(data);
	});
};
