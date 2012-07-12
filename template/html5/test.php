<?php
/*
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
 */


function TPL_html5__block_editor__test($t, $id, $d, $so)
{
	extract($d);

	echo "<form class=\"block_editor\" id=\"", htmlspecialchars($id), "\" method=\"post\">\n";

	echo	"<div>",
		_('Block:'), "\n",
		"<input type=\"text\" name=\"dst_block\" value=\"", htmlspecialchars($block), "\" size=\"30\"
				onchange=\"this.form['delete'].disabled = true;\">\n",
		"<input type=\"submit\" name=\"submit\" value=\"", _('Save'), "\">\n",
		"<input type=\"submit\" name=\"delete\" value=\"", _('Delete'), "\" onclick=\"return confirm('",
				_('Do you really want to delete this entire block?'), "')\">\n",
		"<input type=\"hidden\" name=\"src_block\" value=\"", htmlspecialchars($block), "\">\n",
		"<input type=\"hidden\" name=\"src_mtime\" value=\"", htmlspecialchars($mtime), "\">\n",
		"</div>";


	echo "\t<textarea name=\"cfg\" class=\"block_editor_widget\" rows=\"25\" cols=\"80\" style=\"display: block; width: 99%;\"",
			"data-doc_link=\"", htmlspecialchars($doc_link), "\" ",
			"data-available_blocks=\"", htmlspecialchars(json_encode($available_blocks)), "\">",
		htmlspecialchars(json_encode($cfg)), "</textarea>\n";

	echo "<p>";
	printf('Stored in <tt>%s</tt>, last modified at %s.', $storage_id, strftime('%Y-%m-%d %H:%M:%S', $mtime));
	echo "</p>\n";

	echo "</form>\n";

}

