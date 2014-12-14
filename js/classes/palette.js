/**
 * palette class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 *
 * @todo toolbar promenliva sirka
 *
 * @todo autocomplete filter vedle selectu
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
	$(document).off('change.palette', 'select.' + className).on('change.palette', 'select.' + className, this._filter.bind(this));
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
	$fullscreen.html('<i class="fa fa-fw fa-arrows-alt"></i> F');
	$fullscreen.attr('title', 'Toggle fullscreen [Ctrl + Shift + F]');
	$fullscreen.attr('href', '#fullscreen');
	$fullscreen.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleFullScreen.bind(this));
	this.$toolbar.append($fullscreen);

	// parent block properties button
	var $parent = $('<a>');
	className = BlockEditor._namespace + '-parent-properties-toggle';
	$parent.html('<i class="fa fa-fw fa-cogs"></i> P');
	$parent.attr('title', 'Edit parent block properties [Ctrl + Shift + P]');
	$parent.attr('href', '#parent-properties');
	$parent.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleParentProperties.bind(this));
	this.$toolbar.append($parent);

	// copy button
	var $copy = $('<a>');
	className = BlockEditor._namespace + '-copy';
	$copy.html('<i class="fa fa-fw fa-copy"></i> C');
	$copy.attr('title', 'Copy active block [Ctrl + C]');
	$copy.attr('href', '#copy');
	$copy.addClass(className);
	$(document).on('click', 'a.' + className, this._copy.bind(this));
	this.$toolbar.append($copy);

	// cut button
	var $cut = $('<a>');
	className = BlockEditor._namespace + '-cut';
	$cut.html('<i class="fa fa-fw fa-cut"></i> X');
	$cut.attr('title', 'Cut active block [Ctrl + X]');
	$cut.attr('href', '#cut');
	$cut.addClass(className);
	$(document).on('click', 'a.' + className, this._cut.bind(this));
	this.$toolbar.append($cut);

	// paste button
	var $paste = $('<a>');
	className = BlockEditor._namespace + '-paste';
	$paste.html('<i class="fa fa-fw fa-paste"></i> P');
	$paste.attr('title', 'Paste block [Ctrl + V]');
	$paste.attr('href', '#paste');
	$paste.addClass(className);
	$(document).on('click', 'a.' + className, this._paste.bind(this));
	this.$toolbar.append($paste);

	// filter
	var $filter = this._createFilter();
	this.$toolbar.append($filter);

	$(document).off('keydown.palette').on('keydown.palette', this._keydown.bind(this));

	// disable selection
	$(document).off('click.disable-selection', this.canvas.$container).on('click.disable-selection', this.canvas.$container, this.disableSelection.bind(this));

	// blocks
	for (var id in this.blocks) {
		var b = new Placeholder(id, this.blocks[id], this.editor);
		b._create();
		this.$container.append(b.$container);
	}

	this.editor.$container.append(this.$toolbar);
	this.editor.$container.append(this.$container);
};

Palette.prototype.disableSelection = function(e) {
	if (!e || ($(e.target).is('canvas') && !this.canvas.selection)) {
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].deactivate();
		}
	}
	this.canvas.selection = false;
};

Palette.prototype._keydown = function(e) {
	// ignore key binding when variable editor opened
	var editorClass = BlockEditor._namespace + '-variable-editor';
	if (this.editor.$container.find('.' + editorClass).length) {
		return true;
	}

	var code = e.keyCode ? e.keyCode : e.which;
	if (e.metaKey && code === 67) { // ctrl + c => copy
		this._copy();
	} else if (e.metaKey && code === 86) { // ctrl + v => paste
		this._paste();
	} else if (e.metaKey && code === 88) { // ctrl + x => cut
		this._cut();
	} else if (e.metaKey && e.shiftKey && code === 70) { // ctrl + shift + f => fullscreen
		this._toggleFullScreen();
		return false;
	} else if (e.metaKey && e.shiftKey && code === 80) { // ctrl + shift + p => parent block properties
		this._toggleParentProperties();
	} else if (code === 8 || (e.metaKey && code === 46)) { // del / ctrl + backspace => remove selection
		for (var id in this.editor.blocks) {
			if (this.editor.blocks[id].isActive()) {
				this.editor.blocks[id].remove();
			}
		}
		this.canvas.redraw();
	} else if (code === 27) { // esc => disable selection
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
	var editor = new ParentEditor(this.editor);
	editor.render();

	return false;
};

Palette.prototype._copy = function() {
	var ret = {};
	for (var i in this.editor.blocks) {
		var b = this.editor.blocks[i];
		if (b.isActive()) {
			ret[b.id] = b.serialize();
		}
	}
	localStorage.clipboard = JSON.stringify(ret);

	return false;
};

Palette.prototype._cut = function() {
	var ret = {};
	for (var id in this.editor.blocks) {
		var b = this.editor.blocks[id];
		if (b.isActive()) {
			ret[b.id] = b.remove();
		}
	}
	localStorage.clipboard = JSON.stringify(ret);
	this.canvas.redraw();

	return false;
};

Palette.prototype._paste = function() {
	if (localStorage.clipboard) {
		var blocks = JSON.parse(localStorage.clipboard);
		for (var id in blocks) {
			var b = blocks[id];
			if (id in this.editor.blocks) {
				id = this.editor.blocks[id].getNewId();
				if (!id) {
					continue;
				}
			}
			var block = new Block(id, b, this.editor);
			this.editor.blocks[id] = block;
			block.render();
		}
		this.canvas.redraw();
		this.editor.onChange();
	}

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
