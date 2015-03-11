<?php
/*
 * Copyright (c) 2011, Josef Kufner  <jk@frozen-doe.net>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


function TPL_html5__block_editor__test($t, $id, $d, $so)
{
	extract($d);

	echo "<form class=\"block_editor\" id=\"", htmlspecialchars($id), "\" method=\"post\">\n";

	echo	"<div>";
	if (!empty($back_link)) {
		echo "<a href=\"", htmlspecialchars($back_link), "\">", _('« List'), "</a> | ";
	}
	echo	_('Block:'), "\n",
		"<input type=\"text\" name=\"dst_block\" value=\"", htmlspecialchars($block), "\" size=\"30\"
				onchange=\"this.form['delete'].disabled = true;\">\n",
		"<input type=\"submit\" name=\"submit\" value=\"", _('Save'), "\">\n",
		"<input type=\"submit\" name=\"delete\" value=\"", _('Delete'), "\" onclick=\"return confirm('",
				_('Do you really want to delete this entire block?'), "')\">\n",
		"<input type=\"hidden\" name=\"src_block\" value=\"", htmlspecialchars($block), "\">\n",
		"<input type=\"hidden\" name=\"src_mtime\" value=\"", htmlspecialchars($mtime), "\">\n",
		"</div>\n";

	echo "\t<textarea name=\"cfg\" class=\"block_editor_widget\" rows=\"25\" cols=\"80\" style=\"display: block; width: 99%;\"",
			"data-doc_link=\"", htmlspecialchars($doc_link), "\" ",
			"data-edit_link=\"", htmlspecialchars($edit_link), "\" ",
		">",
		json_encode($cfg, JSON_HEX_TAG | JSON_HEX_AMP), "</textarea>\n";

	echo "<p>";
	printf('Stored in <tt>%s</tt>, last modified at %s.', $storage_id, strftime('%Y-%m-%d %H:%M:%S', $mtime));
	echo "</p>\n";

	echo "</form>\n";

}

