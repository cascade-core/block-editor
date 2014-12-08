/**
 * parent block properties editor
 *
 * @todo tabs, posledni tab se "zbytkem" - pouze nezname vlastnosti
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
		'policy':			[true, 'Policy', 			'TODO: Policy description.'],
		'copy-inputs':		[true, 'Copy inputs', 		'TODO: Copy inputs description.'],
		'outputs':			[true, 'Outputs', 			'TODO: Outputs description.'],
		'forward-outputs':	[true, 'Forward outputs', 	'TODO: Forward outputs description.']
	};
};

// extends Block
ParentEditor.prototype = Object.create(Editor.prototype);
ParentEditor.prototype.constructor = ParentEditor;

ParentEditor.prototype._create = function() {
	// create table container
	this.$container = $('<div class="' + this._namespace + '">');

	var $title = $('<div class="' + this._namespace + '-title">');
	var $close = $('<a href="#">&times;</a>')
	$close.addClass(this._namespace + '-close');
	$close.on('click', this._close.bind(this));
	$title.text('Parent block properties');
	$title.append($close);
	this.$container.append($title);

	var $type = $('<select></select>');
	var $textarea = $('<textarea></textarea>');
	var $desc = $('<div></div>').addClass(this._namespace + '-desc');
	var $save = $('<input type="submit">').val(_('Save'));
	$close = $('<input type="button">').val(_('Close'));
	$close.on('click', this._close.bind(this));
	this.$container.append($type);
	this.$container.append($desc);
	this.$container.append($textarea);
	this.$container.append($save);
	this.$container.append($close);

	for (var t in this._types) {
		$type.append($('<option>').text(_(this._types[t][1])).val(t));
	}

	$type.on('change keyup', this._changeType.bind(this));
	$save.on('click', this._save.bind(this));

	this._bind();

	for (var type in this._types) {
		if (this.editor[type]) {
			$type.val(type);
			$textarea.val(JSON.stringify(this.editor[type]));
			break;
		}
	}
	$type.change();
};

ParentEditor.prototype._changeType = function(e) {
	var type = this._types[e.target.value];
	var ta = this.$container.find('textarea');
	ta.css('display', type[0] ? 'block' : 'none');
	ta.val(JSON.stringify(this.editor[e.target.value]));
	this.$container.find('div.' + this._namespace + '-desc').html(type[2]);
};

ParentEditor.prototype._save = function() {
	var type = this.$container.find('select').val();
	var text = this.$container.find('textarea').val();

	if (text) {
		try {
			this.editor[type] = JSON.parse(text);
		} catch (e) {
			alert(_('Given text is not a valid JSON!'));
			return false;
		}
	} else {
		delete this.editor[type];
	}

	this.editor.onChange();
	alert(_('Property successfully saved!'));

	return false;
};
