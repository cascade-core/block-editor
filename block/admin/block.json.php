{
    "_": "<?php printf('_%c%c}%c',34,10,10);__halt_compiler();?>",
    "output": {
        "done": [
            "editor:done"
        ]
    },
    "blocks": {
        "editor_hd": {
            "block": "core/out/header",
            "x": 20,
            "y": 0,
            "in_val": {
                "level": 2,
                "text": "Block Editor",
                "slot": "default",
                "slot_weight": 10
            }
        },
        "editor": {
            "block": "block_editor/test",
            "x": 0,
            "y": 166,
            "in_con": {
                "block": [
                    "admin",
                    "path_tail"
                ]
            },
            "in_val": {
                "doc_link": "/admin/devel/doc/block/{block}",
                "back_link": "/admin/block-editor",
                "slot": "default",
                "slot_weight": 50
            }
        },
        "message": {
            "in_con": {
                "1": [
                    "editor",
                    "block"
                ],
                "enable": [
                    "editor",
                    "submitted"
                ],
                "is_success": [
                    "editor",
                    "done"
                ],
                "text": [
                    "editor",
                    "message"
                ]
            },
            "block": "core/out/message",
            "x": 248,
            "y": 14,
            "in_val": {
                "type": "error",
                "error_title": "Sorry.",
                "success_title": "Ok.",
                "redirect_url": "/admin/block-editor/%s",
                "slot": "default",
                "slot_weight": 20
            }
        },
        "router_invalidate_cache": {
            "block": "core/ini/router_invalidate_cache",
            "x": 245,
            "y": 466,
            "in_con": {
                "enable": [
                    "editor",
                    "done"
                ]
            }
        }
    }
}