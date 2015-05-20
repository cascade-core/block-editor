/**
 * Toolbar class
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {BlockEditor} editor - reference to plugin instance
 * @class
 */
var Toolbar = function(editor, palette) {
	this.editor = editor;
	this.palette = palette;
	this.canvas = editor.canvas;
	this._zoom = this.canvas.getZoom();
	this._zoomStep = 0.1;
	this._zoomMax = 3.0;
	this._zoomMin = 0.3;
};

/**
 * Creates button element
 *
 * @param {String} name
 * @param {String} icon
 * @param {String} title
 * @param {Boolean} [enable=false]
 * @param {String} [letter]
 * @returns {jQuery}
 * @private
 */
Toolbar.prototype._createButton = function (name, icon, title, enabled, letter) {
	var $btn = $('<a>');
	var className = BlockEditor._namespace + '-' + name;
	letter = letter || name.charAt(0).toUpperCase();
	$btn.html('<i class="fa fa-fw fa-' + icon + '"></i> ' + letter);
	$btn.attr('title', title);
	$btn.attr('href', '#' + name);
	$btn.addClass(className);
	if (!enabled) {
		$btn.addClass('disabled')
	}
	return $btn;
};

/**
 * Renders toolbar
 *
 * @param {jQuery} $container - where to append toolbar
 * @returns {Array} - left and right toolbar jQuery objects
 */
Toolbar.prototype.render = function($container) {
	if (this._rendered) {
		// prevent multiple rendering
		return false;
	}

	this._rendered = true;
	this.$container = $container;
	this.$toolbar = $('<div>');
	this.$toolbar.addClass(BlockEditor._namespace + '-toolbar');

	var $divider = $('<div>').addClass(BlockEditor._namespace + '-toolbar-divider');

	// parent block properties button
	this.$parent = this._createButton('parent-properties-toggle', 'cogs', 'Edit parent block properties [Ctrl + Shift + P]', true);
	$(document).on('click', 'a.' + BlockEditor._namespace + '-parent-properties-toggle', this._toggleParentProperties.bind(this));
	this.$toolbar.append(this.$parent);

	// palette refresh button
	this.$reload = this._createButton('palette-reload', 'refresh', 'Reload palette data [Ctrl + Shift + R]', true);
	$(document).on('click', 'a.' + BlockEditor._namespace + '-palette-reload', this._reloadPalette.bind(this));
	this.$toolbar.append(this.$reload);

	this.$toolbar.append($divider.clone());

	// undo button
	this.$undo = this._createButton('undo', 'undo', 'Undo [Ctrl + Z]', false, '&larr;');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-undo', this._undo.bind(this));
	this.$toolbar.append(this.$undo);

	// redo button
	this.$redo = this._createButton('redo', 'repeat', 'Redo [Ctrl + Shift + Z]', false, '&rarr;');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-redo', this._redo.bind(this));
	this.$toolbar.append(this.$redo);

	this.$toolbar.append($divider.clone());

	// copy button
	this.$copy = this._createButton('copy', 'copy', 'Copy active block [Ctrl + C]');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-copy', this._copy.bind(this));
	this.$toolbar.append(this.$copy);

	// cut button
	this.$cut = this._createButton('cut', 'cut', 'Cut active block [Ctrl + X]', false, 'X');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-cut', this._cut.bind(this));
	this.$toolbar.append(this.$cut);

	// paste button
	this.$paste = this._createButton('paste', 'paste', 'Paste block [Ctrl + V]', false, 'V');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-paste', this._paste.bind(this));
	this.$toolbar.append(this.$paste);

	this.$toolbar.append($divider.clone());

	// zoom in button
	this.$zoomIn = this._createButton('zoom-in', 'search-plus', 'Zoom in [+ / =]', false, '+');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-zoom-in', this._zoomIn.bind(this));
	this.$toolbar.append(this.$zoomIn);

	// zoom out button
	this.$zoomOut = this._createButton('zoom-out', 'search-minus', 'Zoom out [-]', false, '-');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-zoom-out', this._zoomOut.bind(this));
	this.$toolbar.append(this.$zoomOut);

	// zoom reset button
	this.$zoomReset = this._createButton('zoom-reset', 'desktop', 'Reset zoom [0]', false, '0');
	$(document).on('click', 'a.' + BlockEditor._namespace + '-zoom-reset', this._zoomReset.bind(this));
	this.$toolbar.append(this.$zoomReset);

	$(document).off('keydown.toolbar').on('keydown.toolbar', this._keydown.bind(this));

	// disable selection
	$(document).off('click.disable-selection', this.canvas.$container)
			   .on('click.disable-selection', this.canvas.$container, this.disableSelection.bind(this));

	this.$container.append(this.$toolbar);

	// right toolbar
	this.$right = $('<div>');
	this.$right.addClass(BlockEditor._namespace + '-toolbar-right');

	// help button
	this.$help = this._createButton('help', 'lightbulb-o', 'Help [Ctrl + H]', true);
	$(document).on('click', 'a.' + BlockEditor._namespace + '-help', this._toggleHelp.bind(this));
	this.$right.append(this.$help);

	// fullscreen button
	this.$fullscreen = this._createButton('fullscreen-toggle', 'arrows-alt', 'Toggle fullscreen [Ctrl + Shift + F]', true);
	$(document).on('click', 'a.' + BlockEditor._namespace + '-fullscreen-toggle', this._toggleFullScreen.bind(this));
	this.$right.append(this.$fullscreen);

	this.$container.append(this.$toolbar);
	this.$container.append(this.$right);
	this.updateDisabledClasses();

	return [this.$toolbar, this.$right];
};

/**
 * Disables block selection, used as on click handler
 *
 * @param {MouseEvent} [e] - Event
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
 * Reloads palette data via ajax
 *
 * @private
 */
Toolbar.prototype._reloadPalette = function() {
	if (this.$reload.hasClass('disabled')) {
		return false;
	}
	this.$reload.addClass('disabled');
	this.$reload.find('i.fa').addClass('fa-spin');
	var self = this;
	this.palette.reload(function() {
		self.$reload.find('i.fa').removeClass('fa-spin');
		self.$reload.removeClass('disabled');
	});
	return false;
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
	} else if ((e.metaKey || e.ctrlKey) && code === 72) { // ctrl + c => copy
		this.$help.addClass('hover');
		this._toggleHelp();
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
	} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && code === 82) { // ctrl + shift + r => reload palette data
		this.$reload.addClass('hover');
		this._reloadPalette();
		return false;
	} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && code === 80) { // ctrl + shift + p => parent block properties
		this.$parent.addClass('hover');
		this._toggleParentProperties();
	} else if (code === 46 || ((e.metaKey || e.ctrlKey) && code === 8)) { // del / ctrl + backspace => remove selection
		if (!window.confirm(_('Do you realy want to delete selected blocks?'))) {
			return false;
		}
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
	} else if (code === 48) { // 0 => reset zoom
		this._zoomReset();
	} else if (code === 189) { // - => zoom out
		this._zoomOut();
	} else if (code === 187) { // = / + => zoom in
		this._zoomIn();
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
	var undo = this.editor.session.get('undo', true) || [];
	if (undo.length) {
		// save current state to redo
		var oldData = JSON.stringify(JSON.parse(this.editor.$el.val()));
		var redo = this.editor.session.get('redo', true) || [];
		var prev = undo.pop();
		redo.push(oldData);
		this.editor.$el.val(prev);

		this.editor.session.set('undo', undo, true);
		this.editor.session.set('redo', redo, true);

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
	var redo = this.editor.session.get('redo', true) || [];
	if (redo.length) {
		// save current state to undo
		var oldData = JSON.stringify(JSON.parse(this.editor.$el.val()));
		var undo = this.editor.session.get('undo', true) || [];
		var next = redo.pop();
		undo.push(oldData);

		this.editor.$el.val(next);
		this.editor.refresh();

		this.editor.session.set('undo', undo, true);
		this.editor.session.set('redo', redo, true);

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
	var ret = {}, found = false;
	var box = this.editor.getBoundingBox(true);
	var midX = box.minX + (box.maxX - box.minX) / 2;
	var midY = box.minY + (box.maxY - box.minY) / 2;
	for (var i in this.editor.blocks) {
		var b = this.editor.blocks[i];
		if (b.isActive()) {
			found = true;
			ret[b.id] = b.serialize();
			ret[b.id].x -= midX + this.canvas.options.canvasExtraWidth;
			ret[b.id].y -= midY + this.canvas.options.canvasExtraHeight;
		}
	}
	if (found) {
		this.editor.storage.set('clipboard', ret, true);
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
	var ret = {}, found = false;
	var box = this.editor.getBoundingBox(true);
	var midX = box.minX + (box.maxX - box.minX) / 2;
	var midY = box.minY + (box.maxY - box.minY) / 2;
	for (var id in this.editor.blocks) {
		var b = this.editor.blocks[id];
		if (b.isActive()) {
			found = true;
			ret[b.id] = b.remove();
			ret[b.id].x -= midX + this.canvas.options.canvasExtraWidth;
			ret[b.id].y -= midY + this.canvas.options.canvasExtraHeight;
		}
	}
	if (found) {
		this.editor.storage.set('clipboard', ret, true);
		this.canvas.redraw();
		this.updateDisabledClasses();
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
	var blocks = this.editor.storage.get('clipboard', true);
	if (blocks) {
		var center = this.canvas.getCenter();
		this.disableSelection();
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
			block.x += center.x;
			block.y += center.y;
			block.render();
			block.activate();
		}
		this.editor.storage.set('clipboard', blocks, true);
		this.canvas.redraw();
		this.editor.onChange();
		this.updateDisabledClasses();
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

	var undo = this.editor.session.get('undo', true);
	if (undo && undo.length) {
		this.$undo.removeClass('disabled');
	} else {
		this.$undo.addClass('disabled');
	}

	var redo = this.editor.session.get('redo', true);
	if (redo && redo.length) {
		this.$redo.removeClass('disabled');
	} else {
		this.$redo.addClass('disabled');
	}

	var clipboard = this.editor.storage.get('clipboard', true);
	if (clipboard) {
		this.$paste.removeClass('disabled');
	} else {
		this.$paste.addClass('disabled');
	}

	if (this._zoom < this._zoomMax) {
		this.$zoomIn.removeClass('disabled');
	} else {
		this.$zoomIn.addClass('disabled');
	}

	if (this._zoom > this._zoomMin) {
		this.$zoomOut.removeClass('disabled');
	} else {
		this.$zoomOut.addClass('disabled');
	}

	if (this._zoom !== 1.0) {
		this.$zoomReset.removeClass('disabled');
	} else {
		this.$zoomReset.addClass('disabled');
	}

	if (active) {
		this.$copy.removeClass('disabled');
		this.$cut.removeClass('disabled');
	} else {
		this.$copy.addClass('disabled');
		this.$cut.addClass('disabled');
	}
};

/**
 * Zooms to given scale
 *
 * @param {Number} scale
 * @private
 */
Toolbar.prototype._zoomTo = function(scale) {
	// 0.1 precision
	scale = Math.round(scale * 10) / 10;
	this._zoom = scale;
	this.editor.session.set('zoom', scale);
	var centerX = this.canvas.getCenter().x * scale;
	var centerY = this.canvas.getCenter().y * scale;
	this.canvas.$containerInner.css({
		'transform': 'scale(' + this._zoom + ')',
		'width': (this._zoom * 100) + '%',
		'height': (this._zoom * 100) + '%'
	});

	// compensate scroll to preserve center point
	var $c = this.canvas.$container;
	this.canvas.$container.scrollLeft(centerX - $c.width() / 2);
	this.canvas.$container.scrollTop(centerY - $c.height() / 2);

	// force browser to re-render inner container
	var inner = this.canvas.$containerInner.detach();
	this.canvas.$container.append(inner);
	this.canvas.redraw();

	this.updateDisabledClasses();
};

/**
 * Zooms in
 *
 * @private
 */
Toolbar.prototype._zoomIn = function() {
	if (this._zoom < this._zoomMax) {
		this._zoomTo(this._zoom + this._zoomStep);
	}
	return false;
};

/**
 * Zooms out
 *
 * @private
 */
Toolbar.prototype._zoomOut = function() {
	if (this._zoom > this._zoomMin) {
		this._zoomTo(this._zoom - this._zoomStep);
	}
	return false;
};

/**
 * Resets zoom
 *
 * @private
 */
Toolbar.prototype._zoomReset = function() {
	this._zoomTo(1);
	return false;
};

/**
 * Toggles help modal
 *
 * @private
 */
Toolbar.prototype._toggleHelp = function() {
	this.editor.toggleHelp();
	return false;
};
