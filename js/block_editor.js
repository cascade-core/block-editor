/*
 * Block Editor Widget 2.0
 *
 * Copyright (c) 2014, Martin Adamek <adamek@projectisimo.com>
 */
(function($) {
	"use strict";

	$.fn.newBlockEditorWidget = function(options) {
		return this.each(function() {
			new BlockEditor(this, options);
		});
	};



	// run
	$(document).ready(function() {
		var second = $('textarea.block_editor_widget').clone();
		$('textarea.block_editor_widget').parent().append(second);
		$('textarea.block_editor_widget:eq(0)').newBlockEditorWidget();
		$('textarea.block_editor_widget:eq(1)').blockEditorWidget();
	});

})(jQuery);
