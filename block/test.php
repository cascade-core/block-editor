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

/**
 * Test WYSIWYG block editor. INI file is loaded and editor form is displayed.
 */
class B_block_editor__test extends \Cascade\Core\Block {

	protected $inputs = array(
		'block' => false,		// Block to edit.
		'doc_link' => '/admin/doc/block/{block}',	// Link to documentation.
		'back_link' => '/admin/block-editor',		// The "Back to list" link on top of editor
		'slot' => 'default',
		'slot_weight' => 50,
	);

	protected $outputs = array(
		'block' => true,		// Name of saved block.
		'message' => true,		// Success or error message.
		'submitted' => true,		// Form was submited.
		'done' => true,			// Block has been saved or deleted.
	);

	const force_exec = TRUE;


	public function main()
	{
		$saved = false;
		$deleted = false;
		$dst_block = null;
		$storages = $this->getCascadeController()->getBlockStorages();

		// get inputs
		$block = $this->in('block');
		if (is_array($block)) {
			$block = join('/', $block);
		}

		// Replace dashes with underscores, since no dash is allowed in block name
		$block = str_replace('-', '_', $block);

		// load block
		foreach ($storages as $storage_id => $src_storage) {
			$mtime = $src_storage->blockMTime($block);
			if ($mtime) {
				break;
			}
		}
		if (!isset($mtime)) {
			return;
		}
		debug_msg('Edit block: %s', $block);

		// get form data
		$submitted = !empty($_POST['submit']) && $_POST['src_block'] == $block;
		$submit_delete = !empty($_POST['delete']) && $_POST['src_block'] == $block && $_POST['dst_block'] == $block;
		$this->out('submitted', $submitted || $submit_delete);

		if ($submitted) {
			$saved = $this->storeBlock($storages, $mtime, $_POST['dst_block'], $_POST['src_mtime'], $_POST['cfg']);
		} else if ($submit_delete) {
			$deleted = $this->deleteBlock($storages, $mtime, $block, $_POST['src_mtime']);
		}

		if ($deleted) {
			$this->out('message', sprintf(_('Block "%s" has been deleted.'), $block));
		} else {
			if ($saved) {
				$this->out('message', sprintf(_('Block "%s" has been saved.'), $_POST['dst_block']));
			}

			// Load block description
			$cfg = $submitted ? json_decode($_POST['cfg']) : $src_storage->loadBlock($block);

			if ($cfg === FALSE) {
				$this->out('message', _('Failed to load block configuration.'));
				return;
			}

			$available_blocks = $this->getAvailableBlocks();

			$this->templateAddToSlot('head', 'html_head', 60, 'block_editor/html_head', array());

			$this->templateAdd(null, 'block_editor/test', array(
					'block' => $block,
					'mtime' => $mtime,
					'cfg' => $cfg,
					'storage_id' => $storage_id,
					'doc_link' => $this->in('doc_link'),
					'back_link' => $this->in('back_link'),
					'available_blocks' => $available_blocks,
				));
		}

		$this->out('block', $saved ? $_POST['dst_block'] : null);
		$this->out('done', $saved || $deleted);
	}


	private function storeBlock($storages, $orig_mtime, $dst_block, $src_mtime, $cfg)
	{
		$saved = false;

		if ($orig_mtime > 0 && $src_mtime != $orig_mtime) {
			$this->out('message', _('Block was modified by someone else in meantime.'));
			error_msg('Failed to store block "%s", becouse it was modified by someone else (%s != %s).', $dst_block, $src_mtime, $orig_mtime);
			return false;
		}

		$new_cfg = json_decode($cfg, TRUE);

		if ($new_cfg === null) {
			$this->out('message', _('Received block description is invalid.'));
			error_msg('Failed to decode configuration of block "%s".', $dst_block);
			return false;
		}

		// store block in first storage that allows it
		foreach ($storages as $dst_storage_id => $dst_storage) {
			debug_msg("Storing %s in %s ...", $dst_block, $dst_storage_id);
			if (!$dst_storage->isReadOnly()) {
				if ($dst_storage->storeBlock($dst_block, $new_cfg)) {
					$saved = true;
					debug_msg("Storing %s in %s ... Success!", $dst_block, $dst_storage_id);
				} else {
					$saved = false;
					debug_msg("Storing %s in %s ... Failed.", $dst_block, $dst_storage_id);
				}
				break;
			}
		}

		if (!$saved) {
			$this->out('message', _('Cannot write block configuration.'));
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


	private function deleteBlock($storages, $orig_mtime, $dst_block, $src_mtime)
	{
		$deleted = false;

		if ($src_mtime != $orig_mtime) {
			$this->out('message', _('Block was modified by someone else in meantime.'));
			error_msg('Failed to delete block "%s", becouse it was modified by someone else (%s != %s).', $dst_block, $src_mtime, $orig_mtime);
			return false;
		}

		// delete block from all storages that allows it
		foreach ($storages as $dst_storage_id => $dst_storage) {
			debug_msg("Deleting %s from %s ...", $dst_block, $dst_storage_id);
			if (!$dst_storage->isReadOnly() && $dst_storage->deleteBlock($dst_block)) {
				$deleted = true;
				debug_msg("Delete %s from %s ... Success!", $dst_block, $dst_storage_id);
			}
		}

		if (!$deleted) {
			$this->out('message', _('Cannot delete block.'));
			error_msg('Failed to delete block "%s" from %s.', $dst_block, $dst_storage_id);
			return false;
		}

		/*
		echo "<p>Delete: ", $dst_file, "\n";
		echo "<b>", $deleted ? 'ok':'failed', "</b>\n";
		echo "</p>\n";
		// */

		return true;
	}


	private function getAvailableBlocks()
	{
		$cc = $this->getCascadeController();
		$blocks = $cc->getKnownBlocks();

		$available_blocks = array();

		foreach ($blocks as $plugin => $plugin_blocks) {
			foreach ($plugin_blocks as $block) {
				$desc = $cc->describeBlock($block);
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
		debug_dump($available_blocks, 'Available blocks');
		debug_dump($blocks, 'block list');
		// */

		return $available_blocks;
	}
}

