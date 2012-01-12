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
	
	$.fn.moduleEditorWidget = function() {
		this.each(function() {
			var $this = $(this);

			if (!$this.hasClass('module_editor_widget') || this.tagName.toLowerCase() != 'textarea') {
				if (console) {
					console.error('Cannot convert this element to Module Editor widget. It must be textarea with \'module_editor_widget\' class.');
				}
				return;
			}

			var widget = $('<div class=\"module_editor_widget widget\"></div>');
			widget.textarea = $this;
			widget.css({
				position:	'relative',
				overflow:	'auto',
				height:		$this.css('height'),
				width:		$this.css('width')
			});
			widget.disableSelection();
			widget.insertBefore($this);

			widget.createMoulde = function(id, module, connections) {
				var m = $('<div class="module_editor_widget__module"></div>');

				var inputs = $('<td width="50%" class="module_editor_widget__in"></td>');
				var outputs = $('<td width="50%" class="module_editor_widget__out"></td>').text('output');

				m.append($('<table width="100%"></table>')
					.append($('<tr></tr>').append($('<th colspan="2"></th>')
						.append($('<div class="module_editor_widget__module_id"></div>').text(id))
						.append($('<div class="module_editor_widget__module_name"></div>').text(module))))
					.append($('<tr></tr>').append(inputs).append(outputs))
				);
				// m.append($('<a href="#" class="module_editor_widget__add_input">add input</a>'));

				// Inputs
				for (var c in connections) {
					if (c[0] == '.') {
						continue;
					}

					if (typeof(connections[c]) == 'object') {
						inputs.append($('<div></div>').text(c));
					}
				}
				return m;
			};

			widget.updateFromTextarea = function() {
				var d = eval('(' + this.textarea.val() + ')');
				var geometry = {};

				if ('geometry' in d) {
					geometry = d['geometry'];
				}

				for (var i in d) {
					if (i.substr(0, 7) == 'module:') {
						var id = i.substr(7);
						var module = d[i]['.module'];
						var connections = d[i];

						var m = this.createMoulde(id, module, connections);
						this.append(m);
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

