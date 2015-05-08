/**
 * Point representation in 2D space
 *
 * @param {Number} x
 * @param {Number} y
 * @constructor
 * @class
 */
var Point = function(x, y) {
	this.x = x;
	this.y = y;
};

/**
 * Is given point equal to this point?
 *
 * @param {Point} p - other point
 * @returns {Boolean}
 */
Point.prototype.equals = function(p) {
	return this.x === p.x && this.y === p.y;
};

/**
 * Adds points together, returns new Point instance
 *
 * @param {Point} p - other point
 * @returns {Point}
 */
Point.prototype.plus = function(p) {
	return new Point(this.x + p.x, this.y + p.y);
};

/**
 * Subtracts points, returns new Point instance
 *
 * @param {Point} p - other point
 * @returns {Point}
 */
Point.prototype.minus = function(p) {
	return new Point(this.x - p.x, this.y - p.y);
};

/**
 * Calculates the cross product of the two points.
 *
 * @param {Point} p - other points
 * @returns {Number} cross product
 */
Point.prototype.dot = function(p) {
	return this.x * p.y - this.y * p.x;
};

/**
 * Computes distance between to points in euclidean space
 *
 * @param {Point} p - other point
 * @returns {Number}
 */
Point.prototype.dist = function(p) {
	var dx = (p.x - this.x) * (p.x - this.x);
	var dy = (p.y - this.y) * (p.y - this.y);
	return Math.sqrt(dx + dy);
};

/**
 * Calculates the angle ABC (in radians)
 *
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 * @static
 */
Point.angle = function(a, b, c) {
	var ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
	var bc = Math.sqrt(Math.pow(b.x - c.x,2) + Math.pow(b.y - c.y, 2));
	var ac = Math.sqrt(Math.pow(c.x - a.x,2) + Math.pow(c.y - a.y, 2));
	return Math.acos((bc * bc + ab * ab - ac * ac) / (2 * bc * ab));
};

/**
 * Line segment representation in 2D space
 *
 * @param {Point} from
 * @param {Point} to
 * @constructor
 * @class
 */
var Line = function(from, to) {
	this.from = from;
	this.to = to;
};

/**
 * Computes line segment length
 *
 * @returns {Number}
 */
Line.prototype.length = function() {
	return this.from.dist(this.to);
};

/**
 * Do line segments intersect with each other?
 *
 * @param {Line} line
 * @private
 */
Line.prototype.intersection = function(line) {
	var r = this.to.minus(this.from);
	var s = line.to.minus(line.from);
	var w = line.from.minus(this.from);

	var product1 = w.dot(r);
	var product2 = r.dot(s);

	if (product2 === 0) { // lines are parallel
		return false;
	}

	var u = product1 / product2;
	var t = w.dot(s) / product2;

	if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
		return this.from.plus(new Point(t * r.x, t * r.y));
	} else {
		return false;
	}
};
