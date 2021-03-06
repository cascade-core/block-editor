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


function TPL_html5__block_editor__html_head($t, $id, $d, $so)
{
	echo "\t<!-- Block Editor plugin -->\n",
		"\t<link rel=\"stylesheet\" href=\"/plugin/block_editor/external/font-awesome-4.3.0/css/font-awesome.min.css\" type=\"text/css\">\n",
		"\t<link rel=\"stylesheet\" href=\"/plugin/block_editor/css/block_editor.css\" type=\"text/css\">\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/external/jquery.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/external/gettext.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/external/c2s.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/storage.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/geometry.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/grid.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/astar.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/spline.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/block.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/placeholder.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/block_editor.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/canvas.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/toolbar.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/palette.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/editor.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/classes/parent_editor.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/block_editor.js\"></script>\n",
		"\t<script type=\"text/javascript\" src=\"/plugin/block_editor/js/init.js\"></script>\n",
		"\n";
}

