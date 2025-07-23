import React, { useState } from "react";
import ThreeScene from "./ThreeScene";
import DrawingTool from "./DrawingTool";
import "./App.css";

export default function App() {
  const [image, setImage] = useState(null);
  const [addFlowerEnabled, setAddFlowerEnabled] = useState(false);
  const [eraseFlowerEnabled, setEraseFlowerEnabled] = useState(false);
  const [changeSizeEnabled, setChangeSizeEnabled] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [wasdMode, setWasdMode] = useState(false);


  const handleToggleAdd = () => {
    setAddFlowerEnabled((prev) => !prev);
    if (!addFlowerEnabled) {
      setEraseFlowerEnabled(false);
      setChangeSizeEnabled(false);
    }
  };

  const handleToggleErase = () => {
    setEraseFlowerEnabled((prev) => !prev);
    if (!eraseFlowerEnabled) {
      setAddFlowerEnabled(false);
      setChangeSizeEnabled(false);
    }
  };

  const handleToggleChangeSize = () => {
    setChangeSizeEnabled((prev) => !prev);
    if (!changeSizeEnabled) {
      setAddFlowerEnabled(false);
      setEraseFlowerEnabled(false);
    }
    if (changeSizeEnabled) {
      setSelectedFlower(null)
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', position: "absolute", top: "5px", right: "10px" }}>
        <button
          onClick={handleToggleAdd}
          style={{
            padding: "10px",
            margin: "10px",
            fontSize: "16px",
            background: addFlowerEnabled ? "#FF6666" : "white",
            border: "2px solid black",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {addFlowerEnabled ? "Disable Add Flower" : "Enable Add Flower"}
        </button>

        <button
          onClick={handleToggleErase}
          style={{
            padding: "10px",
            margin: "10px",
            fontSize: "16px",
            background: eraseFlowerEnabled ? "#FF6666" : "white",
            border: "2px solid black",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {eraseFlowerEnabled ? "Disable Erase Flower" : "Enable Erase Flower"}
        </button>

        <button
          onClick={handleToggleChangeSize}
          style={{
            padding: "10px",
            margin: "10px",
            fontSize: "16px",
            background: changeSizeEnabled ? "#FF6666" : "white",
            border: "2px solid black",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {changeSizeEnabled ? "Disable Change Size" : "Enable Change Size"}
        </button>

        <button
          onClick={() => setWasdMode(prev => !prev)}
          style={{
            padding: "10px",
            margin: "10px",
            fontSize: "16px",
            background: wasdMode ? "#FF6666" : "white",
            border: "2px solid black",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {wasdMode ? "Disable WASD Mode" : "Enable WASD Mode"}
        </button>
      </div>

      {addFlowerEnabled && <DrawingTool onSave={setImage} />}

      {changeSizeEnabled && selectedFlower && (
        <div 
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            padding: "20px",
            background: "white",
            border: "2px solid black",
            borderRadius: "5px",
            zIndex: 10,
            minWidth: "200px" 
          }}
          className="fade-in-left"
        >
          <div style={{fontWeight:"bold"}}>Flower Properties</div>

          <div style={{display:"flex"}}>
            <label>Scale</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={selectedFlower.scale}
              onChange={(e) => {
                const scale = parseFloat(e.target.value);
                selectedFlower.setScale(scale);
                setSelectedFlower((prev) => ({ ...prev, scale }));
              }}
            />
            <div>{selectedFlower.scale.toFixed(1)}</div>
          </div>

          <div style={{display:"flex"}}>
            <label>Rotation Y</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={selectedFlower.rotation}
              onChange={(e) => {
                const rotation = parseFloat(e.target.value);
                selectedFlower.setRotation(rotation);
                setSelectedFlower((prev) => ({ ...prev, rotation }));
              }}
            />
            <div>{`${selectedFlower.rotation.toFixed(0)}°`}</div>            
          </div>
        </div>
      )}

      <ThreeScene
        userImage={image}
        addFlowerEnabled={addFlowerEnabled}
        eraseFlowerEnabled={eraseFlowerEnabled}
        changeSizeEnabled={changeSizeEnabled}
        onSelectFlower={setSelectedFlower}
        wasdMode={wasdMode}
      />
    </div>
  );
}
