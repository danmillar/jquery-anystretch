/*
 * jQuery Anystretch
 * Version 1.1
 * https://github.com/danmillar/jquery-anystretch
 *
 * Add a dynamically-resized background image to the body
 * of a page or any other block level element within it
 *
 * Copyright (c) 2012 Dan Millar (@danmillar / decode.uk.com)
 * Dual licensed under the MIT and GPL licenses.
 *
 * This is a fork of jQuery Backstretch (v1.2)
 * Copyright (c) 2011 Scott Robbin (srobbin.com)
*/

;(function($) {
    
    $.fn.anystretch = function(src, options, callback) {
        var isBody = this.selector.length ? false : true; // Decide whether anystretch is being called on an element or not

        return this.each(function(i){
            var defaultSettings = {
                positionX: 'center',     // Should we center the image on the X axis?
                positionY: 'center',     // Should we center the image on the Y axis?
                speed: 0,                // fadeIn speed for background after image loads (e.g. "fast" or 500)
                elPosition: 'relative'  // position of containing element when not being added to the body
            },
            el = $(this),
            container = isBody ? $('.anystretch') : el.children(".anystretch"),
            settings = container.data("settings") || defaultSettings, // If this has been called once before, use the old settings as the default
            existingSettings = container.data('settings'),
            imgRatio, bgImg, bgWidth, bgHeight, bgOffset, bgCSS;

            // Extend the settings with those the user has provided
            if(options && typeof options == "object") $.extend(settings, options);
            
            // Just in case the user passed in a function without options
            if(options && typeof options == "function") callback = options;
        
            // Initialize
            $(document).ready(_init);
      
            // For chaining
            return this;
        
            function _init() {
                // Prepend image, wrapped in a DIV, with some positioning and zIndex voodoo
                if(src) {
                    var img;
                    
                    if(!isBody) {
                        // If not being added to the body set position to elPosition (default: relative) to keep anystretch contained
                        el.css({position: settings.elPosition, background: "none"});
                    }
                    
                    // If this is the first time that anystretch is being called
                    if(container.length == 0) {
                        container = $("<div />").attr("class", "anystretch")
                                                .css({left: 0, top: 0, position: (isBody ? "fixed" : "absolute"), overflow: "hidden", zIndex: (isBody ? -999999 : -999998), margin: 0, padding: 0, height: "100%", width: "100%"});
                    } else {
                        // Prepare to delete any old images
                        container.find("img").addClass("deleteable");
                    }
    
                    img = $("<img />").css({position: "absolute", display: "none", margin: 0, padding: 0, border: "none", zIndex: -999999})
                                      .bind("load", function(e) {                                          
                                          var self = $(this),
                                              imgWidth, imgHeight;
        
                                          self.css({width: "auto", height: "auto"});
                                          imgWidth = this.width || $(e.target).width();
                                          imgHeight = this.height || $(e.target).height();
                                          imgRatio = imgWidth / imgHeight;
                                          settings.imgWidth=imgWidth;
                                          settings.imgHeight=imgHeight;
                                          _adjustBG(function() {
                                              self.fadeIn(settings.speed, function(){
                                                  // Remove the old images, if necessary.
                                                  container.find('.deleteable').remove();
                                                  // Callback
                                                  if(typeof callback == "function") callback();
                                              });
                                          });
                                          
                                      })
                                      .appendTo(container);
                     
                    // Append the container to the body, if it's not already there
                    if(el.children(".anystretch").length == 0) {
                        if(isBody) {
                            $('body').append(container);
                        } else {
                            el.append(container);
                        }
                    }
                    
                    // Attach the settings
                    container.data("settings", settings);
                        
                    img.attr("src", src); // Hack for IE img onload event
                    
                    // Adjust the background size when the window is resized or orientation has changed (iOS)
                    $(window).resize(_adjustBG);
                }
            }
            function calculateDimensionsAndOffset(offset,availW,availH,imgW,imgH){
                var ratioW=availW/imgW;
                var ratioH=availH/imgH;
                //take the ratio of the bigger axis in the current view
                //with this we won`t need any conditional to ask for the viewport ratio
                var ratio=Math.max(ratioW,ratioH);

                /*we calculate how many pixels are left on axis and calculate the scale factor to expand these pixel to the full half width of the screen
                this will ensure that there will be no area without image pixel. But be careful, if the offset is to big (in relation to the original
                image, e.g. 1200px width and offset will be 1000px tp the left, 200px need to be spreaded to half of the screen)
                the resultign scale factor on a screen with 2000px would be 1200*0.5/(1200*0.5-550)=500/50=10
                so the image would ne scaled by factor 10! This is exponential to the border. But anyway if you would ever need
                such a big offset: give it back to the designer to recompose in photoshop ;) */
                var spaceLeftRatioX=imgW*0.5/(imgW/2-Math.abs(offset.x));
                var spaceLeftRatioY=imgH*0.5/(imgH/2-Math.abs(offset.y));

                //we will scale up the whole image to ensure that there will be no white space
                var scaleImageFactor=Math.max(spaceLeftRatioX,spaceLeftRatioY)-1;
                
                var newWidth=imgW*ratio*(1+scaleImageFactor);
                var newHeight=imgH*ratio*(1+scaleImageFactor);
                //shiftX=shiftY=0 would be the center, we add our offsets, mapped to the current image scaling,
                //an offset would be 200 instead of 100 if the image is scaled up with factor 2
                var shiftX=(offset.x*ratio)/(availW-newWidth)*(1+scaleImageFactor);
                var shiftY=-(offset.y*ratio)/(availH-newHeight)*(1+scaleImageFactor);
                var newOffsetX=((availW-newWidth))*(0.5+shiftX);
                var newOffsetY=((availH-newHeight))*(0.5+shiftY);

                return {
                    width:newWidth,
                    height:newHeight,
                    offsetX:newOffsetX,
                    offsetY:newOffsetY
                }
            }
            function _adjustBG(fn) {
                try {
                    var offset={x:settings.offsetX,y:settings.offsetY,absolute:false};
                    var measuredLayout=calculateDimensionsAndOffset(offset,_width(),_height(),settings.imgWidth,settings.imgHeight);
                    console.log(measuredLayout);

                    bgCSS = {left: measuredLayout.offsetX, top: measuredLayout.offsetY};
                    bgWidth = measuredLayout.width //we need more space to accomplish the shifting
                    bgHeight = measuredLayout.height;

                  
                    container.children("img:not(.deleteable)").width( bgWidth ).height( bgHeight )
                                                       .filter("img").css(bgCSS);
                } catch(err) {
                    // IE7 seems to trigger _adjustBG before the image is loaded.
                    // This try/catch block is a hack to let it fail gracefully.
                }
          
                // Executed the passed in function, if necessary
                if (typeof fn == "function") fn();
            }
            
            function _width() {
                return isBody ? el.width() : el.innerWidth();
            }
            
            function _height() {
                return isBody ? el.height() : el.innerHeight();
            }
            
        });
    };
    
    $.anystretch = function(src, options, callback) {
        var el = ("onorientationchange" in window) ? $(document) : $(window); // hack to acccount for iOS position:fixed shortcomings
        
        el.anystretch(src, options, callback);
    };
  
})(jQuery);