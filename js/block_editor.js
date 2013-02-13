/*
 * Block Editor Widget
 *
 * Copyright (c) 2011, Josef Kufner  <jk@frozen-doe.net>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the author nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 */

(function($) {
	$.fn.blockEditorWidget = function() {
	
		/**
		 * Converts the given data structure to a JSON string.
		 * Based on http://www.openjs.com/scripts/data/json_encode.php
		 */
		var json_escape = function(str)
		{
			return str.replace(/'"\//g, "\\$&");
		}

		var json_encode = (JSON && JSON.stringify) ? function (arr) { return JSON.stringify(arr, null, '  '); } : function(arr)
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
					str += json_encode(value);
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

		var json_decode = function(json)
		{
			try {
				return (JSON && JSON.parse) ? JSON.parse(json) : eval('(' + json + ')');
			}
			catch (e) {
				return null;
			}
		}

		this.each(function() {
			var canvas_width = 4000;
			var canvas_height = 4000;
			var spacing_vert  = 50;		// Vertical spacing between blocks.
			var spacing_horiz = 80;		// Horizontal spacing between blocks.
			var pan_speed = 2;		// Mouse pan multiplication (when mouse moves by 1 px, canvas scrolls for pan_speed px).

			var textarea = $(this);
			var orig_data = json_decode(textarea.val());
			var blocks = {};
			var doc_link = textarea.attr('data-doc_link');
			var current_dialog = null;
			var block_re = /^block:/;


			// Block
			function Block(id, block, doc_link, onChange)
			{
				this.placeholder = false;
				this.id = id;
				this.block = block;
				this.column = 0;
				this.inputs = {};
				this.outputs = {};
				this.input_divs = {};	// one div for each input
				this.output_divs = {};	// one div for each output
				this.connections = {};	// lines from inputs to other blocks
				this.origX = null;	// original position from received configuration (relative to bounding box)
				this.origY = null;
				this.x = null;		// current position on canvas (relative to canvas)
				this.y = null;

				this.onChange = onChange ? onChange : function() {}; // callback when anything changes

				this.addInput = function(name, value) {
					this.inputs[name] = value;

					var div;
					if (name in this.input_divs) {
						div = this.input_divs[name];
					} else {
						var a = $('<a></a>').text(name);
						div = $('<div></div>').append(a);
						a.attr('href', '#');
						a.click((function (t, name) { return function() { t.editInput(name); return false; }; })(this, name));
						this.input_divs[name] = div;

						if (name == 'enable') {
							div.addClass('block_editor_widget__enable_input');
							this.inputs_holder.append(div);
						} else {
							var enable_input = this.inputs_holder.children('.block_editor_widget__enable_input');
							if (enable_input.length > 0) {
								div.insertBefore(enable_input);
							} else {
								this.inputs_holder.append(div);
							}
						}
					}

					if (value === undefined) {
						div.addClass('block_editor_widget__default_connection');
					} else {
						div.removeClass('block_editor_widget__default_connection');
					}
				};

				this.addInputs = function(list, set_all_to_default) {
					for (var i in list) {
						if (i[0] != '.') {
							this.addInput(i, set_all_to_default ? undefined : list[i]);
						}
					}
				}

				this.addOutput = function(name, value) {
					this.outputs[name] = value;

					var div;
					if (name in this.output_divs) {
						div = this.input_divs[name];
					} else {
						div = $('<div></div>').text(name);
						this.outputs_holder.append(div);
						this.output_divs[name] = div;
					}
				};

				this.addOutputs = function(list) {
					for (var i in list) {
						if (i[0] != '.') {
							this.addOutput(i, list[i]);
						}
					}
				};

				this.editInput = function(name) {
					if (this.placeholder) {
						return false;
					}

					// Ask forn input name if '*' clicked
					if (name == '*') {
						var q_prompt = _('Name of the new input:');
						var q_msg = '';
						var name = '';

						for (;;) {
							name = prompt(q_msg == '' ? q_prompt : q_msg + '\n\n' + q_prompt, name);

							if (name == null || name == '') {
								return;
							} else if (!name.match(/^[a-zA-Z0-9_]*$/)) {
								q_msg = _('Only letters, numbers and underscore are allowed in the input name.');
							} else if (name in this.inputs) {
								q_msg = _('This input already exists.');
							} else {
								break;
							}
						}

						this.addInput(name, null);
					}

					var d = createDialog(this.id + ":" + name);
					var type = $('<select class="focus"></select>');
					var ta = $('<textarea></textarea>');
					var desc = $('<div></div>');
					var set = $('<input>').val(_('Set input')).attr('type', 'submit');
					d.append(type);
					d.append(desc);
					d.append(ta);
					d.append(set);

					type.append($('<option></option>').text(_('Default state')).attr('value', 'default'));
					type.append($('<option></option>').text(_('Connection:')).attr('value', 'connection'));
					type.append($('<option></option>').text(_('Boolean value:')).attr('value', 'bool'));
					type.append($('<option></option>').text(_('Integer value:')).attr('value', 'int'));
					type.append($('<option></option>').text(_('String value:')).attr('value', 'string'));

					var desc_text = {
						'default':	[ false, _('Input is set to it\'s default state, as specified in documentation.') ],
						'connection':	[ true,  _('Input is connected to these outputs: (Syntax: "block:output", one connection per line.)') ],
						'bool':		[ true,  _('Input is set to this boolean value (true or false):') ],
						'int':		[ true,  _('Input is set to this number:') ],
						'string':	[ true,  _('Input is set to this text:') ]
					};

					var update_desc = function() {
						var d = desc_text[type.val()];
						ta.css('display', d[0] ? 'block' : 'none');
						desc.html(d[1]);
					};

					type.change(update_desc).keyup(update_desc);

					//console.log('Get:', name, '=', typeof(this.inputs[name]), this.inputs[name]);

					if (!(name in this.inputs) || this.inputs[name] === null || this.inputs[name] === undefined) {
						type.val('default');
					} else if (typeof(this.inputs[name]) == 'object') {
						type.val('connection');
						ta.val(this.inputs[name].join('\n'));
					} else if (typeof(this.inputs[name]) == 'boolean') {
						type.val('bool');
						ta.val(this.inputs[name]);
					} else {
						type.val('string');
						ta.val(this.inputs[name]);
					}

					ta.autogrow();
					update_desc();

					set.click($.proxy(function() {
						var v = ta.val();
						//console.log('Set:', name, '=', type.val(), v);
						this.input_divs[name].removeClass('block_editor_widget__default_connection');
						switch(type.val()) {
							case 'default':
								this.inputs[name] = undefined;
								this.input_divs[name].addClass('block_editor_widget__default_connection');
								break;

							case 'connection':
								this.inputs[name] = v.split('\n');
								break;

							case 'bool':
								this.inputs[name] = (v == 'true') || parseInt(v) > 0;
								break;

							case 'int':
								if (v == 'true') {
									this.inputs[name] = 1;
								} else if (v == 'false') {
									this.inputs[name] = 0;
								} else {
									this.inputs[name] = parseInt(v);
								}
								break;

							case 'string':
								this.inputs[name] = ta.val();
								break;
						}
						//console.log('Done:', name, '=', typeof(this.inputs[name]), this.inputs[name]);
						this.onChange();
						d.close();
						return false;
					}, this));
				};

				this.setPosition = function(x, y) {
					if (x != null) {
						this.x = Math.round(x);
						this.widget.css('left', this.x);
					}
					if (y != null) {
						this.y = Math.round(y);
						this.widget.css('top', this.y);
					}
					this.onChange();
				}

				this.updateColumn = function(serial) {
					if (serial == this.column_serial) {
						return this.column;
					} else {
						this.column_serial = serial;
					}

					max_column = 0;
					for (var ci in this.connections) {
						var b = this.connections[ci].block;
						b.updateColumn(serial);
						if (b.column >= max_column) {
							max_column = b.column;
						}
					}
					this.column = max_column + 1;
				};

				this.positionOnCanvas = function(element)
				{
					var s = element.position();
					element.parentsUntil('.block_editor_widget__canvas').each(function() {
						$this = $(this);
						if ($this.css('position') == 'absolute') {
							var p = $this.position();
							s.left += p.left;
							s.top += p.top;
						}
					});
					return s;
				}

				// Create or update all connections
				this.connect = function(blocks, raph) {
					var usage = {};

					for (var i in this.inputs) {
						var target = [this.id, i];
						var have_input = this.inputs[i] && typeof(this.inputs[i]) == 'object' && this.inputs[i][0] != null;
						var input_fn = have_input && this.inputs[i][0][0] == ':' ? this.inputs[i][0] : null;

						/*
						console.log('--');
						console.log('Target:', target, have_input ? '... with input.' : '');
						console.log('Source:', this.inputs[i]);
						console.log('Input function:', [input_fn]);
						// */
						

						for (var ii = input_fn == null ? 0 : 1; have_input && ii < this.inputs[i].length; ii++) {
							var source = have_input ? this.inputs[i][ii].split(':') : null;
							var ci = i + ':' + ii;

							//console.log(ci, this.inputs[i], '->', source);

							var line_path;
							var arrow_path;

							if (!source || source[0] == '' || !(source[0] in blocks)) {
								continue;
							}

							// update or create ... we need path anyway

							// source
							var s_div = blocks[source[0]].output_divs[source[1]];
							if (!s_div) {
								if ('*' in blocks[source[0]].outputs) {
									blocks[source[0]].addOutput(source[1]);
									s_div = blocks[source[0]].output_divs[source[1]];
								} else {
									continue;
								}
							}
							var s = this.positionOnCanvas(s_div);
							var sh = Math.round(s_div.height() / 2) + 3;
							var srcX = s.left + s_div.outerWidth() + 4;
							var srcY = s.top + sh;

							// destination
							var d_div = this.input_divs[i];
							if (!d_div) {
								continue;
							}
							var d = this.positionOnCanvas(d_div);
							var dh = Math.round(d_div.height() / 2) + 4;
							var dstX = d.left;
							var dstY = d.top + dh;

							// line path
							var c = Math.abs(srcX - dstX) / 2;
							line_path = [
								'M', srcX, srcY,
								'C', (srcX + c), srcY,  (dstX - c), dstY,  (dstX - dh), dstY,
								'L', dstX + ' ' + dstY
							].join(',')

							// arrow path
							arrow_path = [
								'M', dstX, dstY,
								'L', (dstX - dh), (dstY - (dh - 5)),
								'L', (dstX - 0.6 * dh), dstY,
								'L', (dstX - dh), (dstY + (dh - 5)),
								'Z'
							].join(',');

							// Update/create connection
							if (ci in this.connections) {
								// update
								this.connections[ci].line.attr('path', line_path);
								this.connections[ci].arrow.attr('path', arrow_path);
							} else {
								// create
								//console.log('Connection:', source, '->', target);
								this.connections[ci] = {
									block: blocks[source[0]],
									arrow: raph.path(arrow_path).attr({
										'stroke': '#000',
										'fill': '#000'
									}),
									line: raph.path(line_path).attr({
										'stroke': '#000',
										'stroke-width': 1.4
									})
								};
							}
							usage[ci] = true;
						}
					}

					// remove unused connections
					for (var i in this.connections) {
						if (!(i in usage)) {
							this.connections[i].line.remove();
							this.connections[i].arrow.remove();
							delete this.connections[i];
						}
					}

					raph.safari();
					//console.log(this.connections);
				};

				// When title is dblclicked
				this.onChangeId = $.proxy(function() {
					if (this.placeholder) {
						return false;
					}
					var new_id = prompt(_('New block ID:'), this.id);
					if (new_id == null) {
						return;
					} else if (!new_id.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
						alert(_('Only letters, numbers and underscore are allowed in block ID and the first character must be a letter.'));
					} else if (new_id in blocks) {
						alert(_('This block ID is already taken by another block.'));
					} else {
						blocks[new_id] = this;
						delete blocks[this.id];
						this.id = new_id;
						this.widget.find('.block_editor_widget__block_id').text(this.id);
						this.onChange();
					}
					return false;
				}, this);

				// when remove button is clicked
				this.onRemoveBlock = $.proxy(function () {
					if (this.placeholder) {
						return false;
					}
					if (confirm(_('Do you wish to remove block "' + this.id + '"? There is no undo button.'))) {
						for (var i in this.connections) {
							this.connections[i].line.remove();
							this.connections[i].arrow.remove();
							delete this.connections[i];
						}
						this.widget.remove();
						delete blocks[this.id];
						this.onChange();
						delete this;
					}
					return false;
				}, this);

				// Create DOM widget
				this.createWidget = function() {
					if (this.widget) {
						this.widget.remove();
					}

					this.widget = $('<div class="block_editor_widget__block"></div>');
					this.widget.addClass(getBlockClass(block));

					this.inputs_holder = $('<td class="block_editor_widget__in"></td>');
					this.outputs_holder = $('<td class="block_editor_widget__out"></td>');

					this.widget.append($('<table></table>')
						.append($('<tr></tr>')
							.append($('<th colspan="2"></th>')
							.append($('<a href="#" class="block_editor_widget__block_remove">&times;</a>')
								.click(this.onRemoveBlock))
							.append($('<div class="block_editor_widget__block_id"></div>')
								.text(id)
								.dblclick(this.onChangeId))
							.append($('<div class="block_editor_widget__block_name"></div>')
								.append($('<a></a>').text(block)
									.attr('href', doc_link.replace('{block}', block))
									.attr('target', '_blank')
								))))
						.append($('<tr></tr>')
							.append(this.inputs_holder)
							.append(this.outputs_holder))
					);

				}

				this.addToCanvas = function() {
					canvas_inner.append(this.widget);

					var refreshRequested = false;

					this.widget.draggable({
						cancel: 'a',
						drag: function(ev) {
							if (!refreshRequested) {
								refreshRequested = true;
								setTimeout(function() {
									for (var i in blocks) {
										blocks[i].connect(blocks, canvas_raphael);
									}
									refreshRequested = false;
								}, 20);
							}
						},
						stop: (function(b) { return  function() {
							var pos = b.widget.position();
							b.setPosition(pos.left, pos.top);
							for (var i in blocks) {
								blocks[i].connect(blocks, canvas_raphael);
							}
						}; })(this)
					});

					this.onChange();
				}

				this.createWidget();

				// Every block has 'enable' input.
				this.addInput('enable', undefined);
			}

			// Calculate block prefix from it's name
			function getBlockClass(block)
			{
				return 'block_editor_widget__block__' + block.replace(/\/[^\/]*$/, '').replace('/', '__');
			}

			function onBlockChange() {
				textarea.val(widget.serializeBlocks(blocks));
				for (var i in blocks) {
					blocks[i].connect(blocks, canvas_raphael);
				}
			}

			if (!textarea.hasClass('block_editor_widget') || this.tagName.toLowerCase() != 'textarea') {
				if (console) {
					console.error('Cannot convert this element to Block Editor widget. It must be textarea with \'block_editor_widget\' class.');
				}
				return;
			}

			// Create widget
			var widget = $('<div class="block_editor_widget widget"></div>');
			widget.css('height', textarea.css('height'));
			widget.insertBefore(textarea);
			textarea.css('display', 'none');

			// Canvas dialog factory
			function createDialog(title)
			{
				if (current_dialog) {
					current_dialog.remove();
				}

				current_dialog = $('<div></div>').addClass('block_editor_widget__dialog');
				current_dialog.hide();
				widget.append(current_dialog);

				current_dialog.close = function() {
					current_dialog.hide('drop', { direction: 'up'}, 200,
							(function(current_dialog) { return current_dialog.remove; })(current_dialog));
					current_dialog = null;
					return false;
				};

				var title_element = $('<div class="block_editor_widget__dialog_title"></div>');
				title_element.text(title);
				title_element.append($('<a href="#">&times;</a>').click(current_dialog.close));
				current_dialog.append(title_element);

				current_dialog.show('drop', { direction: 'up' }, 200, function() {
					current_dialog.find('.focus').focus();
					current_dialog.keydown(function(ev) {
						if(ev.keyCode == 27) {
							return current_dialog.close();
						} else {
							return true;
						}
					});
				});

				return current_dialog;
			};


			// Create canvas
			var canvas = $('<div class="block_editor_widget__canvas"></div>');
			widget.append(canvas);

			$(canvas).mousedown(function(ev) {
				var $canvas = $(canvas);
				var startX = (canvas_width  - pan_speed * ev.pageX) - $canvas.scrollLeft();
				var startY = (canvas_height - pan_speed * ev.pageY) - $canvas.scrollTop();

				if (ev.which == 1 && $(ev.target).parents('.block_editor_widget__block').length == 0) {
					$(canvas).mousemove(function(ev) {
						if (ev.which == 0) {
							$canvas.unbind('mousemove');
						} else {
							$canvas.scrollLeft((canvas_width  - pan_speed * ev.pageX) - startX);
							$canvas.scrollTop ((canvas_height - pan_speed * ev.pageY) - startY);
						}
					});
				}
			});
			$(canvas).mouseup(function(ev) {
				$(canvas).unbind('mousemove');
			});

			var canvas_inner = $('<div class="block_editor_widget__canvas_inner"></div>').css({
					position: 'relative',
					width: canvas_width,
					height: canvas_height
				});
			canvas.append(canvas_inner);
			canvas_inner.disableSelection();

			var canvas_raphael = Raphael(canvas_inner[0], canvas_width, canvas_height);	// fixme
			canvas.scrollTo(canvas_width / 3 - 50, canvas_height / 3 - 50);

			// Create palette
			var palette_holder = $('<div class="block_editor_widget__palette"></div>');
			var palette_toolbar = $('<div class="block_editor_widget__palette_toolbar"></div>');
			var palette_blocks = $('<div class="block_editor_widget__palette_blocks"></div>');
			palette_holder.append(palette_toolbar).append(palette_blocks);
			widget.append(palette_holder);

			// Maximize button
			palette_toolbar.append($('<a href="#" class="block_editor_widget__maximize" title="Maximize">&uarr;</a>').click(function() {
				var $this = $(this);
				var w = $this.parents('.block_editor_widget');

				if (w.fullScreen != undefined) {
					w.fullScreen(true);
				} else {
					w.addClass('block_editor_widget__maximized');
				}
				return false;
			}));

			// Restore button
			palette_toolbar.append($('<a href="#" class="block_editor_widget__restore" title="Restore">&darr;</a>').click(function() {
				var $this = $(this);
				var w = $this.parents('.block_editor_widget');

				if (w.fullScreen != undefined) {
					w.fullScreen(false);
				} else {
					w.removeClass('block_editor_widget__maximized');
				}
				return false;
			}));

			// Add/remove class on fullscreen event
			$(document).bind('fullscreenchange', function() {
				if (widget.fullScreen()) {
					widget.addClass("block_editor_widget__fullscreen");
				} else {
					widget.removeClass('block_editor_widget__fullscreen');
				}
			});


			// Edit properties button
			palette_toolbar.append($('<a href="#" class="block_editor_widget__edit_properties" title="Edit parent block properties">P</a>').click(function() {
				var d = createDialog("Parent block properties");
				var snippets = $('<small></small>');
				var ta = $('<textarea class="focus" width="100%" rows="15"></textarea>');
				var set = $('<input>').val(_('Set properties')).attr('type', 'submit');
				var err = $('<p style="text-align: center; margin: 1ex; padding:0"><small>'
					+ _('Entered text is not valid <a href="http://json.org/">JSON</a> object.') + '</small></p>').hide();

				d.append($('<div>' + _('Add:') + " </div>").append(snippets));
				d.append(ta);
				d.append(set);
				d.append(err);

				var val = {};

				for (var i in orig_data) {
					if (!block_re.test(i)) {
						val[i] = orig_data[i];
					}
				}

				ta.val(json_encode(val).replace(/\n(\t+)/g, function(all, indent) {
					return '\n' + Array(indent.length).join('  ');
				}));

				var add_snippet = function(label, key, s) {
					if (snippets.children().length > 0) {
						snippets.append(' | ');
					}
					snippets.append($('<a href="#"></a>').text(label).click(function() {
						var x = json_decode(ta.val());
						if (typeof(x) == 'object' && !(key in x)) {
							x[key] = s;
						}
						ta.val(json_encode(x));
						ta.focus();
						return false;
					}));
				};
				add_snippet('outputs', 'outputs', {
					'title': 'Some title',
					'done': ['id_of_most_important_block:done']
				});
				add_snippet('route', 'route:/some/path/$id', {
					'x': 'value',
					'y': 'value',
				});
				add_snippet('policy', 'policy', {
					'require_block': 'important/block',
					'skip_if_denied': 'optional/output/block',
					'dummy_if_denied': 'optional/data-source/block'
				});

				var check = function() {
					var x = json_decode(ta.val());
					if (x != null) {
						set.removeAttr('disabled');
						err.hide();
					} else {
						set.attr('disabled', 'disabled');
						err.show();
					}
				};
				ta.keydown(check).keyup(check).change(check);

				set.click(function() {
					var new_orig_data = json_decode(ta.val());
					if (typeof(new_orig_data) == 'object') {
						orig_data = new_orig_data;
						d.close();
					} else {
						set.attr('disabled', 'disabled');
						err.show();
					}
					onBlockChange();
					return false;
				});

				return false;
			}));

			// Load available blocks
			var select = $('<select></select>');
			select.append($('<option></option>').attr('value', '').text('*'));
			select.blur(function() {
				palette_holder.removeClass('active');
			});
			select.focus(function() {
				palette_holder.addClass('active');
			});
			var on_filter = function() {
				var c = $(this).val();
				palette_blocks.children().each(function() {
					$(this).css('display', c == '' || $(this).hasClass(c) ? 'block' : 'none');
				});
			};
			select.change(on_filter).keyup(on_filter);
			palette_toolbar.append($('<div>Filter: </div>').append(select));
			var available_blocks = json_decode(textarea.attr('data-available_blocks'));
			var last_class = null;
			for (var block in available_blocks) {
				var b = new Block(block.replace(/.*\//, ''), block, doc_link);
				b.placeholder = true;
				b.addInputs(available_blocks[block].inputs);
				b.addOutputs(available_blocks[block].outputs);
				palette_blocks.append(b.widget);

				var block_class = getBlockClass(block);
				if (block_class != last_class) {
					select.append($('<option></option>').attr('value', block_class).text(block.replace(/\/[^\/]*$/, '')));
					last_class = block_class;
				}

				// Make palette blocks draggable, so they can be added to canvas
				b.widget.draggable({
					cancel: 'a',
					helper: 'clone',
					opacity: 0.8,
					appendTo: canvas,
					zIndex: 30,
					start: (function() {
						palette_toolbar.find('*').blur();
					}),
					stop: (function(b) {
						return function (ev, ui) {
							var pos = ui.position; // destination
							var q_prompt = _('ID of the new block:');
							var q_msg = '';
							var id = b.id;

							for (;;) {
								id = prompt(q_msg == '' ? q_prompt : q_msg + '\n\n' + q_prompt, id);

								if (id == null || id == '') {
									return;
								} else if (!id.match(/^[A-Za-z][a-zA-Z0-9_]*$/)) {
									q_msg = _('Only letters, numbers and underscore are allowed '
										+ 'in block ID and the first character must be a letter.');
								} else if (id in blocks) {
									q_msg = _('This block ID is already taken by another block.');
								} else {
									// good id
									var new_b = new Block(id, b.block, doc_link, onBlockChange);
									new_b.addInputs(available_blocks[b.block].inputs, true);
									new_b.addOutputs(available_blocks[b.block].outputs);
									new_b.setPosition(pos.left, pos.top);
									blocks[id] = new_b;
									new_b.addToCanvas();
									break;
								}
							}
						};
					})(b)
				});
			}


			// Serialize all blocks to JSON, keep unknown values from original in place
			widget.serializeBlocks = function(blocks) {
				var d = {};

				// keep original values
				for (var i in orig_data) {
					if (!block_re.test(i)) {
						d[i] = orig_data[i];
					}
				}

				// get top left corner
				var min_x = canvas_width;
				var min_y = canvas_height;
				for (var i in blocks) {
					var b = blocks[i];
					if (b.x < min_x) {
						min_x = b.x;
					}
					if (b.y < min_y) {
						min_y = b.y;
					}
				}

				// serialize blocks
				for (var i in blocks) {
					var b = blocks[i];
					var B = {
						'.block': b.block,
						'.x': b.x - min_x,
						'.y': b.y - min_y
					};
					if (b.force_exec != null) {
						B['.force_exec'] = b.force_exec;
					}
					for(var input in b.inputs) {
						if (input != '*' && b.inputs[input] !== undefined) {
							B[input] = b.inputs[input];
						}
					}
					d['block:' + b.id] = B;
				}

				return json_encode(d);
			};


			// Add blocks to widget using data in textarea
			widget.updateFromTextarea = function() {
				for (var i in orig_data) {
					if (block_re.test(i)) {
						var id = i.replace(block_re, '');
						var block = orig_data[i]['.block'];

						var b = new Block(id, block, doc_link, onBlockChange);
						if (block in available_blocks) {
							b.addInputs(available_blocks[block].inputs, true);
							b.addOutputs(available_blocks[block].outputs);
						} else {
							b.addInput('*', null);
							b.addOutput('*', null);
						}
						b.addInputs(orig_data[i]);
						b.origX = '.x' in orig_data[i] ? parseInt(orig_data[i]['.x']) : null;
						b.origY = '.y' in orig_data[i] ? parseInt(orig_data[i]['.y']) : null;
						blocks[id] = b;
						b.addToCanvas();
						//console.log('New block', id, ':', b);
					}
				}

				// Create connections for the first time
				for (var i in blocks) {
					blocks[i].connect(blocks, canvas_raphael);
				}

				// Place blocks at least somehow reasonable
				var serial = Math.random();
				var col_height = [];
				var col_width = [];
				for (var i in blocks) {
					var b = blocks[i];
					var row = 0;

					b.updateColumn(serial);

					if (!(b.column in col_width) || b.widget.width() > col_width[b.column]) {
						col_width[b.column] = b.widget.width();
					}

					if (!(b.column in col_height)) {
						col_height[b.column] = b.widget.height() + spacing_vert;
					} else {
						row = col_height[b.column];
						col_height[b.column] += b.widget.height() + spacing_vert;
					}

					b.setPosition(null, canvas_height / 3 + row);
				}
				var col_left = [];
				for (var i in blocks) {
					var b = blocks[i];
					var left = 0;
					if (!(b.column in col_left)) {
						for (var c = b.column - 1; c in col_width; c--) {
							left += col_width[c] + spacing_horiz;
						}
						col_left[b.column] = left;
					} else {
						left = col_left[b.column];
					}
					b.setPosition(canvas_width / 3 + left, null);
				}

				// restore original position (if set) and update arrows
				for (var i in blocks) {
					var b = blocks[i];
					if (b.origX != null && b.origY != null) {
						b.setPosition(b.origX + canvas_width / 3, b.origY + canvas_height / 3);
					}
					b.connect(blocks, canvas_raphael); // update arrows
				}

				$(window).load(function() {
					for (var i in blocks) {
						blocks[i].connect(blocks, canvas_raphael);
					}
				});

				//console.log('Blocks:', blocks);
			};

			widget.updateFromTextarea();
		});
		return this;
	};

	$(document).ready(function() {
		$('textarea.block_editor_widget').blockEditorWidget();
	});

})(jQuery);

