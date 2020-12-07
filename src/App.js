import React from "react";
import logo from './logo.svg';
import './App.less';
import { Image, Button } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons"
import PhotoEditor from "./PhotoEditor.js";
import PicturesWallQueue from "./PicturesWallQueue.js";
import 'cropperjs/dist/cropper.css';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div style={{display: "flex", width: "100%", height: "100%"}}>
        <div className="testLeftSidebar"></div>
        <div style={{width: "100%", overflowY: "auto", backgroundColor: "#1f1f1f"}}>
          <h1 style={{padding: "10px", marginTop: "20px"}}>Meme Generator</h1>
          <PhotoEditor/>
          <div style={{display: "flex", alignItems: "center", marginTop: "50px", padding: "10px"}}>
            <h2 style={{padding: "10px", fontWeight: "600"}}>Your Memes</h2>
          </div>
          <div style={{padding: "10px", transform: "scale(3) translate(33.33%, 33.33%)", width: "33.33%", marginLeft: "-7px"}}>
            <PicturesWallQueue />
          </div>
        </div>
        <div className="testRightSidebar"></div>
      </div>

    );
  }

}

export default App;
