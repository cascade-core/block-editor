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
	this.values = data.in_val;
	this.connections = data.in_con;
	this.placeholder = false;
	this.type = data.block;
//	this.inputs = {};
//	this.outputs = {};
//	this.variables = {};
	this.x = data.x;
	this.y = data.y;

	this.defaults = this.palette.blocks[data.block];
	this.defaults.inputs.enable = {}; // todo
};

Block.prototype.render = function() {
	// create DOM if not exists
	if (!this.$container) {
		this._create();
	}

	// update position
	this.$container.css({
		top: this.y + this.canvas.options.canvasOffset,
		left: this.x + this.canvas.options.canvasOffset
	});
};

Block.prototype._create = function() {
	// create table container
	this.$container = $('<table class="' + BlockEditor._namespace + '-block">');

	// header with block id and block type
	var $id = $('<div class="' + BlockEditor._namespace + '-block-id">');
	var $type = $('<div class="' + BlockEditor._namespace + '-block-type">');
	$type.text(this.type);
	var $header = $('<th colspan="2" class="' + BlockEditor._namespace + '-block-header" />');
	$header.append($id.text(this.id));
	$header.append($type);
	$header.append('<a href="#remove" class="' + BlockEditor._namespace + '-block-remove">×</a>');
	$header.append('<a href="' + this.palette.docLink.replace('{block}', this.type) + '" class="' + BlockEditor._namespace + '-block-doc">o</a>');

	// inputs
	var $inputs = $('<td class="' + BlockEditor._namespace + '-block-inputs" />');
	for (var variable in this.defaults.inputs) {
		var $input = $('<div class="' + BlockEditor._namespace + '-block-input" />');
		$input.html('<a href="#settings">' + variable + '</a>');
		$input.addClass(BlockEditor._namespace + '-invar-' + variable);
		$input.addClass('default');
		$inputs.append($input);
	}

	// outputs
	var $outputs = $('<td class="' + BlockEditor._namespace + '-block-outputs" />');
	for (var variable in this.defaults.outputs) {
		var $output = $('<div class="' + BlockEditor._namespace + '-block-output" />');
		$output.text(variable);
		$output.addClass(BlockEditor._namespace + '-outvar-' + variable);
		$outputs.append($output);
	}
	this.$container.append($('<tr />').append($header));
	this.$container.append($('<tr />').append($inputs).append($outputs));
	this.canvas.$container.append(this.$container);
};

Block.prototype.renderConnections = function() {
	var x2 = this.$container.position().left - 3;
	var y2 = this.$container.position().top;
	for (var id in this.connections) {
		var source = this.connections[id];
		var block = this.editor.blocks[source[0]];
		var query = '.' + BlockEditor._namespace + '-invar-' + id;
		if (this.$container.find(query).length) {
			var yy2 = y2 // from top of block container
				    + 6	 // from center of row
				    + this.$container.find(query).position().top; // add position of variable
		} else {
			var yy2 = y2 + 36; // block header height + center of row
		}
		if (block) {
			var query = '.' + BlockEditor._namespace + '-outvar-' + source[1];
			var offset = block.$container.position();
			var x1 = offset.left // from left of block container
				   + 1			 // offset
				   + block.$container.outerWidth(); // add container width
			var y1 = offset.top // from top of block container
				   + 7			// from center of row
				   + block.$container.find(query).position().top; // add position of variable
			this.canvas._drawConnection(x1, y1, x2, yy2);
		}
	}
};
