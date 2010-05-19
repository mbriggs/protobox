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
        settings: {
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
              <td class="body"> \
                <div class="content"> \
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
    function fillprotoboxFromHref(href, klass) {

        // div
        if (href.match(/#/)) {
            var url    = window.location.href.split('#')[0];
            var target = href.replace(url,'');
            if (target == '#') return;
            $.protobox.reveal($(target).html(), klass);

        // image
        } else if (href.match($.protobox.settings.imageTypesRegexp)) {
            fillprotoboxFromImage(href, klass);

        // ajax
        } else {
            fillprotoboxFromAjax(href, klass);
        }
    }

    function fillprotoboxFromImage(href, klass) {
        var image = new Image();
        image.onload = function() {
            //todo: add static reveal method
            Protobox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass);
        }
        image.src = href;
    }

    //NOTE: GOT TO HERE <----------------------------------------------------------------------------------------------------
    function fillprotoboxFromAjax(href, klass) {
        $.get(href, function(data) { Protobox.reveal(data, klass) });
    }

    function skipOverlay() {
        return $.protobox.settings.overlay == false || $.protobox.settings.opacity === null
    }

    function showOverlay() {
        if (skipOverlay()) return

        if ($('#protobox_overlay').length == 0)
        $("body").append('<div id="protobox_overlay" class="protobox_hide"></div>')

        $('#protobox_overlay').hide().addClass("protobox_overlayBG")
        .css('opacity', $.protobox.settings.opacity)
        .click(function() { $(document).trigger('close.protobox') })
        .fadeIn(200)
        return false
    }

    function hideOverlay() {
        if (skipOverlay()) return
    
        $('#protobox_overlay').fadeOut(200, function(){
            $("#protobox_overlay").removeClass("protobox_overlayBG")
            $("#protobox_overlay").addClass("protobox_hide")
            $("#protobox_overlay").remove()
        });

        return false;
    }

    // BINDINGS

    $(document).bind('close.protobox', function() {
        $(document).unbind('keydown.protobox')
        $('#protobox').fadeOut(function() {
            $('#protobox .content').removeClass().addClass('content')
            hideOverlay()
            $('#protobox .loading').remove()
            $(document).trigger('afterClose.protobox')
        })
    })

    // CLASS DEFINITION

    Protobox = Class.create({
        settings: {},

        initialize: function() {

            if ($.protobox.settings.inited) return true
            else $.protobox.settings.inited = true

            $(document).trigger('init.protobox')

            var imageTypes = $.protobox.settings.imageTypes.join('|')
            $.protobox.settings.imageTypesRegexp = new RegExp('\.(' + imageTypes + ')$', 'i')
        
            if (settings) $.extend($.protobox.settings, settings)
            $('body').append($.protobox.settings.protoboxHtml)
        
            var preload = [ new Image(), new Image() ]
            preload[0].src = $.protobox.settings.closeImage
            preload[1].src = $.protobox.settings.loadingImage
                
            $('#protobox').find('.b:first, .bl').each(function() {
            preload.push(new Image())
            preload.slice(-1).src = $(this).css('background-image').replace(/url\((.+)\)/, '$1')
            })

            $('#protobox .close').click($.protobox.close)
            $('#protobox .close_image').attr('src', $.protobox.settings.closeImage)
        }

        loading: function() {
            init()
            if ($('#protobox .loading').length == 1) return true
                showOverlay()
    
            $('#protobox .content').empty()
            $('#protobox .body').children().hide().end().
                append('<div class="loading"><img src="'+$.protobox.settings.loadingImage+'"/></div>')

            $('#protobox').css({
                top:	getPageScroll()[1] + (getPageHeight() / 10),
                left:	$(window).width() / 2 - 205
            }).show()

            $(document).bind('keydown.protobox', function(e) {
                if (e.keyCode == 27) $.protobox.close()
                return true
            })
            $(document).trigger('loading.protobox')
        },

        reveal: function(data, klass) {
            $(document).trigger('beforeReveal.protobox')
            if (klass) $('#protobox .content').addClass(klass)
            $('#protobox .content').append(data)
            $('#protobox .loading').remove()
            $('#protobox .body').children().fadeIn('normal')
            $('#protobox').css('left', $(window).width() / 2 - ($('#protobox table').width() / 2))
            $(document).trigger('reveal.protobox').trigger('afterReveal.protobox')
        },

        close: function() {
            $(document).trigger('close.protobox')
            return false
        }
    }); // end of class def
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

