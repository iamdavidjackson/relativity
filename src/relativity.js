var $ = require("jquery");

function Relativity (options) {

	this.prefixedTransform = this.vendorPrefix('transform');
	
	// Define default relativity options here - These can be over-ridden by the options variable
    // passed in.
    this._defaultOptions = {

        // initialize functionality immediately or wait to initialize later
        autoInit: true,

        // selector for the top level container that the module will act on
        $container: 'body',

        // selector used to find all the relativity container in the $container
        containerSelector: '.relativity-container',

        // whether we should be supporting mobile 
        mobileSupport: true,

        // whether we should be supporting IE8
        ie8Support: false,

        // whether we should be supporting IE9
        ie9Support: true,

        positionProperty: 'position',

        supports3D: true,

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
        this.options = this.extend(this._defaultOptions, options);
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
            $('html').addClass('relativity');

            this.initEvents();
            this.onUpdateRelativity();
            this.isInit = true; 
        }
    },

    /**
    *   Checks to see whether relativity is supported or not
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
        this.containers = [];

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
	            	var element = container.elements[j],
                        $element = $elem.find(element.selector);

	            	elements.push({
	            		$element: $element,
	            		movement: element.movement,
	            		options: element.options,
                        originalLeft: $element.position().left,
                        originalTop: $element.position().top,
                        originalWidth: $element.width(),
                        originalHeight: $element.height()
	            	});
	            }

        		this.containers.push({
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
        	this.$containers = this.$container.find(this.options.containerSelector);
        	// loop through all the relativity containers and cache their top and bottom positions
	        this.$containers.each(function(index, elem) {
	            var $elem = $(elem),
	                top = $elem.offset().top,
	                height = $elem.height(),
	                bottom = top + height;

	            var $elements = $elem.find('[data-relativity-movement]'),
	            	elements = [];

	            $elements.each(function(index, elem) {
	            	var $elem = $(elem);
	            	elements.push({
	            		$element: $elem,
	            		movement: $elem.attr('data-relativity-movement'),
	            		options: $elem.data(),
                        originalLeft: $element.position().left,
                        originalTop: $element.position().top,
                        originalWidth: $element.width(),
                        originalHeight: $element.height()
	            	});
	            });

	            self.containers.push({
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
        this.containersLength = this.containers.length;
        
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
        if(this.viewPortOffset.top !== viewPortOffset.top || !this.isInit) {
            // we assumed the user is scrolling down but lets verify and set it to down if we were wrong
            if(this.viewPortOffset.top > viewPortOffset.top) {
                scrollDirection = 'up';
            }
            this.viewPortOffset = viewPortOffset;

            // Find all elements with top or bottom values between topOffset and bottomOffset
            for (var i = 0; i < this.containersLength; i++) {
            	var container = this.containers[i];
                if((container.top > topOffset && container.top < bottomOffset) || (container.bottom > topOffset && container.bottom < bottomOffset) || container.top < topOffset && container.bottom > bottomOffset) {
                    
                    var maxTopOffset = topOffset - container.height, // if the bottom of the container was at the top of the screen
                        maxBottomOffset = bottomOffset, // if the top of the container was at the bottom of the screen
                        offsetRange = maxBottomOffset - maxTopOffset,  // the number of pixels between those two points
                        containerOffset = container.top - maxTopOffset, // where the container is within that range
                        percentage = 1 - containerOffset / offsetRange;  // the percentage of the way through the range

                    this.triggerContainerOnScreen(container, percentage);
                } else {
                    this.triggerContainerOffScreen(container, scrollDirection);
                }
            }
        }

    },

    /**
    *   This function triggers an event on this object that can be listened to.  It sends along an object
    *   with some useful information.
    *
    *   @method triggerContainerOnScreen
    *   @return {undefined}
    */
    triggerContainerOnScreen: function(container, percentage) {
    	container.$element.addClass('relativity-onscreen');
        container.$element.trigger('relativity:onscreen', percentage);
        
        // move the elements we defined as having a relativity movement
        for (var i = 0; i < container.elementsCount; i++) {

            var element = container.elements[i],
                movement = element.movement,
                methodName = 'onMovement' + movement.charAt(0).toUpperCase() + movement.slice(1).toLowerCase(),
                method = this[methodName];

            // call the onMethodName if it exists
            if (typeof method == 'function') {
                // pass all arguments, except the event name
                return method.apply(this, [element, percentage]);
            } else {
                console.log('no method available');
            }

        }
    },

    /**
    *   This function triggers an event on this object when an object has moved off screen.
    *
    *   @method triggerConatinerOffScreen
    *   @return {undefined}
    */
    triggerContainerOffScreen: function(container, direction) {
        container.$element.removeClass('relativity-onscreen');
        container.$element.trigger('relativity:offscreen', direction);
    },

    /**
    *   Enables Relativity!  If Relativity hasn't been initialized it takes care of that
    *   or if it has been then it enables all the waypoints.
    *
    *   @method initRelativity
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
    *   Disables Relativity... Just turns off the events for now.  If you really want to kill Relativity
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
        $(document).on('relativity:update', $.proxy(this.onUpdateRelativity, this));

        if((this.isIE8 && this.options.ie8Support) || (this.isIE9 && this.options.ie9Support)) {
            // IE8 and 9 don't play nice with scrolling events - it's super jerky - so we will use
            // requestAnimFrame calls instead to animate the elements thereby cutting jerky scroll
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
    *   This is the event handler for the 'relativity:update' event.
    *
    *   @method onUpdateRelativity
    *   @return {undefined}
    */
    onUpdateRelativity: function(event) {
        this.updateVariables();
        this.updateElements();
    },

    /**
    *   Method for handling moving objects left
    *
    *   @method onMovementLeft
    *   @return {undefined}
    */
    onMovementLeft: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newLeft = element.originalLeft - delta; 
        
        if(this.positionProperty === 'position') {
            this.setLeft($elem, newLeft);    
        } else {
            this.setTransform($elem, newLeft, element.originalLeft, 0, 0);
        }
        
    },

    /**
    *   Method for handling moving objects right
    *
    *   @method onMovementRight
    *   @return {undefined}
    */
    onMovementRight: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newLeft = element.originalLeft + delta; 
        
        if(this.positionProperty == 'position') {
            this.setLeft($elem, newLeft);    
        } else {
            this.setTransform($elem, newLeft, element.originalLeft, 0, 0);
        }
    },

    /**
    *   Method for handling moving objects up
    *
    *   @method onMovementUp
    *   @return {undefined}
    */
    onMovementUp: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newTop = element.originalTop - delta; 
        
        if(this.positionProperty == 'position') {
            this.setTop($elem, newTop);    
        } else {
            this.setTransform($elem, 0, 0, newTop, element.originalTop);
        }
    },

    /**
    *   Method for handling moving objects down
    *
    *   @method onMovementDown
    *   @return {undefined}
    */
    onMovementDown: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newTop = element.originalTop + delta; 
        
        if(this.positionProperty == 'position') {
            this.setTop($elem, newTop);    
        } else {
            this.setTransform($elem, 0, 0, newTop, element.originalTop);
        }
    },

    /**
    *   Method for handling scaling objects
    *
    *   @method onMovementScale
    *   @return {undefined}
    */
    onMovementScale: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newWidth = element.originalWidth + delta,
            newHeight = element.originalHeight * (newWidth / element.originalWidth); 
        
        $elem.css('width', newWidth + 'px');
        $elem.css('height', newHeight + 'px');
    },

    /**
    *   Method for handling revealing objects
    *
    *   @method onMovementReveal
    *   @return {undefined}
    */
    onMovementReveal: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem); 

        if(percentage >= data.triggerPoint) {
            $elem.css('opacity', '1');    
        } else {
            $elem.css('opacity', '0');
        }
    },

    /**
    *   Method for handling revealing objects
    *
    *   @method onMovementReveal
    *   @return {undefined}
    */
    onMovementWiden: function(element, percentage) {

        var $elem = element.$element,
            delta = this.calculateDelta(element, percentage),
            newWidth = element.originalWidth + delta; 

        $elem.css('width', newWidth);    
    },

    /**
    *   Remove event listeners
    *
    *   @method uninitialize
    *   @return {undefined}
    */
    removeEvents: function() {
        $(document).off('relativity:update', $.proxy(this.onUpdateRelativity, this));
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
    },

    setLeft: function($elem, left) { 
        $elem.css('left', left); 
    },
    
    setTop: function($elem, top) { 
        $elem.css('top', top); 
    },
    
    setTransform: function($elem, left, startingLeft, top, startingTop) {
        if(this.options.supports3D) {
            // 3d transformations - Much faster
            $elem.css(this.prefixedTransform, 'translate3d(' + (left - startingLeft) + 'px, ' + (top - startingTop) + 'px, 0)');
        } else {
            // 2d transformations only - IE9
            $elem.css(this.prefixedTransform, 'translate(' + (left - startingLeft) + 'px, ' + (top - startingTop) + 'px)');
        }
    },

    /**
    *   Calculates how far an object should be moved based on it's data attributes.
    *
    *   @method calculateDelta
    *   @return {undefined}
    */
    calculateDelta: function(element, percentage) {
        // if there is no range defined in the data object then
        // use the screen size as a range
        var range = element.options.range || this.viewPortSize.height,
            speed = element.options.speed,
            delta = window.parseInt(speed * range * (percentage - 0.5));

        return delta;
    },

    extend: function (obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    },

    // Returns a function which adds a vendor prefix to any CSS property name
    vendorPrefix: (function() {
        var prefixes = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
            style = $('script')[0].style,
            prefix = '',
            prop;

        for (prop in style) {
            if (prefixes.test(prop)) {
                prefix = prop.match(prefixes)[0];
                break;
            }
        }

        if ('WebkitOpacity' in style) { prefix = 'Webkit'; }
        if ('KhtmlOpacity' in style) { prefix = 'Khtml'; }

        return function(property) {
            return prefix + (prefix.length > 0 ? property.charAt(0).toUpperCase() + property.slice(1) : property);
        };
    })()
};

module.exports = Relativity;