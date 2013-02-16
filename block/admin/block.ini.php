;<?php exit(); __HALT_COMPILER; ?>


[output]
done[] = "editor:done"

[block:editor_hd]
.block = "core/out/header"
.x = 20
.y = 0
level = "2"
text = "Block Editor"
slot = "default"
slot_weight = "10"

[block:editor]
.block = "block_editor/test"
.x = 0
.y = 166
block[] = "admin:path_tail"
doc_link = "/admin/devel/doc/block/{block}"
back_link = "/admin/block-editor"
slot = "default"
slot_weight = "50"

[block:message]
1[] = "editor:block"
.block = "core/out/message"
.x = 248
.y = 14
enable[] = "editor:submitted"
type = "error"
is_success[] = "editor:done"
text[] = "editor:message"
error_title = "Sorry."
success_title = "Ok."
redirect_url = "/admin/block-editor/%s"
slot = "default"
slot_weight = "20"

[block:router_invalidate_cache]
.block = "core/ini/router_invalidate_cache"
.x = 245
.y = 466
enable[] = "editor:done"


; vim:filetype=dosini:
