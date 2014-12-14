/**
 * Toolbar class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Toolbar = function(editor) {
	this.editor = editor;
	this.canvas = editor.canvas;
};

Toolbar.prototype.render = function($container) {
	this.$container = $container;
	this.$toolbar = $('<div>');
	this.$toolbar.addClass(BlockEditor._namespace + '-toolbar');

	// fullscreen button
	var $divider = $('<div>').addClass(BlockEditor._namespace + '-toolbar-divider');
	this.$fullscreen = $('<a>');
	var className = BlockEditor._namespace + '-fullscreen-toggle';
	this.$fullscreen.html('<i class="fa fa-fw fa-arrows-alt"></i> F');
	this.$fullscreen.attr('title', 'Toggle fullscreen [Ctrl + Shift + F]');
	this.$fullscreen.attr('href', '#fullscreen');
	this.$fullscreen.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleFullScreen.bind(this));
	this.$toolbar.append(this.$fullscreen);

	// parent block properties button
	this.$parent = $('<a>');
	className = BlockEditor._namespace + '-parent-properties-toggle';
	this.$parent.html('<i class="fa fa-fw fa-cogs"></i> P');
	this.$parent.attr('title', 'Edit parent block properties [Ctrl + Shift + P]');
	this.$parent.attr('href', '#parent-properties');
	this.$parent.addClass(className);
	$(document).on('click', 'a.' + className, this._toggleParentProperties.bind(this));
	this.$toolbar.append(this.$parent);

	this.$toolbar.append($divider.clone());

	// undo button
	this.$undo = $('<a>').addClass('disabled');
	className = BlockEditor._namespace + '-undo';
	this.$undo.html('<i class="fa fa-fw fa-undo"></i> &larr;');
	this.$undo.attr('title', 'Redo [Ctrl + Z]');
	this.$undo.attr('href', '#undo');
	this.$undo.addClass(className);
	$(document).on('click', 'a.' + className, this._undo.bind(this));
	this.$toolbar.append(this.$undo);

	// redo button
	this.$redo = $('<a>').addClass('disabled');
	className = BlockEditor._namespace + '-redo';
	this.$redo.html('<i class="fa fa-fw fa-repeat"></i> &rarr;');
	this.$redo.attr('title', 'Undo [Ctrl + Shift + Z]');
	this.$redo.attr('href', '#redo');
	this.$redo.addClass(className);
	$(document).on('click', 'a.' + className, this._redo.bind(this));
	this.$toolbar.append(this.$redo);

	this.$toolbar.append($divider.clone());

	// copy button
	this.$copy = $('<a>').addClass('disabled');
	className = BlockEditor._namespace + '-copy';
	this.$copy.html('<i class="fa fa-fw fa-copy"></i> C');
	this.$copy.attr('title', 'Copy active block [Ctrl + C]');
	this.$copy.attr('href', '#copy');
	this.$copy.addClass(className);
	$(document).on('click', 'a.' + className, this._copy.bind(this));
	this.$toolbar.append(this.$copy);

	// cut button
	this.$cut = $('<a>').addClass('disabled');
	className = BlockEditor._namespace + '-cut';
	this.$cut.html('<i class="fa fa-fw fa-cut"></i> X');
	this.$cut.attr('title', 'Cut active block [Ctrl + X]');
	this.$cut.attr('href', '#cut');
	this.$cut.addClass(className);
	$(document).on('click', 'a.' + className, this._cut.bind(this));
	this.$toolbar.append(this.$cut);

	// paste button
	this.$paste = $('<a>').addClass('disabled');
	className = BlockEditor._namespace + '-paste';
	this.$paste.html('<i class="fa fa-fw fa-paste"></i> P');
	this.$paste.attr('title', 'Paste block [Ctrl + V]');
	this.$paste.attr('href', '#paste');
	this.$paste.addClass(className);
	$(document).on('click', 'a.' + className, this._paste.bind(this));
	this.$toolbar.append(this.$paste);

	this.$toolbar.append($divider.clone());

	$(document).off('keydown.toolbar').on('keydown.toolbar', this._keydown.bind(this));

	// disable selection
	$(document).off('click.disable-selection', this.canvas.$container)
			   .on('click.disable-selection', this.canvas.$container, this.disableSelection.bind(this));

	this.editor.$container.append(this.$toolbar);
	this.updateDisabledClasses();

	return this.$toolbar;
};

Toolbar.prototype.disableSelection = function(e) {
	if (!e || ($(e.target).is('canvas') && !this.canvas.selection)) {
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].deactivate();
		}
	}
	this.canvas.selection = false;
};

Toolbar.prototype._keydown = function(e) {
	// set timeout for loosing hover
	setTimeout(function() {
		$('.' + BlockEditor._namespace + '-toolbar a.hover').removeClass('hover');
	}, 150);

	// ignore key binding when variable editor opened
	var editorClass = BlockEditor._namespace + '-variable-editor';
	if (this.editor.$container.find('.' + editorClass).length) {
		return true;
	}

	var code = e.keyCode ? e.keyCode : e.which;
	if (e.metaKey && code === 65) { // ctrl + a => select all blocks
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].activate();
		}
		return false;
	} else if (e.metaKey && code === 67) { // ctrl + c => copy
		this.$copy.addClass('hover');
		this._copy();
	} else if (e.metaKey && code === 86) { // ctrl + v => paste
		this.$paste.addClass('hover');
		this._paste();
	} else if (e.metaKey && code === 88) { // ctrl + x => cut
		this.$cut.addClass('hover');
		this._cut();
	} else if (e.metaKey && e.shiftKey && code === 90) { // ctrl + shift + z => redo
		this.$redo.addClass('hover');
		this._redo();
	} else if (e.metaKey && code === 90) { // ctrl + z => undo
		this.$undo.addClass('hover');
		this._undo();
	} else if (e.metaKey && e.shiftKey && code === 70) { // ctrl + shift + f => fullscreen
		this.$fullscreen.addClass('hover');
		this._toggleFullScreen();
		return false;
	} else if (e.metaKey && e.shiftKey && code === 80) { // ctrl + shift + p => parent block properties
		this.$parent.addClass('hover');
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

Toolbar.prototype._toggleFullScreen = function() {
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

Toolbar.prototype._toggleParentProperties = function() {
	var editor = new ParentEditor(this.editor);
	editor.render();

	return false;
};

Toolbar.prototype._undo = function() {
	if (sessionStorage.undo && JSON.parse(sessionStorage.undo).length) {
		// save current state to redo
		var oldData = JSON.stringify(JSON.parse(this.editor.$el.val()));
		var redo = sessionStorage.redo ? JSON.parse(sessionStorage.redo) : [];
		var undo = JSON.parse(sessionStorage.undo);
		var prev = undo.pop();
		redo.push(oldData);
		this.editor.$el.val(prev);

		sessionStorage.undo = JSON.stringify(undo);
		sessionStorage.redo = JSON.stringify(redo);

		this.editor.refresh();

		this.updateDisabledClasses();
	}

	return false;
};

Toolbar.prototype._redo = function() {
	if (sessionStorage.redo && JSON.parse(sessionStorage.redo).length) {
		// save current state to undo
		var oldData = JSON.stringify(JSON.parse(this.editor.$el.val()));
		var undo = sessionStorage.undo ? JSON.parse(sessionStorage.undo) : [];
		var redo = JSON.parse(sessionStorage.redo);
		var next = redo.pop();
		undo.push(oldData);

		this.editor.$el.val(next);
		this.editor.refresh();

		sessionStorage.undo = JSON.stringify(undo);
		sessionStorage.redo = JSON.stringify(redo);

		this.updateDisabledClasses();
	}

	return false;
};

Toolbar.prototype._copy = function() {
	var ret = {};
	for (var i in this.editor.blocks) {
		var b = this.editor.blocks[i];
		if (b.isActive()) {
			ret[b.id] = b.serialize();
		}
	}
	if (ret) {
		localStorage.clipboard = JSON.stringify(ret);
		this.updateDisabledClasses();
	}

	return false;
};

Toolbar.prototype._cut = function() {
	var ret = {};
	for (var id in this.editor.blocks) {
		var b = this.editor.blocks[id];
		if (b.isActive()) {
			ret[b.id] = b.remove();
		}
	}
	if (ret) {
		localStorage.clipboard = JSON.stringify(ret);
		this.canvas.redraw();
	}

	return false;
};

Toolbar.prototype._paste = function() {
	if (localStorage.clipboard && JSON.parse(localStorage.clipboard)) {
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

Toolbar.prototype._filter = function(e) {
	if ($(e.target).val() === '*') {
		var className = BlockEditor._namespace + '-block';
	} else {
		var className = BlockEditor._namespace + '-filter-' + $(e.target).val();
	}

	this.$container.find('.' + BlockEditor._namespace + '-block').hide();
	this.$container.find('.' + className).show();

	return false;
};

Toolbar.prototype.updateDisabledClasses = function() {
	// set disabled class to toolbar buttons
	var active = false;
	for (var id in this.editor.blocks) {
		if (this.editor.blocks[id].isActive()) {
			active = true;
			break;
		}
	}

	if (sessionStorage.undo && JSON.parse(sessionStorage.undo).length) {
		this.$undo.removeClass('disabled');
	} else {
		this.$undo.addClass('disabled');
	}

	if (sessionStorage.redo && JSON.parse(sessionStorage.redo).length) {
		this.$redo.removeClass('disabled');
	} else {
		this.$redo.addClass('disabled');
	}

	if (localStorage.clipboard && JSON.parse(localStorage.clipboard)) {
		this.$paste.removeClass('disabled');
	} else {
		this.$paste.addClass('disabled');
	}

	if (active) {
		this.$copy.removeClass('disabled');
		this.$cut.removeClass('disabled');
	} else {
		this.$copy.addClass('disabled');
		this.$cut.addClass('disabled');
	}
};
