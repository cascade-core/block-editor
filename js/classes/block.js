/**
 * block entity
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
		this.$container.css({
			left: left < 0 ? 0 : left,
			top: top < 0 ? 0 : top
		});
		this.canvas.redraw();
	}
};

Block.prototype._onDragEnd = function(e) {
	this._dragging = false;
	$('body').off('mousemove.block-editor mouseup.block-editor');

	// update coordinates
	this.y = this.position().top - this.canvas.options.canvasOffset;
	this.x = this.position().left - this.canvas.options.canvasOffset;
	this.editor.onChange();
};

Block.prototype._onClick = function(e) {
	if (!this._moved && !$(e.target).is('a')) {
		var className = BlockEditor._namespace + '-active';
		this.$container.toggleClass(className);
		this._active = this.$container.hasClass(className);
	}
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
}

Block.prototype._toggleInputEditor = function(e) {
	var editor = new Editor(this, this.editor, $(e.target).text());
	editor.render();

	return false;
};

Block.prototype.getNewId = function() {
	var id = window.prompt(_('New block ID:'), this.id);

	if (id === null) {
		return;
	} else if (!id.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
		alert(_('Only letters, numbers and underscore are allowed in block ID and the first character must be a letter.'));
	} else if (id in this.editor.blocks) {
		alert(_('This block ID is already taken by another block.'));
	} else {
		return id;
	}

	return null;
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
	var type = window.prompt(_('New block type:'), this.type);
	// todo selectbox?

	if (type === null) {
		return;
	} else if (!type.match(/^[a-zA-Z][a-zA-Z0-9_/]*$/)) {
		alert(_('Only letters, numbers and underscore are allowed in block type and the first character must be a letter.'));
	} else if (!(type in this.palette.blocks)) {
		alert(_('This block type does not exist.'));
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
