/*
 * canvas class
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var Canvas = function(editor) {
	this.editor = editor;
	this.options = this.editor.options;
	this.width = this.options.canvasWidth;
	this.height = this.options.canvasHeight;
	this.controls = {};
	this._create();
};

Canvas.prototype._drawLine = function(fromX, fromY, toX, toY) {
	this.context.save();
	this.context.beginPath();
	this.context.translate(0.5, 0.5);
	this.context.moveTo(fromX, fromY);
	this.context.lineTo(toX, toY);
	this.context.closePath();
	this.context.stroke();
	this.context.restore();
};

Canvas.prototype._drawBackground = function() {
	$(this.canvas).css('background', this.options.canvasBackgroundColor);
	this.context.strokeStyle = this.options.canvasBackgroundLineColor;
	this.context.lineWidth = 1;
	var step = this.options.canvasBackgroundLineStep;

	// vertical lines
	var max = this.width / step;
	for (var i = 0; i < max; i++) {
		this._drawLine(i * step, 0, i * step, this.width);
	}

	// horizontal lines
	max = this.height / step;
	for (var i = 0; i < max; i++) {
		this._drawLine(0, i * step, this.height, i * step);
	}

	this.context.fillStyle = '#000';
};

Canvas.prototype._create = function() {
	// create canvas element
	this.canvas = $('<canvas>')[0];
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.context = this.canvas.getContext('2d');
	this._drawBackground();

	// create scroll container
	this.$container = $('<div>');
	this.$container.attr('class', BlockEditor._namespace + '-container');
	this.$container.css({
		width: this.editor.$container.width(),
		height: this.editor.$container.height()
	});
	this.$container.on({
		mousedown: this._onMouseDown.bind(this),
		mouseup: this._onMouseUp.bind(this),
		mousemove: this._onMouseMove.bind(this)
	});
	this.$container.append(this.canvas);
	this.editor.$container.append(this.$container);
};

Canvas.prototype._onMouseDown = function(e) {
	if (e.metaKey && $(e.target).is('canvas')) { // selecting blocks
		this._cursor = {
			x: e.pageX - this.$container.offset().left + this.$container.scrollLeft(),
			y: e.pageY - this.$container.offset().top + this.$container.scrollTop()
		};
		this._$selection = $('<div class="' + BlockEditor._namespace + '-selection">');
		this._$selection.css({
			left: this._cursor.x,
			top: this._cursor.y
		});
		this.$container.append(this._$selection);
		return;
	}

	var block = $(e.target).closest('table.' + BlockEditor._namespace + '-block')[0];
	if (!block) {
		var speed = this.options.canvasSpeed;
		this._moving = true;
		this._cursor = {
			x: (this.canvas.width - speed * e.pageX) - this.$container.scrollLeft(),
			y: (this.canvas.height - speed * e.pageY) - this.$container.scrollTop()
		};
	}
};

Canvas.prototype._onMouseMove = function(e) {
	if (this._$selection) {
		var currX = e.pageX - this.$container.offset().left + this.$container.scrollLeft();
		var currY = e.pageY - this.$container.offset().top + this.$container.scrollTop();
		var width = currX - this._cursor.x;
		var height = currY - this._cursor.y;
		this._$selection.css({
			width: Math.abs(width),
			height: Math.abs(height)
		});
		if (width < 0) {
			this._$selection.css('left', currX);
		}
		if (height < 0) {
			this._$selection.css('top', currY);
		}
	}

	if (this._moving) {
		var speed = this.options.canvasSpeed;
		this.$container.scrollLeft((this.canvas.width - speed * e.pageX) - this._cursor.x);
		this.$container.scrollTop((this.canvas.height - speed * e.pageY) - this._cursor.y);
	}
};

Canvas.prototype._onMouseUp = function(e) {
	if (this._$selection) {
		for (var id in this.editor.blocks) {
			var b = this.editor.blocks[id];
			var currX = e.pageX - this.$container.offset().left + this.$container.scrollLeft();
			var currY = e.pageY - this.$container.offset().top + this.$container.scrollTop();
			var blockX = b.position().left;
			var blockXW = b.position().left + b.$container.width();
			var blockY = b.position().top;
			var blockYH = b.position().top + b.$container.height();

			if (currX - this._cursor.x < 0) { // right to left selection => allow selecting just part of block
				if (currX < blockXW && this._cursor.x > blockX &&
					((currY > blockY && this._cursor.y < blockYH) || (this._cursor.y > blockY && currY < blockYH))) {
					b.activate();
				}
			} else { // left to right selection => select only whole block
				if (currX > blockXW && this._cursor.x < blockX &&
					((currY > blockYH && this._cursor.y < blockY) || this._cursor.y > blockYH && currY < blockY)) {
					b.activate();
				}
			}
		}

		this._$selection.remove();
		delete this._$selection;
		this.selection = true; // prevent disabling selection by click event on canvas

		return false;
	}
	this._moving = false;
};

Canvas.prototype._drawConnection = function(fromX, fromY, toX, toY, color) {
	// line style
	color = color || '#000';
	this.context.save();
	this.context.beginPath();
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.lineWidth = 1.4;

	// control points based on x-diff
	var diffX = Math.abs(toX - fromX) / 2;
	var cp1X = fromX + diffX;
	var cp1Y = fromY;
	var cp2X = toX - diffX;
	var cp2Y = toY;

	// draw curved line
	this.context.moveTo(fromX, fromY);
	this.context.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, toX, toY);
	this.context.stroke();
	this.context.closePath();

	// draw arrow in the end point
	this._drawArrow(toX, toY, color);
};

Canvas.prototype._dist = function(fromX, fromY, toX, toY) {
	var diffX = (toX - fromX) * (toX - fromX);
	var diffY = (toY - fromY) * (toY - fromY);
	return Math.sqrt(diffX + diffY);
};

Canvas.prototype._drawArrow = function(x, y) {
	this.context.save();
	this.context.beginPath();
	this.context.lineWidth = 2;

	this.context.moveTo(x, y);
	this.context.lineTo(x - 6, y - 3);
	this.context.lineTo(x - 4, y);
	this.context.lineTo(x - 6, y + 3);
	this.context.lineTo(x, y);

	this.context.closePath();
	this.context.fill();
	this.context.stroke();
	this.context.restore();
};

Canvas.prototype._writeText = function(text, x, y) {
	this.context.save();
	this.context.fillStyle = "#690299";
	this.context.font = "11px Arial";
	this.context.textAlign = 'right';
	this.context.fillText(text, x, y);
	this.context.restore();
};

Canvas.prototype.redraw = function() {
	this.context.clearRect(0, 0, this.width, this.height);
	this._drawBackground();
	for (var id in this.editor.blocks) {
		this.editor.blocks[id].renderConnections();
	}
};
