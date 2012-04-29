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

/**
 * Test WYSIWYG block editor. INI file is loaded and editor form is displayed.
 */
class B_block_editor__test extends Block {

	protected $inputs = array(
		'file' => false,		// Filename to load (if block is not specified).
		'block' => false,		// Block to edit.
		'doc_link' => DEBUG_CASCADE_GRAPH_LINK,	// Link to documentation.
		'slot' => 'default',
		'slot_weight' => 50,
	);

	protected $outputs = array(
		'file' => true,
		'done' => true,
	);

	const force_exec = TRUE;


	public function main()
	{
		$block = $this->in('block');
		if ($block !== false) {
			if (is_array($block)) {
				$block = join('/', $block);
			}
			$file = get_block_filename($block, '.ini.php');
		} else {
			$file = $this->in('file');
		}
		debug_msg('Loading file: %s', $file);

		$cfg = parse_ini_file($file, TRUE);

		if ($cfg === FALSE) {
			return;
		}

		$available_blocks = $this->get_available_blocks();

		$this->template_add_to_slot('head', 'html_head', 60, 'block_editor/html_head', array());

		$this->template_add(null, 'block_editor/test', array(
				'file' => $file,
				'cfg' => $cfg,
				'doc_link' => $this->in('doc_link'),
				'available_blocks' => $available_blocks,
			));

		$this->out('file', $file);
		$this->out('done', true);
	}


	private function get_available_blocks()
	{
		$cc = $this->get_cascade_controller();
		$blocks = $cc->get_known_blocks();

		$available_blocks = array();

		foreach ($blocks as $plugin => $plugin_blocks) {
			foreach ($plugin_blocks as $block) {
				$desc = $cc->describe_block($block);
				if ($desc !== false) {
					$available_blocks[$block] = $desc;
					$available_blocks[$block]['plugin'] = $plugin;
				} else {
					$available_blocks[$block] = array(
						'block' => $block,
						'plugin' => $plugin,
						'force_exec' => TRUE,
						'inputs' => array('*' => null),
						'outputs' => array('*' => null),
					);
				}
			}
		}

		ksort($available_blocks);

		/*
		NDebug::barDump($available_blocks, 'Available blocks');
		NDebug::barDump($blocks, 'block list');
		// */

		return $available_blocks;
	}
}

