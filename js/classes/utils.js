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
 * @param {number} x
 * @param {number} y
 * @constructor
 * @class
 */
var Point = function(x, y) {
	this.x = x;
	this.y = y;
};

var Utils = {};

/**
 * Computes distance between to points in euclidean space
 *
 * @param {Point} from
 * @param {Point} to
 * @returns {number}
 */
Utils.dist = function(from, to) {
	var diffX = (to.x - from.x) * (to.x - from.x);
	var diffY = (to.y - from.y) * (to.y - from.y);
	return Math.sqrt(diffX + diffY);
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

var Spline = function(points, tension, context) {
	this.points = points;
	this.tension = tension;
	this.context = context;
};

Spline.prototype._vector = function(p1, p2) {
	return new Point(p2.x - p1.x, p2.y - p1.y);
};

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

Spline.prototype.render = function() {
	var cps = []; // control points
	for (var i = 0; i < this.points.length - 2; i++) {
		cps = cps.concat(this._controlPoints(this.points[i], this.points[i + 1], this.points[i + 2]));
	}
	this._drawCurvedPath(cps);
	return;



	var points = this.points;
	this.context.moveTo(points[0].x, points[0].y);
	for (var i = 1; i < points.length; i++) {
		// control points based on x-diff
		var diffX = Math.abs(points[i].x - points[i - 1].x) / 2;
		var cp1X = points[i - 1].x + diffX;
		var cp1Y = points[i - 1].y;
		var cp2X = points[i].x - diffX;
		var cp2Y = points[i].y;

		//this.context.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, points[i].x, points[i].y);
		this.context.lineTo(points[i].x, points[i].y);
	}
	this.context.stroke();
	this.context.closePath();
};

Spline.prototype._drawCurvedPath = function(cps) {
	var len = this.points.length;
	if (len < 2) {
		return;
	}
	var ctx = this.context;
	//console.log(len, cps.length, cps);
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
			//console.log(i, k - 1, k);
			ctx.bezierCurveTo(cps[k - 1].x, cps[k - 1].y, cps[k].x, cps[k].y, this.points[i].x, this.points[i].y);
		}
		//console.log(i, k);
		ctx.quadraticCurveTo(cps[k + 1].x, cps[k + 1].y, this.points[i].x, this.points[i].y);
		ctx.stroke();

	}
};

