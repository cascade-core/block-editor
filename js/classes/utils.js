/**
 * Simple storage wrapper
 *
 * @copyright Martin Adamek <adamek@projectisimo.com>, 2015
 * @param {object} storage
 * @param {string} namespace
 * @class
 */
var Storage = function(storage, namespace) {
	this._storage = storage;
	this._namespace = namespace;
};

/**
 * Gets namespaced key name
 *
 * @param {string} key
 * @returns {string}
 * @private
 */
Storage.prototype._key = function(key) {
	return this._namespace + ':' + key;
};

/**
 * @param {string} key
 * @param {boolean} json - return JSON object
 * @returns {Object}
 * @private
 */
Storage.prototype.get = function(key, json) {
	var item = this._storage.getItem(this._key(key));
	if (json) {
		return item ? JSON.parse(item) : false;
	}
	return item;
};

/**
 * Sets variable {key} to value {value}
 *
 * @param {string} key
 * @param {mixed} value
 * @param {boolean} json - save JSON string of {value}
 * @returns {Object}
 */
Storage.prototype.set = function(key, value, json) {
	if (json) {
		value = JSON.stringify(value);
	}
	this._storage.setItem(this._key(key), value);
	return value;
};

/**
 * Resets variable key
 *
 * @param {string} key
 */
Storage.prototype.reset = function(key) {
	this._storage.removeItem(this._key(key));
};

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
 * @param {Point} p
 * @returns {boolean}
 */
Point.prototype.equals = function(p) {
	return this.x === p.x && this.y === p.y;
};

/**
 * @param {Point} p
 * @returns {Point}
 */
Point.prototype.plus = function(p) {
	return new Point(this.x + p.x, this.y + p.y);
};

/**
 * @param {Point} p
 * @returns {Point}
 */
Point.prototype.minus = function(p) {
	return new Point(this.x - p.x, this.y - p.y);
};

/**
 * Calculates the cross product of the two points.
 *
 * @param {Point} p
 * @returns {Number} cross product
 */
Point.prototype.dot = function(p) {
	return this.x * p.y - this.y * p.x;
};

/**
 * Utility functions
 *
 * @type {Object}
 */
var Utils = {};

/**
 * Computes distance between to points in euclidean space
 *
 * @param {Point} from
 * @param {Point} to
 * @returns {Number}
 */
Utils.dist = function(from, to) {
	var diffX = (to.x - from.x) * (to.x - from.x);
	var diffY = (to.y - from.y) * (to.y - from.y);
	return Math.sqrt(diffX + diffY);
};

/**
 * Calculates the angle ABC (in radians)
 *
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 */
Utils.angle = function(a, b, c) {
	var ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
	var bc = Math.sqrt(Math.pow(b.x - c.x,2) + Math.pow(b.y - c.y, 2));
	var ac = Math.sqrt(Math.pow(c.x - a.x,2) + Math.pow(c.y - a.y, 2));
	return Math.acos((bc * bc + ab * ab - ac * ac) / (2 * bc * ab));
};

/**
 * Line representation in 2D space
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
 * Computes line length
 *
 * @returns {Number}
 */
Line.prototype.length = function() {
	return Utils.dist(this.from, this.to);
};

/**
 * Do lines intersects with each other?
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

/**
 * Smooth curved line
 *
 * @param {Array} points
 * @param {Number} tension
 * @param {CanvasRenderingContext2D} context
 * @constructor
 */
var Spline = function(points, tension, context) {
	this.points = points;
	this.tension = tension;
	this.context = context;
};

/**
 * Computes vector from two points
 *
 * @param {Point} p1
 * @param {Point} p2
 * @returns {Point}
 * @private
 */
Spline.prototype._vector = function(p1, p2) {
	return new Point(p2.x - p1.x, p2.y - p1.y);
};

/**
 * Computes bezier curve control points based on 3 following points
 *
 * @param {Point} p1
 * @param {Point} p2
 * @param {Point} p3
 * @returns {[{Point}, {Point}]}
 * @private
 */
Spline.prototype._controlPoints = function(p1, p2, p3) {
	var t = this.tension;
	var v = this._vector(p1, p3);
	var d12 = Utils.dist(p1, p2);
	var d23 = Utils.dist(p2, p3);
	var d123 = d12 + d23;
	return [
		new Point(p2.x - v.x * t * d12 / d123, p2.y - v.y * t * d12 / d123),
		new Point(p2.x + v.x * t * d23 / d123, p2.y + v.y * t * d23 / d123)
	];
};

/**
 * Renders curve to canvas
 */
Spline.prototype.render = function() {
	var cps = []; // control points
	for (var i = 0; i < this.points.length - 2; i++) {
		cps = cps.concat(this._controlPoints(this.points[i], this.points[i + 1], this.points[i + 2]));
	}
	this._drawCurvedPath(cps);
	return;
};

/**
 * Internal rendering method
 *
 * @param {Array} cps - Control points
 * @private
 */
Spline.prototype._drawCurvedPath = function(cps) {
	var len = this.points.length;
	var ctx = this.context;
	if (len < 2) {
		return;
	}

	// render points
	//for (var i in this.points) {
	//	ctx.beginPath();
	//	ctx.arc(this.points[i].x, this.points[i].y, 5, 0, 2 * Math.PI);
	//	ctx.closePath();
	//	ctx.stroke();
	//}
	//for (var i in cps) {
	//	ctx.beginPath();
	//	ctx.strokeStyle = 'red';
	//	ctx.arc(cps[i].x, cps[i].y, 5, 0, 2 * Math.PI);
	//	ctx.closePath();
	//	ctx.stroke();
	//}
	//ctx.strokeStyle = 'black';

	if (len === 2) {
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		ctx.lineTo(this.points[1].x, this.points[1].y);
		ctx.stroke();
	} else {
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		ctx.quadraticCurveTo(cps[0].x, cps[0].y, this.points[1].x, this.points[1].y);
		for (var i = 2; i < len - 1; i += 1) {
			var k = 2 * (i - 1);
			ctx.bezierCurveTo(cps[k - 1].x, cps[k - 1].y, cps[k].x, cps[k].y, this.points[i].x, this.points[i].y);
		}
		ctx.quadraticCurveTo(cps[k + 1].x, cps[k + 1].y, this.points[i].x, this.points[i].y);
		ctx.stroke();
	}
};
