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

class M_module_editor__test extends Module {

	protected $inputs = array(
		'file' => FILE_APP_CONFIG,
		'doc_link' => '/doc/',
		'slot' => 'default',
		'slot-weight' => 50,
	);

	protected $outputs = array(
		'file' => true,
		'done' => true,
	);

	const force_exec = TRUE;


	public function main()
	{
		$file = $this->in('file');
		$cfg = parse_ini_file($file, TRUE);

		if ($cfg === FALSE) {
			return;
		}

		$available_modules = $this->get_available_modules();

		$this->template_add_to_slot('head', 'html_head', 60, 'module_editor/html_head', array());

		$this->template_add(null, 'module_editor/test', array(
				'file' => $file,
				'cfg' => $cfg,
				'doc_link' => $this->in('doc_link'),
				'available_modules' => $available_modules,
			));

		$this->out('file', $file);
		$this->out('done', true);
	}


	private function get_available_modules()
	{
		$modules = M_core__devel__doc__index::get_modules();

		$available_modules = array();

		foreach ($modules as $plugin => $plugin_modules) {
			foreach ($plugin_modules as $module) {
				$class = get_module_class_name($module);
				if ($class !== false) {
					$m = new $class();
					$available_modules[$module] = $m->describe_module();
					$available_modules[$module]['plugin'] = $plugin;
					unset($m);
				} else {
					$available_modules[$module] = array(
						'module' => $module,
						'plugin' => $plugin,
						'force_exec' => TRUE,
						'inputs' => array('*' => null),
						'outputs' => array('*' => null),
					);
				}
			}
		}

		ksort($available_modules);

		/*
		NDebug::barDump($available_modules, 'Available modules');
		NDebug::barDump($modules, 'Module list');
		// */

		return $available_modules;
	}
}

