import React, { useEffect, useRef } from 'react';
import reactImgCrop from './react-img-crop';
import './App.css';

function App() {
  useEffect(() => {
    const imageContainer = document.getElementById('imageContainer');
    const debugContainer = document.getElementById('debugContainer');
    const generateButton = document.getElementById('generateButton');
    const loadPreviousButton = document.getElementById('loadPrevious');
    const backgroundImage = document.getElementById('backgroundImage');
    const canvas = document.getElementById('canvas');
    const sizeControllerWrap = document.getElementById('sizeControllerWrap');
    const sizeController = document.getElementById('sizeController');
    const sizeControlProgress = document.getElementById('sizeControlProgress');
    const fileNameDom = document.getElementById('fileName');
    const fileSelector = document.getElementById('fileSelector');

    const config = {
      imageContainer,
      generateButton,
      loadPreviousButton,
      backgroundImage,
      canvas,
      sizeControlProgress,
      sizeController,
      sizeControllerWrap,
      fileNameDom,
      fileSelector,
      debugContainer,
      onCrop: (info) => {
        console.log(info);
        const img = canvas.toDataURL('image/png');
        document.getElementById('result').src = img;


        var link = document.createElement('a');
        link.download = 'name';
        link.href = img;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        //console.log(img);
        //window.image = resultImage.current;
        //console.log(resultImage.current === document.getElementById('result'));
        //resultImage.current.src = `${ img }`;
      },
    };
    reactImgCrop.init(config);
    reactImgCrop.start();
  }, []);

  return (
    <div className="App">
      <p>
        Your application is ready. There should be a message in your browsers
        console indicating the JavaScript application has loaded.
      </p>
      <form action="#">
        <fieldset>
          <div className="topWrap">
            <label htmlFor="fileSelector">Select an Image file</label>
            <span className="fileWrap">
            <input type="file" id="fileSelector" className="fileSelector"/>
            <button>choose File</button>
            <span id="fileName" className="fileName">No File Chosen</span>
          </span>
            <span>Size control:</span>
            <div className="sizeControlWrap">
              <span className="label">-</span>
              <div className="controlBarWrap" id="sizeControllerWrap">
                <div className="controlProgress" id="sizeControlProgress"></div>
                <span className="controller" id="sizeController"></span>
              </div>
              <span className="label">+</span>
            </div>
          </div>
        </fieldset>
      </form>
      <div className="container">
        <div className="left">
          <div id="imageContainer">
            <img id="backgroundImage" className="backgroundImage"/>
            <div className="mask"></div>
            <canvas id="canvas" className="canvas" width="450" height="300"/>
          </div>
        </div>
        <div className="right">
          <div className="actionsWrap">
            <button id="generateButton">Generate!</button>
            <button id="loadPrevious">loads a previous!</button>
          </div>
          <div id="debugContainer">
            <img src='' id='result'/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
