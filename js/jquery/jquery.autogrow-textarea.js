(function($) {

    /*
     * Auto-growing textareas; technique ripped from Facebook
     * From http://javascriptly.com/2008/09/quick-useful-jquery-plugins/
     * Changes:
     *   - Limited maximum height to half of screen.
     */
    $.fn.autogrow = function(options) {
        
        this.filter('textarea').each(function() {
            
            var $this       = $(this),
                minHeight   = $this.height(),
                lineHeight  = $this.css('lineHeight');
            
            var shadow_holder = $('<div></div>').css({
                position:   'absolute',
		top:        0,
		left:       0,
		width:      1,
		height:     1,
		overflow:   'hidden',
		visibility: 'hidden'
	    }).appendTo(document.body);
            var shadow = $('<div></div>').css({
                width:      $(this).width(),
                fontSize:   $this.css('fontSize'),
                fontFamily: $this.css('fontFamily'),
                lineHeight: $this.css('lineHeight'),
                resize:     'none'
            }).appendTo(shadow_holder);
            
            var update = function() {
                
                var val = this.value.replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/&/g, '&amp;')
                                    .replace(/\n/g, '<br>') + '&nbsp;';
                
                shadow.html(val);
                $(this).css('height', Math.max(Math.min(screen.height / 2, shadow.height() + 20), minHeight));
            }
            
            $(this).change(update).keyup(update).keydown(update).mouseup(update);
            
            update.apply(this);
            
        });
        
        return this;
        
    }
    
})(jQuery);
