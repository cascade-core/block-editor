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

	// Calculate module prefix from it's name
	function getModuleClass(module)
	{
		return 'module_editor_widget__module__' + module.replace(/\/[^\/]*$/, '').replace('/', '__');
	}

	// Create module in widget
	function createModule (id, module, inputs, outputs, doc_link)
	{
		var m = $('<div class="module_editor_widget__module"></div>');
		m.addClass(getModuleClass(module));

		var inputs_holder = $('<td width="50%" class="module_editor_widget__in"></td>');
		var outputs_holder = $('<td width="50%" class="module_editor_widget__out"></td>');

		m.append($('<table width="100%"></table>')
			.append($('<tr></tr>').append($('<th colspan="2"></th>')
				.append($('<div class="module_editor_widget__module_id"></div>').text(id))
				.append($('<div class="module_editor_widget__module_name"></div>')
					.append($('<a></a>').text(module)
						.attr('href', doc_link + module)
						.attr('target', '_blank')
					))))
			.append($('<tr></tr>').append(inputs_holder).append(outputs_holder))
		);
		// m.append($('<a href="#" class="module_editor_widget__add_input">add input</a>'));

		// Inputs
		for (var i in inputs) {
			if (i[0] == '.') {
				continue;
			}

			var div = $('<div></div>').text(i);
			if (inputs[i] && typeof(inputs[i]) == 'object') {
				div.attr('data-connection', inputs[i][0]);
			} else {
				div.attr('data-value', inputs[i]);
			}
			inputs_holder.append(div);
		}

		// Outputs
		for (var i in outputs) {
			if (i[0] == '.') {
				continue;
			}

			var div = $('<div></div>').text(i);
			outputs_holder.append(div);
		}
		return m;
	}
	
	$.fn.moduleEditorWidget = function() {
		this.each(function() {
			var $this = $(this);
			var doc_link = $this.attr('data-doc_link');

			if (!$this.hasClass('module_editor_widget') || this.tagName.toLowerCase() != 'textarea') {
				if (console) {
					console.error('Cannot convert this element to Module Editor widget. It must be textarea with \'module_editor_widget\' class.');
				}
				return;
			}

			// Create widget
			var widget = $('<div class="module_editor_widget widget"></div>');
			widget.css({
				height:		$this.css('height'),
				width:		$this.css('width')
			});
			widget.disableSelection();
			widget.insertBefore($this);

			var textarea = $this;
			widget.canvas = $('<div class="module_editor_widget__canvas"></div>');
			widget.append(widget.canvas);
			
			// Create palette
			var palette_holder = $('<div class="module_editor_widget__palette"></div>');
			var palette_toolbar = $('<div class="module_editor_widget__palette_toolbar"></div>');
			var palette_modules = $('<div class="module_editor_widget__palette_modules"></div>');
			palette_holder.append(palette_toolbar).append(palette_modules);
			widget.append(palette_holder);

			// Load available modules
			var select = $('<select></select>');
			select.append($('<option></option>').attr('value', '').text('*'));
			select.change(function() {
				var c = $(this).val();
				palette_modules.children().each(function() {
					$(this).css('display', c == '' || $(this).hasClass(c) ? 'block' : 'none');
				});
			});
			palette_toolbar.append($('<div>Filter: </div>').append(select));
			var modules = eval('(' + textarea.attr('data-available_modules') + ')');
			console.log(modules);
			var last_class = null;
			for (var module in modules) {
				var m = $('<div class="module_editor_widget__palette_item"></div>')
					.text(module);
				palette_modules.append(createModule(module.replace(/.*\//, ''), module, modules[module].inputs, modules[module].outputs, doc_link));
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

				for (var i in d) {
					if (i.substr(0, 7) == 'module:') {
						var id = i.substr(7);
						var module = d[i]['.module'];
						var inputs = d[i];

						var m = createModule(id, module, inputs, { '*': true }, doc_link);
						this.canvas.append(m);
					}
				}
			};

			widget.updateFromTextarea();
		});
		return this;
	};

	$(document).ready(function() {
		$('textarea.module_editor_widget').moduleEditorWidget();
	});

})(jQuery);

