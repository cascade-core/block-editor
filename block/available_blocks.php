<?php
/*
 * Copyright (c) 2014, Josef Kufner  <jk@frozen-doe.net>
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
 * Load list of available blocks from all block storages.
 *
 * TODO: Whole server side of block editor needs redesign, this part too.
 */
class B_block_editor__available_blocks extends \Cascade\Core\Block {

	protected $inputs = array(
	);

	protected $outputs = array(
		'available_blocks' => true,	// List of blocks
		'done' => true,
	);


	public function main()
	{
		$cc = $this->getCascadeController();
		$blocks = $cc->getKnownBlocks();

		$available_blocks = array();

		foreach ($blocks as $plugin => $plugin_blocks) {
			foreach ($plugin_blocks as $block) {
				try {
					$desc = $cc->describeBlock($block, $this->context);
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
				catch (\Exception $ex) {
					error_msg('Failed to get description of block "%s": %s', $block, $ex->getMessage());
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

		$this->out('available_blocks', $available_blocks);
		$this->out('done', true);
	}
}

