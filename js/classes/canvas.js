/**
 * canvas class
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 *
 * @param {BlockEditor} editor - reference to plugin instance
 * @class
 */
var Canvas = function(editor) {
	this.editor = editor;
	this.options = this.editor.options;
	this.controls = {};
};

/**
 * Renders canvas and its container, computes width and height based on diagram bounding box

 * @param {object} box
 */
Canvas.prototype.render = function(box) {
	this.width = box.maxX - box.minX + 2 * this.options.canvasExtraWidth;
	this.height = box.maxY - box.minY + 2 * this.options.canvasExtraHeight;
	this._create();
};

/**
 * Draws straight line to this canvas
 *
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @private
 */
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

/**
 * Draws canvas background
 * @private
 */
Canvas.prototype._drawBackground = function() {
	$(this.canvas).css('background', this.options.canvasBackgroundColor);
	this.context.strokeStyle = this.options.canvasBackgroundLineColor;
	this.context.lineWidth = 1;
	var step = this.options.canvasBackgroundLineStep;

	// vertical lines
	var max = this.width / step;
	for (var i = 0; i < max; i++) {
		this._drawLine(i * step, 0, i * step, this.height);
	}

	// horizontal lines
	max = this.height / step;
	for (var i = 0; i < max; i++) {
		this._drawLine(0, i * step, this.width, i * step);
	}

	this.context.fillStyle = '#000';
};

/**
 * Creates container and canvas element
 * @private
 */
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
		mousemove: this._onMouseMove.bind(this),
		scroll: this._onScroll.bind(this)
	});
	// disable text selection, forces default cursor when selecting
	this.$container[0].onselectstart = function() {
		return false;
	};

	// create inner container - used to scale transformation (zoom)
	this.$containerInner = $('<div>');
	this.$containerInner.css('width', this.width);
	this.$containerInner.css('height', this.height);
	this.$containerInner.attr('class', BlockEditor._namespace + '-container-inner');
	this.$containerInner.append(this.canvas);
	this.$container.append(this.$containerInner);
	this.editor.$container.append(this.$container);

	// save initial center position of viewport
	var $c = this.$container;
	this._center = {
		x: ($c.scrollLeft() + $c.width() / 2),
		y: ($c.scrollTop() + $c.height() / 2)
	};
};

/**
 * Move canvas or start making selection
 * used as mouse down handler
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Canvas.prototype._onMouseDown = function(e) {
	if ((e.metaKey || e.ctrlKey) && $(e.target).is('canvas')) { // selecting blocks
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
		var zoom = this.getZoom();
		var speed = this.options.canvasSpeed / zoom;
		this._moving = true;
		this._cursor = {
			x: (this.canvas.width - speed * e.pageX) - this.$container.scrollLeft(),
			y: (this.canvas.height - speed * e.pageY) - this.$container.scrollTop()
		};
	}
};

/**
 * Moves canvas - used as mousemove handler
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Canvas.prototype._onMouseMove = function(e) {
	var $c = this.$container;

	if (this._$selection) {
		var currX = e.pageX - $c.offset().left + $c.scrollLeft();
		var currY = e.pageY - $c.offset().top + $c.scrollTop();
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
		var zoom = this.getZoom();
		var speed = this.options.canvasSpeed / zoom;
		$c.scrollLeft((this.canvas.width - speed * e.pageX) - this._cursor.x);
		$c.scrollTop((this.canvas.height - speed * e.pageY) - this._cursor.y);
	}
};

/**
 * On scroll handler, used to save current center of viewport (used when zooming)
 *
 * @param {ScrollEvent} e - Event
 * @private
 */
Canvas.prototype._onScroll = function(e) {
	// save center of viewport
	var zoom = this.getZoom();
	var $c = this.$container;
	this._center = {
		x: ($c.scrollLeft() + $c.width() / 2) / zoom,
		y: ($c.scrollTop() + $c.height() / 2) / zoom
	};
};

/**
 * Completes selection of blocks
 *
 * @param {MouseEvent} e - Event
 * @private
 */
Canvas.prototype._onMouseUp = function(e) {
	if (this._$selection) {
		var zoom = this.getZoom();
		this._cursor.x /= zoom;
		this._cursor.y /= zoom;
		for (var id in this.editor.blocks) {
			var b = this.editor.blocks[id];
			var currX = e.pageX - this.$container.offset().left + this.$container.scrollLeft();
			var currY = e.pageY - this.$container.offset().top + this.$container.scrollTop();
			currX /= zoom;
			currY /= zoom;
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

/**
 * Does line intersect with any block?
 *
 * @param {string} id - block id
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @returns {Array}
 * @private
 */
Canvas.prototype._getIntersections = function(id, fromX, fromY, toX, toY) {
	var b = this.editor.blocks[id];
	var box = b.getBoundingBox();
	var ret = [], intersection;

	// top line intersection
	intersection = this._lineIntersects(new Line(box.topLeft, box.topRight), fromX, fromY, toX, toY);
	if (intersection) {
		ret.push(intersection);
	}

	// bottom line intersection
	intersection = this._lineIntersects(new Line(box.bottomLeft, box.bottomRight), fromX, fromY, toX, toY);
	if (intersection) {
		ret.push(intersection);
	}

	// left line intersection
	intersection = this._lineIntersects(new Line(box.topLeft, box.bottomLeft), fromX, fromY, toX, toY);
	if (intersection) {
		ret.push(intersection);
	}

	// right line intersection
	intersection = this._lineIntersects(new Line(box.topRight, box.bottomRight), fromX, fromY, toX, toY);
	if (intersection) {
		ret.push(intersection);
	}

	return ret;
};

/**
 * Do lines intersects with each other?
 *
 * @param {Line} line
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @private
 */
Canvas.prototype._lineIntersects = function(line, fromX, fromY, toX, toY) {
	var s1X = toX - fromX;
	var s1Y = toY - fromY;
	var s2X = line.to.x - line.from.x;
	var s2Y = line.to.y - line.from.y;
	var s = (-s1Y * (fromX - line.from.x) + s1X * (fromY - line.from.y)) / (-s2X * s1Y + s1X * s2Y);
	var t = ( s2X * (fromY - line.from.y) - s2Y * (fromX - line.from.x)) / (-s2X * s1Y + s1X * s2Y);

	// Collision detected
	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		var intX = fromX + (t * s1X);
		var intY = fromY + (t * s1Y);
		return new Point(intX, intY);
	}

	return null; // No collision
};

/**
 * Draws connection line with arrow pointing to end
 *
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {string} [color='#000'] defaults to black
 * @private
 */
Canvas.prototype._drawConnection = function(fromX, fromY, toX, toY, color) {
	// line style
	color = color || '#000';
	this.context.save();
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.lineWidth = 1.4;

	// line points with starting point
	var points = [new Point(fromX + 10, fromY)];

	// find intersections with other blocks
	for (var id in this.editor.blocks) {
		var intersections = this._getIntersections(id, fromX + 10, fromY, toX - 10, toY);
		if (intersections.length) {
			// find block border points to avoid
			var b = this.editor.blocks[id];
			var box = b.getBoundingBox();
			var follow = this._findPointsToFollow(box, intersections, new Point(fromX, fromY), new Point(toX, toY));
			points = points.concat(follow);
		}
	}

	points.push(new Point(toX - 10, toY));
	//console.log(points);
	points = this._sortPoints(points);
	//console.log(points);

	// add original start & end points
	points.unshift(new Point(fromX, fromY));
	points.push(new Point(toX, toY));

	// draw curved line
	var path = new Spline(points, 0.5, this.context);
	path.render();

	// draw arrow in the end point
	this._drawArrow(toX, toY, color);
};

/**
 * Topologically sorts given points to path using modified Floyd Warshall algorithm
 * preserves first and last point
 *
 * @param {Array} points - array of points
 * @returns {Array} sorted path (array of points)
 * @private
 */
Canvas.prototype._sortPoints = function(points) {
	// create distance matrix
	var dist = [];
	var infimum = this.width + this.height; // bigger than potential maximum
	for (var i in points) {
		var row = [];
		for (var j in points) {
			if (i == points.length - 1 || j == points.length - 1) {
				row[j] = infimum;
			} else {
				row[j] = Utils.dist(points[i], points[j]);
			}
		}
		dist[i] = row;
	}

	// find path
	var curr = '0'; // js indexes array with string numbers
	var path = [];
	do {
		path.push(curr);
		var min = Infinity, minI = '-1';
		for (var i in dist) {
			if (min > dist[curr][i] && i !== curr && path.indexOf(i) === -1) {
				min = dist[curr][i];
				minI = i;
			}
		}
		//console.log(curr, path, dist[curr][minI]);
		curr = minI;
	} while (path.length < points.length);

	for (var i in path) {
		path[i] = points[path[i]];
	}

	// find path
	return path;
};

/**
 * Finds points that should be followed to avoid box
 *
 * @param {Object} box
 * @param {Array} inters - intersections
 * @param {Point} from
 * @param {Point} to
 * @returns {Array}
 * @private
 */
Canvas.prototype._findPointsToFollow = function(box, inters, from, to) {
	var ret = [];

	// find nearest border points of box
	for (var i in inters) {
		var min = Infinity, point = null;
		for (var p in box) {
			var d = Utils.dist(inters[i], box[p]);
			if (d < min) {
				min = d;
				point = new Point(box[p].x, box[p].y); // copy
				point.x += 10 * (p.indexOf('Left') > -1 ? -1 : 1);
				point.y += 10 * (p.indexOf('top') > -1 ? -1 : 1);
				point.placement = p;
			}
		}
		ret.push(point);
	}

	// check for diagonal through box
	if (inters.length === 2) {
		var p1 = ret[ret.length - 2];
		var p2 = ret[ret.length - 1];
		var p1p = p1.placement;
		var p2p = p2.placement;
		if (!(
			(p1p.indexOf('top') === 0 		&& p2p.indexOf('top') === 0) ||
			(p1p.indexOf('bottom') === 0	&& p2p.indexOf('bottom') === 0) ||
			(p1p.indexOf('Left') > 0 		&& p2p.indexOf('Left') > 0) ||
			(p1p.indexOf('Right') > 0 		&& p2p.indexOf('Right') > 0)
		)) {
			if (Math.abs(p1.y - from.y) < Math.abs(p2.y - to.y)) {
				p2.y = p1.y;
			} else {
				p1.y = p2.y;
			}
		}
	}

	return ret;
};

/**
 * Draws arrow pointing to the right
 *
 * @param {number} x - horizontal position of the peak of arrow
 * @param {number} y - vertical position of the peak of arrow
 * @private
 */
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

/**
 * Writes text to canvas
 *
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @private
 */
Canvas.prototype._writeText = function(text, x, y) {
	this.context.save();
	this.context.fillStyle = "#690299";
	this.context.font = "11px Arial";
	this.context.textAlign = 'right';
	this.context.fillText(text, x, y);
	this.context.restore();
};

/**
 * Redraws canvas
 */
Canvas.prototype.redraw = function() {
	this.context.clearRect(0, 0, this.width, this.height);
	this._drawBackground();
	for (var id in this.editor.blocks) {
		this.editor.blocks[id].renderConnections();
	}
};

/**
 * Gets center of viewport
 *
 * @returns {object}
 */
Canvas.prototype.getCenter = function() {
	return this._center;
};

/**
 * Gets current zoom
 *
 * @returns {object}
 */
Canvas.prototype.getZoom = function() {
	var zoom = this.editor.session.get('zoom');
	return Math.round(parseFloat(zoom) * 10) / 10;
};
