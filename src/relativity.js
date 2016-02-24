var $ = require("jquery");
var _ = require("lodash");
var ParallaxMovement = require('./parallax-movement');

function Relativity (options) {
	
	// Define default parallax options here - These can be over-ridden by the options variable
    // passed in.
    this._defaultOptions = {

        // initialize functionality immediately or wait to initialize later
        autoInit: true,

        // top level container that the module will act on
        $container: 'body',

        // selector used to find all the parallax container in the $container
        parallaxContainerSelector: '.parallax-container',

        // whether we should be supporting mobile 
        mobileSupport: true,

        // whether we should be supporting IE8
        ie8Support: false,

        // whether we should be supporting IE9
        ie9Support: true,

        containers: []
    }

	// Initialize all the variables
    this.initVariables(options);

    // If autoInit is set to true we should go ahead and start the engines.
    if(this.options.autoInit) {
        this.init();
    }
}

Relativity.prototype = {
	/**
    *   Initialize variables including overriding default options with
    *   those that are passed in.
    *
    *   @method initVariables
    *   @return {undefined}
    */
    initVariables: function(options) {
        // Override default options with those passed in
        this.options = _.assign(this._defaultOptions, options);
        this.containers = this.options.containers;

        // Dom Elements
        this.$container = $(this.options.$container);
        this.updateVariables();
    },

    /**
    *   Initializes the module.  This can be called automatically or at a later time.
    *
    *   @method init
    *   @return {undefined}
    */
    init: function () {
        // mobile browsers require some special scrolling magic.  Instead of writing this
        // I'm just going to piggy back on some already super code...  We'll just use Skrollr.
        if(this.isSupported()) {
            this.parallaxMovement = new ParallaxMovement({
                parallax: this,
                positionProperty: this.options.positionProperty,
                supports3D: this.options.supports3D
            });

            $('html').addClass('parallax');

            this.initEvents();
            this.onUpdateParallax();
            this.isInit = true; 
        }
    },

    /**
    *   Checks to see whether parallax is supported or not
    *
    *   @method isSupported
    *   @return {undefined}
    */
    isSupported: function () {
        var isSupported = true;

        // Check for mobile.  We'll only support Apple products with IOS versions of 8 and above
        
        var isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOSlg: function() {
                return navigator.userAgent.match(/iPad/i);
            },
            iOSsm: function() {
                return navigator.userAgent.match(/iPhone|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOSsm() ||isMobile.Opera() || isMobile.Windows());
            }
        };
        
        if(isMobile.any()) { //All mobile
            // We will not support mobile by default
            isSupported = false;

             if(/iP(hone|od|ad)/.test(navigator.platform)) {
              // supports iOS 8 and later
              var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
              var versionNumber = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
              if (versionNumber >= 8) {
                isSupported = true;
              }
            } 
        }

        return isSupported;
    },

    /**
    *   Set variable values that need to be updated during runtime.
    *
    *   @method updateVariables
    *   @return {undefined}
    */
    updateVariables: function() {
        var self = this;

        this.viewPortSize = this.getViewportSize();
        this.viewPortOffset = this.getViewportOffset();
        this.parallaxContainers = [];

        // If some containers have been defined then use those otherwise search the DOM structure for them
        var containerLength = this.options.containers.length;
        if(containerLength > 0) {
        	for (var i = 0; i < containerLength; i++) {
        		var container = this.options.containers[i],
        			$elem = $(container.selector),
        			top = $elem.offset().top,
	                height = $elem.height(),
	                bottom = top + height,
	                elementsLength = container.elements.length,
	            	elements = [];

	            for (var j = 0; j < elementsLength; j++) {
	            	var element = container.elements[j];

	            	elements.push({
	            		$element: $elem.find(element.selector),
	            		movement: element.movement,
	            		options: element.options
	            	});
	            }

        		this.parallaxContainers.push({
	                top: top,
	                bottom: bottom,
	                height: height,
	                $element: $elem,
	                elements: elements,
	                elementsCount: elements.length
	            });
        	}
        } else {
        	this.$container = $(this.options.$container);
        	this.$parallaxContainers = this.$container.find(this.options.parallaxContainerSelector);
        	// loop through all the parallax containers and cache their top and bottom positions
	        this.$parallaxContainers.each(function(index, elem) {
	            var $elem = $(elem),
	                top = $elem.offset().top,
	                height = $elem.height(),
	                bottom = top + height;

	            var $elements = $elem.find('[data-parallax-movement]'),
	            	elements = [];

	            $elements.each(function(index, elem) {
	            	var $elem = $(elem);
	            	elements.push({
	            		$element: $elem,
	            		movement: $elem.attr('data-parallax-movement'),
	            		options: $elem.data()
	            	});
	            });

	            self.parallaxContainers.push({
	                top: top,
	                bottom: bottom,
	                height: height,
	                $element: $elem,
	                elements: elements,
	                elementsCount: elements.length
	            });
	        });
        }

        // Cache the length of the array
        this.parallaxContainersLength = this.parallaxContainers.length;
        
    },

    /**
    *   This is the guts of the module.  It loops through all the containers we have cached
    *   and figures out if it is onscreen or not.  It hands off responsibility to fire the actual
    *   events to the two trigger functions.
    *
    *   @method updateElements
    *   @return {undefined}
    */
    updateElements: function() {
        var viewPortOffset = this.getViewportOffset(),
            topOffset = viewPortOffset.top,
            bottomOffset = topOffset + this.viewPortSize.height,
            scrollDirection = 'down';

        // check to see if the screen has moved at all since the last frame
        if(this.viewPortOffset.top !== viewPortOffset.top) {
            // we assumed the user is scrolling down but lets verify and set it to down if we were wrong
            if(this.viewPortOffset.top > viewPortOffset.top) {
                scrollDirection = 'up';
            }
            this.viewPortOffset = viewPortOffset;
            // Find all elements with top or bottom values between topOffset and bottomOffset
            for (var i = 0; i < this.parallaxContainersLength; i++) {
            	var container = this.parallaxContainers[i];
                if((container.top > topOffset && container.top < bottomOffset) || (container.bottom > topOffset && container.bottom < bottomOffset) || container.top < topOffset && container.bottom > bottomOffset) {
                    
                    var maxTopOffset = topOffset - container.height, // if the bottom of the container was at the top of the screen
                        maxBottomOffset = bottomOffset, // if the top of the container was at the bottom of the screen
                        offsetRange = maxBottomOffset - maxTopOffset,  // the number of pixels between those two points
                        containerOffset = container.top - maxTopOffset, // where the container is within that range
                        parallaxPercentage = 1 - containerOffset / offsetRange;  // the percentage of the way through the range

                    this.triggerParallaxOnScreen(container, parallaxPercentage);
                } else {
                    this.triggerParallaxOffScreen(container, scrollDirection);
                }
            }
        }

    },

    /**
    *   This function triggers an event on this object that can be listened to.  It sends along an object
    *   with some useful information.
    *
    *   @method triggerParallaxOnScreen
    *   @return {undefined}
    */
    triggerParallaxOnScreen: function(container, percentage) {
    	container.$element.addClass('parallax-onscreen');
        container.$element.trigger('parallax:onscreen', percentage);
        this.parallaxMovement.onParallaxOnScreen(container, percentage);
    },

    /**
    *   This function triggers an event on this object when an object has moved off screen.
    *
    *   @method triggerParallaxOffScreen
    *   @return {undefined}
    */
    triggerParallaxOffScreen: function(container, direction) {
        container.$element.removeClass('parallax-onscreen');
        container.$element.trigger('parallax:offscreen', direction);
    },

    /**
    *   Enables Parallax!  If Parallax hasn't been initialized it takes care of that
    *   or if it has been then it enables all the waypoints.
    *
    *   @method initParallax
    *   @return {undefined}
    */
    enable: function() {
        if(this.isSupported) {
            if(!this.isInit) {
                this.init();
            } else {
                this.initEvents();
            }
        }
    },

    /**
    *   Disables Parallax... Just turns off the events for now.  If you really want to kill parallax
    *   then run uninitialize.
    *
    *   @method disable
    *   @return {undefined}
    */
    disable: function() {
        this.removeEvents();
    },

    /**
    *   Initialize events and event listeners.
    *
    *   @method initEvents
    *   @return {undefined}
    */
    initEvents: function() {
        // Initialize your module specific events here.
        $(document).on('parallax:update', $.proxy(this.onUpdateParallax, this));

        if((this.isIE8 && this.options.ie8Support) || (this.isIE9 && this.options.ie9Support)) {
            // IE8 and 9 don't play nice with scrolling events - it's super jerky - so we will use
            // requestAnimFrame calls instead to animate the parallax thereby cutting jerky scroll
            // right out of the picture.

            this.requestAnimFrameLoop();
        } else {
            $(window).scroll($.proxy(this.onWindowScroll, this));
        }

        $(window).resize($.proxy(this.onWindowResize, this));
    },

    /**
    *   On Window scroll event handler.  Debounced version.
    *
    *   @method onWindowScroll
    *   @return {undefined}
    */
    onWindowScroll: function(event) {
        this.isScrolling = true;
        this.updateElements();
    },

    /**
    *   On Window scroll event handler.  Debounced version.
    *
    *   @method requestAnimFrameLoop
    *   @return {undefined}
    */
    requestAnimFrameLoop: function() {
        this.updateElements();
        window.requestAnimationFrame(this.requestAnimFrameLoop.bind(this));
    },

    /**
    *   On Window scroll resize handler
    *
    *   @method uninitialize
    *   @return {undefined}
    */
    onWindowResize: function(event) {
        this.updateVariables();
    },

    /**
    *   This is the event handler for the 'parallax:update' event.  It calls the waypoints
    *   plugin to refresh.
    *
    *   @method onUpdateParallax
    *   @return {undefined}
    */
    onUpdateParallax: function(event) {
        this.updateVariables();
        this.updateElements();
    },

    /**
    *   Remove event listeners
    *
    *   @method uninitialize
    *   @return {undefined}
    */
    removeEvents: function() {
        $(document).off('parallax:update', $.proxy(this.onUpdateParallax, this));
        $(window).off('scroll', $.proxy(this.onWindowScroll, this));
        $(window).off('resize', $.proxy(this.onWindowResize, this));
    },

    /**
    *   Remove event listeners
    *
    *   @method uninitialize
    *   @return {undefined}
    */
    uninitialize: function() {
        // Unbind all bound events.
        this.removeEvents();
    },

    /**
    *   calculate the size of the viewport
    *
    *   @method getViewportSize
    *   @return {undefined}
    */
    getViewportSize: function() {
        var mode, domObject, size = { height: window.innerHeight, width: window.innerWidth };

        // if this is correct then return it. iPad has compat Mode, so will
        // go into check clientHeight/clientWidth (which has the wrong value).
        if (!size.height) {
          mode = document.compatMode;
          if (mode || !$.support.boxModel) { // IE, Gecko
            domObject = mode === 'CSS1Compat' ?
              document.documentElement : // Standards
              document.body; // Quirks
            size = {
              height: domObject.clientHeight,
              width:  domObject.clientWidth
            };
          }
        }

        return size;
    },

    /**
    *   calculate the offset of the viewport
    *
    *   @method getViewportOffset
    *   @return {undefined}
    */
    getViewportOffset: function() {
        return {
          top:  window.pageYOffset || document.documentElement.scrollTop   || document.body.scrollTop,
          left: window.pageXOffset || document.documentElement.scrollLeft  || document.body.scrollLeft
        };
    }
};

module.exports = Relativity;