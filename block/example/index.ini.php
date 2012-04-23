; <?php exit(); __halt_compiler(); ?>

[output]
done[] = index:done

[block:editor_hd]
.block = "core/out/header"
text = "Block Editor"

[block:index]
.block = core/devel/doc/index
link = "/block_editor/%s"
regexp = "/\.ini\.php$/"

; vim:filetype=dosini:

