/**
 * placeholder entity
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Placeholder = function(id, data, editor) {
	// extends Block
	Block.apply(this, arguments);

	this.type = id;
	var s = id.split('/');
	this.id = s[s.length - 1];

	this.defaults = data;
};

// extends Block
Placeholder.prototype = Object.create(Block.prototype);
Placeholder.prototype.constructor = Placeholder;

Placeholder.prototype._create = function(e) {
	Block.prototype._create.call(this);
	var t = this.type.replace(/\/[^\/]*$/, '').replace(/\//g, '-');
	this.$container.addClass(BlockEditor._namespace + '-filter-' + t);
	this.$container.off('click');
};

Placeholder.prototype._onDragStart = function(e) {
	this._dragging = true;
	this._moved = false;
	this._cursor = {
		x: e.pageX
			- this.position().left
			- this.$container.parent()[0].offsetLeft
			+ this.$container.parent()[0].scrollLeft,
		y: e.pageY
			- this.position().top
			- this.$container.parent()[0].offsetTop
			+ this.$container.parent()[0].scrollTop
	};
	this.$container.disableSelection();

	$('body').on({
		'mousemove.block-editor': this._onDragOver.bind(this),
		'mouseup.block-editor': this._onDragEnd.bind(this)
	});
};

Placeholder.prototype._onDragOver = function(e) {
	if (this._dragging) {
		if (!this.$clone) {
			this.$clone = this.$container.clone().addClass(BlockEditor._namespace + '-clone');
			this.canvas.$container.append(this.$clone);
		}

		var left = e.pageX - this._cursor.x + this.canvas.$container.scrollLeft();
		var top = e.pageY - this._cursor.y + this.canvas.$container.scrollTop();
		this._moved = this.position().left !== left || this.position().top !== top;
		this.$clone.css({
			left: left < 0 ? 0 : left,
			top: top < 0 ? 0 : top
		});
		this.canvas.redraw();
	}
};

Placeholder.prototype._onDragEnd = function(e) {
	if (this.$clone && this._moved) {
		var id = this.getNewId();
		if (id) {
			var data = {
				block: this.type,
				in_con: {},
				in_val: {},
				x: this.$clone[0].offsetLeft - this.editor.options.canvasOffset,
				y: this.$clone[0].offsetTop - this.editor.options.canvasOffset
			};
			this.editor.addBlock(id, data);
		}
		this.$clone.remove();
		delete this.$clone;
	}
	this._dragging = false;
	$('body').off('mousemove.block-editor mouseup.block-editor');
};
