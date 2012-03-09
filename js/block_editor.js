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
		this.each(function() {
			var canvas_width = 4000;
			var canvas_height = 4000;
			var spacing_vert  = 50;		// Vertical spacing between blocks.
			var spacing_horiz = 80;		// Horizontal spacing between blocks.
			var pan_speed = 2;		// Mouse pan multiplication (when mouse moves by 1 px, canvas scrolls for pan_speed px).

			// Block
			function Block(id, block, doc_link, onChange)
			{
				this.id = id;
				this.block = block;
				this.column = 0;
				this.inputs = {};
				this.outputs = {};
				this.input_divs = {};	// one div for each input
				this.output_divs = {};	// one div for each output
				this.connections = {};	// lines from inputs to other blocks
				this.x = null;
				this.y = null;

				this.onChange = onChange; // callback when anything changes

				this.widget = $('<div class="block_editor_widget__block"></div>');
				this.widget.addClass(getBlockClass(block));

				this.inputs_holder = $('<td class="block_editor_widget__in"></td>');
				this.outputs_holder = $('<td class="block_editor_widget__out"></td>');

				this.widget.append($('<table></table>')
					.append($('<tr></tr>').append($('<th colspan="2"></th>')
						.append($('<div class="block_editor_widget__block_id"></div>').text(id))
						.append($('<div class="block_editor_widget__block_name"></div>')
							.append($('<a></a>').text(block)
								.attr('href', doc_link + block)
								.attr('target', '_blank')
							))))
					.append($('<tr></tr>').append(this.inputs_holder).append(this.outputs_holder))
				);

				this.addInput = function(name, value) {
					this.inputs[name] = value;

					var div;
					if (name in this.input_divs) {
						div = this.input_divs[name];
					} else {
						div = $('<a></a>').text(name);
						div.attr('href', '#');
						div.click((function (t, name) { return function() { t.editInput(name); return false; };})(this, name));
						this.input_divs[name] = div;
						this.inputs_holder.append(div);
					}
				};

				this.addInputs = function(list) {
					for (var i in list) {
						if (i[0] != '.') {
							this.addInput(i, list[i]);
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
					var d = createDialog(this.widget, this.id + ":" + name);
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

					console.log(this.inputs[name], typeof(this.inputs[name]));

					if (!(name in this.inputs) || this.inputs[name] === null) {
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

					set.click(function() {
						d.close();
						return false;
					});
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
					for (var i in this.inputs) {
						var target = [this.id, i];
						var have_input = this.inputs[i] && typeof(this.inputs[i]) == 'object';
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

							if (source) {
								// update or create ... we need path anyway

								if (source[0] == '') {
									continue;
								}

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
								var sh = Math.round(s_div.height() / 2) + 2;
								var srcX = s.left + s_div.outerWidth() + 4;
								var srcY = s.top + sh;

								// destination
								var d_div = this.input_divs[i];
								if (!d_div) {
									continue;
								}
								var d = this.positionOnCanvas(d_div);
								var dh = Math.round(d_div.height() / 2) + 2;
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
									'L', (dstX - dh), (dstY - (dh - 3)),
									'L', (dstX - 0.7 * dh), dstY,
									'L', (dstX - dh), (dstY + (dh - 3)),
									'Z'
								].join(',');
							}

							if (ci in this.connections) {
								if (source) {
									// update
									this.connections[ci].line.attr('path', line_path);
									this.connections[ci].arrow.attr('path', arrow_path);
								} else {
									// remove
									this.connections[ci].line.remove();
									this.connections[ci].arrow.remove();
									delete this.connections[ci];
								}
							} else if (source) {
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
						}
					}
					raph.safari();
					//console.log(this.connections);
				};
			}

			// Calculate block prefix from it's name
			function getBlockClass(block)
			{
				return 'block_editor_widget__block__' + block.replace(/\/[^\/]*$/, '').replace('/', '__');
			}

			var textarea = $(this);
			var blocks = {};
			var doc_link = textarea.attr('data-doc_link');
			var current_dialog = null;

			if (!textarea.hasClass('block_editor_widget') || this.tagName.toLowerCase() != 'textarea') {
				if (console) {
					console.error('Cannot convert this element to Block Editor widget. It must be textarea with \'block_editor_widget\' class.');
				}
				return;
			}

			// Create widget
			var widget = $('<div class="block_editor_widget widget"></div>');
			widget.css('height', textarea.css('height'));
			widget.disableSelection();
			widget.insertBefore(textarea);
			//textarea.css('display', 'none !important');

			// Canvas dialog factory
			function createDialog(holder, title)
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
			$(canvas).mouseup(function() {
				$(canvas).unbind('mousemove');
			});

			var canvas_inner = $('<div class="block_editor_widget__canvas_inner"></div>').css({
					position: 'relative',
					width: canvas_width,
					height: canvas_height
				});
			canvas.append(canvas_inner);

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
				var w = $(this).parents('.block_editor_widget');
				w.toggleClass('block_editor_widget__maximized');
				$(this).html(w.hasClass('block_editor_widget__maximized') ? '&darr;' : '&uarr;')
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
				b.addInputs(available_blocks[block].inputs);
				b.addOutputs(available_blocks[block].outputs);
				palette_blocks.append(b.widget);

				var block_class = getBlockClass(block);
				if (block_class != last_class) {
					select.append($('<option></option>').attr('value', block_class).text(block.replace(/\/[^\/]*$/, '')));
					last_class = block_class;
				}
			}

			var block_re = /^block:/;

			// Serialize all blocks to JSON, keep unknown values from original in place
			widget.serializeBlocks = function(blocks, orig_data) {
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
						if (input != '*') {
							B[input] = b.inputs[input];
						}
					}
					d['block:' + b.id] = B;
				}

				return json_encode(d);
			};


			// Add blocks to widget using data in textarea
			widget.updateFromTextarea = function() {
				var d = json_decode(textarea.val());
				var geometry = {};
				var refreshRequested = false;

				if ('geometry' in d) {
					geometry = d['geometry'];
				}

				for (var i in d) {
					if (block_re.test(i)) {
						var id = i.replace(block_re, '');
						var block = d[i]['.block'];
						var inputs = available_blocks[block].inputs;
						var outputs = available_blocks[block].outputs;

						var b = new Block(id, block, doc_link, function() { textarea.val(widget.serializeBlocks(blocks, d)); });
						b.addInputs(available_blocks[block].inputs);
						b.addOutputs(available_blocks[block].outputs);
						b.addInputs(d[i]);
						b.setPosition('x' in d[i] ? d[i].x + canvas_width / 3 : canvas_width / 2,
								'y' in d[i] ? d[i].y + canvas_height / 3 : canvas_height / 2);
						blocks[id] = b;

						canvas_inner.append(b.widget);
						b.widget.draggable({
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
							}; })(b)
						});
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

