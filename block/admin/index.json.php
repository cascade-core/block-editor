{
    "_": "<?php printf('_%c%c}%c',34,10,10);__halt_compiler();?>",
    "output": {
        "done": [
            "index:done"
        ]
    },
    "blocks": {
        "editor_hd": {
            "block": "core/out/header",
            "x": 2,
            "y": 0,
            "in_val": {
                "text": "Block Editor",
                "slot_weight": 10
            }
        },
        "index": {
            "block": "core/devel/doc/index",
            "x": 305,
            "y": 515,
            "in_val": {
                "link": "/admin/block-editor/{block}",
                "writable_only": 1,
                "heading_level": 3,
                "slot_weight": 30
            },
            "in_con": {
                "slot": [
                    "slot_right",
                    "name"
                ]
            }
        },
        "routes_hd": {
            "block": "core/out/header",
            "x": 306,
            "y": 123,
            "in_con": {
                "enable": [
                    "routes",
                    "done"
                ],
                "slot": [
                    "slot_left",
                    "name"
                ]
            },
            "in_val": {
                "level": 3,
                "text": "Routes",
                "slot_weight": 40
            }
        },
        "routes_menu": {
            "block": "core/out/menu",
            "x": 305,
            "y": 308,
            "in_con": {
                "enable": [
                    "routes",
                    "done"
                ],
                "items": [
                    "routes",
                    "links"
                ],
                "slot": [
                    "slot_left",
                    "name"
                ]
            },
            "in_val": {
                "slot_weight": 45
            }
        },
        "slot_left": {
            "block": "core/out/slot",
            "x": 0,
            "y": 172,
            "in_val": {
                "slot_weight": 60,
                "extra_class": "left_column"
            }
        },
        "slot_right": {
            "block": "core/out/slot",
            "x": 1,
            "y": 526,
            "in_val": {
                "slot_weight": 65,
                "extra_class": "right_column"
            }
        },
        "routes": {
            "block": "core/router_links",
            "x": 1,
            "y": 314,
            "in_con": {
                "config": [
                    "config",
                    "routes"
                ]
            },
            "in_val": {
                "flat_list": 1,
                "title_fmt": "{route}",
                "link_fmt": "/admin/block-editor/{block}",
                "enable_key": "block"
            }
        }
    }
}