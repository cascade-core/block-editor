;<?php exit(); __HALT_COMPILER; ?>


[output]
done[] = "index:done"

[block:editor_hd]
.block = "core/out/header"
.x = 0
.y = 0
text = "Block Editor"
slot_weight = "10"

[block:index]
.block = "core/devel/doc/index"
.x = 0
.y = 354
link = "/block-editor/{block}"
writable_only = "1"
heading_level = "3"
slot_weight = "40"

[block:routes_hd]
.block = "core/out/header"
.x = 251
.y = 38
enable[] = "routes:done"
level = "3"
text = "Routes"
slot_weight = "20"

[block:routes]
.block = "core/ini/router_links"
.x = 2
.y = 175
config = "app/routes.ini.php"
flat_list = "1"
title_fmt = "{ROUTE}"
link_fmt = "/block-editor/{BLOCK}"
enable_key = "BLOCK"

[block:routes_menu]
.block = "core/out/menu"
.x = 250
.y = 223
enable[] = "routes:done"
items[] = "routes:links"
slot_weight = "30"


; vim:filetype=dosini:
