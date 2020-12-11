---
id: dependencies
title: Dependencies
---

## <span style={{color: "#25c2a0"}}>React</span>

The photo editor is built using the React framework as a React component written in JSX.

### <span style={{color: "#25c2a0"}}>Ant Design</span>

To provide a clean modern user interface with ready-made interactive elements we use a React component library called Ant Design. Documentation for Ant-Design can be found here: https://ant.design/

## <span style={{color: "#25c2a0"}}>Build Tools</span>

### <span style={{color: "#25c2a0"}}>Craco</span>

Because of the way Ant Design works, we need a build tool called Craco to extend React native build tools. We need it to add LESS stylesheets compiling and to override LESS variables to customize the Ant Design theme. Documentation for Craco can be found here: https://github.com/gsoft-inc/craco

## <span style={{color: "#25c2a0"}}>NPM Package Libraries</span>

The photo editor uses some npm package libraries for various functions. These are listed here.

### <span style={{color: "#25c2a0"}}>Konva</span>

Konva is a library that provides functionalities for dealing with objects drawn on an HTMLCanvasElement. The photo editor uses this library to provide the core functionality of having transformable and movable images and text on the canvas. The documentation of Konva can be found here: https://konvajs.org/

### <span style={{color: "#25c2a0"}}>CropperJS</span>

CropperJS is a javascript library that provides being able to put a canvas element into crop mode and have the user select a crop box area. That crop box information can then be used separately to implement cropping actions on the canvas. Documentation for CropperJS can be found here: https://fengyuanchen.github.io/cropperjs/

### <span style={{color: "#25c2a0"}}>Iro.js</span>

Iro.js is a color picker widget that allows the user to select a color from a color wheel. When a color is selected, this dispatches an event which can be listened to in order to get the color value the user selected. This information is then given to the tool that has a selectable color, such as the brush or text tools, the eyedrop tool also interacts with it. Documentation for Iro.js can be found here: https://iro.js.org/

### <span style={{color: "#25c2a0"}}>PixiJS</span>

PixiJS is an advanced canvas manipulation library. It has an extensive filter library as well and that is what we use it for. Documentation for PixiJS can be found here: https://www.pixijs.com/

### <span style={{color: "#25c2a0"}}>pixi-filters</span>

Pixi-filters is a filter library for PixiJS that extends the filter options available in PixiJS.  Most of the filters we use come from pixi-filters rather than core PixiJS but PixiJS is needed in order for pixi-filters to work. Documentation for pixi-filters can be found here: https://github.com/pixijs/pixi-filters and here: https://pixijs.io/pixi-filters/docs/

### <span style={{color: "#25c2a0"}}>image-conversion</span>

Image-conversion is a small library we use to convert between image object types in some instances. It is a bit redundant and could be removed. It was originally installed to downscale images but did not work for that purpose. Documentation for image-conversion can be found here: https://www.npmjs.com/package/image-conversion

### <span style={{color: "#25c2a0"}}>browser-image-resizer</span>

Browser-image-resizer is another small library we use for downscaling images to better performance. Documentation for browser-image-resizer can be found here: https://www.npmjs.com/package/browser-image-resizer
