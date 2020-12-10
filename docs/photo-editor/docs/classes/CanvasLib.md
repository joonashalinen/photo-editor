---
id: canvas-lib
title: CanvasLib
---

## Info

A utility methods library for dealing with HTMLCanvasElements.

## Dependencies

None.

## Methods

### cloneCanvas(canvas) ```static```

Clones canvas.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| canvas      | HTMLCanvasElement |  | canvas to be cloned |

returns: HTMLCanvasElement

### copyCanvasProperties(canvas, targetCanvas) ```static```

Copies the width, height and style.transform of canvas to target canvas.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| canvas      | HTMLCanvasElement |  | Canvas to copy from. |
| targetCanvas      |   HTMLCanvasElement    |    |   Canvas to copy to. |

returns: undefined

### rotateCanvas(canvas) ```static```

Rotates a given canvas by 90 degrees clockwise.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| canvas      | HTMLCanvasElement |  | Canvas to rotate. |

returns: undefined

### rotateCanvasSize(canvas) ```static```

Rotates the size of the canvas by 90 degrees clockwise (So in effect just switches height and width with each other).
Doesn't rotate the contents of the canvas.

| Name        |      Type      |   Attributes |   Description |
| ------------- | :-----------: | -----: | -----: |
| canvas      | HTMLCanvasElement |  | Canvas to change size of. |

returns: undefined
