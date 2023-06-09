const canvas = document.querySelector("#canvas");
const tmpCanvas = document.querySelector("#tmp-canvas");
const clearBtn = document.querySelector(".clear-canvas");
const toolBtns = document.querySelectorAll(".tool");
const colorPicker = document.querySelector(".color-picker");
const sizeSlider = document.querySelector("#size-slider");
const fillColor = document.querySelector("#fill-color");
const undoBtn = document.querySelector(".undo");
const reundoBtn = document.querySelector(".reundo");
const saveBlock = document.querySelector("#save-block");
const saveBtn = document.querySelector(".save-image");

let tmpCtx = tmpCanvas.getContext("2d");
let ctx = canvas.getContext("2d"),
  currentTool = "brush",
  currentColor = "black",
  currentSize = 3,
  isDrawing = false,
  isFill = false,
  preX = 0,
  preY = 0,
  preRadius = 0,
  snapshot = null,
  curSnapshot = null,
  lastSnapshot = null,
  curSelection = null,
  backgroundColor = "white",
  isDragging = false,
  existShape = false,
  cancelDragging = false,
  isFilledBack = false,
  dx = 0,
  dy = 0,
  tmpsnapshot = null;

// initialize a selection area
shape = { x: null, y: null, w: null, h: null };

function mouseMove(e) {
  if (shape != null && isInside(shape, e) && !isDrawing) {
    canvas.style.cursor = "move";
    tmpCanvas.style.cursor = "move";
  } else {
    canvas.style.cursor = "default";
    tmpCanvas.style.cursor = "default";
  }

  if (currentTool == "selection") {
    if (isDrawing) {
      shape.w = e.offsetX - shape.x;
      shape.h = e.offsetY - shape.y;
      renderSelection(shape);
    }
    if (isDragging) {
      //drawRect(shape);
      shape.x = -dx + e.offsetX;
      shape.y = -dy + e.offsetY;
      renderSelection(shape);
    }
    return;
  }

  // currentTool is not selection tool
  if (!isDrawing) return;
  if (snapshot != null) ctx.putImageData(snapshot, 0, 0);

  switch (currentTool) {
    case "brush":
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      break;
    case "eraser":
      ctx.strokeStyle = "white";
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      break;
    case "circle":
      drawCircle(e);
      break;
    case "rectangle":
      drawRect(e);
      break;
    case "straight-line":
      drawStraightLine(e);
      break;
  }
  lastSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function mouseDown(e) {
  if (!existShape)
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (currentTool == "selection") {
    if (!existShape) {
      // not finished selecting area
      isDrawing = true;
      tmpsnapshot = tmpCtx.getImageData(0, 0, canvas.width, canvas.height);
      shape.x = e.offsetX;
      shape.y = e.offsetY;
      return;
    }
    // finished selecting an area
    if (isInside(shape, e)) {
      // if mousedown and is inside the area
      // drag selected area
      // fill the back of the selected area with background color ONCE
      // if not isFilledBack
      if (!isFilledBack) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        isFilledBack = true;
      }
      isDragging = true;
      dx = e.offsetX - shape.x;
      dy = e.offsetY - shape.y;
      // this solve the misinteraction between Undo/Redo and Selection Tool
      reundoBtn.disabled = true;
      undoBtn.disabled = false;
      return;
    }

    selectionInterupt();
    //snapshot = lastSnapshot;

    // this solve the misinteraction between Undo/Redo and Selection Tool
    reundoBtn.disabled = true;
    undoBtn.disabled = false;
    return;
  }

  // current tool is not selection tool
  selectionInterupt();

  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);

  ctx.strokeStyle = currentColor; // set the stroke color
  ctx.fillStyle = currentColor; // set the fill color

  ctx.lineWidth = currentSize; // set size to the brush

  preX = e.offsetX;
  preY = e.offsetY;

  reundoBtn.disabled = true;
  undoBtn.disabled = false;
}

function mouseUp() {
  // fix the interaction between Undo/Redo and Selection Tool
  if (existShape && undoBtn.disabled == true) {
    undoBtn.disabled = false;
    reundoBtn.disabled = true;
  }

  if (currentTool == "selection") {
    isDragging = false;
    isDrawing = false;

    if (!existShape) {
      // this solve the problem when you selected nothing
      if (shape.w * shape.h == 0) return;
      // this solved the problem when you drag from different start direction
      if (shape.w < 0) shape.x += shape.w;
      if (shape.h < 0) shape.y += shape.h;
      shape.w = Math.abs(shape.w);
      shape.h = Math.abs(shape.h);

      // the selected area is stored in curSelection
      curSelection = ctx.getImageData(shape.x, shape.y, shape.w, shape.h);
    }
    existShape = true;
    window.addEventListener("keydown", (e) => {
      if (e.key == "Delete") {
        // delete the current selection
        curSelection = null;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        ctx.fill();
        //tmpCtx.clearRect(0, 0, canvas.width, canvas.height);

        selectionInterupt();
      }
      return;
    });
    return;
  }
  isDrawing = false;
}

// function to do smth :>
function selectionInitializer() {
  isDragging = false;
  dx = 0;
  dy = 0;
  existShape = false;
  isDrawing = false;
  cancelDragging = false;
  curSelection = null;
  tmpsnapshot = null;
  isFilledBack = false;
  shape = { x: null, y: null, w: null, h: null };
  return;
}

function setColor(element) {
  currentColor = element.style.background;
  selectionInterupt();
}

function clearCanvas() {
  selectionInterupt();
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function isInside(rect, mouse) {
  var dx = mouse.offsetX - rect.x;
  var dy = mouse.offsetY - rect.y;
  if (
    mouse.offsetX - rect.x >= 0 &&
    mouse.offsetX - rect.x <= rect.w &&
    mouse.offsetY - rect.y >= 0 &&
    mouse.offsetY - rect.y <= rect.h
  )
    return true;
  return false;
}

function setActiveTool(tool) {
  document.querySelector(".options .active").classList.remove("active");
  document.querySelector("#" + tool).classList.add("active");
  currentTool = tool;
}

function selectionInterupt() {
  // mousedown and not inside selected area
  // select, drag and drop finished
  if (curSelection != null) ctx.putImageData(curSelection, shape.x, shape.y);
  tmpCtx.clearRect(0, 0, canvas.width, canvas.height);

  // initialize selection variables for next selection
  selectionInitializer();
}

// interact with window event(load, resize, ..)
window.addEventListener("load", () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  tmpCanvas.width = tmpCanvas.offsetWidth;
  tmpCanvas.height = tmpCanvas.offsetHeight;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  reundoBtn.disabled = true;
  selectionInterupt();
});

window.addEventListener("resize", () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  tmpCanvas.width = tmpCanvas.offsetWidth;
  tmpCanvas.height = tmpCanvas.offsetHeight;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  selectionInterupt();
  if (lastSnapshot != null) ctx.putImageData(lastSnapshot, 0, 0);
});

// interact with buttons and input
colorPicker.addEventListener("input", () => {
  selectionInterupt();
  currentColor = colorPicker.value;
});

sizeSlider.addEventListener("input", () => {
  selectionInterupt();
  currentSize = sizeSlider.value;
});

fillColor.addEventListener("input", () => {
  selectionInterupt();
  isFill = true;
});

undoBtn.addEventListener("click", () => {
  selectionInterupt();
  curSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(snapshot, 0, 0);
  undoBtn.disabled = true;
  reundoBtn.disabled = false;
});

reundoBtn.addEventListener("click", () => {
  selectionInterupt();
  ctx.putImageData(curSnapshot, 0, 0);
  reundoBtn.disabled = true;
  undoBtn.disabled = false;
});

saveBtn.addEventListener("click", () => {
  selectionInterupt();
  const link = document.createElement("a");
  link.download = "myImage.jpg";
  link.href = canvas.toDataURL();
  link.click();
});

toolBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // adding click event to all tool option
    // removing active class from the previous option and adding on current clicked option
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    currentTool = btn.id;
    if (currentTool == "selection") selectionInitializer();
    selectionInterupt();
  });
});

clearBtn.addEventListener("click", clearCanvas);

// draw shapes
function drawCircle(e) {
  radius = Math.sqrt(
    (e.offsetX - preX) * (e.offsetX - preX) +
      (e.offsetY - preY) * (e.offsetY - preY)
  );

  ctx.beginPath();
  ctx.arc(preX, preY, radius, 0, 2 * Math.PI);
  if (isFill) ctx.fill();
  else ctx.stroke();
}

function drawRect(e) {
  if (isFill) {
    ctx.fillRect(preX, preY, e.offsetX - preX, e.offsetY - preY);
    ctx.fill();
    return;
  }
  ctx.strokeRect(preX, preY, e.offsetX - preX, e.offsetY - preY);
  ctx.stroke();
}

function drawStraightLine(e) {
  ctx.beginPath();
  ctx.moveTo(preX, preY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}

// this draw the rectangle with dash border
// show the border of the selection
function renderSelection(rect) {
  if (tmpsnapshot != null) tmpCtx.putImageData(tmpsnapshot, 0, 0);
  if (curSelection != null) tmpCtx.putImageData(curSelection, rect.x, rect.y);
  tmpCtx.lineWidth = 1;
  tmpCtx.setLineDash([5]);
  tmpCtx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

// interact with canvas
[tmpCanvas, canvas].forEach((cv) => {
  cv.addEventListener("pointerdown", mouseDown);
});

[tmpCanvas, canvas].forEach((cv) => {
  cv.addEventListener("pointerup", mouseUp);
});

[tmpCanvas, canvas].forEach((cv) => {
  cv.addEventListener("pointermove", mouseMove);
});
