/**
 * Toolbar class
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {BlockEditor} editor - reference to plugin instance
 * @class
 */
var Toolbar = function(editor) {
	this.editor = editor;
	this.canvas = editor.canvas;
};

/**
 * Renders toolbar
 *
 * @param {jQuery} $container
 * @returns {jQuery}
 */
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

	$(document).off('keydown.toolbar').on('keydown.toolbar', this._keydown.bind(this));

	// disable selection
	$(document).off('click.disable-selection', this.canvas.$container)
			   .on('click.disable-selection', this.canvas.$container, this.disableSelection.bind(this));

	this.editor.$container.append(this.$toolbar);
	this.updateDisabledClasses();

	return this.$toolbar;
};

/**
 * Disables block selection, used as on click handler
 *
 * @param {MouseEvent} e - Event
 */
Toolbar.prototype.disableSelection = function(e) {
	if (!e || ($(e.target).is('canvas') && !this.canvas.selection)) {
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].deactivate();
		}
	}
	this.canvas.selection = false;
};

/**
 * Keydown handler, binds keyboard shortcuts
 *
 * @param {KeyboardEvent} e - Event
 * @returns {boolean}
 * @private
 */
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
	if ((e.metaKey || e.ctrlKey) && code === 65) { // ctrl + a => select all blocks
		for (var id in this.editor.blocks) {
			this.editor.blocks[id].activate();
		}
		return false;
	} else if ((e.metaKey || e.ctrlKey) && code === 67) { // ctrl + c => copy
		this.$copy.addClass('hover');
		this._copy();
	} else if ((e.metaKey || e.ctrlKey) && code === 86) { // ctrl + v => paste
		this.$paste.addClass('hover');
		this._paste();
	} else if ((e.metaKey || e.ctrlKey) && code === 88) { // ctrl + x => cut
		this.$cut.addClass('hover');
		this._cut();
	} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && code === 90) { // ctrl + shift + z => redo
		this.$redo.addClass('hover');
		this._redo();
	} else if ((e.metaKey || e.ctrlKey) && code === 90) { // ctrl + z => undo
		this.$undo.addClass('hover');
		this._undo();
	} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && code === 70) { // ctrl + shift + f => fullscreen
		this.$fullscreen.addClass('hover');
		this._toggleFullScreen();
		return false;
	} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && code === 80) { // ctrl + shift + p => parent block properties
		this.$parent.addClass('hover');
		this._toggleParentProperties();
	} else if (code === 46 || ((e.metaKey || e.ctrlKey) && code === 8)) { // del / ctrl + backspace => remove selection
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

/**
 * Toggles fullscreen mode
 *
 * @returns {boolean}
 * @private
 */
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

/**
 * Toggles parent block properties editor
 *
 * @returns {boolean}
 * @private
 */
Toolbar.prototype._toggleParentProperties = function() {
	var editor = new ParentEditor(this.editor);
	editor.render();

	return false;
};

/**
 * Undo last action
 *
 * @returns {boolean}
 * @private
 */
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

/**
 * Redo last reverted action
 *
 * @returns {boolean}
 * @private
 */
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

/**
 * Copies active block(s)
 *
 * @returns {boolean}
 * @private
 */
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

/**
 * Cuts active block(s)
 *
 * @returns {boolean}
 * @private
 */
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

/**
 * Pastes blocks from clipboard
 *
 * @returns {boolean}
 * @private
 */
Toolbar.prototype._paste = function() {
	if (localStorage.clipboard && JSON.parse(localStorage.clipboard)) {
		var blocks = JSON.parse(localStorage.clipboard);
		for (var id in blocks) {
			var b = blocks[id];
			var exists = id in this.editor.blocks;
			if (exists) {
				id = this.editor.blocks[id].getNewId();
				if (!id) {
					continue;
				}
			}
			var block = new Block(id, b, this.editor);
			this.editor.blocks[id] = block;
			if (exists) {
				block.x += 10;
				block.y += 10;
				b.x += 10;
				b.y += 10;
			}
			block.render();
		}
		localStorage.clipboard = JSON.stringify(blocks);
		this.canvas.redraw();
		this.editor.onChange();
	}

	return false;
};

/**
 * Updates disable state of all buttons inside toolbar
 */
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
