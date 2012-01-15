/*
 * Module Editor Widget
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

	// Module
	function Module(id, module, doc_link)
	{
		this.id = id;
		this.module = module;
		this.inputs = {};
		this.outputs = {};
		this.input_divs = {};	// one div for each input
		this.output_divs = {};	// one div for each output
		this.connections = {};	// lines from inputs to other modules

		this.widget = $('<div class="module_editor_widget__module"></div>');
		this.widget.addClass(getModuleClass(module));

		this.inputs_holder = $('<td width="50%" class="module_editor_widget__in"></td>');
		this.outputs_holder = $('<td width="50%" class="module_editor_widget__out"></td>');

		this.widget.append($('<table width="100%"></table>')
			.append($('<tr></tr>').append($('<th colspan="2"></th>')
				.append($('<div class="module_editor_widget__module_id"></div>').text(id))
				.append($('<div class="module_editor_widget__module_name"></div>')
					.append($('<a></a>').text(module)
						.attr('href', doc_link + module)
						.attr('target', '_blank')
					))))
			.append($('<tr></tr>').append(this.inputs_holder).append(this.outputs_holder))
		);
		// m.append($('<a href="#" class="module_editor_widget__add_input">add input</a>'));

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

		// Create or update all connections
		this.connect = function(modules, raph) {
			for (var i in this.inputs) {
				var target = [this.id, i];
				var source = this.inputs[i] && typeof(this.inputs[i]) == 'object' ? this.inputs[i][0].split(':') : null;

				if (i in this.connections) {
					if (source) {
						// update
					} else {
						// remove
					}
				} else if (source) {
					// create
					console.log('Connection:', source, '->', target);

					var c = this.widget.parents('.module_editor_widget__canvas').offset();
					// source
					var s_div = modules[source[0]].output_divs[source[1]];
					if (!s_div) {
						if ('*' in modules[source[0]].outputs) {
							modules[source[0]].addOutput(source[1]);
							s_div = modules[source[0]].output_divs[source[1]];
						} else {
							continue;
						}
					}
					var s = s_div.offset();
					var sh = s_div.height();
					var srcX = s.left - c.left + s_div.outerWidth();
					var srcY = s.top - c.top + Math.round(sh / 2);

					// destination
					var d_div = this.input_divs[i];
					if (!d_div) {
						continue;
					}
					var d = d_div.offset();
					var dh = d_div.height();
					var dstX = d.left - c.left;
					var dstY = d.top - c.top + Math.round(dh / 2);
					
					console.log(d, c);
					raph.connectionLine(srcX, srcY, dstX, dstY, dh);
					raph.arrowRight(dstX, dstY, 0.9 * dh);
				}
			}
		};
	}

	// Calculate module prefix from it's name
	function getModuleClass(module)
	{
		return 'module_editor_widget__module__' + module.replace(/\/[^\/]*$/, '').replace('/', '__');
	}


	$.fn.moduleEditorWidget = function() {
		this.each(function() {
			var textarea = $(this);
			var modules = {};
			var doc_link = textarea.attr('data-doc_link');

			if (!textarea.hasClass('module_editor_widget') || this.tagName.toLowerCase() != 'textarea') {
				if (console) {
					console.error('Cannot convert this element to Module Editor widget. It must be textarea with \'module_editor_widget\' class.');
				}
				return;
			}

			// Create widget
			var widget = $('<div class="module_editor_widget widget"></div>');
			widget.css('height', textarea.css('height'));
			widget.disableSelection();
			widget.insertBefore(textarea);
			textarea.css('display', 'none !important');

			var canvas = $('<div class="module_editor_widget__canvas"></div>');
			widget.append(canvas);

			Raphael.fn.arrowRight = function(x, y, h) {
				var w = h;
				var h2 = Math.floor(h / 2);
				return this.path(
						'M' + x + ' ' + y
						+ 'L' + (x - w) + ' ' + (y - h2)
						+ 'L' + (x - 0.7 * w) + ' ' + (y)
						+ 'L' + (x - w) + ' ' + (y + h2)
						+ 'Z'
					).attr('stroke', '#000').attr('fill', '#000');
			};
			Raphael.fn.connectionLine = function(srcX, srcY, dstX, dstY, d) {
				var c = Math.round(0.5 * Math.abs(srcX - dstX) + d);
				return this.path(
						'M' + srcX + ' ' + srcY
						+ 'C' + (srcX + c) + ' ' + srcY
						+ ' ' + (dstX - c) + ' ' + dstY
						+ ' ' + (dstX - d) + ' ' + dstY
						+ 'L' + dstX + ' ' + dstY
					).attr('stroke', '#000').attr('stroke-width', 1.4);
			};
			var canvas_raphael = Raphael(canvas[0], 2000, 2000);	// fixme
			
			// Create palette
			var palette_holder = $('<div class="module_editor_widget__palette"></div>');
			var palette_toolbar = $('<div class="module_editor_widget__palette_toolbar"></div>');
			var palette_modules = $('<div class="module_editor_widget__palette_modules"></div>');
			palette_holder.append(palette_toolbar).append(palette_modules);
			widget.append(palette_holder);

			// Maximize button
			palette_toolbar.append($('<a href="#" class="module_editor_widget__maximize" title="Maximize">&uarr;</a>').click(function() {
				var w = $(this).parents('.module_editor_widget');
				w.toggleClass('module_editor_widget__maximized');
				$(this).html(w.hasClass('module_editor_widget__maximized') ? '&darr;' : '&uarr;')
				return false;
			}));

			// Load available modules
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
				palette_modules.children().each(function() {
					$(this).css('display', c == '' || $(this).hasClass(c) ? 'block' : 'none');
				});
			};
			select.change(on_filter).keyup(on_filter);
			palette_toolbar.append($('<div>Filter: </div>').append(select));
			var available_modules = eval('(' + textarea.attr('data-available_modules') + ')');
			var last_class = null;
			for (var module in available_modules) {
				var m = new Module(module.replace(/.*\//, ''), module, doc_link);
				m.addInputs(available_modules[module].inputs);
				m.addOutputs(available_modules[module].outputs);
				palette_modules.append(m.widget);

				var module_class = getModuleClass(module);
				if (module_class != last_class) {
					select.append($('<option></option>').attr('value', module_class).text(module.replace(/\/[^\/]*$/, '')));
					last_class = module_class;
				}
			}

			// Add modules to widget using data in textarea
			widget.updateFromTextarea = function() {
				var d = eval('(' + textarea.val() + ')');
				var geometry = {};

				if ('geometry' in d) {
					geometry = d['geometry'];
				}

				p = 0;
				for (var i in d) {
					if (i.substr(0, 7) == 'module:') {
						var id = i.substr(7);
						var module = d[i]['.module'];
						var inputs = available_modules[module].inputs;
						var outputs = available_modules[module].outputs;

						var m = new Module(id, module, doc_link);
						m.addInputs(available_modules[module].inputs);
						m.addOutputs(available_modules[module].outputs);
						m.addInputs(d[i]);

						modules[id] = m;
						m.widget.css('top', 50 + Math.round(p / 3) * 200);
						m.widget.css('left', 50 + (p % 3) * 300);
						p++;
						canvas.append(m.widget);
					}
				}

				for (var i in modules) {
					modules[i].connect(modules, canvas_raphael);
				}

				console.log('Modules:', modules);
			};

			widget.updateFromTextarea();
		});
		return this;
	};

	$(document).ready(function() {
		$('textarea.module_editor_widget').moduleEditorWidget();
	});

})(jQuery);

