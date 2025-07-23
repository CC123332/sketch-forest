import React, { useRef, useState, useEffect } from "react";
import paperImage from './paper.png';
import flowerDefault from './flowerDefault.png';

const DrawingTool = ({ onSave }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [isErasing, setIsErasing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [lineWidth]);

  const loadDefaultImage = (ctx, canvas) => {
    const image = new Image();
    image.src = flowerDefault;
    image.onload = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctxRef.current = ctx;
    loadDefaultImage(ctx, canvas);
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
      ctxRef.current.strokeStyle = color;
    }
  }, [color, isErasing]);

  const startDrawing = (e) => {
    e.stopPropagation();
    setDrawing(true);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    e.stopPropagation();
    if (!drawing) return;
    const ctx = ctxRef.current;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.stopPropagation();
    setDrawing(false);
    ctxRef.current.closePath();
  };

  const saveDrawing = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    onSave(dataURL);
  };

  // This clears EVERYTHING including the flower image
  const clearToBlankCanvas = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Reset to default flower image
  const resetToDefault = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadDefaultImage(ctx, canvas);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fade-in-right"
      style={{
        textAlign: "center",
        padding: "10px",
        borderRadius: '5px',
        position: "absolute",
        top: "50px",
        right: 0,
        margin: "10px",
        backgroundImage: `url(${paperImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ border: "1px solid black", background: "transparent" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <br />
      <input
        type="color"
        value={color}
        onChange={(e) => { e.stopPropagation(); setColor(e.target.value); }}
        style={{ margin: "5px" }}
        disabled={isErasing}
      />
      <div style={{ margin: "5px" }}>
        <label htmlFor="lineWidthSlider">Brush Size: {lineWidth}</label>
        <input
          id="lineWidthSlider"
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => {
            e.stopPropagation();
            setLineWidth(parseInt(e.target.value));
          }}
        />
      </div>
      <button onClick={(e) => { e.stopPropagation(); setIsErasing(false); }} style={{ margin: "5px", padding: "5px", cursor:"pointer", background:"white", border: "1px solid black", borderRadius: "5px" }}>Draw</button>
      <button onClick={(e) => { e.stopPropagation(); setIsErasing(true); }} style={{ margin: "5px", padding: "5px", cursor:"pointer", background:"white", border: "1px solid black", borderRadius: "5px" }}>Erase</button>
      <button onClick={clearToBlankCanvas} style={{ margin: "5px", background:"white", border: "1px solid black", borderRadius: "5px", padding: "5px", cursor:"pointer" }}>
        Clear Canvas
      </button>
      <br />
      <button onClick={resetToDefault} style={{ margin: "5px", background: "#ff6666", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>
        Reset to Default
      </button>
      <button onClick={saveDrawing} style={{ margin: "5px", background:"white", padding: "5px", cursor:"pointer", border: "1px solid black", borderRadius: "5px" }}>Save Drawing</button>
    </div>
  );
};

export default DrawingTool;
