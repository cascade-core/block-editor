{
	"_": "<?php printf('_%c%c}%c',34,10,10);__halt_compiler();?>",
	"main_menu": {
		"devel": {
			"children": {
				"block_editor": {
					"title": "Block editor",
					"link": "/admin/block-editor",
					"weight": 30
				}
			}
		}
	},
	"routes": {
		"/block-editor": {
			"title": "Block editor",
			"block": "block_editor/admin/index",
			"connections": {
			}
		},
		"/block-editor/**": {
			"title": "Block editor",
			"block": "block_editor/admin/block",
			"connections": {
			}
		}
	}
}

