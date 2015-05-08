/**
 * Grid representation for A* path finding
 *
 * @param {Array} blocks - blocks to avoid when planning the path
 * @param {Number} width - bounding box width
 * @param {Number} height - bounding box height
 * @param {Number} segment - length of single segment (size of square side)
 * @param {Point} offset - offset of most top left point
 * @constructor
 * @class
 */
var Grid = function(blocks, width, height, segment, offset) {
	this._offset = offset;
	this._segment = segment;
	this._grid = [];
	for (var x = 0; x <= Math.floor(width / segment) + 1; x++) {
		this._grid[x] = [];
		for (var y = 0; y <= Math.floor(height / segment) + 1; y++) {
			this._grid[x][y] = 1;
		}
	}
	this.avoidBlocks(blocks);
};

/**
 * Sets walls in grid based on blocks' coordinates
 *
 * @param {Object} blocks
 */
Grid.prototype.avoidBlocks = function(blocks) {
	var offset = this._segment / 3;
	for (var i in blocks) {
		var b = blocks[i];
		var box = b.getBoundingBox();
		var fromX = Math.ceil((box.topLeft.x - this._offset.x - offset) / this._segment);
		var maxX = Math.ceil((box.topLeft.x - this._offset.x + b.$container.outerWidth() + offset) / this._segment);
		for (var x = fromX; x < maxX; x++) {
			var fromY = Math.ceil((box.topLeft.y - this._offset.y - offset) / this._segment);
			var maxY = Math.ceil((box.topLeft.y - this._offset.y + b.$container.outerHeight() + offset) / this._segment);
			for (var y = fromY; y < maxY; y++) {
				this._grid[x][y] = 0;
			}
		}
	}
};

/**
 * Renders grid control points, used for debugging
 *
 * @param {CanvasRenderingContext2D} context
 */
Grid.prototype.render = function(context) {
	for (var x in this._grid) {
		for (var y in this._grid[x]) {
			this._renderPoint(context, x, y);
		}
	}
};

/**
 * Renders given path, used for debugging
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Array} path
 */
Grid.prototype.renderPath = function(context, path) {
	for (var p in path) {
		this._renderPoint(context, path[p].x, path[p].y, '#4dff4d');
	}
};

/**
 * Renders single point, used for debugging
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Number} x
 * @param {Number} y
 * @param {String} color
 * @private
 */
Grid.prototype._renderPoint = function(context, x, y, color) {
	context.save();
	if (this._grid[x][y] === 0) {
		color = 'black';
	}
	context.strokeStyle = color || 'red';
	context.beginPath();
	context.arc(this._offset.x + x * this._segment, this._offset.y + y * this._segment, 2, 0, 2 * Math.PI);
	context.closePath();
	context.stroke();
	if (color || this._grid[x][y] === 0) {
		context.fillStyle = color || 'darkred';
		context.fill();
	}
	context.restore();
};

/**
 * Returns this grid's array
 *
 * @returns {Array}
 */
Grid.prototype.toArray = function() {
	return this._grid;
};

/**
 * Creates canvas point instance based on relative grid coordinates
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {Point}
 */
Grid.prototype.getPointObject = function(x, y) {
	return new Point(this._offset.x + x * this._segment, this._offset.y + y * this._segment);
};

/**
 * Gets grid node with given relative coordinates
 *
 * @param {Object} grid
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} clear
 * @returns {*}
 */
Grid.prototype.getPoint = function(grid, x, y, clear) {
	x = Math.round((x - this._offset.x) / this._segment);
	y = Math.round((y - this._offset.y) / this._segment);
	if (clear) {
		this._grid[x][y] = 1;
		grid[x][y].weight = 1;
	}
	return grid[x][y];
};
