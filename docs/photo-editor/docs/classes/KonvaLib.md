---
id: konva-lib
title: KonvaLib
---

export const Highlight = ({children, color}) => (
  <span
    style={{
      backgroundColor: color,
      borderRadius: '2px',
      color: '#fff',
      padding: '0.2rem',
    }}>
    {children}
  </span>
);

## <span style={{color: "#25c2a0"}}>Info</span>

Class with methods and properties for dealing with the [Konva](/docs/introduction) library in our photo editor (excluding the [Konva instance used with the text functionalities](/docs/introduction)). Is instanced and added onto to the main photoEditorLib object as photoEditorLib.konvaLib.

## <span style={{color: "#25c2a0"}}>Dependencies</span>

* [Konva](/docs/introduction)
* [ImageCropLib](/docs/introduction)

## <span style={{color: "#25c2a0"}}>Methods</span>

### constructor(options, callback)

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| options      | object |  | options object |
| options.initialScale      | number |  | initial scale of the photo instance |
| options.containerId      | string |  | id of the main Konva container HTML element |
| options.transformersContainerId      | string |  | id of the Konva container HTML element used for overlaying transformers |
| options.width      | number |  | width of the photo instance |
| options.height      | number |  | height of the photo instance |
| callback      | function |  | callback for when everything has been initialized |

returns: KonvaLib

### setBackgroundColor(rgbaString)

Set the fill color of the color background image (this.colorBackgroundImage).

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| rgbaString      | string |  | CSS-style rgba value "e.g rgba(255, 255, 255, 1)" |

returns: undefined

### createImageTransformer(image)

Returns a new Konva.Transformer with all the default properties used in the photo editor attached to a given image.
Does not add the transformer on to the stage.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | Image the created transformer will be attached to |

returns: Konva.Transformer

### addImage(imageObj, options)

Adds a given HTMLImageElement to the stage as a Konva.Image together with transformers.
Given image is expected to have a unique .id property that will be used as .photoEditorId property for the Konva.Image node.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| imageObj      | HTMLImageElement |  | image to add |
| options      | object |  | options object |
| options.draggable      | boolean | <optional\> | whether the image will be draggable, default: false |
| options.targetable      | boolean | <optional\> | whether the image will be targetable, default: false |

returns: Konva.Image

### rotateLayerContents(layer)

Rotates the contents of a given layer in such a way as if the layer had been rotated by 90 degrees clockwise by its center.
Does not rotate or change the offset or position values of the layer itself.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | layer to rotate contents of |

returns: undefined

### moveLayerContents(fromLayer, toLayer, useAbsolutePosition)

Moves the contents of the given fromLayer to the layer toLayer. If useAbsolutePosition is defined as true, will move the contents based on
absolute positioning instead of relative. So if the fromLayer has offsets, position or rotation transformations applied and the toLayer does not,
the contents will still be in the same place when viewed on the stage, only the layer will be free of any transformations that would complicate dealing with it.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| fromLayer      | Konva.Layer |  | layer to move contents from |
| toLayer      | Konva.Layer |  | layer to move contents to |

returns: undefined

### cloneLayerProperties(layer, layerToClone)

Copies the layer properties x, y, offsetX, offsetY, rotation, scale and size to the given layer from the layer layerToClone.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | target layer |
| layerToClone      | Konva.Layer |  | layer to copy properties from |

returns: undefined

### fixLayerContentsPositioning(layer)

Goes through the contents of a layer and sets their positions to be their absolute position. Then sets the position and offsets of the layer to 0.
Purpose of this is to remove transformations from a layer while keeping the contents in place when viewed on the stage.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | layer to fix the content positioning of |

returns: undefined

### cropImages(boundaryBox)

Crops the images on this.imagesLayer using the boundaries of the crop box given in boundaryBox.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| boundaryBox      | object |  | object with the boundaries of the crop box |
| boundaryBox.x      | number |  | top-left corner x value of the crop box |
| boundaryBox.y      | number |  | top-left corner y value of the crop box |
| boundaryBox.width      | number |  | width of the crop box |
| boundaryBox.height      | number |  | height of the crop box |

returns: undefined

### hideAllImages()

Does .hide() for all nodes under this.imagesLayer.

returns: undefined

### showAllImages()

Does .show() for all nodes under this.imagesLayer.

returns: undefined

### enableBackground()

Does .show() for this.backgroundImage and this.colorBackgroundImage.

returns: undefined

### disableBackground()

Does .hide() for this.backgroundImage and this.colorBackgroundImage.

returns: undefined

### cloneAllImages()

Clones all image nodes from this.imagesLayer and returns them. Used by [UndoRedoTypesLib](/docs/introduction) for undo/redo caching.

returns: Array

### bringToFront(konvaNode)

Purpose of this method is to bring the given Konva.Node (in our use a Konva.Image) to the front.
Does .moveToTop() on given konvaNode.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| konvaNode      | Konva.Node |  | node to bring to front |

returns: undefined

### targetImage(image)

Make given image the targeted image this.selectedTargetImage and apply targeted image visual properties such as shadow and border stroke and make the image transformers visible.
If already targeted, will untarget. Returns true if targeting/untargeting happened, false if image is not targetable.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to target |

returns: boolean

### unTargetImage(image)

Untarget given image if it is the currently selected image and unapply targeted image visual properties.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to untarget |

returns: undefined

### previewTargetImage(image)

Preview targeting is when an untargeted image is hovered, and it temporarily applies the visual properties of a targeted image to the hovered image to indicate it can be targeted. This method makes the given image the currently preview targeted image and applies preview targeted image visual properties.
Returns true if preview targeting happened, false if not (for example the image is already targeted, note the difference in behavior to this.targetImage(image), also returns false when image is not targetable)

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to preview target |

returns: boolean

### unPreviewTargetImage(image)

Un-preview-targets an image that is currently the preview targeted image.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to un-preview-target |

returns: undefined

### hideAllImageTransformers()

Does .hide() for all transformers from both this.mainLayer and this.transformersStageMainLayer.

returns: undefined

### hideImageTransformer(image)

Hides the image transformers (both from this.mainLayer and this.transformersStageMainLayer) attached to the given image.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to hide transformers of |

returns: undefined

### hideImageTransformer(image)

Shows the image transformers (both from this.mainLayer and this.transformersStageMainLayer) attached to the given image.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to show transformers of |

returns: undefined

### getImageTransformer(image, layer)

Alias for this.getNodeTransformer();

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to get the transformer of |
| layer      | Konva.Layer | <optional\> | layer to get the transformer from, default: this.mainLayer |

returns: Konva.Transformer

### getNodeTransformer(image, layer)

Returns transformers attached to given image from given layer. If no layer specified, uses this.mainLayer.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to get the transformer of |
| layer      | Konva.Layer | <optional\> | layer to get the transformer from, default: this.mainLayer |

returns: Konva.Transformer

### updateTransformers(layer)

Does .forceUpdate() on all transformers under given layer. Useful for when a Konva.Transformer isn't updating with the image its attached to after transformations have been made to the image.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | layer to update transformers of |

returns: undefined

### hideImage(image)

Does .visible(false) on given image.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to hide |

returns: undefined

### showImage(image)

Does .show() on given image.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | Konva.Image |  | image to show |

returns: undefined

### replaceImages(newImages, startIndex)

Replaces images in this.imagesLayer with equivalent images given in array newImages starting the replacing process from the index startIndex.
Expects the array to have matching order and length beginning from the start index. Images in array can be either HTMLImageElements or Konva.Images as long as they have either the correct .id if HTMLImageElements or .photoEditorId if Konva.Images. New images must match in their .id or .photoEditorId with the old images. The purpose of this method is refresh the contents of an existing Konva image node's image contents with a different version of the same image. Used for example when applying filters and then updating the visible images with the filter-applied images. Returns the whole collection of children in this.imagesLayer.
Does this.stage.batchDraw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| newImages      | [Konva.Image] \| [HTMLImageElement] |  | images to replace with |
| startIndex      | number |  | index to start replacing process from |

returns: Konva.Collection

### replaceImage(oldImage, newImageObj)

Replaces given oldImage with new image node on the stage, .photoEditorId of old image is copied to new image.
If given HTMLImageElement instead of ready Konva.Image, copies position coordinates and other properties but not offsets from the existing Konva.Image.
Returns an array with the new added image node at index 0 and the old removed image node at index 1

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| oldImage      | Konva.Image |  | old image to be replaced |
| newImageObj      | [Konva.Image] \| [HTMLImageElement] |  | new image to replace with |

returns: [Konva.Image, Konva.Image]

### replaceImageWithSameId(imageObj)

Does the same as this.replaceImage(oldImage, newImageObj) but uses .id or .photoEditorId of given new image to find the old image to be replaced.
Returns what this.replaceImage(oldImage, newImageObj) returns.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| imageObj      | [Konva.Image] \| [HTMLImageElement] |  | new image to replace id-matched old image with |

returns: [Konva.Image, Konva.Image]

### deleteImage(image)

Removes given image from its layer and hides its attached transformer from this.transformersStageMainLayer with .hide(). Returns removed image.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| image      | [Konva.Image] \| [HTMLImageElement] |  | new image to replace id-matched old image with |

returns: Konva.Image

### deleteImageWithId(id)

Finds image with given id from this.imagesLayer and then does the same as this.deleteImage(image). Returns removed image.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| id      | number |  | id of image to be deleted |

returns: Konva.Image

### getImageWithId(id)

Finds and returns image from this.imagesLayer that has .photoEditorId that matches given id.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| id      | number |  | id of image to get |

returns: Konva.Image

### getImageObjects(layer) ```async```

Returns the image contents of all Konva Image nodes under given layer as an array of HTMLImageElements.
Note, this is an async method.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | layer to get images from |

returns: [HTMLImageElement]

### bringImageToFront(image)

Makes the given image have zIndex of this.imagesLayer's childrens' length - 1.
Purpose of the method is to make the given image be shown above all other images in this.imagesLayer on the stage.
Does this.stage.draw().

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| layer      | Konva.Layer |  | layer to get images from |

returns: [HTMLImageElement]



## <span style={{color: "#25c2a0"}}>Properties</span>

### options

<Highlight color="rgb(173 173 173)">object</Highlight>

Options object for the KonvaLib instance.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| options.initialScale      | number |  | initial scale of the photo instance |
| options.containerId      | string |  | id of the main Konva container HTML element |
| options.transformersContainerId      | string |  | id of the Konva container HTML element used for overlaying transformers |
| options.width      | number |  | width of the photo instance |
| options.height      | number |  | height of the photo instance |

### initialScale

<Highlight color="rgb(173 173 173)">number</Highlight>

The value of options.initialScale given when the constructor method was called.

### stage

<Highlight color="rgb(173 173 173)">Konva.Stage</Highlight>

The main Konva.Stage that has the background tile pattern image, color fill background image, image nodes and main transformers of those image nodes.
The different layers are specified further below.

### transformersStage

<Highlight color="rgb(173 173 173)">Konva.Stage</Highlight>

The Konva.Stage that has the overlay duplicate transformers of currently active image nodes. The reason we have to keep duplicate image transformers active on this separate stage is so that the draw tool canvas can be placed on top of the Konva images' canvas but still have the transformer borders and anchors on top of the drawings and text.

### backgroundLayer

<Highlight color="rgb(173 173 173)">Konva.Layer</Highlight>

The layer that contains the tile background image and the color fill background image. Attached to this.stage.

### imagesLayer

<Highlight color="rgb(173 173 173)">Konva.Layer</Highlight>

The layer that contains all the active image nodes. Attached to this.stage.

### imagesLayerRotation

<Highlight color="rgb(173 173 173)">number</Highlight>

Keeps track of the imagined rotation angle of this.imagesLayer, although no actual rotation is ever kept applied to the layer.
Is always either 0, 90, 180 or 270.

### mainLayer

<Highlight color="rgb(173 173 173)">Konva.Layer</Highlight>

Could just as well be called "transformersLayer" because that's what it's only used for. Contains all the main (not overlay duplicate) transformers of the image nodes in this.imagesLayer. Attached to this.stage.

### transformersStageMainLayer

<Highlight color="rgb(173 173 173)">Konva.Layer</Highlight>

The duplicate equivalent of this.mainLayer but under a different stage, this.transformersStage. All the nodes under this layer are duplicate clones (but separate nodes) of the transformers on this.mainLayer. Attached to this.transformersStage.

### backgroundImage

<Highlight color="rgb(173 173 173)">Konva.Image</Highlight>

The background tile pattern image node. Attached to this.backgroundLayer.

### colorBackgroundImage

<Highlight color="rgb(173 173 173)">Konva.Image</Highlight>

The background color fill image. Attached to this.backgroundLayer.

### backgroundImageColor

<Highlight color="rgb(173 173 173)">string</Highlight>

The CSS-style color string of the background color fill image.
