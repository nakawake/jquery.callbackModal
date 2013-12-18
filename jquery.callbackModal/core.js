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
            endMessage:     'Process finished.',
            errorMessages:  ['Error happend.'],
            // Callbacks
            onAfterFadeIn:  function(){},
            onAfterFadeOut: function(){},
            onProcesses:    [function(){}],
            onHoge:         function(){}
        };

        var cm = this,
            el = element;
        // Settings
        cm.s = {};

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

            $(el).click(function(e){
                e.preventDefault();
                rewind();
                showOverlay();
                showContent();
            });
        };

        /**
         * private
         * Show Layer
         */
        var showOverlay = function(){
            // Create a overlay
            cm.overlay = $('<div class="cm_overlay" />');
            $('body').append(cm.overlay);
            // Show it
            cm.overlay.fadeIn(cm.s['speed']);
            // Bind close event
            cm.overlay.click(function(e){close();});
        };

        /**
         * private
         * Show Content as a modal.
         */
        var showContent = function(){
            // Create a wrapper and modal
            cm.wrapper = $('<div class="cm_wrapper" />');
            $(cm.s['modal']).children().clone().appendTo(cm.wrapper);
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
                    $.when(cm.s.onProcesses[key]()).done(function(data){
                        if(data === true
                           || data == 'success'
                           || data == 'ok'
                           || typeof data.success != 'undefined'
                           || typeof data.ok != 'undefined'
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
                // Do function after fadeout
                cm.s.onAfterFadeOut();
                // Remove themselves
                cm.overlay.remove();
                cm.wrapper.remove();
                cm.overlay = cm.wrapper = null;
            });
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
            return ($(window).height() - cm.wrapper.height()) * 0.5;
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
