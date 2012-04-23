; <?php exit(); __halt_compiler(); ?>

[output]
done[] = editor:done

[block:editor_hd]
.block		= "core/out/header"
text		= "Block Editor"
enable[]	= "editor:done"

[block:editor]
.block = block_editor/test
block[] = router:path_tail

; vim:filetype=dosini:

