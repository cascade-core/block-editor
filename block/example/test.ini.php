;<?php exit(); __HALT_COMPILER; ?>


[output]
done[] = "editor:done"

[block:editor_hd]
.block = "core/out/header"
.x = 14
.y = 253
level = "2"
text = "Block Editor"
slot = "default"
slot_weight = "10"

[block:editor]
.block = "block_editor/test"
.x = 0
.y = 123
block[] = "router:path_tail"
doc_link = "/documentation/block/{block}"
slot = "default"
slot_weight = "50"

[block:message]
1[] = "editor:block"
.block = "core/out/message"
.x = 249
.y = 0
enable[] = "editor:submitted"
type = "error"
is_success[] = "editor:saved"
error_title = "Sorry."
error_text[] = "editor:error"
success_title = "Block has been saved."
redirect_url = "/block_editor/%s"
slot = "default"
slot_weight = "20"


; vim:filetype=dosini:
