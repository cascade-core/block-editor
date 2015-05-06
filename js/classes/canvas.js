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
	this.debug = editor.debug;
};

/**
 * Renders canvas and its container, computes width and height based on diagram bounding box
 *
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
 * @param {Number} fromX
 * @param {Number} fromY
 * @param {Number} toX
 * @param {Number} toY
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
 * Creates container and canvas element
 * @private
 */
Canvas.prototype._create = function() {
	// create canvas element
	var $el = $('<canvas>');
	if (!this.options.viewOnly) {
		$el.addClass('block-editor-bg');
	}
	this.canvas = $el[0];
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	if (this.options.viewOnly && 'C2S' in window) {
		this.context = new C2S(this.width, this.height);
	} else {
		this.context = this.canvas.getContext('2d');
	}

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
	if (!(e.metaKey || e.ctrlKey) && $(e.target).is('canvas')) { // selecting blocks
		this.editor.palette.toolbar.disableSelection();
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
			var box = b.getBoundingBox();

			if (currX - this._cursor.x < 0) { // right to left selection => allow selecting just part of block
				if (currX < box.topRight.x && this._cursor.x > box.topLeft.x &&
					((currY > box.topLeft.y && this._cursor.y < box.bottomLeft.y) || (this._cursor.y > box.topLeft.y && currY < box.bottomLeft.y))) {
					b.activate();
				}
			} else { // left to right selection => select only whole block
				if (currX > box.topRight.x && this._cursor.x < box.topLeft.x &&
					((currY > box.bottomLeft.y && this._cursor.y < box.topLeft.y) || this._cursor.y > box.bottomLeft.y && currY < box.topLeft.y)) {
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
 * Does line intersect with given block?
 *
 * @param {string} id - block id
 * @param {Line} line
 * @returns {Array}
 * @private
 */
Canvas.prototype._getIntersections = function(id, line) {
	var b = this.editor.blocks[id];
	var box = b.getBoundingBox();
	var ret = [], intersection;

	// first check whether block lies in line bounding box
	if (!this._insideBoundingBox(box, line)) {
		return [];
	}

	// top line intersection
	intersection = new Line(box.topLeft, box.topRight).intersection(line);
	if (intersection && (!ret[0] || !ret[0].equals(intersection))) {
		ret.push(intersection);
	}

	// bottom line intersection
	intersection = new Line(box.bottomLeft, box.bottomRight).intersection(line);
	if (intersection && (!ret[0] || !ret[0].equals(intersection))) {
		ret.push(intersection);
	}

	// left line intersection
	intersection = new Line(box.topLeft, box.bottomLeft).intersection(line);
	if (intersection && (!ret[0] || !ret[0].equals(intersection))) {
		ret.push(intersection);
	}

	// right line intersection
	intersection = new Line(box.topRight, box.bottomRight).intersection(line);
	if (intersection && (!ret[0] || !ret[0].equals(intersection))) {
		ret.push(intersection);
	}

	return ret;
};

Canvas.prototype._insideBoundingBox = function(box, line) {
	// create line bounding box
	var lineBox = [
		Math.min(line.from.x, line.to.x), Math.min(line.from.y, line.to.y), // topLeft
		Math.max(line.from.x, line.to.x), Math.max(line.from.y, line.to.y) // bottomRight
	];
	return box.topLeft.x < lineBox[2]
		&& box.bottomRight.x > lineBox[0]
		&& box.topLeft.y < lineBox[3]
		&& box.bottomRight.y > lineBox[1];
};

Canvas.prototype.createGrid = function() {
	var box = this.editor.getBoundingBox();
	var segment = 30;
	var offset = new Point(this.options.canvasExtraWidth + box.minX - segment, this.options.canvasExtraHeight + box.minY - segment);
	offset.x = Math.floor(offset.x / segment) * segment; // round to multiple of segment
	offset.y = Math.floor(offset.y / segment) * segment;
	var grid = new Grid(this.editor.blocks, box.maxX - box.minX + 2 * segment, box.maxY - box.minY + 2 * segment, segment, offset);
	//grid.render(this.context);
	var graph = new Graph(grid.toArray(), { diagonal: true });
	this.grid = grid;
	this.graph = graph;
};

/**
 * Draws connection line with arrow pointing to end
 *
 * @param {Point} from
 * @param {Point} to
 * @param {string} [color='#000'] defaults to black
 * @private
 */
Canvas.prototype.drawConnection = function(from, to, color) {
	// line style
	color = color || '#000';
	this.context.save();
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.lineWidth = 1.4;

	if (!this.grid) {
		this.createGrid();
	}
	var grid = this.graph.grid;
	var start = this.grid.getPoint(grid, from.x, from.y, true);
	try {
		var end = this.grid.getPoint(grid, to.x, to.y, true);
	} catch (e) { // point may be outside of precomputed grid
		var end = to;
	}
	var path = astar.search(this.graph, start, end);
	//this.grid.renderPath(this.context, path);

	var correction = Math.log(from.dist(to) / 5);
	var points = [new Point(from.x + 10, from.y)];
	// ignore first and last point in found path
	for (var i = 1, j = 1; i < path.length - 1; i++, j++) {
		path[i].weight += 1;
		points.push(this.grid.getPointObject(path[i].x, path[i].y));
		points[points.length - 1].x += correction;
		points[points.length - 1].y += correction;

		// remove last point if there are three points with same vertical or horizontal position
		if (points.length > 2) {
			// check horizontal position
			var xeq = points[j - 2].x === points[j - 1].x && points[j - 1].x === points[j].x;
			// check vertical position
			var yeq = points[j - 2].y === points[j - 1].y && points[j - 1].y === points[j].y;
			// check diagonals
			var xyeq = points[j - 2].y === points[j - 1].y && points[j - 1].y === points[j].y;
			var yxeq = points[j - 2].y === points[j - 1].y && points[j - 1].y === points[j].y;
			if (xeq || yeq || xyeq || yxeq) {
				points.splice(j - 1, 1);
				j--;
			}
		}
	}
	points.push(new Point(to.x - 10, to.y));

	// remove useless points & add extra points to smoothen line
	var t0 = performance.now();
	//this._improvePath(points);
	if (this.debug) {
		var t1 = performance.now();
		console.log("canvas.improvePath: " + (t1 - t0) + " ms");
	}

	// add original start & end points
	points.unshift(from);
	points.push(to);

	// draw curved line
	var path = new Spline(points, this.options.splineTension, this.context);
	path.render();

	// draw arrow in the end point
	this._drawArrow(to.x, to.y, color);
};

/**
 * Removes useless points & adds extra points to smoothen line
 *
 * @param {Array} points
 * @private
 */
Canvas.prototype._improvePath = function(points) {
	for (var i = 1; i < points.length - 1; i++) {
		var ab = new Line(points[i - 1], points[i]);
		var bc = new Line(points[i], points[i + 1]);
		var ac = new Line(points[i - 1], points[i + 1]);
		if (ab.length() + bc.length() >= ac.length()) { // try to remove point B and look for intersections in AC
			var collisions = 0;
			for (var id in this.editor.blocks) {
				var intersections = this._getIntersections(id, ac);
				if (intersections.length > 0) {
					collisions++;
					break;
				}
			}
			// point b is useless, remove it
			if (!collisions) {
				points.splice(i, 1);
				i--;
			}
		}
	}
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
				row[j] = points[i].dist(points[j]);
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
			var d = inters[i].dist(box[p]);
			if (d < min) {
				min = d;
				point = new Point(box[p].x, box[p].y); // copy
				point.x += 10 * (p.indexOf('Left') > -1 ? -1 : 1);
				point.y += 10 * (p.indexOf('top') > -1 ? -1 : 1);
				point.placement = p;
			}
		}
		// add only unique points
		if (point && (!ret[0] || !ret[0].equals(point))) {
			ret.push(point);
		}
	}

	// check for diagonal through box
	if (ret.length === 2) {
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
 * @param {Number} x - horizontal position of the peak of arrow
 * @param {Number} y - vertical position of the peak of arrow
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
 * @param {Number} x
 * @param {Number} y
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
	var t00 = performance.now();
	this.context.clearRect(0, 0, this.width, this.height);
	var t0 = performance.now();
	if (this.debug) {
		console.log("canvas.clear: " + (t0 - t00) + " ms");
	}
	this.createGrid();
	if (this.debug) {
		var t1 = performance.now();
		console.log("canvas.createGrid: " + (t1 - t0) + " ms");
	}
	for (var id in this.editor.blocks) {
		this.editor.blocks[id].renderConnections();
	}
	if (this.debug) {
		var t2 = performance.now();
		console.log("canvas.redraw: " + (t2 - t0) + " ms");
	}
	if (this.options.viewOnly && 'C2S' in window) {
		var svg = this.context.getSerializedSvg(true); //true here will replace any named entities with numbered ones.
		this.$containerInner.find('svg, canvas').remove();
		this.$containerInner.append(svg);
		this.$containerInner.find('svg rect').remove();
		this.context = new C2S(this.width, this.height);
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
