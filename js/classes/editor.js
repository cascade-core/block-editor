/**
 * Input editor
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {Block} block - block to edit
 * @param {BlockEditor} editor - plugin instance
 * @param {string} target - input name to edit
 * @class
 */
var Editor = function(block, editor, target) {
	this.block = block;
	this.editor = editor;
	this._variable = target;
	this._namespace = BlockEditor._namespace + '-variable-editor';

	// description of each input type
	this._types = {
		'default': 		[false, 'Default state', 	'Input is set to it\'s default state, as specified in documentation.'],
		'connection': 	[true,  'Connection', 		'Input is connected to these outputs: (Syntax: "block:output", one connection per line.)'],
		'bool': 		[true,  'Boolean value', 	'Input is set to this boolean value (true or false):'],
		'int': 			[true,  'Integer value', 	'Input is set to this number:'],
		'string': 		[true,  'String value', 	'Input is set to this text:'],
		'json': 		[true,  'JSON', 			'Input is set to this JSON:']
	};
};

/**
 * Renders input editor
 */
Editor.prototype.render = function() {
	// remove existing editors
	$('div.' + this._namespace).remove();

	// create new input
	if (this._variable === '*') {
		this._variable = this.getNewName();
		if (this._variable === null) {
			return;
		}
		this.block.values[this._variable] = undefined;
		this.block.redraw();
	}

	// create new editor element
	this.$type = this._create();
	this.editor.$container.append(this.$container);
	if (this.$type) {
		this.$type.focus();
	}
};

/**
 * Closes editor
 *
 * @returns {boolean}
 * @private
 */
Editor.prototype._close = function() {
	this.$container.remove();
	$(document).off('click.editor', this.canvas);
	return false;
};

/**
 * Binds close handler to close button and ESC key
 * @private
 */
Editor.prototype._bind = function() {
	// close on escape
	$(document).off('keydown.editor').on('keydown.editor', $.proxy(function(e) {
		var code = e.keyCode ? e.keyCode : e.which;
		if (code === 27) {
			return this._close();
		} else {
			return true;
		}
	}, this));

	// close on outside click
	$(document).off('click.editor', this.canvas).on('click.editor', $.proxy(function(e) {
		if (this._dragging || $(e.target).is('.' + this._namespace) || $(e.target).closest('.' + this._namespace).length > 0) {
			return true;
		} else {
			return this._close();
		}
	}, this), this.canvas);
};

/**
 * Creates input editor container
 * @returns {jQuery} - type element to focus when appended to DOM
 * @private
 */
Editor.prototype._create = function() {
	// create table container
	this.$container = $('<div class="' + this._namespace + '">');

	var $title = $('<div class="' + this._namespace + '-title">');
	$title.text(this.block.id + ':' + this._variable);
	$title.on('mousedown', this._onDragStart.bind(this)); // make it draggable

	var $close = $('<a href="#">&times;</a>');
	$close.addClass(this._namespace + '-close');
	$close.on('click', this._close.bind(this));

	$title.append($close);
	this.$container.append($title);

	var id = BlockEditor._namespace + '-type';
	var $type = $('<select>').attr('id', id);
	var $typeLabel = $('<label>').attr('for', id).text(_('Type:'));
	var $textarea = $('<textarea>').on('keydown', this._keydown.bind(this));
	var $desc = $('<div></div>').addClass(this._namespace + '-desc');
	var $save = $('<input type="submit">').val(_('Set input'));
	$close = $('<input type="button">').val(_('Cancel'));
	$close.on('click', this._close.bind(this));
	this.$container.append($typeLabel);
	this.$container.append($type);
	this.$container.append($desc);
	this.$container.append($textarea);
	this.$container.append($save);
	this.$container.append($close);

	for (var t in this._types) {
		$type.append($('<option>').text(_(this._types[t][1])).val(t));
	}

	$type.on('change keyup', this._changeType.bind(this));
	$save.on('click', this._save.bind(this));

	this._bind();

	var values = this.block.values;
	var conn = this.block.connections;
	var type = typeof(values[this._variable]);
	if (this._variable in conn) {
		$type.val('connection');
		var value = '';
		for (var i in conn[this._variable]) {
			value += conn[this._variable][i] + (i % 2 ? '\n' : ':');
		}
		$textarea.val(value);
	} else if (type === 'undefined') {
		$type.val('default');
	} else if (type === 'boolean') {
		$type.val('bool');
		$textarea.val(values[this._variable]);
	} else if (type === 'number') {
		$type.val('int');
		$textarea.val(values[this._variable]);
	} else if (type === 'string') {
		$type.val('string');
		$textarea.val(values[this._variable]);
	} else {
		$type.val('json');
		$textarea.val(JSON.stringify(values[this._variable], null, 4));
	}
	$type.change();
	this._type = $type.val();
	return $type;
};

/**
 * Moves editor - binds move events
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Editor.prototype._onDragStart = function(e) {
	this._dragging = true;
	this._moved = false;
	this._cursor = {
		x: e.clientX - this.$container[0].offsetLeft + parseInt(this.$container.css('margin-left')),
		y: e.clientY - this.$container[0].offsetTop + parseInt(this.$container.css('margin-top'))
	};

	$('body').on({
		'mousemove.block-editor': this._onDragOver.bind(this),
		'mouseup.block-editor': this._onDragEnd.bind(this)
	});
};

/**
 * Moves editor
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Editor.prototype._onDragOver = function(e) {
	if (this._dragging) {
		var left = e.clientX - this._cursor.x;
		var top = e.clientY - this._cursor.y;

		this._moved = this.$container[0].offsetLeft !== left || this.$container[0].offsetTop !== top;
		if (this._moved) {
			this.$container.css({
				left: left,
				top: top
			});
		}
	}
};

/**
 * Moves editor - unbinds move events
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Editor.prototype._onDragEnd = function(e) {
	// wait to prevent closing editor from onClick event
	var that = this;
	setTimeout(function() {
		that._dragging = false;
	}, 1);
	$('body').off('mousemove.block-editor mouseup.block-editor');
};

/**
 * Changes type of current input,
 * used as on click handler
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Editor.prototype._changeType = function(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	var type = this._types[e.target.value];
	this.$container.find('div.' + this._namespace + '-desc').html(type[2]);
	// ignore shift and tab keys when focusing to allow other handlers to focus other elements
	if ($.inArray(code, [9, 16]) === -1 && !e.shiftKey) {
		this.$container.find('textarea').css('display', type[0] ? 'block' : 'none').focus();
	}
};

/**
 * Saves new input value, hides editor
 *
 * @returns {boolean}
 * @private
 */
Editor.prototype._save = function() {
	var type = this.$container.find('select').val();
	var text = this.$container.find('textarea').val();
	var selector = '.' + BlockEditor._namespace + '-block-input';
	selector += '[data-input="' + this._variable + '"]';
	var def = false;
	var redraw = false;

	// remove any old connection - it will be overwritten anyway
	if (this._variable in this.block.connections) {
		delete this.block.connections[this._variable];
		redraw = true;
	}

	if (this._type === 'connection') { // was connection -> remove old value
		delete this.block.connections[this._variable];
		this.block.$container.find(selector).removeClass('missing').removeAttr('title');
	}

	switch (type) {
		case 'default':
			this.block.values[this._variable] = undefined;
			def = true;
			break;

		case 'connection':
			var rows = text.trim().split(/\n+/); // ignore empty lines

			// check for missing aggregation
			if (rows.length > 1 && rows[0].indexOf(':') !== 0) {
				alert(_('You have to use aggregation function on first row when multiple connections are used!'));
				return false;
			}

			var connections = [];
			for	(var i in rows) {
				if (rows[i].indexOf(':') >= 0) { // id:name or aggregation (:and, :or, :...)
					connections.push.apply(connections, rows[i].split(':'));
				}
			}

			if (connections.length > 0) {
				this.block.connections[this._variable] = connections;
			} else {
				delete this.block.connections[this._variable];
				def = true;
			}

			redraw = true;
			break;

		case 'bool':
			this.block.values[this._variable] = (text === 'true') || parseInt(text) > 0;
			break;

		case 'int':
			if (text === 'true') {
				this.block.values[this._variable] = 1;
			} else if (text == 'false') {
				this.block.values[this._variable] = 0;
			} else {
				this.block.values[this._variable] = parseInt(text);
			}
			break;

		case 'string':
			this.block.values[this._variable] = text;
			break;

		case 'json':
			if (!this._isValidJson(text)) {
				alert(_('Entered text is not valid JSON string!'));
				return false;
			}
			this.block.values[this._variable] = JSON.parse(text);
			break;
	}

	if (def) {
		$(selector, this.block.$container).addClass('default');
	} else {
		$(selector, this.block.$container).removeClass('default');
	}

	if (redraw) {
		this.editor.canvas.redraw();
	}

	this._close();
	this.editor.onChange();

	return false;
};

/**
 * Gets new input name
 *
 * @param {boolean} [output] - Prompt for input or output input name?
 * @returns {?string}
 */
Editor.prototype.getNewName = function(output) {
	var old = this.id;
	var name = null;
	while (name === null) {
		name = window.prompt(_('New ' + (output ? 'output' : 'input') + ' name:'), old);

		if (name === null) {
			return name;
		} else if (!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
			alert(_('Only letters, numbers and underscore are allowed in input name and the first character must be a letter.'));
			old = name;
			name = null;
		} else if (!output && (name === 'enable' || name in this.block.values)) {
			alert(_('This name is already taken by another input.'));
			old = name;
			name = null;
		}
	}

	return name;
};

/**
 * Checks whether string is valid JSON string
 *
 * @param {string} str
 * @returns {boolean}
 * @private
 */
Editor.prototype._isValidJson = function(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
};

/**
 * Keydown handler that allows adding tab keys and sending form with CTRL + enter
 *
 * @param {KeyboardEvent} e - Event
 * @returns {boolean}
 * @private
 */
Editor.prototype._keydown = function(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	if (!e.shiftKey && code === 9) { // tab without shift => allow adding tabs to textarea
		return this._fixTabs(e);
	} else if ((e.metaKey || e.ctrlKey) && code === 13) { // ctrl + enter => save form
		return this._save();
	} else if (e.shiftKey && code === 9) { // shift + tab => focus type select
		var $type = this.$type;
		// wait for other events to propagate (changeType event focuses textarea, we need to focus after that)
		setTimeout(function() {
			$type.focus();
		}, 0);
		return false;
	}
};

/**
 * Allows sending tabs to textarea
 *
 * @param {KeyboardEvent} e - Event
 * @returns {boolean}
 * @private
 */
Editor.prototype._fixTabs = function(e) {
	// get caret position
	var pos, r, re, rc;
	if (e.target.selectionStart) {
		pos = e.target.selectionStart;
	} else if (document.selection) {
		r = document.selection.createRange();
		if (r === null) {
			return true;
		}
		re = e.target.createTextRange();
		rc = re.duplicate();
		re.moveToBookmark(r.getBookmark());
		rc.setEndPoint('EndToStart', re);
		pos = rc.text.length;
	} else {
		pos = 0;
	}

	// update value
	var str = $(e.target).val();
	str = str.slice(0, pos) + '\t' + str.slice(pos);
	pos += 1;
	$(e.target).val(str);

	// set caret position
	if (e.target.selectionStart) {
		e.target.selectionStart = pos;
		e.target.selectionEnd = pos;
	} else if (document.selection) {
		var start = offsetToRangeCharacterMove(e.target, pos);
		re.move("character", start);
	}
	return false;
};
