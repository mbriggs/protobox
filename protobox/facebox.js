/*
 * protobox, modal popups using prototype
 * ported from the facebox jquery plugin - http://famspam.com/protobox/
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]
 *
 * TODO: write new documentation
 * Usage:
 *
 *  jQuery(document).ready(function() {
 *    jQuery('a[rel*=protobox]').protobox()
 *  })
 *
 *  <a href="#terms" rel="protobox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="protobox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="protobox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *
 *  You can also use it programmatically:
 *
 *    jQuery.protobox('some html')
 *    jQuery.protobox('some html', 'my-groovy-style')
 *
 *  The above will open a protobox with "some html" as the content.
 *
 *    jQuery.protobox(function($) {
 *      $.get('blah.html', function(data) { $.protobox(data) })
 *    })
 *
 *  The above will show a loading screen before the passed function is called,
 *  allowing for a better ajaxy experience.
 *
 *  The protobox function can also display an ajax page, an image, or the contents of a div:
 *
 *    jQuery.protobox({ ajax: 'remote.html' })
 *    jQuery.protobox({ ajax: 'remote.html' }, 'my-groovy-style')
 *    jQuery.protobox({ image: 'stairs.jpg' })
 *    jQuery.protobox({ image: 'stairs.jpg' }, 'my-groovy-style')
 *    jQuery.protobox({ div: '#box' })
 *    jQuery.protobox({ div: '#box' }, 'my-groovy-style')
 *
 *  Want to close the protobox?  Trigger the 'close.protobox' document event:
 *
 *    jQuery(document).trigger('close.protobox')
 *
 *  protobox also has a bunch of other hooks:
 *
 *    loading.protobox
 *    beforeReveal.protobox
 *    reveal.protobox (aliased as 'afterReveal.protobox')
 *    init.protobox
 *    afterClose.protobox
 *
 *  Simply bind a function to any of these hooks:
 *
 *   $(document).bind('reveal.protobox', function() { ...stuff to do after the protobox and contents are revealed... })
 *
 */


var Protobox = null;

(function() {

    // DEFAULTS
    
    var defaults = {
        opacity      : 0,
        overlay      : true,
        loadingImage : '/images/protobox/loading.gif',
        closeImage   : '/images/protobox/closelabel.gif',
        imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ],
        protoboxHtml  : '\
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
                <div class="protobox-content"> \
                </div> \
                <div class="footer"> \
                  <a href="#" class="close"> \
                    <img src="/protobox/closelabel.gif" title="close" class="close_image" /> \
                  </a> \
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

    // Adapted from getPageSize() by quirksmode.com
    function getPageHeight() {
        var windowHeight;
        if (window.innerHeight) {  // all except Explorer
            windowHeight = window.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {  // Explorer 6 Strict Mode
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) { // other Explorers
            windowHeight = document.body.clientHeight;
        }
        return windowHeight;
    }

    // Figures out what you want to display and displays it
    // formats are:
    //     div: #id
    //   image: blah.extension
    //    ajax: anything else
    function fillprotoboxFromHref(s, href, klass) {

        // div
        if (href.match(/#/)) {
            var url    = window.location.href.split('#')[0];
            var target = href.replace(url,'');
            if (target == '#') return;
            Protobox.reveal($(target).html(), klass);

        // image
        } else if (href.match(s.imageTypesRegexp)) {
            fillprotoboxFromImage(href, klass);

        // ajax
        } else {
            fillprotoboxFromAjax(href, klass);
        }
    }

    function fillprotoboxFromImage(href, klass) {
        var image = new Image();
        image.onload = function() {
            Protobox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass);
        }
        image.src = href;
    }

    function fillprotoboxFromAjax(href, klass) {
        new Ajax.Request(href, {
            method: 'GET',
            onSuccess: function(transport) {
                Protobox.reveal(transport.responseText, klass);
            }
        });
    }

    function skipOverlay(s) {
        return s.overlay == false || s.opacity === null
    }

    function showOverlay(s) {
        if (skipOverlay(s)) return

        if ($('protobox_overlay').childElements.size == 0)
            $(document.body).insert('<div id="protobox_overlay" class="protobox_hide"></div>');

        $('protobox_overlay').hide()
            .addClassName("protobox_overlayBG")
            .setStyle({ 'opacity': s.opacity })
            .observe('click', function() { 
                    $(document).fire('protobox:close'); 
            })
            .fadeIn(200);

        return false;
    }

    function hideOverlay(s) {
        if (skipOverlay(s)) return;

        $('protobox_overlay').fade(0.02);

        $("protobox_overlay").removeClassName("protobox_overlayBG");
        $("protobox_overlay").addClassName("protobox_hide");
        $("protobox_overlay").remove();

        return false;
    }



    // CLASS DEFINITION

    Protobox = Class.create({
        settings: {},

        initialize: function(s) {
            this.settings = s;

            if (this.settings.inited) return true;
            else this.settings.inited = true;

            Object.extend(defaults, this.settings);
            
            $(document).fire('protobox:init')

            var imageTypes = this.settings.imageTypes.join('|');
            this.settings.imageTypesRegexp = new RegExp('\.(' + imageTypes + ')$', 'i');
        
            $(document.body).insert(this.settings.protoboxHtml);
        
            var preload = [ new Image(), new Image() ];
            preload[0].src = this.settings.closeImage;
            preload[1].src = this.settings.loadingImage;
                
            // preloading all the background-images
            $$('#protobox .b:first, #protobox .bl').each(function(elm) {
                preload.push(new Image());
                preload.last.src = elm.getStyle('background-image').replace(/url\((.+)\)/, '$1');
            });

            $$('#protobox .close').invoke('observe', 'click', Protobox.close);
            $$('#protobox .close_image').invoke('writeAttribute', 'src', this.settings.closeImage);
        }



        loading: function() {
            init();
            if ($('protobox-loading')) return true;
            showOverlay();

            $('protobox-content').childElements.invoke('remove');
            $('protobox-body').childElements().invoke('hide');
            $('protobox-body').insert('<div class="loading"><img src="' + this.settings.loadingImage + '"/></div>');

            $('protobox').setStyle({
                top:	getPageScroll()[1] + (getPageHeight() / 10),
                left:	$(window).width() / 2 - 205
            }).show();

            $(document).observe('keypress', function(evt) {
                if (evt.keyCode == Event.KEY_ESC) Protobox.close();
                return true;
            });
            $(document).fire('protobox:loading');
        }
    }); // end of class def

    // STATIC METHODS

    Protobox.reveal = function(data, klass) {
        $(document).fire('protobox.beforeReveal');
        if (klass) $$('#protobox .content').invoke('addClassName', klass);
        $('protobox-content').insert(data);
        $$('#protobox .loading').invoke('remove');
        $('protobox-body').children().fadeIn('normal');
        $('#protobox').css('left', $(window).width() / 2 - ($('#protobox table').width() / 2))
        $(document).trigger('reveal.protobox').trigger('afterReveal.protobox')
    }

    Protobox.close = function() {
        $(document).fire('protobox:close')
        
        $(document).stopObserving('keypress')

        $('protobox').fade();

        $('protobox-content').writeAttribute('class', 'content');
        hideOverlay();
        //TODO: this needs to be changed to an ID
        $$('protobox-loading').invoke('remove');

        $(document).fire('protobox:afterClose');
        return false;
    }
})(); // end of scope

  /*
   * Public, $.fn methods
   */

  //$.fn.protobox = function(settings) {
    //if ($(this).length == 0) return

    //init(settings)

    //function clickHandler() {
      //$.protobox.loading(true)

      //// support for rel="protobox.inline_popup" syntax, to add a class
      //// also supports deprecated "protobox[.inline_popup]" syntax
      //var klass = this.rel.match(/protobox\[?\.(\w+)\]?/)
      //if (klass) klass = klass[1]

      //fillprotoboxFromHref(this.href, klass)
      //return false
    //}

    //return this.bind('click.protobox', clickHandler)
  //}

