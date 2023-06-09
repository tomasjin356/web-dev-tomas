---
layout: post
title: Rendering Text in WebVR
description: |
    Within is a platform for storytelling in virtual reality and is available everywhere VR is. This includes the web. Leveraging WebVR, viewers are able to go to a website, click a link, and immediately watch Within’s films in immersive VR - including high end head-mounted displays. During the development process the team discovered rendering text is difficult in this new environment, and they created an example using shaders to make it a smoother process.
date: 2017-02-02
updated: 2017-02-02
tags:
  - blog
  - case-study

---

<figure>
{% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/xE2bMbYkwAw5oXpuIN5k.jpg", alt="Within Detail", width="800", height="450" %}
</figure>

[View the site](https://vr.with.in/)

Within ([https://with.in/](https://with.in/)) is a platform for storytelling in
virtual reality. So when the team heard about [WebVR](https://developer.chrome.com/blog/ar-for-the-web/) in
2015 we were immediately interested in its potential. Today, that interest
manifests into a unique subdomain of our Web platform,
[https://vr.with.in/](https://vr.with.in/). Anyone with a VR-enabled browser can
go to the site, click a button and throw on a headset to be immersed in our
portfolio of VR films.

Today that includes but is not limited to Chrome on Daydream View. For
information on your device and head-mounted display check out
[https://webvr.info/](https://webvr.info/).

Like other virtual reality specific rendering environments, the web
predominantly relies on a three-dimensional representation of a scene. This
scene has a camera, your perspective, and any number of objects. To help manage
this scene, camera, and objects we use a library called
[Three.js](https://threejs.org/) which leverages the `<canvas>` element to throw
rendering onto your computer's GPU. There are many useful Three.js add-ons to
make your scene viewable in WebVR. The main two are
[THREE.VREffect](https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/VREffect.js)
for creating a viewport for each eye and
[THREE.VRControls](https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/VRControls.js)
for translating the perspective (e.g the rotation and position of the
head-mounted display) convincingly into your scene. There are many examples of
how to implement this. Check out the
[Three.js WebVR examples](https://threejs.org/examples/?q=webvr)
for ways to get started.

As we got further into our exploration of WebVR we ran into an issue. If we look
at the contents of the web, text is an integral part of it. While the majority
of our content is video based, if you go to the
[Within site](https://with.in/#films) text surrounds the content;
the user interface and additional information about a film or related films are all
constructed with text. Furthermore all of this text is created in the DOM. Our
WebVR explorations and [https://vr.with.in/](https://vr.with.in/) are all in
`<canvas>`.

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/jX3gkPhFpeTL9lbY0HXi.jpg", alt="Text used in WebVR", width="800", height="800" %}
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/7eQw7WsXQghVDsGdcshr.jpg", alt="Text used in WebVR", width="800", height="800" %}
  <figcaption>
    Text used in WebVR for <a href="https://vr.with.in/">vr.with.in</a>
  </figcaption>
</figure>

## What are my Options?

Luckily, there is work being done to make this possible. In fact in our research
we found a number of effective ways to render text in a three-dimensional
environment on a `<canvas>` element. Below is a matrix of a few we found
marked with pros and cons for each:

<table>
  <tr>
   <th></th>
   <th>Resolution Independent</th>
   <th>Typographic Features</th>
   <th>Performance</th>
   <th>Ease of Implementation</th>
  </tr>
  <tr>
   <td><a href="https://vr.with.in/archive/text-2d-canvas/">2D canvas text</a></td>
   <td></td>
   <td>Yes</td>
   <td>Yes</td>
   <td>Yes</span></td>
  </tr>
  <tr>
   <td><a href="https://vr.with.in/archive/text-triangulated-vector/">Triangulated vector text</a></td>
   <td>Yes</span></td>
   <td></td>
   <td>Yes</td>
   <td></td>
  </tr>
  <tr>
   <td><a href="https://threejs.org/examples/webgl_geometry_text.html">Extruded 3D text</a></td>
   <td>Yes</td>
   <td></td>
   <td></td>
   <td></td>
  </tr>
  <tr>
   <td><a href="https://vr.with.in/archive/text-sdf-bitmap/">Signed distance field bitmap text</a></td>
   <td>Yes</td>
   <td>Yes</td>
   <td>Yes</td>
   <td></td>
  </tr>
</table>


## Our Decision: SDF Bitmap Font

2D canvas with `ctx.fillText()` can do text wrapping, letter spacing and line
height, but overflow gets cut off, and text will be blurry if you zoom in really
far. You could increase the size of the canvas texture, but might hit an upper
limit in texture size or performance could suffer if the texture is too big.

Extruded 3D text is essentially the same as triangulated vector text, but with
depth and possibly a bevel so it has at least twice as much geometry. Either of
these could work in small doses for titles or logos, but wouldn't perform as
well for large quantities of text and neither has typographic features.

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/NGvF4Cy2irDhTW1PoKaR.png", alt="Font to SDF bitmap workflow", width="519", height="170" %}
  <figcaption>Font to SDF bitmap workflow</figcaption>
</figure>

Bitmap fonts use one quad (two triangles) per character, so they use less
geometry and perform better than
[triangulated vectors](https://vr.with.in/archive/text-triangulated-vector/).
They're still raster based since they use a texture map sprite, but with an SDF
shader they're basically resolution-independent so they look nicer than a 2D
canvas texture.
[Matt DesLauriers'](https://mattdesl.svbtle.com/material-design-on-the-gpu)
three-bmfont-text also includes reliable typographic features for text wrapping,
letter spacing, line height and alignment. Overflow doesn't get cut off. Font
size is controlled through scale. We chose this route because it gave us the
best options for design while staying performant. Unfortunately, it wasn't as
easy to implement so we'll go through the steps in the hopes of helping fellow
developers working in WebVR.

## 1. Generate a bitmap font (.png + .fnt)

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/gqRSq5JcJFyDXUtdxRMV.png", alt="Hiero interface", width="800", height="753" %}
  <figcaption>Hiero interface</figcaption>
</figure>

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/Y6dc1N4jMEWDuDHw5wkM.png", alt="Hiero output (Bitmap PNG and .fnt file)", width="455", height="448" %}
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/65AI0E525qSn0YhBPsXD.png", alt="Hiero output (Bitmap PNG and .fnt file)", width="512", height="512" %}
  <figcaption>Hiero output (Bitmap PNG and .fnt file)</figcaption>
</figure>

[Hiero](https://github.com/libgdx/libgdx/wiki/Hiero) is a bitmap font packing
tool that runs with Java. The Hiero documentation doesn't really explain how to
run it without going through a complicated build process. First, install Java if
you haven't already. Then, if double-click on the runnable-hiero.jar doesn't
open Hiero, try running it with this command in the console:

```shell
java -jar runnable-hiero.jar
```

Once Hiero is running, open a .ttf or .otf desktop font, enter any extra
characters you want included, change rendering to Java to enable effects,
increase the size so that your characters fill up the entire glyph cache square,
add a distance field effect, adjust the distance field's scale and spread. The
scale value is like a resolution. The higher it is, the less blurry it will be,
but the longer it will take for Hiero to render the preview. Then save your
bitmap font. It generates a bitmap font consisting of a .png image and an
AngelCode .fnt font description file.

## 2. Convert AngelCode to JSON

Now that the bitmap font has been generated, we have to load it into our
javascript app with Matt DesLauriers'
[load-bmfont npm package](https://www.npmjs.com/package/load-bmfont).

We could browserify load-bmfont and use that on the front end, but instead we're
going to run
[load-bmfont.js](https://vr.with.in/archive/text-sdf-bitmap/load-bmfont.js) with
Node to convert and save Hiero's AngelCode .fnt to a
[.json file](https://vr.with.in/archive/text-sdf-bitmap/fonts/roboto/bitmap/roboto-bold.json):

```shell
npm install
node load-bmfont.js
```

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/lqRV6zKx4t29C2iyOLxW.png", alt="Example of output JSON", width="449", height="428" %}
  <figcaption>Example of output JSON</figcaption>
</figure>

Now we can bypass load-bmfont and just do an XHR (XMLHttpRequest) request on the
.json font file.

```js
var r = new XMLHttpRequest();
r.open('GET', 'fonts/roboto/bitmap/roboto-bold.json');

r.onreadystatechange = function() {
    if (r.readyState === 4 && r.status === 200) {
    setup(JSON.parse(r.responseText));
    }
};

r.send();

function setup(font) {
    // pass font into TextBitmap object
}
```

## 3. Browserify three-bmfont-text

Once we have the font loaded, Matt's three-bmfont-text will take care of the
rest. Since we're not using Node for our own app, we're going to
[browserify](http://browserify.org/)
[three-bmfont-text.js](https://vr.with.in/archive/text-sdf-bitmap/three-bmfont-text.js)
into a usable [three-bmfont-text-bundle.js](https://vr.with.in/archive/text-sdf-bitmap/three-bmfont-text-bundle.js)

```shell
npm install -g browserify
browserify three-bmfont-text.js -o three-bmfont-text-bundle.js
```

## 4. SDF shader

Adjust the **afwidth** and **threshold** sliders on
[vr.with.in/archive/text-sdf-bitmap/](https://vr.with.in/archive/text-sdf-bitmap/)
to see the affect of the signed distance field shader.

## 5. Usage

For convenience, I created a
[TextBitmap wrapper class](https://vr.with.in/archive/text-sdf-bitmap/text-bitmap.js)
for the browserified three-bmfont-text.

<figure>
  {% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/ZuSlohAf0rwGdUh1Nctk.png", alt="Text-sdf-bitmap in action", width="800", height="396" %}
  <figcaption>Text-sdf-bitmap in action</figcaption>
</figure>

```html
<script src="three-bmfont-text-bundle.js"></script>
<script src="sdf-shader.js"></script>
<script src="text-bitmap.js"></script>
```

Create an XHR request for the .json font file and create a text object in the
callback:

```js
var bmtext = new TextBitmap({ options });
```

To change text:

```js
bmtext.text = 'The quick brown fox jumps over the lazy dog.';

scene.add( bmtext.group );
hitBoxes.push( bmtext.hitBox );
```

The bitmap font's .png is loaded with THREE.TextureLoader in text-bitmap.js

TextBitmap also includes an invisible hitbox for three.js raycast interaction
through a mouse, camera, or hand tracked motion controllers like Oculus Touch or
the Vive controllers. The hitbox's size auto-updates when you change the text
options.

Bmtext.group is added to the three.js scene. If you need to access the children
/ Object3D's, the scene graph for the text looks like:

<figure>
{% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/38XlqLFu31jVetooepgF.png", alt="File system diagram", width="125", height="159" %}
</figure>

## 6. Unminify json and modify xoffsets

<figure>
{% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/lIwwhhWV9sFsN5S3KpIX.gif", alt="Within text gif", width="800", height="297" %}
</figure>

If your kerning look off, you may need to edit the xoffsets in the json. Paste
the json into [Jsbeautifier.org](http://jsbeautifier.org/) to get an
unminified version of the file.

The xoffset is essentially global kerning for one character. Kerning is for two
specific characters that appear next to each other. The default values in the
kerning array don't actually make a difference, and it would be too tedious to
edit, so you can empty that array to decrease the file size of the json. Then
edit the xoffsets for kerning.

First you'll have to figure out which characters go with which char ID in the
json. In [three-bmfont-text-bundle.js](https://vr.with.in/archive/text-sdf-bitmap/three-bmfont-text-bundle.js),
insert `console.log` after line 240:

```js
    var id = text.charCodeAt(i)
    // console.log(id);
```

Then type into dat.gui text field on
[https://vr.with.in/archive/text-sdf-bitmap/](https://vr.with.in/archive/text-sdf-bitmap/)
and check the console to find the corresponding ID of a character.

For example, in our bitmap font, "j" is consistently too far to the right. Its
char ID is 106. So find `"id": 106` in the json and change its xoffset from -1
to -10.

## 7. Layout

If you have multiple blocks of text and want it to flow from top to bottom like
HTML, everything has to be manually positioned, similar to absolute positioning
every dom element yourself with CSS. Can you imagine doing this in CSS?

```css
    * { position: absolute; }
```

That's what text layout in 3D is like. In the detail view: title, author,
description, and duration are each a new TextBitmap object with their own
styles, color, scale, etc.:

<figure>
{% Img src="image/T4FyVKpzu4WKF1kBNvXepbi08t52/SXdLB0TTJNyAxYuZFXdK.jpg", alt="3d layout", width="800", height="800" %}
</figure>

```js
author.group.position.y = title.group.position.y - title.height - padding;
description.group.position.y = author.group.position.y - author.height - padding;
duration.group.position.y = description.group.position.y - description.height - padding;
```

This assumes that the local origin of each TextBitmap group is vertically
aligned with the top of the TextBitmap mesh (see centering in
[text-bitmap.js](https://vr.with.in/archive/text-sdf-bitmap/text-bitmap.js)
update). If you change the text for any of those objects later, and the height
of that object changes, you will also need to recalculate those positions. Here,
only the y-position of the text is modified, but one opportunity of working in
3D is that we can push and pull the text in the z-direction, as well as rotate
around the x, y and z axes.

## Conclusion

Text and layout in WebVR have a long way to go before they're as easy and as
widely-used as HTML and CSS. But working solutions exist and you can do way more
in WebVR than you can with a traditional HTML web page. WebVR exists today.
There will probably be better tools tomorrow. Until then, try it out and
experiment. Developing without a ubiquitous framework leads to more unique
projects, and that's exciting.
