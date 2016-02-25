# Relativity
Relativity is a library that uses screen scroll events and position to animate elements within the viewport.  It can be used to create a parallax effect, scaling, rotations, fade in and out, and so much more.

## Installation

```npm install --save relativity```

```bower install relativity```

## Usage
Relativity uses jQuery for DOM manipulation so you'll need that available before Relativity.

```
<script src="https://code.jquery.com/jquery-1.12.1.min.js"></script>
<script src="relativity.js"></script>
```

## Initialization
Relativity makes itself available as a global variable which you can use to create a new instance.

```
var relativity = new Relativity({
	... options ...
	containers: [
		{
			selector: ".row1",
			elements: [
				{
					selector: "p",
					movement: "left",
					options: {
						speed: "0.5"
					}
				}
			]
		}
	]
});
```
## Options

