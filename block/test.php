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
		'block' => false,		// Block to edit.
		'doc_link' => DEBUG_CASCADE_GRAPH_DOC_LINK, // Link to documentation.
		'slot' => 'default',
		'slot_weight' => 50,
	);

	protected $outputs = array(
		'saved' => true,		// True, if block has been saved.
		'block' => true,		// Name of saved block.
		'error' => true,		// Error message about saving the block.
		'submitted' => true,		// Form was submited.
		'done' => true,
	);

	const force_exec = TRUE;


	public function main()
	{
		$error = false;
		$saved = false;
		$dst_block = null;
		$storages = $this->get_cascade_controller()->get_block_storages();

		// get inputs
		$block = $this->in('block');
		if (is_array($block)) {
			$block = join('/', $block);
		}

		// load block
		foreach ($storages as $src_storage) {
			$mtime = $src_storage->block_mtime($block);
			if ($mtime) {
				break;
			}
		}
		if (!isset($mtime)) {
			return;
		}
		debug_msg('Loading block: %s', $block);

		// get form data
		$submitted = !empty($_POST['submit']) && $_POST['src_block'] == $block;
		$this->out('submitted', $submitted);

		if ($submitted) {
			$saved = $this->store($storages, $mtime, $_POST['dst_block'], $_POST['src_mtime'], $_POST['cfg']);
		}

		if (!$saved) {
			// Load block description
			$cfg = $src_storage->load_block($block);

			if ($cfg === FALSE) {
				$this->out('error', _('Failed to load block configuration.'));
				return;
			}

			$available_blocks = $this->get_available_blocks();

			$this->template_add_to_slot('head', 'html_head', 60, 'block_editor/html_head', array());

			$this->template_add(null, 'block_editor/test', array(
					'block' => $block,
					'mtime' => $mtime,
					'cfg' => $cfg,
					'doc_link' => $this->in('doc_link'),
					'available_blocks' => $available_blocks,
				));
		}

		$this->out('saved', $saved);
		$this->out('block', $dst_block);
		$this->out('done', true);
	}


	private function store($storages, $orig_mtime, $dst_block, $src_mtime, $cfg)
	{
		$saved = false;

		if ($src_mtime != $orig_mtime) {
			$this->out('error', _('Block was modified by someone else in meantime.'));
			error_msg('Failed to store block "%s", becouse it was modified by someone else (%s != %s).', $dst_block, $src_mtime, $orig_mtime);
			return false;
		}

		$new_cfg = json_decode($cfg, TRUE);

		if ($new_cfg === null) {
			$this->out('error', _('Received block description is invalid.'));
			error_msg('Failed to decode configuration of block "%s".', $dst_block);
			return false;
		}

		// store block in first storage that allows it
		foreach ($storages as $dst_storage_id => $dst_storage) {
			debug_msg("Storing %s in %s ...", $dst_block, $dst_storage_id);
			if (!$dst_storage->is_read_only() && $dst_storage->store_block($dst_block, $new_cfg)) {
				$saved = true;
				debug_msg("Storing %s in %s ... Success!", $dst_block, $dst_storage_id);
				break;
			}
		}

		if (!$saved) {
			$this->out('error', _('Cannot write block configuration.'));
			error_msg('Failed to write block "%s" to %s.', $dst_block, $dst_storage_id);
			return false;
		}

		/*
		echo "<pre>", $dst_file, "<br>\n";
		print_r($new_cfg);
		echo "</pre>\n";
		echo "<b>", $saved ? 'ok':'failed', "</b>\n";
		// */
		
		return true;
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

