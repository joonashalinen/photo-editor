(this["webpackJsonpphoto-editor"]=this["webpackJsonpphoto-editor"]||[]).push([[0],{215:function(e,t,a){},216:function(e,t,a){},218:function(e,t,a){},241:function(e,t,a){},270:function(e,t){},272:function(e,t){},283:function(e,t){},285:function(e,t){},416:function(e,t,a){},430:function(e,t,a){"use strict";a.r(t);var n=a(5),i=a(0),o=a.n(i),s=a(23),r=a.n(s),c=(a(215),a(9)),l=a(10),d=a(13),h=a(17),u=(a.p,a(216),a(7)),m=a(26),g=a.n(m),v=a(51),f=(a(218),function(e){var t=e.id,a=e.containerId,i=e.style;return Object(n.jsx)("div",{id:a,className:"canvasContainer",style:i,children:Object(n.jsx)("canvas",{id:t,width:"100px",height:"100px",className:"canvas"})})}),p=a(432);var y=function(e){var t=e.min,a=e.max,i=e.defaultValue,o=e.title,s=e.onChange;return Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)("h5",{children:o}),Object(n.jsx)(p.a,{min:t,max:a,onChange:s,defaultValue:i})]})},C=a(434),x=a(435);function b(e){return Object(n.jsxs)("div",{children:[Object(n.jsxs)("h5",{style:{marginBottom:"5px",marginTop:"5px"},children:["Text Field",Object(n.jsx)(x.a,{style:{fontSize:"14px",color:"#ff7875",cursor:"pointer",marginLeft:"5px"},onClick:e.onDelete})]}),Object(n.jsx)(C.a.TextArea,{onChange:e.onInput,defaultValue:e.defaultValue,size:"small",style:{fontSize:"12px"}})]})}var j=a(102),w=a(55),I=(a(241),o.a.Component,a(431)),T=a(436);function O(e){return Object(n.jsx)(I.a,{accept:e.accept,action:e.onUpload,fileList:e.fileList?e.fileList:[],customRequest:function(e){e.onSuccess()},children:Object(n.jsx)(w.a,{icon:Object(n.jsx)(T.a,{}),children:"Select Photo"})})}var E=a(129),k=a.n(E),B=a(199),A=a.n(B),D=a(68),S=a.n(D),F=a(200),L=a.n(F),M=(a(57),function(){function e(){Object(c.a)(this,e)}return Object(l.a)(e,[{key:"rgbToHsl",value:function(e,t,a){e/=255,t/=255,a/=255;var n,i,o=Math.max(e,t,a),s=Math.min(e,t,a),r=(o+s)/2;if(o==s)n=i=0;else{var c=o-s;switch(i=r>.5?c/(2-o-s):c/(o+s),o){case e:n=(t-a)/c+(t<a?6:0);break;case t:n=(a-e)/c+2;break;case a:n=(e-t)/c+4}n/=6}return[n,i,r]}},{key:"hslToRgb",value:function(e,t,a){var n,i,o;if(0==t)n=i=o=a;else{var s=function(e,t,a){return a<0&&(a+=1),a>1&&(a-=1),a<1/6?e+6*(t-e)*a:a<.5?t:a<2/3?e+(t-e)*(2/3-a)*6:e},r=a<.5?a*(1+t):a+t-a*t,c=2*a-r;n=s(c,r,e+1/3),i=s(c,r,e),o=s(c,r,e-1/3)}return[255*n,255*i,255*o]}},{key:"saturate",value:function(e,t){for(var a,n,i=e.data,o=0;o<i.length;o+=4)(n=this.rgbToHsl(i[o],i[o+1],i[o+2]))[1]*=t,a=this.hslToRgb(n[0],n[1],n[2]),i[o]=a[0],i[o+1]=a[1],i[o+2]=a[2];console.log("finished")}}]),e}()),N=(a(416),function(e){Object(d.a)(a,e);var t=Object(h.a)(a);function a(e){var n;return Object(c.a)(this,a),(n=t.call(this,e)).state={image:e.image?e.image:"",numberOfTextFields:0,showAcceptCancelMenu:!1},n.imageFilters={contrast:0,brightness:0,saturation:0},n.colors=new M,n.activeTransformers=[],n.reattachTextAnchorList=[],n.imageInstanced=!1,n.inCropMode=!1,n.texts=[],n}return Object(l.a)(a,[{key:"initKonva",value:function(){var e=new S.a.Stage({container:"overlayCanvasContainer",width:document.getElementById("canvas").clientWidth,height:document.getElementById("canvas").clientHeight});console.log(document.getElementById("canvas").clientWidth);var t=new S.a.Layer;e.add(t),this.layer=t,this.stage=e,document.getElementById("overlayCanvasContainer").firstElementChild.style.transform="scale(".concat(this.scale,")"),document.getElementById("overlayCanvasContainer").firstElementChild.style.position="absolute",this.konvaReady=!0}},{key:"applyEffects",value:function(){var e=document.getElementById("canvas").getContext("2d"),t=this.originalImage.clone();for(var a in this.imageFilters)if(this.imageFilters[a]){if("saturation"===a)continue;t[a](this.imageFilters[a])}var n=new ImageData(Uint8ClampedArray.from(t.bitmap.data),t.bitmap.width);this.colors.saturate(n,1+this.imageFilters.saturation),e.putImageData(n,0,0)}},{key:"contrast",value:function(e){this.imageFilters.contrast=e/100,this.applyEffects()}},{key:"saturate",value:function(e){this.imageFilters.saturation=e/100,this.applyEffects()}},{key:"brightness",value:function(e){this.imageFilters.brightness=e/100,this.applyEffects()}},{key:"changeImage",value:function(){var e=Object(v.a)(g.a.mark((function e(t){var a,n,i,o,s,r,c,l,d=this;return g.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return this.imageInstanced||document.getElementById("saveImageButton").addEventListener("click",(function(){d.exportImage()})),this.imageInstanced=!0,console.log(t),e.next=5,k.a.read(t);case 5:a=e.sent,(n=document.getElementById("canvas")).height=a.bitmap.height,n.width=a.bitmap.width,i=n.getContext("2d"),o=n.parentElement,s=a.bitmap.width/a.bitmap.height,r=o.clientWidth/o.clientHeight,c=s>r?o.clientWidth/a.bitmap.width:o.clientHeight/a.bitmap.height,o.clientWidth>=a.bitmap.width&&o.clientHeight>=a.bitmap.height&&(c=1),this.scale=c,n.style.transform="scale(".concat(c,")"),l=new ImageData(Uint8ClampedArray.from(a.bitmap.data),a.bitmap.width),i.putImageData(l,0,0),this.image=a.clone(),this.originalImage=a,this.originalImageData=new ImageData(new Uint8ClampedArray(l.data),l.width,l.height),this.currentImageData=l;case 23:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"changeImageFromFile",value:function(e){var t=this;setTimeout((function(){}),5e3),e.arrayBuffer().then((function(e){k.a.read(e).then((function(e){var a=document.getElementById("canvas");a.height=e.bitmap.height,a.width=e.bitmap.width;var n=a.getContext("2d"),i=a.parentElement,o=e.bitmap.width/e.bitmap.height>i.clientWidth/i.clientHeight?i.clientWidth/e.bitmap.width:i.clientHeight/e.bitmap.height;t.scale=o,a.style.transform="scale(".concat(o,")");var s=new ImageData(Uint8ClampedArray.from(e.bitmap.data),e.bitmap.width);n.putImageData(s,0,0),t.setState({image:e})})).catch((function(e){console.log(e)}))})).catch((function(e){console.log(e)}))}},{key:"addText",value:function(){this.focusCanvasContainer("overlayCanvasContainer");var e=this.layer,t=new S.a.Text({x:this.layer.offsetX(),y:this.layer.offsetY(),text:"Simple Text",fontSize:30,fontFamily:"Impact",fill:"#111",draggable:!0});e.add(t);var a=new S.a.Transformer({nodes:[t],rotateAnchorOffset:60,enabledAnchors:["top-left","top-right","bottom-left","bottom-right"]});return e.add(a),t.text("Add text"),e.draw(),document.getElementById("overlayCanvasContainer").style.pointerEvents="auto",this.activeTransformers.push(a),t}},{key:"getTexts",value:function(){return this.layer.nodes()}},{key:"updateText",value:function(e,t){e.text(t),this.layer.draw()}},{key:"deleteText",value:function(e){var t=this.activeTransformers.filter((function(t){if(t.nodes()[0]===e)return!0}));Object(u.a)(t,1)[0].detach(),e.destroy(),this.layer.draw()}},{key:"removeAllAnchors",value:function(){if(console.log("removing anchors"),this.layer&&this.stage){for(var e=0;e<this.activeTransformers.length;e++)this.reattachTextAnchorList.push([this.activeTransformers[e],this.activeTransformers[e].nodes()]),this.activeTransformers[e].detach();this.activeTransformers=[],this.layer.draw()}}},{key:"readdAllAnchors",value:function(){console.log("readding anchors");for(var e=0;e<this.reattachTextAnchorList.length;e++){var t=this.reattachTextAnchorList[e];t[0].nodes(t[1]),this.activeTransformers.push(t[0])}this.reattachTextAnchorList=[],this.layer.draw()}},{key:"cloneKonvaStage",value:function(){var e=new S.a.Stage({container:document.createElement("div"),width:document.getElementById("canvas").clientWidth,height:document.getElementById("canvas").clientHeight});console.log(document.getElementById("canvas").clientWidth);var t=new S.a.Layer;return e.add(t),this.layer.getChildren().each((function(e,a){t.add(e)})),console.log(e),e}},{key:"beginCrop",value:function(){this.focusCanvasContainer("canvasContainer"),document.getElementById("drawingCanvasContainer").style.visibility="hidden",document.getElementById("overlayCanvasContainer").style.visibility="hidden";var e=document.getElementById("canvas"),t=document.getElementById("canvas").getContext("2d"),a=t.getImageData(0,0,e.clientWidth,e.clientHeight),n=new ImageData(new Uint8ClampedArray(a.data),a.width,a.height);t.drawImage(document.getElementById("drawingCanvas"),0,0),t.drawImage(this.stage.toCanvas(),0,0),this.beforeCropImageData=n;var i=new A.a(e,{crop:function(e){}});this.cropper=i}},{key:"endCrop",value:function(){document.getElementById("canvas").getContext("2d").putImageData(this.beforeCropImageData,0,0),document.getElementById("drawingCanvasContainer").style.visibility="visible",document.getElementById("overlayCanvasContainer").style.visibility="visible",this.cropper.destroy()}},{key:"getCroppedCanvas",value:function(e,t){var a=document.getElementById(t),n=a.getContext("2d"),i=n.getImageData(e.x,e.y,e.width,e.height),o=a;return o.width=e.width,o.height=e.height,o.id=t,(n=o.getContext("2d")).clearRect(0,0,a.width,a.height),n.putImageData(i,0,0),o}},{key:"acceptCrop",value:function(){var e=Object(v.a)(g.a.mark((function e(){var t,a,n,i,o=this;return g.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:(t=document.getElementById("canvas").getContext("2d")).putImageData(this.beforeCropImageData,0,0),a=this.cropper.getData(),n=t.getImageData(a.x,a.y,a.width,a.height),(i=document.createElement("canvas")).width=a.width,i.height=a.height,(t=i.getContext("2d")).putImageData(n,0,0),i.toBlob((function(e){e.arrayBuffer().then(function(){var e=Object(v.a)(g.a.mark((function e(t){var n;return g.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,o.changeImage(t);case 2:o.layer.offsetX(Math.floor(o.layer.offsetX()+a.x)),o.layer.offsetY(Math.floor(o.layer.offsetY()+a.y)),o.stage.size({width:Math.floor(a.width),height:Math.floor(a.height)}),o.layer.draw(),n=o.getCroppedCanvas(a,"drawingCanvas"),document.getElementById("drawingCanvasContainer").firstElementChild.remove(),document.getElementById("drawingCanvasContainer").appendChild(n),document.getElementById("overlayCanvasContainer").firstElementChild.style.transform="scale(".concat(o.scale,")"),document.getElementById("drawingCanvas").style.transform="scale(".concat(o.scale,")"),document.getElementById("drawingCanvasContainer").style.visibility="visible",document.getElementById("overlayCanvasContainer").style.visibility="visible",o.cropper.destroy();case 14:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}())}));case 10:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"enableDrawing",value:function(){if(this.focusCanvasContainer("drawingCanvasContainer"),!this.cfd){var e=new L.a({elementId:"drawingCanvas",width:document.getElementById("canvas").clientWidth,height:document.getElementById("canvas").clientHeight,backgroundColor:[0,0,0,0]});e.setLineWidth(3),e.setStrokeColor([11,11,11]),e.on({event:"redraw"},(function(){})),this.cfd=e,document.getElementById("drawingCanvas").style.transform="scale(".concat(this.scale,")")}}},{key:"disableDrawing",value:function(){}},{key:"focusCanvasContainer",value:function(e){document.getElementById("canvasContainer").style.pointerEvents="canvasContainer"===e?"auto":"none",document.getElementById("drawingCanvasContainer").style.pointerEvents="drawingCanvasContainer"===e?"auto":"none",document.getElementById("overlayCanvasContainer").style.pointerEvents="overlayCanvasContainer"===e?"auto":"none"}},{key:"exportImage",value:function(){console.log(this.state.selectedTool),"addText"===this.state.selectedTool&&this.removeAllAnchors();var e=document.getElementById("canvas"),t=document.getElementById("canvas").getContext("2d").getImageData(0,0,e.clientWidth,e.clientHeight),a=(new ImageData(new Uint8ClampedArray(t.data),t.width,t.height),document.createElement("canvas"));a.width=e.width,a.height=e.height;var n=a.getContext("2d");n.putImageData(t,0,0),n.drawImage(document.getElementById("drawingCanvas"),0,0),this.stage&&n.drawImage(this.stage.toCanvas(),0,0),"addText"===this.state.selectedTool&&this.readdAllAnchors(),function(e,t){e.toDataURL("image/png").replace("image/png","image/octet-stream");var a=document.createElement("a");a.download=t,a.href=e.toDataURL("image/png;base64"),a.click()}(a,"image.png")}},{key:"removeImageInstance",value:function(){if(this.imageInstanced){var e=document.getElementById("canvas"),t=document.getElementById("drawingCanvas"),a=document.getElementById("overlayCanvasContainer").firstElementChild.firstElementChild,n=e.getContext("2d");n.clearRect(0,0,e.width,e.height),(n=t.getContext("2d")).clearRect(0,0,e.width,e.height),(n=a.getContext("2d")).clearRect(0,0,e.width,e.height),this.konvaReady&&(document.getElementById("overlayCanvasContainer").firstElementChild.remove(),this.stage=!1,this.layer=!1,this.konvaReady=!1),this.cfd=!1,this.texts=[],this.setState({numberOfTexts:0})}}},{key:"focusTool",value:function(e){this.focusCanvasContainer({crop:"canvasContainer",addText:"overlayCanvasContainer",draw:"drawingCanvasContainer"}[e])}},{key:"render",value:function(){var e=this;setTimeout((function(){console.log("asdd")}),5e3);this.beginDrawing,this.enableDrawing,this.beginCrop,this.endCrop,this.acceptCrop,this.addText,this.updateText,this.exportImage,this.contrast,this.brightness,this.saturate,this.removeAnchors,this.removeAllAnchors,this.deleteText,this.focusTool;var t=["image/png","image/jpeg","image/jpg","image/svg","x-icon/svg","image/tiff","image/bmp","image/gif"],a=function(t,a){return e.konvaReady||e.initKonva(),e[t].apply(e,a)};return Object(n.jsxs)("div",{className:"mainContainer",children:[Object(n.jsx)("div",{className:"upperRow",children:Object(n.jsx)(O,{onUpload:function(a){t.includes(a.type)&&(e.removeImageInstance(),a.arrayBuffer().then((function(t){e.changeImage(t)})),e.setState({uploadFileList:[]}))},accept:"image/png,image/jpeg,image/jpg",showUploadList:{showPreviewIcon:!1},fileList:this.state.uploadFileList})}),Object(n.jsxs)("div",{className:"canvasTools",children:[Object(n.jsx)(f,{id:"canvas",containerId:"canvasContainer"}),Object(n.jsx)(f,{id:"drawingCanvas",containerId:"drawingCanvasContainer",style:{position:"absolute",top:0,left:0,backgroundColor:"transparent",pointerEvents:"none"}}),Object(n.jsx)(f,{id:"overlayCanvas",containerId:"overlayCanvasContainer",style:{position:"absolute",top:0,left:0,backgroundColor:"transparent",pointerEvents:"none"}}),Object(n.jsxs)("div",{id:"tools",className:"toolsMenuContainer",children:[Object(n.jsx)(y,{min:-100,max:100,defaultValue:0,title:"Contrast",onChange:function(e){a("contrast",[e])}}),Object(n.jsx)(y,{min:-100,max:100,defaultValue:0,title:"Brightness",onChange:function(e){a("brightness",[e])}}),Object(n.jsx)(y,{min:-100,max:100,defaultValue:0,title:"Saturation",onChange:function(e){a("saturate",[e])}}),Object(n.jsxs)("div",{className:"toolIcons",children:[Object(n.jsx)(j.a,{title:"Crop",children:Object(n.jsx)("div",{className:"toolIconContainer".concat("crop"===this.state.selectedTool?" toolIconContainerSelected":""),onClick:function(t){"crop"!==e.state.selectedTool&&("addText"===e.state.selectedTool&&a("removeAllAnchors",[]),a("focusTool",["crop"]),e.setState({showAcceptCancelMenu:!0,selectedTool:"crop",inCropMode:!0}),a("beginCrop",[]))},children:Object(n.jsx)("img",{className:"toolIcon",src:"crop-alt.svg",width:"24px"})})}),Object(n.jsx)(j.a,{title:"Add Text",children:Object(n.jsx)("div",{className:"toolIconContainer".concat("addText"===this.state.selectedTool?" toolIconContainerSelected":""),onClick:function(t){"addText"!==e.state.selectedTool&&("crop"===e.state.selectedTool&&a("endCrop",[]),a("readdAllAnchors",[]),a("focusTool",["addText"]),e.setState({selectedTool:"addText"}))},children:Object(n.jsx)("img",{className:"toolIcon",src:"text.svg",width:"24px"})})}),Object(n.jsx)(j.a,{title:"Draw",children:Object(n.jsx)("div",{className:"toolIconContainer".concat("draw"===this.state.selectedTool?" toolIconContainerSelected":""),onClick:function(t){"draw"!==e.state.selectedTool&&("crop"===e.state.selectedTool&&a("endCrop",[]),"addText"===e.state.selectedTool&&a("removeAllAnchors",[]),a("focusTool",["draw"]),e.setState({selectedTool:"draw"}),a("enableDrawing"))},children:Object(n.jsx)("img",{className:"toolIcon",src:"pen.svg",height:"18px"})})}),"crop"===this.state.selectedTool?Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(w.a,{onClick:function(t){a("acceptCrop",[]),e.setState({selectedTool:"",showAcceptCancelMenu:!1}),e.inCropMode=!1},type:"primary",className:"cropAccept",children:Object(n.jsx)("img",{className:"whiteCheckmark",src:"check.svg",height:"18px"})}),Object(n.jsx)(w.a,{onClick:function(){a("endCrop",[]),e.setState({selectedTool:"",showAcceptCancelMenu:!1}),e.inCropMode=!1},className:"cropCancel",children:"Cancel"})]}):null]}),"addText"===this.state.selectedTool?Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(w.a,{onClick:function(){var t=a("addText",[]);e.texts.push(t),e.setState({numberOfTexts:e.texts.length})},type:"dashed",size:"small",style:{fontSize:"12px",marginTop:"10px"},children:"+ New Text Field"}),Object(n.jsx)("div",{style:{height:"87px",overflow:"auto",marginTop:"5px"},children:this.state.numberOfTexts>0?this.texts.map((function(t,i){return Object(n.jsx)(b,{defaultValue:"Add Text",onDelete:function(){a("deleteText",[t]),e.texts.splice(e.texts.indexOf(t),1),e.setState({numberOfTexts:e.state.numberOfTexts-1}),e.forceUpdate()},onInput:function(e){a("updateText",[t,e.target.value])}},t._id)})):null})]}):null]})]})]})}}]),a}(o.a.Component)),H=a(433),R=function(e){Object(d.a)(a,e);var t=Object(h.a)(a);function a(e){var n;return Object(c.a)(this,a),(n=t.call(this,e)).showModal=function(){n.setState({visible:!0})},n.handleOk=function(e){},n.handleCancel=function(e){n.setState({visible:!1})},n.state={visible:!0},n.eventHub=e.eventHub,n}return Object(l.a)(a,[{key:"render",value:function(){return Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(w.a,{type:"primary",onClick:this.showModal,children:"Open Photo Editor"}),Object(n.jsx)(H.a,{title:this.props.title,visible:this.state.visible,onOk:this.handleOk,onCancel:this.handleCancel,okButtonProps:{id:"saveImageButton"},okText:"Save",children:this.props.children})]})}}]),a}(o.a.Component),W=(a(429),function(e){Object(d.a)(a,e);var t=Object(h.a)(a);function a(e){return Object(c.a)(this,a),t.call(this,e)}return Object(l.a)(a,[{key:"render",value:function(){return Object(n.jsx)("div",{class:"modalButtonContainer",children:Object(n.jsx)(R,{title:"Photo Editor",children:Object(n.jsx)(N,{})})})}}]),a}(o.a.Component)),U=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,437)).then((function(t){var a=t.getCLS,n=t.getFID,i=t.getFCP,o=t.getLCP,s=t.getTTFB;a(e),n(e),i(e),o(e),s(e)}))};r.a.render(Object(n.jsx)(o.a.StrictMode,{children:Object(n.jsx)(W,{})}),document.getElementById("root")),U()}},[[430,1,2]]]);
//# sourceMappingURL=main.328646bf.chunk.js.map