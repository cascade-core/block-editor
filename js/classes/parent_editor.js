/**
 * parent block properties editor
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
var ParentEditor = function(editor) {
	// extends Block
	Editor.apply(this, arguments);

	this.editor = editor;
	this._namespace = BlockEditor._namespace + '-variable-editor';

	// description of each input type
	this._types = {
		'policy':			'Policy',
		'copy-inputs':		'Copy inputs',
		'outputs':			'Outputs',
		'forward-outputs':	'Forward outputs',
		'_other':			'Other'
	};

	// clone properties to temp location
	this._data = JSON.parse(JSON.stringify(this.editor.properties));
	this._data._other = {};
	for (var t in this._data) {
		if (!this._types[t]) {
			this._data._other[t] = this._data[t];
			delete this._data[t];
		}
	}
};

// extends Block
ParentEditor.prototype = Object.create(Editor.prototype);
ParentEditor.prototype.constructor = ParentEditor;

ParentEditor.prototype._create = function() {
	// create table container
	this.$container = $('<div class="' + this._namespace + '">');

	var $title = $('<div class="' + this._namespace + '-title">');
	// make it draggable
	$title.on('mousedown', this._onDragStart.bind(this));

	var $close = $('<a href="#">&times;</a>');
	$close.addClass(this._namespace + '-close');
	$close.on('click', this._close.bind(this));
	$title.text('Parent block properties');
	$title.append($close);
	this.$container.append($title);

	var $tabs = $('<div>').addClass(this._namespace + '-tabs');
	var $textarea = $('<textarea></textarea>');
	// allow tabs inside textarea
	$textarea.on('keydown', this._fixTabs);
	$textarea.prop('autofocus', true);
	var $save = $('<input type="submit">').val(_('Save'));
	$close = $('<input type="button">').val(_('Close'));
	$close.on('click', this._close.bind(this));
	this.$container.append($tabs);
	this.$container.append($textarea);
	this.$container.append($save);
	this.$container.append($close);

	for (var t in this._types) {
		var $link = $('<a>').text(_(this._types[t]));
		$link.attr('href', '#' + t);
		$link.attr('data-type', t);
		$link.on('click', this._changeTab.bind(this));
		$tabs.append($link);
	}

	$save.on('click', this._save.bind(this));

	this._bind();

	// set first non-empty tab as active
	this.$container.find('.' + this._namespace + '-tabs a:last').click();
	for (var type in this._types) {
		if (this._data[type]) {
			$tabs.find('a.active').removeClass('active');
			$tabs.find('[data-type="' + type + '"]').addClass('active');
			$textarea.val(JSON.stringify(this._data[type], null, "\t"));
			break;
		}
	}
};

ParentEditor.prototype._saveTextarea = function(type) {
	// save current data to temp property
	var $ta = this.$container.find('textarea');
	if (type === '_other') {
		try {
			var other = JSON.parse($ta.val());
			for (var t in this._data._other) { // remove unset variables
				if (!other[t]) {
					delete this._data._other[t];
				}
			}
			for (var o in other) { // set new variables values
				this._data._other[o] = other[o];
			}
		} catch (e) {
			alert(_('Given text is not a valid JSON!'));
			this.$container.find('textarea').focus();
			return false;
		}
	} else if (type && $ta.val() === '') {
		this._data[type] = '';
	} else if (type) {
		try {
			this._data[type] = JSON.parse($ta.val());
		} catch (e) {
			alert(_('Given text is not a valid JSON!'));
			this.$container.find('textarea').focus();
			return false;
		}
	}
	return true;
};

ParentEditor.prototype._changeTab = function(e) {
	// save current data to temp property
	var type = $(e.target).parent().find('a.active').data('type');
	if (!this._saveTextarea(type)) {
		return false;
	}

	// change tab
	var $ta = this.$container.find('textarea');
	type = $(e.target).data('type');
	this.$container.find('a.active').removeClass('active');
	if (this._data[type]) {
		$ta.val(JSON.stringify(this._data[type], null, "\t"));
	} else {
		$ta.val('');
	}
	$(e.target).addClass('active');
	$ta.focus();
	return false;
};

ParentEditor.prototype._save = function() {
	// save current data to temp property
	var type = this.$container.find('a.active').data('type');
	if (!this._saveTextarea(type)) {
		return false;
	}

	// update properties with temp data
	for	(var t in this._data) {
		if (t === '_other') {
			for (var o in this.editor.properties) { // remove unset variables
				if (!this._types[o] && !this._data[t][o]) {
					delete this.editor.properties[o];
				}
			}
			for (var o in this._data[t]) { // set variables values
				this.editor.properties[o] = this._data[t][o];
			}
		} else if (this._data[t] === '') {
			delete this.editor.properties[t];
		} else {
			this.editor.properties[t] = this._data[t];
		}
	}

	this.editor.onChange();
	this._close();

	return false;
};
