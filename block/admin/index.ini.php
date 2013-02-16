;<?php exit(); __HALT_COMPILER; ?>


[output]
done[] = "index:done"

[block:editor_hd]
.block = "core/out/header"
.x = 2
.y = 0
text = "Block Editor"
slot_weight = "10"

[block:index]
.block = "core/devel/doc/index"
.x = 305
.y = 515
link = "/admin/block-editor/{block}"
writable_only = "1"
heading_level = "3"
slot[] = "slot_right:name"
slot_weight = "30"

[block:routes_hd]
.block = "core/out/header"
.x = 306
.y = 123
enable[] = "routes:done"
level = "3"
text = "Routes"
slot[] = "slot_left:name"
slot_weight = "40"

[block:routes]
.block = "core/ini/router_links"
.x = 2
.y = 311
config = "app/routes.ini.php"
flat_list = "1"
title_fmt = "{ROUTE}"
link_fmt = "/admin/block-editor/{BLOCK}"
enable_key = "BLOCK"

[block:routes_menu]
.block = "core/out/menu"
.x = 305
.y = 308
enable[] = "routes:done"
items[] = "routes:links"
slot[] = "slot_left:name"
slot_weight = "45"

[block:slot_left]
.block = "core/out/slot"
.x = 0
.y = 172
slot_weight = 60
extra_class = "left_column"

[block:slot_right]
.block = "core/out/slot"
.x = 1
.y = 526
slot_weight = "65"
extra_class = "right_column"


; vim:filetype=dosini:
