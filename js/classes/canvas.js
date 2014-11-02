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
	var block = $(e.target).closest('table.' + BlockEditor._namespace + '-block')[0];
	if (!block) {
		var speed = this.options.canvasSpeed;
		this._moving = true;
		this._cursor = {
			x: (this.canvas.width - speed * e.pageX) - this.$container.scrollLeft(),
			y: (this.canvas.height - speed * e.pageY) - this.$container.scrollTop()
		};
		this.$container.disableSelection();
	}
};

Canvas.prototype._onMouseMove = function(e) {
	if (this._moving) {
		var speed = this.options.canvasSpeed;
		this.$container.scrollLeft((this.canvas.width - speed * e.pageX) - this._cursor.x);
		this.$container.scrollTop((this.canvas.height - speed * e.pageY) - this._cursor.y);
	}
};

Canvas.prototype._onMouseUp = function(e) {
	this._moving = false;
};

Canvas.prototype._drawConnection = function(fromX, fromY, toX, toY) {
	// line style
	this.context.save();
	this.context.beginPath();
	this.context.fillStyle = '#000';
	this.context.strokeStyle = '#000';
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
	this._drawArrow(toX, toY);
};

Canvas.prototype._dist = function(fromX, fromY, toX, toY) {
	var diffX = (toX - fromX) * (toX - fromX);
	var diffY = (toY - fromY) * (toY - fromY);
	return Math.sqrt(diffX + diffY);
};

Canvas.prototype._drawArrow = function(x, y) {
	this.context.save();
	this.context.beginPath();
	this.context.fillStyle = '#000';
	this.context.strokeStyle = '#000';
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

Canvas.prototype.redraw = function() {
//	requestAnimationFrame(this.redraw.bind(this));
	this.context.clearRect(0, 0, this.width, this.height);
	this._drawBackground();
	for (var id in this.editor.blocks) {
		this.editor.blocks[id].renderConnections();
	}
};
