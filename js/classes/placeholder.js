/**
 * placeholder entity
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Placeholder = function(id, data, editor) {
	// extends Block
	Block.apply(this, arguments);

	this.defaults = data;
	this.type = id;
	var s = id.split('/');
	this.id = s[s.length - 1];
	this.defaults.inputs.enable = {}; // todo
};

// extends Block
Placeholder.prototype = Object.create(Block.prototype);
Placeholder.prototype.constructor = Placeholder;

Placeholder.prototype._create = function(e) {
	Block.prototype._create.call(this);
};

Placeholder.prototype._onDragStart = function(e) {
	this.$clone = this.$container.clone().addClass(BlockEditor._namespace + '-clone');
	this.$clone.css({
		position: 'absolute',
		left: this.canvas.$container.scrollLeft() + 'px',
		top: this.canvas.$container.scrollTop() + 'px'
	});
	this.canvas.$container.append(this.$clone);

	this._dragging = true;
	this._cursor = {
		x: e.clientX - this.$container.position().left,
		y: e.clientY - this.$container.position().top
	};
	this.$container.disableSelection();
};

Placeholder.prototype._onDragOver = function(e) {
	if (this._dragging) {
		var left = e.clientX - this._cursor.x + this.canvas.$container.scrollLeft() + 'px';
		var top = e.clientY - this._cursor.y + this.canvas.$container.scrollTop();
		this.$clone.css({
			left: left < 0 ? 0 : left,
			top: top < 0 ? 0 : top
		});
		this.canvas.redraw();
	}
};

Placeholder.prototype._onDragEnd = function(e) {
	if (this.$clone) {
		this.$clone.removeClass(BlockEditor._namespace + '-clone');
		// todo replace with new block registered in editor, destroy $clone
		this._dragging = false;
	}
};
