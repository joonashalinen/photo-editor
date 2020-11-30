import React from "react";
import logo from './logo.svg';
import './App.less';
import PhotoEditor from "./PhotoEditor.js"
import CustomModal from "./CustomModal.js";
import 'cropperjs/dist/cropper.css';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class="modalButtonContainer">
        <CustomModal title="Photo Editor">
          <PhotoEditor/>
        </CustomModal>
      </div>
    );
  }

}

export default App;
