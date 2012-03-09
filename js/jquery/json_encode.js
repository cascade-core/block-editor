/*
 * Converts the given data structure to a JSON string.
 * Based on http://www.openjs.com/scripts/data/json_encode.php
 *
 * Copyright (c) 2011, Josef Kufner  <jk@frozen-doe.net>
 * All rights reserved.
 *
 * Licensed under MIT license.
 *
 */

function json_escape(str)
{
	return str.replace(/'"\//g, "\\$&");;
}

var json_decode = (JSON && JSON.parse) ? JSON.parse : function(str)
{
	return eval('(' + str + ')');
}

var json_encode = (JSON && JSON.stringify) ? function(arr) { return JSON.stringify(arr, null, '\t'); } : function(arr)
{
	var parts = [];
	var is_list = (Object.prototype.toString.apply(arr) === '[object Array]');

	for (var key in arr) {
		var value = arr[key];
		var str = "";
		if (!is_list) {
			str = '"' + json_escape(key) + '":';
		}
		if (typeof value == "object") {
			if (value.toJSON) {
				str += value.toJSON();
			} else {
				str += json_encode(value);
			}
		} else if (typeof value == "number") {
			str += value;
		} else if (value === false) {
			str += 'false';
		} else if (value === true) {
			str += 'true';
		} else if (value === null) {
			str += 'null';
		} else {
			str += '"' + json_escape(value) + '"';
		}
		parts.push(str);
	}
	var json = parts.join(",\n");

	if (is_list) {
		return '[' + json + ']';
	} else {
		return '{' + json + '}';
	}
}

