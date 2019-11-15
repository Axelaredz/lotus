(function($) {
	
	"use strict";


    

   $('#ytvideo').YTPlayer({
        fitToBackground: true,
        videoId: 'rN6nlNC9WQA',
        playerVars: {
            modestbranding: 0,
            autoplay: 1,
            controls: 0,
            showinfo: 0,
            wmode: 'transparent',
            branding: 0,
            rel: 0,
            mute: true,
            autohide: 0,
            origin: window.location.origin
        }
    });

    
    

	
})(jQuery);