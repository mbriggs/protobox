/************************************************************************
 * protobox, modal popups using prototype                               *
 * ported from the facebox jquery plugin - http://famspam.com/protobox/ *
 *                                                                      *
 * Licensed under the MIT:                                              *
 *   http://www.opensource.org/licenses/mit-license.php                 *
 *                                                                      *
 * Copyright 2010 Matt Briggs [ matt@mattbriggs.net ]                   *
 *                                                                      *
 * origional facebox code                                               *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]              *
 *                                                                      *
 ************************************************************************
 *
 *
 *
 * Object Oriented Usage:
 * ======================
 *
 *  $(document).observe('dom:loaded', function() {
 *      var proto = new Protobox('.protobox');
 *  })
 *
 *  <a href="#terms" class="protobox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" class="protobox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" class="protobox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *  You can also use .watch(selector) or .stopWatching(selector)
 *
 *  full constructor signature is : 
 *      new Protobox(selector, settings, customClassToApplyToContent);
 *
 *  default settings are *
 *      opacity      : 0,
 *      overlay      : true,
 *      loadingImage : 'images/protobox/loading.gif',
 *      closeImage   : 'images/protobox/closelabel.gif',
 *      imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ],
 *
 *  all constructor arguments are optional
 *
 *
 *  You can also use it programmatically:
 *  =====================================
 *
 *    Protobox.box('some html')
 *    Protobox.box('some html', 'my-groovy-style')
 *
 *  The above open a protobox with "some html" as the content.
 *
 *    Protobox.box(function() {
 *      Ajax.Request('blah.html', { 
 *          method: 'get',
 *          onSuccess: function(transport) { 
 *              $.protobox(transport.requestText); 
 *          }
 *      });
 *    })
 *
 *  The above will show a loading screen before the passed function is called,
 *  allowing for a better ajaxy experience.
 *
 *  The box function can also display an ajax page, an image, or the contents of a div:
 *
 *    Protobox.box({ ajax: 'remote.html' })
 *    Protobox.box({ ajax: 'remote.html' }, 'my-groovy-style')
 *    Protobox.box({ image: 'stairs.jpg' })
 *    Protobox.box({ image: 'stairs.jpg' }, 'my-groovy-style')
 *    Protobox.box({ div: '#box' })
 *    Protobox.box({ div: '#box' }, 'my-groovy-style')
 *
 *  Want to close the protobox? Fire the 'protobox:close' document event:
 *
 *    $(document).fire('protobox:close')
 *
 *  protobox also has a bunch of other hooks:
 *
 *    protobox:loading
 *    protobox:beforeReveal
 *    protobox:reveal (aliased as 'protobox:afterReveal')
 *    protobox:init
 *    protobox:afterClose
 *
 *  Simply observe any of these hooks:
 *
 *   $(document).observe('protobox:reveal', function() { ...stuff to do after the protobox and contents are revealed... })
 *
 */


var Protobox = null;
(function() {

    // DEFAULTS
    var defaults = {
        overlay        : true,
        opacity        : 0.30, // this also needs to change in the css
        loadingImage   : 'images/protobox/loading.gif',
        closeImage     : 'images/protobox/closelabel.gif',
        animationSpeed : 0.3, 
        imageTypes     : [ 'png', 'jpg', 'jpeg', 'gif' ],
        protoboxHtml   : '\
    <div id="protobox" style="display:none;"> \
      <div class="popup"> \
        <table> \
          <tbody id="protobox-tbody"> \
            <tr> \
              <td class="tl"/><td class="b"/><td class="tr"/> \
            </tr> \
            <tr> \
              <td class="b"/> \
              <td id="protobox-body"> \
                <a href="#" class="close"> \
                  <img src="images/protobox/closelabel.gif" title="close" id="protobox-close-image" /> \
                </a> \
                <div id="protobox-content"> \
                </div> \
              </td> \
              <td class="b"/> \
            </tr> \
            <tr> \
              <td class="bl"/><td class="b"/><td class="br"/> \
            </tr> \
          </tbody> \
        </table> \
      </div> \
    </div>'
    };


    // CLASS DEFINITION

    Protobox = Class.create({
        settings: {},

        initialize: function() {
            klass = null;
            // the way this works is the actual work is done by the 1 case
            // everything else sets some variables, then falls through to that
            switch (arguments.length) {
                case 3:
                    // selector, settings, klass
                    this.settings = arguments[1];
                    klass = arguments[2];

                case 2:
                    arg1 = arguments[0];
                    arg2 = arguments[1];

                    // selector, settings
                    if (typeof(arg1) === 'string' &&
                        typeof(arg2) === 'object' &&
                        arg2 != null) {
                        
                        this.settings = arg2;
                    }
                    
                    // settings, klass
                    // in this case we DO NOT want to fall through
                    if (typeof(arg1) === 'object' &&
                        arg1 != null &&
                        typeof(arg2) === 'string') {

                        klass = arg2;
                        this.settings = arg1;
                        break;
                    }

                    // selector, klass
                    if (typeof(arg1) === 'string' &&
                        typeof(arg2) === 'string') {

                        klass = arg2;
                    }

                case 1:
                    // selector
                    this.watch(arguments[0], klass); 
                    break;
            }

            this.settings = init(this.settings);

        },

        watch: function(selector, klass) {
            $$(selector).each(function(elm) {
                elm.observe('click', function() {
                    fillProtoboxFromHref(this.settings, this.href, klass);
                });
            });
        },

        stopWatching: function(selector) {
            $$(selector).invoke('stopObserving', 'click');
        }

    }); // end of class def

    // STATIC METHODS

    Protobox.box = function(data, klass) {
        settings = {};
        loading(settings);

        if (data.ajax) fillProtoboxFromAjax(data.ajax, klass)
        else if (data.image) fillProtoboxFromImage(data.image, klass)
        else if (data.div) fillProtoboxFromHref(settings, data.div, klass)
        else if (Object.isFunction(data)) data.call($)
        else Protobox.reveal(data, klass)
    }

    Protobox.reveal = function(data, klass) {
        $(document).fire('protobox.beforeReveal');

        if (klass) $('protobox-content').addClassName(klass);
        $('protobox-content').update(data);

        if ($('protobox-loading')) $('protobox-loading').remove();
        
        $('protobox-body').childElements().invoke('appear', { duration: defaults.animationSpeed });

        $(document).fire('protobox:reveal');
        $(document).fire('protobox:afterReveal');
    }

    Protobox.close = function(settings) {
        if (!settings) settings = {}
        if (!settings.inited) settings = init(settings);
        $(document).fire('protobox:close')
        
        $(document).stopObserving('keypress');
        $('protobox-overlay').stopObserving('click');

        $('protobox').fade({ duration: settings.animationSpeed, from: settings.opacity, 
            afterFinish: function() {
                $('protobox-content').writeAttribute('class', 'content');
            } 
        });

        hideOverlay(settings);
        if ($('protobox-loading')) $('protobox-loading').remove();

        $(document).fire('protobox:afterClose');
        return false;
    }

    // PRIVATE METHODS

    // getPageScroll() by quirksmode.com
    function getPageScroll() {
        var xScroll, yScroll;
        if (window.pageYOffset) {
            yScroll = window.pageYOffset;
            xScroll = window.pageXOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
            yScroll = document.documentElement.scrollTop;
            xScroll = document.documentElement.scrollLeft;
        } else if (document.body) { // all other Explorers
            yScroll = document.body.scrollTop;
            xScroll = document.body.scrollLeft;
        }
        return [xScroll, yScroll];
    }

    var WindowSize = {
        width: function()
        {
            var myWidth = 0;
            if (typeof(window.innerWidth) == 'number')
            {
                //Non-IE
                myWidth = window.innerWidth;
            }
            else if (document.documentElement && document.documentElement.clientWidth)
            {
                //IE 6+ in 'standards compliant mode'
                myWidth = document.documentElement.clientWidth;
            }
            else if (document.body && document.body.clientWidth)
            {
                //IE 4 compatible
                myWidth = document.body.clientWidth;
            }
            return myWidth;
        },
        height: function()
        {
            var myHeight = 0;
            if (typeof(window.innerHeight) == 'number')
            {
                //Non-IE
                myHeight = window.innerHeight;
            }
            else if (document.documentElement && document.documentElement.clientHeight)
            {
                //IE 6+ in 'standards compliant mode'
                myHeight = document.documentElement.clientHeight;
            }
            else if (document.body && document.body.clientHeight)
            {
                //IE 4 compatible
                myHeight = document.body.clientHeight;
            }
            return myHeight;
        }
    };

    // Figures out what you want to display and displays it
    // formats are:
    //     div: #id
    //   image: blah.extension
    //    ajax: anything else
    function fillProtoboxFromHref(s, href, klass) {

        // div
        if (href.match(/#/)) {
            // support for www.full.url.com#anchor
            var url    = window.location.href.split('#')[0];
            var target = href.replace(url,'');
            if (target == '#') return;
            // strip the leading #
            if (target.substr(0, 1) == '#') target = target.substr(1);

            if ($(target))
                Protobox.reveal($(target).innerHTML, klass);

        // image
        } else if (href.match(s.imageTypesRegexp)) {
            fillProtoboxFromImage(href, klass);

        // ajax
        } else {
            fillProtoboxFromAjax(href, klass);
        }
    }

    function fillProtoboxFromImage(href, klass) {
        var image = new Image();
        image.onload = function() {
            Protobox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass);
        }
        image.src = href;
    }

    function fillProtoboxFromAjax(href, klass) {
        new Ajax.Request(href, {
            method: 'GET',
            onSuccess: function(transport) {
                Protobox.reveal(transport.responseText, klass);
            }
        });
    }

    function skipOverlay(s) {
        return s.overlay == false; 
    }

    function showOverlay(s) {
        if (skipOverlay(s)) return

        if ($('protobox-overlay') == null) {
            $(document.body).insert('<div id="protobox-overlay"></div>');
        }
        $('protobox-overlay').hide()
            .addClassName("protobox-overlayBG")
            .observe('click', function() { 
                    $(document).fire('protobox:close'); 
            }).show();

        new Effect.Opacity('protobox-overlay', { duration: s.animationSpeed, 
                                                 from: 0,
                                                 to: s.opacity });
        $('protobox-overlay').observe('click', function() {
            Protobox.close();
        });

        return false;
    }

    function hideOverlay(s) {
        if (skipOverlay(s)) return;

        $('protobox-overlay').fade({ duration: s.animationSpeed, from: s.opacity, afterFinish: function() {
                $("protobox-overlay").remove();
            } 
        });

        return false;
    }

    function init(s) {

        if (s.inited) return true;
        else s.inited = true;

        Object.extend(s, defaults);
            
        $(document).fire('protobox:init')

        var imageTypes = s.imageTypes.join('|');
        s.imageTypesRegexp = new RegExp('\.(' + imageTypes + ')$', 'i');
        
        if ($('protobox') == null) $(document.body).insert(s.protoboxHtml);
        
        var preload = [ new Image(), new Image() ];
        preload[0].src = s.closeImage;
        preload[1].src = s.loadingImage;
                
        // preloading all the background-images
        $$('#protobox .b:first, #protobox .bl').each(function(elm) {
            preload.push(new Image());
            preload.last.src = elm.getStyle('background-image').replace(/url\((.+)\)/, '$1');
        });

        $$('#protobox .close').invoke('observe', 'click', Protobox.close);
        $('protobox-close-image').writeAttribute('src', s.closeImage);

        return s;
    }


    function loading(s) {
        s = init(s);
        if ($('protobox-loading')) return true; 
        showOverlay(s); 
        $('protobox-body').childElements().invoke('hide');
        $('protobox-body').insert('<div id="protobox-loading"><img src="' + s.loadingImage + '"/></div>');

        $('protobox').setStyle({
            top:    (getPageScroll()[1] + (WindowSize.height() / 10)) + 'px',
            left:   (WindowSize.width() / 2 - 205) + 'px'
        }).show();

        $(document).observe('keypress', function(evt) {
            if (evt.keyCode == Event.KEY_ESC) Protobox.close();
            return true;
        });
        $(document).fire('protobox:loading');
    }
})(); // end of scope
