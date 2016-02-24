var $ = require("jquery");
var _ = require("lodash");

/**
*   ParallaxMovement is a module.
*   This module manages moving Parallax objects based on the events emitted from parallax.js.  
*   There are a number of built in movement types: left, right, up, down however you can also
*   add your own.  Use this syntax:
*
*   this.parallaxMovements = new ParallaxMovements();
*   this.parallaxMovements.onParallaxMovementRotate = function($elem, percentage) {
*       $elem.css('transform', 'rotateX(' + (360 * percentage) + 'deg)');
*   }
* 
*
*   @class ParallaxMovement
*   @constructor
*/
var ParallaxMovement = function(options) {

    this.prefixedTransform = this.vendorPrefix('transform');

    this._defaultOptions = {

        parallax: {},

        positionProperty: 'position',

        supports3D: true,

        backgroundPositionSupport: true
    };

    this.initVariables(options);
    
};

ParallaxMovement.prototype = {

    /**
    *   Initialize any variables needed, meaning mainly "wrap elements with jQuery."
    *
    *   @method initVariables
    *   @return {undefined}
    */
    initVariables: function(options) {

        this.options = _.assign(this._defaultOptions, options);

        this.parallaxModule = this.options.parallax;
        this.updateVariables();
    },

    /**
    *   Set variable values that need to be updated during runtime.
    *
    *   @method updateVariables
    *   @return {undefined}
    */
    updateVariables: function() {
        this.viewPortSize = this.parallaxModule.getViewportSize();
    },

    /**
    *   Initialize this module
    *
    *   @method init
    *   @return {undefined}
    */
    init: function(parallax) {
        this.initVariables(parallax);

        this.initEvents();
        this.isInit = true;
    },

    /**
    *   Initialize events and event listeners.
    *
    *   @method initEvents
    *   @return {undefined}
    */
    initEvents: function() {
        $(window).resize($.proxy(this.onWindowResize, this));
        
    },

    /**
    *   This function allows you to add a parallax module after the movements
    *   module has been created.  It essentially just initializes the module.
    *
    *   @method addParallaxModule
    *   @return {undefined}
    */
    addParallaxModule: function(parallax) {
        this.init(parallax);
    },

    /**
    *   This function controls what should happen on parallax on screen events
    *
    *   @method onParallaxOnScreen
    *   @param Object event contains:
    *        elem - jQuery object that the event is acting on
    *        percentage - decimal value between 0 and 1 of how far the object
    *        has scrolled in and out of the viewport.
    *   @return {undefined}
    */
    onParallaxOnScreen: function(container, percentage) {
        // move the elements we defined as having a parallax movement
        for (var i = 0; i < container.elementsCount; i++) {

            var element = container.elements[i],
                movement = element.movement,
                methodName = 'onParallaxMovement' + movement.charAt(0).toUpperCase() + movement.slice(1).toLowerCase(),
                method = this[methodName];

            // call the onMethodName if it exists
            if (_.isFunction(method)) {
                // pass all arguments, except the event name
                return method.apply(this, [element, percentage]);
            } else {
                console.log('no method available');
            }

        };
    },

    /**
    *   Method for handling moving objects left
    *
    *   @method onParallaxMovementLeft
    *   @return {undefined}
    */
    onParallaxMovementLeft: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newLeft = data.originalLeft - delta; 
        
        if(this.positionProperty === 'position') {
            this.setLeft($elem, newLeft);    
        } else {
            this.setTransform($elem, newLeft, data.originalLeft, 0, 0);
        }
        
    },

    /**
    *   Method for handling moving objects right
    *
    *   @method onParallaxMovementRight
    *   @return {undefined}
    */
    onParallaxMovementRight: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newLeft = data.originalLeft + delta; 
        
        if(this.positionProperty == 'position') {
            this.setLeft($elem, newLeft);    
        } else {
            this.setTransform($elem, newLeft, data.originalLeft, 0, 0);
        }
    },

    /**
    *   Method for handling moving objects up
    *
    *   @method onParallaxMovementUp
    *   @return {undefined}
    */
    onParallaxMovementUp: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newTop = data.originalTop - delta; 
        
        if(this.positionProperty == 'position') {
            this.setTop($elem, newTop);    
        } else {
            this.setTransform($elem, 0, 0, newTop, data.originalTop);
        }
    },

    /**
    *   Method for handling moving objects down
    *
    *   @method onParallaxMovementDown
    *   @return {undefined}
    */
    onParallaxMovementDown: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newTop = data.originalTop + delta; 
        
        if(this.positionProperty == 'position') {
            this.setTop($elem, newTop);    
        } else {
            this.setTransform($elem, 0, 0, newTop, data.originalTop);
        }
    },

    /**
    *   Method for handling scaling objects
    *
    *   @method onParallaxMovementScale
    *   @return {undefined}
    */
    onParallaxMovementScale: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newWidth = data.originalWidth + delta,
            newHeight = data.originalHeight * (newWidth / data.originalWidth); 
        
        $elem.css('width', newWidth + 'px');
        $elem.css('height', newHeight + 'px');
    },

    /**
    *   Method for handling revealing objects
    *
    *   @method onParallaxMovementReveal
    *   @return {undefined}
    */
    onParallaxMovementReveal: function(element, percentage) {

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
    *   @method onParallaxMovementReveal
    *   @return {undefined}
    */
    onParallaxMovementWiden: function(element, percentage) {

        var $elem = element.$element,
            data = this.getDataAttributes($elem),
            delta = this.calculateDelta(_.assign(data, element.options), percentage),
            newWidth = data.originalWidth + delta; 

        $elem.css('width', newWidth);    
    },

    /**
    *   Gets information from the data attributes on the elem that we
    *   need to calculate changes in position.  Also caches original position
    *   if it hasn't already been cached.
    *
    *   @method getDataAttributes
    *   @return {undefined}
    */
    getDataAttributes: function($elem) {
        var originalLeft = $elem.attr('data-parallax-original-left'),
            originalTop = $elem.attr('data-parallax-original-top'),
            originalWidth = $elem.attr('data-parallax-original-width'),
            originalHeight = $elem.attr('data-parallax-original-height');

        // cache original position if not set
        if(typeof originalLeft == 'undefined') {
            originalLeft = $elem.position().left;
            originalTop = $elem.position().top;
            originalWidth = $elem.width();
            originalHeight = $elem.height();
            $elem.attr('data-parallax-original-left', originalLeft);
            $elem.attr('data-parallax-original-top', originalTop);
            $elem.attr('data-parallax-original-width', originalWidth);
            $elem.attr('data-parallax-original-height', originalHeight);
        }

        return {
            originalLeft: window.parseFloat(originalLeft),
            originalTop: window.parseFloat(originalTop),
            originalWidth: window.parseFloat(originalWidth),
            originalHeight: window.parseFloat(originalHeight)
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
    calculateDelta: function(data, percentage) {
        // if there is no range defined in the data object then
        // use the screen size as a range
        var range = data.range || this.viewPortSize.height,
            speed = data.speed,
            delta = window.parseInt(speed * range * (percentage - 0.5));

        return delta;
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
    *   Remove event listeners
    *
    *   @method uninitialize
    *   @return {undefined}
    */
    uninitialize: function() {
        this.parallaxModule.off('parallax:onscreen', $.proxy(this.onParallaxOnScreen, this));
        $(window).off('resize', $.proxy(this.onWindowResize, this));
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

module.exports = ParallaxMovement;