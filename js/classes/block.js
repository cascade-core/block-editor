/**
 * block entity
 *
 * @todo agregacni funkce do zavorky k navzu vstupu, vcetne dvojtecky
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Block = function(id, data, editor) {
	this.id = id;
	this.editor = editor;
	this.palette = editor.palette;
	this.canvas = editor.canvas;
	this.values = data.in_val || {};
	this.connections = data.in_con || {};
	this.type = data.block;

	this.x = data.x;
	this.y = data.y;

	this.defaults = this.palette.blocks[data.block] || {};
};

Block.prototype.render = function() {
	// create DOM if not exists
	if (!this.$container) {
		this._create();
		this.canvas.$container.append(this.$container);
	}

	// update position
	this.$container.css({
		top: this.y + this.canvas.options.canvasOffset,
		left: this.x + this.canvas.options.canvasOffset
	});
};

Block.prototype.position = function() {
	if (!this.$container) {
		return null;
	}

	return {
		top: this.$container[0].offsetTop,
		left: this.$container[0].offsetLeft
	};
};

Block.prototype.remove = function() {
	this.$container.remove();
	delete this.$container;
	delete this.editor.blocks[this.id];
	this.editor.onChange();
	return this.serialize();
};

Block.prototype.redraw = function() {
	this.$container.remove();
	delete this.$container;
	this.defaults = this.palette.blocks[this.type];
	this.render();
	this.canvas.redraw();
};

Block.prototype._onDragStart = function(e) {
	this._dragging = true;
	this._moved = false;
	this._cursor = {
		x: e.clientX - this.position().left,
		y: e.clientY - this.position().top
	};
	this.$container.disableSelection();

	$('body').on({
		'mousemove.block-editor': this._onDragOver.bind(this),
		'mouseup.block-editor': this._onDragEnd.bind(this)
	});
};

Block.prototype._onDragOver = function(e) {
	if (this._dragging) {
		var left = e.clientX - this._cursor.x;
		var top = e.clientY - this._cursor.y;

		this._moved = this.position().left !== left || this.position().top !== top;
		if (this._moved) {
			var dx = this.position().left - left;
			var dy = this.position().top - top;
			this.$container.css({
				left: left < 0 ? 0 : left,
				top: top < 0 ? 0 : top
			});
			this.y = this.position().top - this.canvas.options.canvasOffset;
			this.x = this.position().left - this.canvas.options.canvasOffset;
			for (var id in this.editor.blocks) {
				if (this !== this.editor.blocks[id] && this.editor.blocks[id].isActive()) {
					this.editor.blocks[id].updatePosition(dx, dy);
				}
			}
			this.canvas.redraw();
		}
	}
};

Block.prototype.updatePosition = function(dx, dy) {
	this.$container.css({
		left: parseInt(this.$container.css('left')) - dx,
		top: parseInt(this.$container.css('top')) - dy
	});
	this.x = this.x - dx;
	this.y = this.y - dy;
};

Block.prototype._onDragEnd = function(e) {
	this._dragging = false;
	$('body').off('mousemove.block-editor mouseup.block-editor');
	this.editor.onChange();
};

Block.prototype._onClick = function(e) {
	if (!this._moved && !$(e.target).is('a')) {
		this.activate();
	}
};

Block.prototype.isActive = function() {
	return this._active;
};

Block.prototype.activate = function() {
	this._active = true;
	var className = BlockEditor._namespace + '-active';
	this.$container.addClass(className);
};

Block.prototype.deactivate = function() {
	this._active = false;
	var className = BlockEditor._namespace + '-active';
	this.$container.removeClass(className);
};

Block.prototype._create = function() {
	// create table container
	this.$container = $('<table class="' + BlockEditor._namespace + '-block">');

	// make it draggable
	this.$container.on('click', this._onClick.bind(this));
	this.$container.on('mousedown', this._onDragStart.bind(this));

	// header with block id and block type
	var $header = this._createHeader();

	// inputs
	this.$inputs = $('<td class="' + BlockEditor._namespace + '-block-inputs" />');
	for (var variable in this.defaults.inputs) {
		this.addInput(variable);
	}
	for (var variable in this.values) {
		if (!(variable in this.defaults.inputs)) {
			this.addInput(variable);
		}
	}
	this.addInput('enable');

	// outputs
	this.$outputs = $('<td class="' + BlockEditor._namespace + '-block-outputs" />');
	for (var variable in this.defaults.outputs) {
		this.addOutput(variable);
	}

	this.$container.append($('<tr />').append($header));
	this.$container.append($('<tr />').append(this.$inputs).append(this.$outputs));
};

Block.prototype._createHeader = function() {
	var $id = $('<div class="' + BlockEditor._namespace + '-block-id">');
	$id.on('dblclick', this._changeId.bind(this));
	var $type = $('<div class="' + BlockEditor._namespace + '-block-type">');
	$type.text(this.type);
	$type.on('dblclick', this._changeType.bind(this));

	var $removeButton = $('<a href="#remove" class="' + BlockEditor._namespace + '-block-remove">×</a>');
	$removeButton.on('click', this._remove.bind(this));
	$removeButton.attr('title', 'Remove block');
	var $docButton = $('<a class="' + BlockEditor._namespace + '-block-doc">o</a>');
	$docButton.attr('href', this.palette.docLink.replace('{block}', this.type));
	$docButton.attr('target', '_blank');
	$docButton.attr('title', 'Block documentation');

	var $header = $('<th colspan="2" class="' + BlockEditor._namespace + '-block-header" />');
	$header.append($id.text(this.id));
	$header.append($type);
	$header.append($removeButton);
	$header.append($docButton);

	return $header;
}

Block.prototype.addInput = function(variable) {
	var $input = $('<div class="' + BlockEditor._namespace + '-block-input" />');
	$input.attr('data-variable', variable);
	var $link = $('<a href="#settings">' + variable + '</a>');
	$link.on('click', this._toggleInputEditor.bind(this))
	$input.append($link);
	$input.addClass(BlockEditor._namespace + '-invar-' + variable);
	if ((!this.values || !this.values[variable]) && (!this.connections[variable])) {
		$input.addClass('default');
	}
	this.$inputs.append($input);
};

Block.prototype.addOutput = function (variable) {
	var $output = $('<div class="' + BlockEditor._namespace + '-block-output" />');
	$output.text(variable);
	$output.addClass(BlockEditor._namespace + '-outvar-' + variable);
	this.$outputs.append($output);
};

Block.prototype._toggleInputEditor = function(e) {
	var editor = new Editor(this, this.editor, $(e.target).text());
	editor.render();

	return false;
};

Block.prototype.getNewId = function() {
	var old = this.id;
	var id = null;
	while (id === null) {
		id = window.prompt(_('New block ID:'), old);

		if (id === null) {
			return id;
		} else if (!id.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
			alert(_('Only letters, numbers and underscore are allowed in block ID and the first character must be a letter.'));
			old = id;
			id = null;
		} else if (id in this.editor.blocks) {
			alert(_('This block ID is already taken by another block.'));
			old = id;
			id = null;
		}
	}

	return id;
};

Block.prototype._changeId = function() {
	var id = this.getNewId();

	if (id === null) {
		return;
	} else {
		this.id = id;
		this.redraw();
		this.editor.onChange();
	}

	return false;
};

Block.prototype._changeType = function() {
	// todo selectbox?
	var old = this.type;
	var type = null;
	while (type === null) {
		type = window.prompt(_('New block ID:'), old);

		if (type === null) {
			break;
		} else if (!type.match(/^[a-zA-Z][a-zA-Z0-9_/]*$/)) {
			alert(_('Only letters, numbers and underscore are allowed in block type and the first character must be a letter.'));
			old = type;
			type = null;
		} else if (!(type in this.palette.blocks)) {
			alert(_('This block type does not exist.'));
			old = type;
			type = null;
		}
	}

	if (type === null) {
		return;
	} else {
		this.type = type;
		this.redraw();
		this.editor.onChange();
	}

	return false;
};

Block.prototype._remove = function() {
	if (confirm(_('Do you wish to remove block "' + this.id + '"? There is no undo button.'))) {
		for (var i in this.connections) {
			delete this.connections[i];
		}
		this.$container.remove();
		delete this.editor.blocks[this.id];
		this.canvas.redraw();
		this.editor.onChange();
	}

	return false;
};

Block.prototype.renderConnections = function() {
	var x2 = this.position().left - 3;
	var y2 = this.position().top;
	for (var id in this.connections) {
		var sources = this.connections[id];
		for (var i = 0; i < sources.length; i = i + 2) {
			this._renderConnection(id, sources.slice(i, i + 2), x2, y2);
		}
	}
};

Block.prototype._renderConnection = function(id, source, x2, y2) {
	// aggregation (:and, :or, ...)
	if (source[0] === '') {
		var query = '.' + BlockEditor._namespace + '-invar-' + id;
		var yy2 = y2 // from top of block container
			+ this.$container.find(query).position().top; // add position of variable
		this.canvas._writeText(source[1], x2 - 15, yy2);
		return;
	}

	var block = this.editor.blocks[source[0]];
	if (block) {
		var query = '.' + BlockEditor._namespace + '-invar-' + id;
		if (this.$container.find(query).length) {
			var yy2 = y2 // from top of block container
				+ 7	 // center of row
				+ this.$container.find(query).position().top; // add position of variable
		} else {
			var yy2 = y2 + 36; // block header height + center of row
		}
		query = '.' + BlockEditor._namespace + '-outvar-' + source[1];

		if (block.$container.find(query).length === 0) {
			if ('*' in block.defaults.outputs) {
				block.addOutput(source[1]);
				this.canvas.redraw();
			} else {
				alert(_('Source block does not have output with given name or wildcard output!'));
			}
			return false;
		}

		var offset = block.position();
		var x1 = offset.left // from left of block container
				+ 1			 // offset
				+ block.$container.outerWidth(); // add container width
		var y1 = offset.top // from top of block container
				+ 7			// center of row
				+ block.$container.find(query).position().top; // add position of variable
		this.canvas._drawConnection(x1, y1, x2, yy2);
	}
};

Block.prototype.serialize = function() {
	var B = {
		block: this.type,
		x: this.x,
		y: this.y
	};
	if (this.force_exec !== null) {
		B.force_exec = this.force_exec;
	}
	for (var input in this.values) {
		if (input !== '*' && this.values[input] !== undefined) {
			if (!('in_val' in B)) {
				B.in_val = {};
			}
			B.in_val[input] = this.values[input];
		}
	}
	for (var input in this.connections) {
		if (input !== '*' && this.connections[input] !== undefined) {
			if (this.connections[input] instanceof Array) {
				if (!('in_con' in B)) {
					B.in_con = {};
				}
				B.in_con[input] = this.connections[input]
					.map(function (x) {return x[0] === ':' ? [x] : x.split(':');})
					.reduce(function (a, b) {return a.concat(b);});
			}
		}
	}
	return B;
};
