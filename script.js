const canvas = document.querySelector("canvas");
const clearBtn = document.querySelector(".clear-canvas");
const toolBtns = document.querySelectorAll(".tool");
const colorPicker = document.querySelector(".color-picker");
const sizeSlider = document.querySelector("#size-slider");
const fillColor = document.querySelector("#fill-color");
const undoBtn = document.querySelector(".undo");
const reundoBtn = document.querySelector(".reundo");
const saveBlock = document.querySelector("#save-block");
const saveBtn = document.querySelector(".save-image");

ctx = canvas.getContext("2d");
currentTool = "brush";
currentColor = "black";
currentSize = 5;
isDrawing = false;
isFill = false;
preX = 0;
preY = 0;
preRadius = 0;
let snapshot = null,
  curSnapshot = null,
  lastSnapshot = undefined;

window.addEventListener("load", () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  reundoBtn.disabled = true;
});

window.addEventListener("resize",() => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.putImageData(lastSnapshot,0,0);
})

const drawCircle = (e) => {
  radius = Math.sqrt(
    (e.offsetX - preX) * (e.offsetX - preX) +
      (e.offsetY - preY) * (e.offsetY - preY)
  );

  ctx.beginPath();
  ctx.arc(preX, preY, radius, 0, 2 * Math.PI);
  if (isFill) ctx.fill();
  else ctx.stroke();
};

const drawRect = (e) => {
  if (isFill) {
    ctx.fillRect(preX, preY, e.offsetX - preX, e.offsetY - preY);
    ctx.fill();
    return;
  }
  ctx.strokeRect(preX, preY, e.offsetX - preX, e.offsetY - preY);
  ctx.stroke();
};

const drawStraightLine = (e) => {
  ctx.beginPath();
  ctx.moveTo(preX, preY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
};

const draw = (e) => {
  if (!isDrawing) return;
  ctx.putImageData(snapshot, 0, 0);
  if (currentTool == "brush") {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  } else if (currentTool == "eraser") {
    ctx.strokeStyle = "white";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  } else if (currentTool == "circle") {
    drawCircle(e);
  } else if (currentTool == "rectangle") {
    drawRect(e);
  } else if (currentTool == "straight-line") {
    drawStraightLine(e);
  }
  lastSnapshot = ctx.getImageData(0,0,canvas.width, canvas.height);
};

const mouseDown = (e) => {
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
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //console.log(preX, preY);
};

const mouseUp = () => {
  isDrawing = false;
};

const clearCanvas = () => {
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

canvas.addEventListener("pointerdown", mouseDown);
canvas.addEventListener("pointerup", mouseUp);
canvas.addEventListener("pointermove", draw);
clearBtn.addEventListener("click", clearCanvas);

toolBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // adding click event to all tool option
    // removing active class from the previous option and adding on current clicked option
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    currentTool = btn.id;
  });
});

function setColor(element) {
  currentColor = element.style.background;
}

colorPicker.addEventListener("input", () => {
  currentColor = colorPicker.value;
});

sizeSlider.addEventListener("input", () => {
  currentSize = sizeSlider.value;
});

fillColor.addEventListener("input", () => {
  isFill = true;
});

undoBtn.addEventListener("click", () => {
  curSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(snapshot, 0, 0);
  undoBtn.disabled = true;
  reundoBtn.disabled = false;
});

reundoBtn.addEventListener("click", () => {
  ctx.putImageData(curSnapshot, 0, 0);
  reundoBtn.disabled = true;
  undoBtn.disabled = false;
});

saveBtn.addEventListener("click",() => {
  console.log("btn clicked");
  const link = document.createElement("a");
  link.download = "myImage.jpg";
  link.href = canvas.toDataURL();
  link.click();
})