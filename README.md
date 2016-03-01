# Relativity
Relativity is a library that uses screen scroll events and position to animate elements within the viewport.  It can be used to create a parallax effect, scaling, rotations, fade in and out, and so much more.

## Installation
```npm install --save relativity```

```bower install relativity```

## Usage
Relativity uses jQuery for DOM manipulation so you'll need that to be available before Relativity.

```
<script src="https://code.jquery.com/jquery-1.12.1.min.js"></script>
<script src="relativity.js"></script>
```

Relativity makes itself available as a global variable which you can use to create a new instance like this:

```
var relativity = new Relativity(options);
```

## Options
There are a number of options that you can use when initializing Relativity.  You can either pass a JSON array into options.containers which describes the containers and the elements inside them or you can defined the containers and movements in your HTML and let Relativity find them.  

| Option               | Type       | Values                   | Description                                                           |
| -------------------- | ---------- | ------------------------ | --------------------------------------------------------------------- |
| `positionPropery`    | String     | `transform` / `position` | Specificies whether to use CSS3 transforms or top/left positioning to move objects
| `supports3D`         | Boolean    | `true` / `false`         | Specificies whether to use CSS3 transform3d or transform              |
| `containers`         | Array      | []                       | Specifies which elements to use as containers and the elements within them |

## Movements
Relativity includes a number of built in movements that you can use to animate elements inside of containers.

### Left | Right | Up | Down

### Reveal

### Scale

## Events
Relativity also fires off events if you need more control over the animations or want to use Relativity as a waypoints solution.  

### On Screen
When a container is on screen it will trigger an event after every window.scroll event.  You can listen to it like this:

```
$('.myContainer').on('relativity:onscreen', function(event, container, percentage) {
	console.log(container);
	// { top: '', bottom: '', height: '', $element: '', elements: [], elementsCount: 0 }
});
```

### Off Screen
When a container switches from being on screen to off screen it will trigger a single event and include a direction parameter that can be `up` or `down`.

```
$('.myContainer').on('relativity:offscreen', function(event, container, direction) {
	console.log(container);
	// { top: '', bottom: '', height: '', $element: '', elements: [], elementsCount: 0 }

	console.log(direction);
	// 'up' | 'down'
});
```

### Update Elements
Relativity needs to know a few things about the page height and screen size in order to accurately calculate which elements are on screen.  It already includes a listener to detect screen resize events however these don't detect changes to the height of the page if something is added to the DOM.  If you add anything to the DOM or adjust the height of an element dynamically you will need to ask Relativity to recalculate everything.  It's super simple though, just trigger an event on the document like this:

```
$(document).trigger('relativity:update');
```
