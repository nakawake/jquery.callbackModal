/**
 * 各所で使用するモーダルのjQueryライブラリ callbackModal(仮)
 * 名前の通りcallbackに特化したモーダルウィンドウになる予定
 *
 * 記述ルール：
 * オプションの値が function の場合は、cm.s.hoge (ドット渡し)、
 * それ以外の場合は、cm.s['hoge'] (配列渡し)にしています
 *
 * @Since 2013-12-10
 * @Author Kei Maeda
 */
;(function($){
    $.callbackModal = function(element, options){
        var defaults = {
            // Options
            modal:          '#modal', // Required
            yesButton:      '.yes',   // Required
            noButton:       '.no',    // Required
            speed:          'normal',
            needEndStep:    true,
            width:          0,
            clone:          true,
            endMessage:     'Process finished.',
            errorMessages:  ['Error happend.'],
            // Callbacks
            onBeforeFadeIn: function(element){ return true;},
            onAfterFadeIn:  function(){},
            onAfterFadeOut: function(result){ return result;},
            onProcesses:    [function(){}],
            onHoge:         function(){}
        };

        var cm = this,
            el = element;
        // Settings
        cm.s = {};
        cm.el;
        cm.isScrollLocked = false;
        cm.scrollPositioin = {top:0, left:0};

        /**
         * private
         * Initialize
         */
        var init = function(){
            // Settings
            cm.s = $.extend(defaults, options);

            // Count steps
            cm.steps = $(cm.s['modal']).children().length;
            if(!isType('Array', cm.s.onProcesses)){
                cm.s.onProcesses = [cm.s.onProcesses];
            }
            if(!isType('Array', cm.s.errorMessages)){
                cm.s.errorMessages = [cm.s.errorMessages];
            }
            // Step counter
            cm.stepCounter = 0;
            // Result of All processes
            cm.result = false;

            var handler = function(e){
                e.preventDefault();
                var _this = this; // This is element you clicked.
                cm.el = _this; // Set current element to cm.el.

                rewind();
                $.when(cm.s.onBeforeFadeIn(_this)).done(function(data){
                    if(data === true
                       || data == 'success'
                       || data == 'ok'
                       || data.hasOwnProperty('success')
                       || data.hasOwnProperty('ok')
                       || data.hasOwnProperty('result')
                      ){
                        showOverlay();
                        showContent();
                    }else{
                        //console.log(data);
                    }
                });
            }

            var dom = $(el).parents().map(function(){
                if(this.className){
                    var pattern = /\s/g;
                    var className = '.' + this.className.replace(pattern, '.');
                }else{
                    var className = '';
                }
                return this.tagName + className;
            }).get().reverse().join(' ') + ' ' + el.get(0).tagName;

            //$(document).off('click', dom, handler); // To avoid to bind multiple event.I don't know why the handler isn't applied
            $(document).off('click', dom);
            $(document).on('click', dom, handler);

        };

        /**
         * private
         * Show Layer
         */
        var showOverlay = function(){
            if($('.cm_overlay').length > 0) return false;
            // Create a overlay
            cm.overlay = $('<div class="cm_overlay" />');
            $('body').append(cm.overlay);
            // Show it
            cm.overlay.fadeIn(cm.s['speed']);
            // Bind close event
            cm.overlay.click(function(e){close();});

            // Lock Scrolling
            lockScroll();
        };

        /**
         * private
         * Show Content as a modal.
         */
        var showContent = function(){
            if($('.cm_wrapper').length > 0) return false;

            // Create a wrapper and modal
            cm.wrapper = $('<div class="cm_wrapper" />');
            if(cm.s['width'] > 0){
                cm.wrapper.css('width', cm.s['width']);
            }
            if(cm.s['clone']){
                $(cm.s['modal']).children().clone(true).appendTo(cm.wrapper);
            }else{
                $(cm.s['modal']).children().appendTo(cm.wrapper);
            }
            $('body').append(cm.wrapper);
            // Hide them without first step
            cm.wrapper.children().not(':first-child').hide();
            // Show it
            cm.wrapper.fadeIn(cm.s['speed'], cm.s.onAfterFadeIn);
            // Put it in the center
            cm.wrapper.css('top', calcCenter());
            // Bind close function to no buttons
            cm.wrapper.find(cm.s['noButton']).click(function(e){close();});
            // Bind process function to yes buttons
            $.each(cm.wrapper.children(), function(key, val){
                $(this).find(cm.s['yesButton']).click(function(e){
                    $.when(cm.s.onProcesses[key](cm.el)).done(function(data){
                        if(data == null || typeof data == 'undefined'){
                            return;
                        }

                        if(data === true
                           || data == 'success'
                           || data == 'ok'
                           || data.hasOwnProperty('success')
                           || data.hasOwnProperty('ok')
                           || data.hasOwnProperty('result')
                        ){
                            res = true;
                        }else{
                            res = false;
                        }

                        // If true, go next or finish
                        if(res){
                            // If last step, go end
                            if(key == cm.steps - 1){
                                if(cm.s['needEndStep']){
                                    showEnd(cm.s['endMessage']);
                                }else{
                                    cm.result = true;
                                    close();
                                }
                            }
                            // If it's not last step, go next
                            else{
                                showNext();
                            }
                        }
                        // If false, show error messages
                        else{
                            showError(cm.s['errorMessages'][key]);
                        }
                    });
                });
            });
        };

        /**
         * private
         * Close the modal
         */
        var close = function(){
            cm.overlay.fadeOut(cm.s['speed']);
            cm.wrapper.fadeOut(cm.s['speed'], function(){
                if(!cm.s['clone']){
                    cm.wrapper.children().appendTo(cm.s['modal']);
                }
                // Do function after fadeout
                cm.s.onAfterFadeOut(cm.result);
                // Remove themselves
                cm.overlay.remove();
                cm.wrapper.remove();
                cm.overlay = cm.wrapper = null;

                UnlockScroll();
            });
        };
        /**
         * Lock scroll
         */
        var lockScroll = function(){
            cm.scrollPosition = {
                top: $(window).scrollTop(),
                left: $(window).scrollLeft()
            }
            cm.isScrollLocked = true;
            $('body').css('overflow', 'hidden');
            $(window).scroll(lockScrollHandler);
        };
        /**
         * Lock scroll handler
         */
        var lockScrollHandler = function(){
            $(this).scrollTop(cm.scrollPosition.top).scrollLeft(cm.scrollPosition.left);
        }
        /**
         * Unlock scroll
         */
        var UnlockScroll = function(){
            cm.isScrollLocked = false;
            $('body').css('overflow', 'auto');
            $(window).unbind('scroll', lockScrollHandler);
        };

        /**
         * Show Next
         */
        var showNext = function(){
            cm.wrapper.children().eq(cm.stepCounter).fadeOut(cm.speed, function(){
                cm.stepCounter++;
                cm.wrapper.children().eq(cm.stepCounter).fadeIn(cm.speed);
            });
        };

        /**
         * Show End
         */
        var showEnd = function(endMessage){
            cm.wrapper.children().eq(cm.stepCounter).fadeOut(cm.speed, function(){
                cm.wrapper.children().remove();
                var endMessageEle = $('<div class="endMessage" />')
                endMessageEle.append($('<div class="Message" />').html(endMessage));
                endMessageEle.append($('<button>Close</button>').addClass(cm.s['noButton'].replace(/[\.,]/, ' ')).click(function(){close();}));
                cm.wrapper.append(endMessageEle.hide());
                endMessageEle.fadeIn(cm.speed);
            });
        };

        /**
         * Show Error
         */
        var showError = function(errorMessage){
            showEnd(errorMessage);
        };

        /**
         * Open modal again
         */
        var rewind = function(){
            cm.stepCounter = 0;
        }

        var calcCenter = function(){
            return ($(window).height() - cm.wrapper.innerHeight()) * 0.5;
        }

        /**
         * private
         * Check type strictly
         * "String", "Number", "Boolean", "Date", "Error", "Array", "Function", "RegExp", "Object"
         */
        var isType = function (type, obj) {
            var clas = Object.prototype.toString.call(obj).slice(8, -1);
            return obj !== undefined && obj !== null && clas === type;
        };

        init();

        return this;
    };

    $.fn.callbackModal = function(options){
        // Return this
        if(this.length == 0) return this;

        // If mutltiple elements are
        if(this.length > 1){
            this.each(function(){$(this).callbackModal(options)});
            return this;
        }

        var plugin = new $.callbackModal(this, options);

        // Public functions
        this.getOption = function(){
            return plugin.s;
        };

        // Return this for Method Chain
        return this;
    }

})(jQuery);
