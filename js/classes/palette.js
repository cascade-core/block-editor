/**
 * palette class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 *
 * @todo autocomplete filter vedle selectu
 * @todo novy block / infinite loop na nove jmeno / neztracet hodnotu
 * @todo font awesome podminene ikonky
 * @todo dummy block bez typy na zacatek palety - zvyraznit pokud ma neexistujici typ
 */
var Palette = function(editor, blocks, docLink) {
	this.editor = editor;
	this.canvas = editor.canvas;
	this.blocks = blocks;
	this.docLink = docLink;
};

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

	className = BlockEditor._namespace + '-filter';
	this.$filter.addClass(className);
	$(document).off('change.palette').on('change.palette', 'select.' + className, this._filter.bind(this));
	return this.$filter;
};

Palette.prototype.render = function() {
	this.$container = $('<div>');
	this.$container.addClass(BlockEditor._namespace + '-palette');

	// toolbar
	this.$toolbar = $('<div>');
	this.$toolbar.addClass(BlockEditor._namespace + '-toolbar');

	// fullscreen button
	var $fullscreen = $('<a>');
	var className = BlockEditor._namespace + '-fullscreen-toggle';
	$fullscreen.text('F');
	$fullscreen.attr('title', 'Toggle fullscreen');
	$fullscreen.attr('href', '#fullscreen');
	$fullscreen.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleFullScreen.bind(this));
	this.$toolbar.append($fullscreen);

	// parent block properties button
	var $parent = $('<a>');
	className = BlockEditor._namespace + '-parent-properties-toggle';
	$parent.text('P');
	$parent.attr('title', 'Edit parent block properties');
	$parent.attr('href', '#parent-properties');
	$parent.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleParentProperties.bind(this));
	this.$toolbar.append($parent);

	// copy button
	var $copy = $('<a>');
	className = BlockEditor._namespace + '-copy';
	$copy.text('C');
	$copy.attr('title', 'Copy active block');
	$copy.attr('href', '#copy');
	$copy.addClass(className);
	$(document).on('click', 'a.' + className, this._copy.bind(this));
	this.$toolbar.append($copy);

	// cut button
	var $cut = $('<a>');
	className = BlockEditor._namespace + '-cut';
	$cut.text('X');
	$cut.attr('title', 'Cut active block');
	$cut.attr('href', '#cut');
	$cut.addClass(className);
	$(document).on('click', 'a.' + className, this._cut.bind(this));
	this.$toolbar.append($cut);

	// paste button
	var $paste = $('<a>');
	className = BlockEditor._namespace + '-paste';
	$paste.text('P');
	$paste.attr('title', 'Paste block');
	$paste.attr('href', '#paste');
	$paste.addClass(className);
	$(document).on('click', 'a.' + className, this._paste.bind(this));
	this.$toolbar.append($paste);

	// filter
	var $filter = this._createFilter();
	this.$toolbar.append($filter);

	// key bindings
	//$(document).off('keyup.palette').on('keyup.palette', this._keyup.bind(this));

	// disable selection
	$(document).off('click.disable-selection', this.canvas).on('click.disable-selection', this._disableSelection.bind(this));

	// blocks
	for (var id in this.blocks) {
		var b = new Placeholder(id, this.blocks[id], this.editor);
		b._create();
		this.$container.append(b.$container);
	}

	this.editor.$container.append(this.$toolbar);
	this.editor.$container.append(this.$container);
};

Palette.prototype._disableSelection = function(e) {
	if ($(e.target).is('canvas')) {
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].deactivate();
		}
	}
};

Palette.prototype._toggleFullScreen = function() {
	var shift = this.editor.$container[0].getBoundingClientRect();
	var position = [this.canvas.$container.scrollLeft(), this.canvas.$container.scrollTop()];
	var $el = this.editor.$container.detach();
	$el.toggleClass(BlockEditor._namespace + '-fullscreen');

	if (this._fullscreen) {
		this.editor.$el.after($el);
		this.canvas.$container.css({
			width: this.editor.$container.width(),
			height: this.editor.$container.height()
		});
		position[0] += this._shift.left;
		position[1] += this._shift.top;
	} else {
		this._shift = {
			left: shift.left,
			top: shift.top
		};
		$('body').append($el);
		shift = this.editor.$container[0].getBoundingClientRect();
		this._shift.top -= shift.top;
		this._shift.left -= shift.left;
		this.canvas.$container.css({
			width: '100%',
			height: '100%'
		});
		position[0] -= this._shift.left;
		position[1] -= this._shift.top;
	}
	this.canvas.$container.scrollLeft(position[0]);
	this.canvas.$container.scrollTop(position[1]);

	this._fullscreen = !this._fullscreen;

	return false;
};

Palette.prototype._toggleParentProperties = function() {
	// todo

	return false;
};

Palette.prototype._copy = function() {
	// todo
	console.log('copy');

	return false;
};

Palette.prototype._cut = function() {
	// todo
	console.log('cut');

	return false;
};

Palette.prototype._paste = function() {
	// todo
	console.log('paste');

	return false;
};

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
