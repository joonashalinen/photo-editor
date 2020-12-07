
import React from "react";
import { Upload, Modal, Image} from 'antd';
import { PlusOutlined, ToolOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import "./PicturesWallQueue.css";

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

class PicturesWallQueue extends React.Component {
  state = {
    previewVisible: false,
    previewImage: '',
    previewTitle: '',
    images: this.props.images
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true,
      previewTitle: file.name || file.url.substring(file.url.lastIndexOf('/') + 1),
    });
  };

  handleChange = ({ fileList }) => this.setState({ fileList });

  render() {
    const { previewVisible, previewImage, fileList, previewTitle } = this.state;
    const uploadButton = (
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
      </div>
    );
    return (
      <div class="picturesWallQueueMainContainer">
        {
          this.state.images.map((image) => {
            return (
              <div style={{width: this.props.width + 40, height: this.props.height + 40}} className="picturesWallQueueContainer">
                <Image className="picturesWallQueuePicture" width={this.props.width} src={image.url}/>
                <div className="picturesWallQueueIconsContainer">
                  <div className="picturesWallQueueIcons">
                    <EyeOutlined className="picturesWallQueueIcon" onClick={() => {
                      this.props.onClickDelete();
                    }}/>
                    <DeleteOutlined className="picturesWallQueueIcon" onClick={() => {
                      this.props.onClickDelete();
                    }}/>
                    <ToolOutlined className="picturesWallQueueIcon" onClick={() => {
                      this.props.onClickDelete();
                    }}/>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }
}

export default PicturesWallQueue;
