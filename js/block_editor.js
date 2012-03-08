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

	// Block
	function Block(id, block, doc_link)
	{
		this.id = id;
		this.block = block;
		this.inputs = {};
		this.outputs = {};
		this.input_divs = {};	// one div for each input
		this.output_divs = {};	// one div for each output
		this.connections = {};	// lines from inputs to other blocks

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
		// b.append($('<a href="#" class="block_editor_widget__add_input">add input</a>'));

		this.addInput = function(name, value) {
			this.inputs[name] = value;

			var div;
			if (name in this.input_divs) {
				div = this.input_divs[name];
			} else {
				div = $('<div></div>').text(name);
				this.input_divs[name] = div;
				this.inputs_holder.append(div);
			}
			if (value && typeof(value) == 'object') {
				div.attr('data-connection', value[0]);
			} else {
				div.attr('data-value', value);
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
				var source = this.inputs[i] && typeof(this.inputs[i]) == 'object' ? this.inputs[i][0].split(':') : null;
				var line_path;
				var arrow_path;

				if (source) {
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
					var sh = Math.round(s_div.height() / 2);
					var srcX = s.left + s_div.outerWidth();
					var srcY = s.top + sh;

					// destination
					var d_div = this.input_divs[i];
					if (!d_div) {
						continue;
					}
					var d = this.positionOnCanvas(d_div);
					var dh = Math.round(d_div.height() / 2);
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
						'L', (dstX - dh), (dstY - (dh - 1)),
						'L', (dstX - 0.7 * dh), dstY,
						'L', (dstX - dh), (dstY + (dh - 1)),
						'Z'
					].join(',');
				}

				if (i in this.connections) {
					if (source) {
						// update
						this.connections[i].line.attr('path', line_path);
						this.connections[i].arrow.attr('path', arrow_path);
					} else {
						// remove
						this.connections[i].line.remove();
						this.connections[i].arrow.remove();
						delete this.connections[i];
					}
				} else if (source) {
					// create
					//console.log('Connection:', source, '->', target);

					this.connections[i] = {
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
				raph.safari();
			}
		};
	}

	// Calculate block prefix from it's name
	function getBlockClass(block)
	{
		return 'block_editor_widget__block__' + block.replace(/\/[^\/]*$/, '').replace('/', '__');
	}


	$.fn.blockEditorWidget = function() {
		this.each(function() {
			var canvas_width = 3000;
			var canvas_height = 3000;

			var textarea = $(this);
			var blocks = {};
			var doc_link = textarea.attr('data-doc_link');

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

			var canvas = $('<div class="block_editor_widget__canvas"></div>');
			widget.append(canvas);

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
			var available_blocks = eval('(' + textarea.attr('data-available_blocks') + ')');
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

			// Add blocks to widget using data in textarea
			widget.updateFromTextarea = function() {
				var d = eval('(' + textarea.val() + ')');
				var geometry = {};

				if ('geometry' in d) {
					geometry = d['geometry'];
				}

				p = 0;
				var block_re = /^block:/;
				for (var i in d) {
					if (block_re.test(i)) {
						var id = i.replace(block_re, '');
						var block = d[i]['.block'];
						var inputs = available_blocks[block].inputs;
						var outputs = available_blocks[block].outputs;

						var b = new Block(id, block, doc_link);
						b.addInputs(available_blocks[block].inputs);
						b.addOutputs(available_blocks[block].outputs);
						b.addInputs(d[i]);

						blocks[id] = b;
						b.widget.css('top', canvas_height / 3 + Math.round(p / 4) * 200);
						b.widget.css('left', canvas_width / 3 + (p % 4) * 300);
						p++;
						canvas_inner.append(b.widget);
						b.widget.draggable({
							drag: function() {
								for (var i in blocks) {
									blocks[i].connect(blocks, canvas_raphael);
								}
							},
							stop: function() {
								for (var i in blocks) {
									blocks[i].connect(blocks, canvas_raphael);
								}
							}
						});
					}
				}

				for (var i in blocks) {
					blocks[i].connect(blocks, canvas_raphael);
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

