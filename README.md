Playbox
=======

Subdivide and color boxes.


Installation
------------

  1. `npm install`
  2. `npm start`

Why?
----

I wrote this when I found myself drawing a lot of these fractal-ly boxes,
trying to visualize why different infinite sums converge to a particular
number.

Here's a visualization of how `sum((3/4)^n) = 4` for `n = [0, inf]`

<img src="public/three-quarter-box.svg" width="512" height="512">


Controls
--------

 - `<click>`- Split or color the box, depending on what mode you're in
 - `s` - Set click-mode to "split"
 - `c` - Set click-mode to "color"
 - `n`/`N` - Select the next/previous preset color
 - `4` - Set split-mode to 4-way
 - `2` - Set split-mode to 2-way
 - `h` - Set split-mode to 2-way, horizontal
 - `v` - Set split-mode to 2-way, vertical
 - `a` - Toggle all-mode (act on all of a certain color)
 - `u` - Undo the last action
 - `<space>` - Toggle box outlines
