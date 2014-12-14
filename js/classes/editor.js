/**
 * variable editor
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 *
 * @todo select na prvni radek nebo pred popisek
 *
 * @todo nove spojeni pretazenim - shift / ctrl
 * @todo zmena typu spojeni na ... ->
 * @todo historie pri zmene typu
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

Editor.prototype.render = function() {
	// remove existing editors
	$('div.' + this._namespace).remove();

	// create new variable
	if (this._variable === '*') {
		this._variable = this.getNewName();
		if (this._variable === null) {
			return;
		}
		this.block.values[this._variable] = undefined;
		this.block.redraw();
	}

	// create new editor element
	this._create();
	this.editor.$container.append(this.$container);
};

Editor.prototype._close = function() {
	this.$container.remove();
	$(document).off('click.editor', this.canvas);
	return false;
};

Editor.prototype._bind = function() {
	// close on escape
	$(document).off('keydown.editor').on('keydown.editor', $.proxy(function(e) {
		if (e.keyCode === 27) {
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

Editor.prototype._create = function() {
	// create table container
	this.$container = $('<div class="' + this._namespace + '">');

	// make it draggable
	this.$container.on('mousedown', this._onDragStart.bind(this));

	var $title = $('<div class="' + this._namespace + '-title">');
	var $close = $('<a href="#">&times;</a>')
	$close.addClass(this._namespace + '-close');
	$close.on('click', this._close.bind(this));
	$title.text(this.block.id + ':' + this._variable);
	$title.append($close);
	this.$container.append($title);

	var $type = $('<select autofocus="autofocus"></select>');
	var $textarea = $('<textarea></textarea>');
	var $desc = $('<div></div>').addClass(this._namespace + '-desc');
	var $save = $('<input type="submit">').val(_('Save'));
	this.$container.append($type);
	this.$container.append($desc);
	this.$container.append($textarea);
	this.$container.append($save);

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
		$textarea.val(JSON.stringify(values[this._variable]));
	}
	$type.change();
};

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

Editor.prototype._onDragEnd = function(e) {
	// wait to prevent closing editor from onClick event
	var that = this;
	setTimeout(function() {
		that._dragging = false;
	}, 1);
	$('body').off('mousemove.block-editor mouseup.block-editor');
};

Editor.prototype._changeType = function(e) {
	var type = this._types[e.target.value];
	this.$container.find('textarea').css('display', type[0] ? 'block' : 'none');
	this.$container.find('div.' + this._namespace + '-desc').html(type[2]);
};

Editor.prototype._save = function() {
	var type = this.$container.find('select').val();
	var text = this.$container.find('textarea').val();
	var selector = '.' + BlockEditor._namespace + '-block-input';
	selector += '[data-variable="' + this._variable + '"]';
	var def = false;

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

			this.editor.canvas.redraw();
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

	this._close();
	this.editor.onChange();

	return false;
};

Editor.prototype.getNewName = function() {
	var old = this.id;
	var name = null;
	while (name === null) {
		name = window.prompt(_('New input name:'), old);

		if (name === null) {
			return name;
		} else if (!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
			alert(_('Only letters, numbers and underscore are allowed in variable name and the first character must be a letter.'));
			old = name;
			name = null;
		} else if (name === 'enable' || name in this.block.values) {
			alert(_('This name is already taken by another variable.'));
			old = name;
			name = null;
		}
	}

	return name;
};

Editor.prototype._isValidJson = function(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
};
