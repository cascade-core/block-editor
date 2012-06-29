; <?php exit(); __halt_compiler(); ?>

[output]
done[] = index:done

[block:editor_hd]
.block = "core/out/header"
text = "Block Editor"

[block:index]
.block = core/devel/doc/index
writable_only = true
link = "/block_editor/{block}"
heading_level = 3

; vim:filetype=dosini:

