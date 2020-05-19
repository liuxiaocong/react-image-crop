(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/xiaoconglau/test/software-engineer-js-test/app/js/constant.js":[function(require,module,exports){
const lastDescriptionKey = 'canvas_last_description';
const lastActionInfoKey = 'canvas_last_action_info';
const lastImageDataKey = 'canvas_last_image_data';
const lastImageNameKey = 'canvas_last_image_name';
module.exports = {
  lastDescriptionKey,
  lastActionInfoKey,
  lastImageDataKey,
  lastImageNameKey,
}
},{}],"/Users/xiaoconglau/test/software-engineer-js-test/app/js/main.js":[function(require,module,exports){
// NOTE: you can use CommonJS here, for instance:
// var foo = require("npm-dependency");
// var bar = require("./path/to/local/file_without_extension");
// module.exports = someVariable;

// grab DOM elements inside index.html

// var bar = require("./path/to/local/file_without_extension");
//{
//  "canvas": {
//  "width": 15
//  "height": 10,
//    "photo" : {
//    "id": "filename",
//      "width": 20,
//      "height": 20,
//      "x": -2.5,
//      "y": -5
//    }
//  }
//}
var photoEditor = require('./photoEditor');
var { lastDescriptionKey, lastActionInfoKey } = require('./constant');
var imageContainer = document.getElementById('imageContainer');
var debugContainer = document.getElementById('debugContainer');
var generateButton = document.getElementById('generateButton');
var loadPreviousButton = document.getElementById('loadPrevious');
var backgroundImage = document.getElementById('backgroundImage');
var canvas = document.getElementById('canvas');
var sizeControllerWrap = document.getElementById('sizeControllerWrap');
var sizeController = document.getElementById('sizeController');
var sizeControlProgress = document.getElementById('sizeControlProgress');
var fileNameDom = document.getElementById('fileName');
var editor;

// some functions to get you started !!

function log(msg) {
  // show debug/state message on screen
  debugContainer.innerHTML += '<p>' + msg + '</p>';
}

// detect last action
if (localStorage.getItem(lastDescriptionKey) && localStorage.getItem(lastActionInfoKey)) {
  loadPreviousButton.style.display = 'inline-block';
}

fileSelector.onchange = function(e) {
  // get all selected Files
  var files = e.target.files;
  var file;
  for (var i = 0; i < files.length; ++i) {
    file = files[i];
    // check if file is valid Image (just a MIME check)
    switch (file.type) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        // read Image contents from file
        var reader = new FileReader();
        reader.onload = function(e) {
          // create HTMLImageElement holding image data
          var img = new Image();
          console.log(file);
          console.log(reader);
          img.src = reader.result;

          img.onload = function() {
            // grab some data from the image
            var imageData = {
              'width': img.naturalWidth,
              'height': img.naturalHeight,
            };
            log('Loaded Image w/dimensions ' + imageData.width + ' x ' +
              imageData.height);
            editor = photoEditor(backgroundImage, canvas, img, imageContainer, sizeControllerWrap, sizeController,
              sizeControlProgress, loadPreviousButton, fileNameDom, reader.result, file.name);
            editor.start();

          };
          // do your magic here...i do it above..
        };
        reader.readAsDataURL(file);
        // process just one file.
        return;

      default:
        log('not a valid Image file :' + file.name);
    }
  }
};

generateButton.onclick = function(e) {
  log('GENERATE BUTTON CLICKED!! Should this do something else?');
  if (editor) {
    log(editor.showDescription());
  }
};

loadPreviousButton.onclick = function(e) {
  // restore selector status , fix select same file issue
  fileSelector.value = '';
  if (editor) {
    editor.restoreLastDescription();
  } else {
    const lastDescription = localStorage.getItem(lastDescriptionKey) && JSON.parse(localStorage.getItem(lastDescriptionKey));
    const lastActionInfo = localStorage.getItem(lastActionInfoKey) && JSON.parse(localStorage.getItem(lastActionInfoKey));
    if (!lastActionInfo || !lastDescription) return;
    let img = new Image();
    img.src = lastActionInfo.imageData;
    img.onload = function() {
      var imageData = {
        'width': img.naturalWidth,
        'height': img.naturalHeight,
      };
      log('Loaded Image w/dimensions ' + imageData.width + ' x ' +
        imageData.height);
      editor = photoEditor(backgroundImage, canvas, img, imageContainer, sizeControllerWrap, sizeController,
        sizeControlProgress, loadPreviousButton, fileNameDom, lastActionInfo.imageData,
        lastActionInfo.imageName || '');
      editor.start();
      editor.restoreLastDescription();
      // log('Ignore the text "No file chosen", it care it we can use some css and js to optimize');
    };
  }
};
log('Test application ready');


},{"./constant":"/Users/xiaoconglau/test/software-engineer-js-test/app/js/constant.js","./photoEditor":"/Users/xiaoconglau/test/software-engineer-js-test/app/js/photoEditor.js"}],"/Users/xiaoconglau/test/software-engineer-js-test/app/js/photoEditor.js":[function(require,module,exports){
var { lastDescriptionKey, lastActionInfoKey } = require('./constant');
const photoEditor = (
  backgroundImage,
  canvas,
  loadedImage,
  imageContainer,
  sizeControllerWrap,
  sizeController,
  sizeControlProgress,
  loadPreviousButton,
  fileNameDom,
  initReaderResult,
  fileName,) => {
  const inchToPx = 96;
  const targetWidth = inchToPx * 15; // inches
  const context = canvas.getContext('2d');
  const containerWidth = 600;
  const containerHeight = 600;
  const canvasWidth = 450;
  const canvasHeight = 300;
  const covertRate = targetWidth / 450;
  const canvasLeftPadding = (containerWidth - 450) / 2;
  const canvasTopPadding = (containerHeight - 300) / 2;
  const imageContainerStartPosition = {};
  const sizeControllerStartPosition = {};
  const maxScaleTimes = 5;
  const description = {
    lastDescription: null,
    lastActionInfo: null,
  };
  try {
    description.lastDescription = localStorage.getItem(lastDescriptionKey) &&
      JSON.parse(localStorage.getItem(lastDescriptionKey));
    description.lastActionInfo = localStorage.getItem(lastActionInfoKey) &&
      JSON.parse(localStorage.getItem(lastActionInfoKey));
  } catch (ex) {
    console.error(ex);
  }

  let readerResult = initReaderResult;
  let image = loadedImage;
  let imageWidth = image.naturalWidth;
  let imageHeight = image.naturalHeight;
  let isLandscape = imageWidth > imageHeight;
  let minScaleTimes = 1;
  let initSizeControlPosition = 1;
  let sizeControlStep = (maxScaleTimes + minScaleTimes - 1) / 300;
  let currentBackgroundImageInfo = {};
  let isSizeControllerDragging = false;
  let isDragging = false;

  var ret = {
    start: function() {
      backgroundImage.src = image.src;
      this.updateFileName();
      this.initBackgroundImageSizeAndPosition();
      this.initSizeControl();
      imageContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        imageContainerStartPosition.x = e.clientX;
        imageContainerStartPosition.y = e.clientY;
        imageContainerStartPosition.imageX = currentBackgroundImageInfo.x;
        imageContainerStartPosition.imageY = currentBackgroundImageInfo.y;
      });
      imageContainer.addEventListener('mouseup', (e) => {
        isDragging = false;
      });
      imageContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) {
          return;
        }
        // move the background image
        const moveX = e.clientX - imageContainerStartPosition.x;
        const moveY = e.clientY - imageContainerStartPosition.y;
        const imageX = imageContainerStartPosition.imageX;
        const imageY = imageContainerStartPosition.imageY;
        let finalX = imageX + moveX;
        let finalY = imageY + moveY;
        this.updateBackgroundImageSizeAndPosition(finalX, finalY,
          currentBackgroundImageInfo.width, currentBackgroundImageInfo.height);
      });
    },

    updateFileName: function() {
      fileNameDom.innerText = fileName ? fileName : 'No File Chosen';
    },

    initSizeControl: function() {
      console.log('initSizeControl');
      if (currentBackgroundImageInfo.orginalHeight / canvasHeight >
        currentBackgroundImageInfo.orginalWidth / canvasWidth) {
        minScaleTimes = 1 / (currentBackgroundImageInfo.orginalWidth / canvasWidth);
      } else {
        minScaleTimes = 1 / (currentBackgroundImageInfo.orginalHeight / canvasHeight);
      }
      sizeControlStep = (maxScaleTimes + minScaleTimes) / 300;
      initSizeControlPosition = ((1 - minScaleTimes) / sizeControlStep);
      console.log(sizeControlStep);
      console.log(initSizeControlPosition);
      sizeController.style.left = initSizeControlPosition + 'px';
      sizeControlProgress.style.width = (initSizeControlPosition / 300) * 100 + '%';

      sizeControllerWrap.addEventListener('mousedown', (e) => {
        isSizeControllerDragging = true;
        sizeControllerStartPosition.left = sizeController.style.left ? parseInt(sizeController.style.left) : 0;
        sizeControllerStartPosition.x = e.clientX;
        sizeControllerStartPosition.y = e.clientY;
      });
      sizeControllerWrap.addEventListener('mouseup', (e) => {
        isSizeControllerDragging = false;
      });
      sizeControllerWrap.addEventListener('mousemove', (e) => {
        if (!isSizeControllerDragging) {
          return;
        }
        const moveX = e.clientX - sizeControllerStartPosition.x;
        let finalX = sizeControllerStartPosition.left + moveX;
        if (finalX < 0) {
          finalX = 0;
        }
        if (finalX > 300) {
          finalX = 300;
        }
        sizeController.style.left = finalX + 'px';
        sizeControlProgress.style.width = (finalX / 300) * 100 + '%';
        this.updateImageSizeWithControl(finalX);
      });
    },

    updateImageSizeWithControl: function(sizeControlX) {
      let scale = 1 + (sizeControlX - initSizeControlPosition) * sizeControlStep;
      if (scale < minScaleTimes) {
        scale = minScaleTimes;
      }
      if (scale > maxScaleTimes) {
        scale = maxScaleTimes;
      }
      let width = currentBackgroundImageInfo.orginalWidth * scale;
      let height = currentBackgroundImageInfo.orginalHeight * scale;
      if (width < canvasWidth) {
        width = canvasWidth;
        height = currentBackgroundImageInfo.orginalHeight / currentBackgroundImageInfo.orginalWidth * width;
      }
      if (height < canvasHeight) {
        height = canvasHeight;
        width = currentBackgroundImageInfo.orginalWidth / currentBackgroundImageInfo.orginalHeight * height;
      }
      const xNeedMove = (width - currentBackgroundImageInfo.width) / 2;
      const yNeedMove = (height - currentBackgroundImageInfo.height) / 2;
      const x = currentBackgroundImageInfo.x - xNeedMove;
      const y = currentBackgroundImageInfo.y - yNeedMove;
      this.updateBackgroundImageSizeAndPosition(x, y, width, height);

    },

    initBackgroundImageSizeAndPosition: function() {
      console.log(isLandscape);
      if (isLandscape) {
        const width = imageWidth / imageHeight * containerWidth;
        currentBackgroundImageInfo.orginalWidth = width;
        currentBackgroundImageInfo.orginalHeight = containerHeight;
        this.updateBackgroundImageSizeAndPosition(0, 0, width, containerHeight);
      } else {
        const height = imageHeight / imageWidth * containerHeight;
        currentBackgroundImageInfo.orginalWidth = containerWidth;
        currentBackgroundImageInfo.orginalHeight = height;
        this.updateBackgroundImageSizeAndPosition(0, 0, containerWidth, height);
      }
    },
    updateBackgroundImageSizeAndPosition: function(x, y, width, height) {
      //console.log('updateBackgroundImageSizeAndPosition: x=' + x + ', y=' + y +
      //  ', width=' + width + ', height=' + height);
      const maxX = canvasLeftPadding;
      const maxY = canvasTopPadding;
      // minX + currentBackgroundImageInfo.width > canvasLeftPadding + canvasWidth;
      const minX = canvasLeftPadding + canvasWidth -
        currentBackgroundImageInfo.width;
      const minY = canvasTopPadding + canvasHeight -
        currentBackgroundImageInfo.height;
      let left = x;
      let top = y;
      if (left > maxX) {
        left = maxX;
      }
      if (top > maxY) {
        top = maxY;
      }
      if (left < minX) {
        left = minX;
      }
      if (top < minY) {
        top = minY;
      }
      backgroundImage.style.left = left + 'px';
      backgroundImage.style.top = top + 'px';
      backgroundImage.style.width = width + 'px';
      backgroundImage.style.height = height + 'px';
      currentBackgroundImageInfo = Object.assign(currentBackgroundImageInfo, {
        x: left,
        y: top,
        width: width,
        height: height,
      });
      this.updateCanvasDisplay();
    },

    updateCanvasDisplay: function() {
      const x = canvasLeftPadding - currentBackgroundImageInfo.x;
      const y = canvasTopPadding - currentBackgroundImageInfo.y;
      //console.log('updateCanvasDisplay : x=' + x + ', y=' + y + ', width=' + currentBackgroundImageInfo.width +
      //  ', height=' + currentBackgroundImageInfo.height);
      //context.drawImage(image, x, y, currentBackgroundImageInfo.width,
      //  currentBackgroundImageInfo.height);

      context.drawImage(image, -x, -y, backgroundImage.width,
        backgroundImage.height);
    },

    setBodyScrollEnable: function(enable) {
      if (enable) {
        document.body.style.overflow = 'auto';
      } else {
        document.body.style.overflow = 'hidden';
      }
    },

    convertBackgroundImageInfoToInch: function() {
      return {
        width: (currentBackgroundImageInfo.width * covertRate / inchToPx).toFixed(2),
        height: (currentBackgroundImageInfo.height * covertRate / inchToPx).toFixed(2),
        x: ((canvasLeftPadding - currentBackgroundImageInfo.x) * covertRate / inchToPx).toFixed(2),
        y: ((canvasTopPadding - currentBackgroundImageInfo.y) * covertRate / inchToPx).toFixed(2),
      };
    },

    convertInchToBackgroundImageInfo: function(width, height, x, y) {
      return {
        width: width * inchToPx / covertRate,
        height: height * inchToPx / covertRate,
        x: canvasLeftPadding - x * inchToPx / covertRate,
        y: canvasTopPadding - y * inchToPx / covertRate,
      };
    },

    showDescription: function() {
      console.log(currentBackgroundImageInfo);
      const backgroundImageInfoToInch = this.convertBackgroundImageInfoToInch();
      const lastDescription = {
        'canvas': {
          'width': 15,
          'height': 10,
          'photo': {
            'id': fileName,
            'width': backgroundImageInfoToInch.width,
            'height': backgroundImageInfoToInch.height,
            'x': backgroundImageInfoToInch.x,
            'y': backgroundImageInfoToInch.y,
          },
        },
      };
      const lastActionInfo = {
        imageData: readerResult,
        imageName: fileName,
        sizeControllerLeft: sizeController.style.left,
        sizeControlProgressWidth: sizeControlProgress.style.width,
      };

      description.lastDescription = lastDescription;
      description.lastActionInfo = lastActionInfo;
      loadPreviousButton.style.display = 'inline-block';

      localStorage.setItem(lastDescriptionKey, JSON.stringify(lastDescription));
      localStorage.setItem(lastActionInfoKey, JSON.stringify(lastActionInfo));

      alert(JSON.stringify(lastDescription));
      return JSON.stringify(lastDescription);
    },

    restoreLastDescription: function() {
      if (description.lastDescription && description.lastActionInfo) {
        let img = new Image();
        img.src = description.lastActionInfo.imageData;
        readerResult = description.lastActionInfo.imageData;
        let that = this;
        img.onload = function() {
          // grab some data from the image
          image = img;
          fileName = description.lastActionInfo.imageName || '';
          imageWidth = image.naturalWidth;
          imageHeight = image.naturalHeight;
          isLandscape = imageWidth > imageHeight;
          that.start();
          console.log(description);
          const photo = description.lastDescription.canvas.photo;
          const backgroundInfoInPx = that.convertInchToBackgroundImageInfo(photo.width, photo.height, photo.x, photo.y);
          console.log(backgroundInfoInPx);
          that.updateBackgroundImageSizeAndPosition(backgroundInfoInPx.x, backgroundInfoInPx.y,
            backgroundInfoInPx.width,
            backgroundInfoInPx.height);
          sizeController.style.left = description.lastActionInfo.sizeControllerLeft;
          sizeControlProgress.style.width = description.lastActionInfo.sizeControlProgressWidth;
        };
      }
    },
  };
  return ret;
};

module.exports = photoEditor;
},{"./constant":"/Users/xiaoconglau/test/software-engineer-js-test/app/js/constant.js"}]},{},["/Users/xiaoconglau/test/software-engineer-js-test/app/js/main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvY29uc3RhbnQuanMiLCJhcHAvanMvbWFpbi5qcyIsImFwcC9qcy9waG90b0VkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IGxhc3REZXNjcmlwdGlvbktleSA9ICdjYW52YXNfbGFzdF9kZXNjcmlwdGlvbic7XG5jb25zdCBsYXN0QWN0aW9uSW5mb0tleSA9ICdjYW52YXNfbGFzdF9hY3Rpb25faW5mbyc7XG5jb25zdCBsYXN0SW1hZ2VEYXRhS2V5ID0gJ2NhbnZhc19sYXN0X2ltYWdlX2RhdGEnO1xuY29uc3QgbGFzdEltYWdlTmFtZUtleSA9ICdjYW52YXNfbGFzdF9pbWFnZV9uYW1lJztcbm1vZHVsZS5leHBvcnRzID0ge1xuICBsYXN0RGVzY3JpcHRpb25LZXksXG4gIGxhc3RBY3Rpb25JbmZvS2V5LFxuICBsYXN0SW1hZ2VEYXRhS2V5LFxuICBsYXN0SW1hZ2VOYW1lS2V5LFxufSIsIi8vIE5PVEU6IHlvdSBjYW4gdXNlIENvbW1vbkpTIGhlcmUsIGZvciBpbnN0YW5jZTpcbi8vIHZhciBmb28gPSByZXF1aXJlKFwibnBtLWRlcGVuZGVuY3lcIik7XG4vLyB2YXIgYmFyID0gcmVxdWlyZShcIi4vcGF0aC90by9sb2NhbC9maWxlX3dpdGhvdXRfZXh0ZW5zaW9uXCIpO1xuLy8gbW9kdWxlLmV4cG9ydHMgPSBzb21lVmFyaWFibGU7XG5cbi8vIGdyYWIgRE9NIGVsZW1lbnRzIGluc2lkZSBpbmRleC5odG1sXG5cbi8vIHZhciBiYXIgPSByZXF1aXJlKFwiLi9wYXRoL3RvL2xvY2FsL2ZpbGVfd2l0aG91dF9leHRlbnNpb25cIik7XG4vL3tcbi8vICBcImNhbnZhc1wiOiB7XG4vLyAgXCJ3aWR0aFwiOiAxNVxuLy8gIFwiaGVpZ2h0XCI6IDEwLFxuLy8gICAgXCJwaG90b1wiIDoge1xuLy8gICAgXCJpZFwiOiBcImZpbGVuYW1lXCIsXG4vLyAgICAgIFwid2lkdGhcIjogMjAsXG4vLyAgICAgIFwiaGVpZ2h0XCI6IDIwLFxuLy8gICAgICBcInhcIjogLTIuNSxcbi8vICAgICAgXCJ5XCI6IC01XG4vLyAgICB9XG4vLyAgfVxuLy99XG52YXIgcGhvdG9FZGl0b3IgPSByZXF1aXJlKCcuL3Bob3RvRWRpdG9yJyk7XG52YXIgeyBsYXN0RGVzY3JpcHRpb25LZXksIGxhc3RBY3Rpb25JbmZvS2V5IH0gPSByZXF1aXJlKCcuL2NvbnN0YW50Jyk7XG52YXIgaW1hZ2VDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1hZ2VDb250YWluZXInKTtcbnZhciBkZWJ1Z0NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWJ1Z0NvbnRhaW5lcicpO1xudmFyIGdlbmVyYXRlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dlbmVyYXRlQnV0dG9uJyk7XG52YXIgbG9hZFByZXZpb3VzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRQcmV2aW91cycpO1xudmFyIGJhY2tncm91bmRJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWNrZ3JvdW5kSW1hZ2UnKTtcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG52YXIgc2l6ZUNvbnRyb2xsZXJXcmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpemVDb250cm9sbGVyV3JhcCcpO1xudmFyIHNpemVDb250cm9sbGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpemVDb250cm9sbGVyJyk7XG52YXIgc2l6ZUNvbnRyb2xQcm9ncmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXplQ29udHJvbFByb2dyZXNzJyk7XG52YXIgZmlsZU5hbWVEb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZU5hbWUnKTtcbnZhciBlZGl0b3I7XG5cbi8vIHNvbWUgZnVuY3Rpb25zIHRvIGdldCB5b3Ugc3RhcnRlZCAhIVxuXG5mdW5jdGlvbiBsb2cobXNnKSB7XG4gIC8vIHNob3cgZGVidWcvc3RhdGUgbWVzc2FnZSBvbiBzY3JlZW5cbiAgZGVidWdDb250YWluZXIuaW5uZXJIVE1MICs9ICc8cD4nICsgbXNnICsgJzwvcD4nO1xufVxuXG4vLyBkZXRlY3QgbGFzdCBhY3Rpb25cbmlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShsYXN0RGVzY3JpcHRpb25LZXkpICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGxhc3RBY3Rpb25JbmZvS2V5KSkge1xuICBsb2FkUHJldmlvdXNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xufVxuXG5maWxlU2VsZWN0b3Iub25jaGFuZ2UgPSBmdW5jdGlvbihlKSB7XG4gIC8vIGdldCBhbGwgc2VsZWN0ZWQgRmlsZXNcbiAgdmFyIGZpbGVzID0gZS50YXJnZXQuZmlsZXM7XG4gIHZhciBmaWxlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgKytpKSB7XG4gICAgZmlsZSA9IGZpbGVzW2ldO1xuICAgIC8vIGNoZWNrIGlmIGZpbGUgaXMgdmFsaWQgSW1hZ2UgKGp1c3QgYSBNSU1FIGNoZWNrKVxuICAgIHN3aXRjaCAoZmlsZS50eXBlKSB7XG4gICAgICBjYXNlICdpbWFnZS9qcGVnJzpcbiAgICAgIGNhc2UgJ2ltYWdlL3BuZyc6XG4gICAgICBjYXNlICdpbWFnZS9naWYnOlxuICAgICAgICAvLyByZWFkIEltYWdlIGNvbnRlbnRzIGZyb20gZmlsZVxuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAvLyBjcmVhdGUgSFRNTEltYWdlRWxlbWVudCBob2xkaW5nIGltYWdlIGRhdGFcbiAgICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coZmlsZSk7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVhZGVyKTtcbiAgICAgICAgICBpbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcblxuICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGdyYWIgc29tZSBkYXRhIGZyb20gdGhlIGltYWdlXG4gICAgICAgICAgICB2YXIgaW1hZ2VEYXRhID0ge1xuICAgICAgICAgICAgICAnd2lkdGgnOiBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAnaGVpZ2h0JzogaW1nLm5hdHVyYWxIZWlnaHQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9nKCdMb2FkZWQgSW1hZ2Ugdy9kaW1lbnNpb25zICcgKyBpbWFnZURhdGEud2lkdGggKyAnIHggJyArXG4gICAgICAgICAgICAgIGltYWdlRGF0YS5oZWlnaHQpO1xuICAgICAgICAgICAgZWRpdG9yID0gcGhvdG9FZGl0b3IoYmFja2dyb3VuZEltYWdlLCBjYW52YXMsIGltZywgaW1hZ2VDb250YWluZXIsIHNpemVDb250cm9sbGVyV3JhcCwgc2l6ZUNvbnRyb2xsZXIsXG4gICAgICAgICAgICAgIHNpemVDb250cm9sUHJvZ3Jlc3MsIGxvYWRQcmV2aW91c0J1dHRvbiwgZmlsZU5hbWVEb20sIHJlYWRlci5yZXN1bHQsIGZpbGUubmFtZSk7XG4gICAgICAgICAgICBlZGl0b3Iuc3RhcnQoKTtcblxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gZG8geW91ciBtYWdpYyBoZXJlLi4uaSBkbyBpdCBhYm92ZS4uXG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICAvLyBwcm9jZXNzIGp1c3Qgb25lIGZpbGUuXG4gICAgICAgIHJldHVybjtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbG9nKCdub3QgYSB2YWxpZCBJbWFnZSBmaWxlIDonICsgZmlsZS5uYW1lKTtcbiAgICB9XG4gIH1cbn07XG5cbmdlbmVyYXRlQnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gIGxvZygnR0VORVJBVEUgQlVUVE9OIENMSUNLRUQhISBTaG91bGQgdGhpcyBkbyBzb21ldGhpbmcgZWxzZT8nKTtcbiAgaWYgKGVkaXRvcikge1xuICAgIGxvZyhlZGl0b3Iuc2hvd0Rlc2NyaXB0aW9uKCkpO1xuICB9XG59O1xuXG5sb2FkUHJldmlvdXNCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gcmVzdG9yZSBzZWxlY3RvciBzdGF0dXMgLCBmaXggc2VsZWN0IHNhbWUgZmlsZSBpc3N1ZVxuICBmaWxlU2VsZWN0b3IudmFsdWUgPSAnJztcbiAgaWYgKGVkaXRvcikge1xuICAgIGVkaXRvci5yZXN0b3JlTGFzdERlc2NyaXB0aW9uKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbGFzdERlc2NyaXB0aW9uID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obGFzdERlc2NyaXB0aW9uS2V5KSAmJiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGxhc3REZXNjcmlwdGlvbktleSkpO1xuICAgIGNvbnN0IGxhc3RBY3Rpb25JbmZvID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obGFzdEFjdGlvbkluZm9LZXkpICYmIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0obGFzdEFjdGlvbkluZm9LZXkpKTtcbiAgICBpZiAoIWxhc3RBY3Rpb25JbmZvIHx8ICFsYXN0RGVzY3JpcHRpb24pIHJldHVybjtcbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgaW1nLnNyYyA9IGxhc3RBY3Rpb25JbmZvLmltYWdlRGF0YTtcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW1hZ2VEYXRhID0ge1xuICAgICAgICAnd2lkdGgnOiBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAnaGVpZ2h0JzogaW1nLm5hdHVyYWxIZWlnaHQsXG4gICAgICB9O1xuICAgICAgbG9nKCdMb2FkZWQgSW1hZ2Ugdy9kaW1lbnNpb25zICcgKyBpbWFnZURhdGEud2lkdGggKyAnIHggJyArXG4gICAgICAgIGltYWdlRGF0YS5oZWlnaHQpO1xuICAgICAgZWRpdG9yID0gcGhvdG9FZGl0b3IoYmFja2dyb3VuZEltYWdlLCBjYW52YXMsIGltZywgaW1hZ2VDb250YWluZXIsIHNpemVDb250cm9sbGVyV3JhcCwgc2l6ZUNvbnRyb2xsZXIsXG4gICAgICAgIHNpemVDb250cm9sUHJvZ3Jlc3MsIGxvYWRQcmV2aW91c0J1dHRvbiwgZmlsZU5hbWVEb20sIGxhc3RBY3Rpb25JbmZvLmltYWdlRGF0YSxcbiAgICAgICAgbGFzdEFjdGlvbkluZm8uaW1hZ2VOYW1lIHx8ICcnKTtcbiAgICAgIGVkaXRvci5zdGFydCgpO1xuICAgICAgZWRpdG9yLnJlc3RvcmVMYXN0RGVzY3JpcHRpb24oKTtcbiAgICAgIC8vIGxvZygnSWdub3JlIHRoZSB0ZXh0IFwiTm8gZmlsZSBjaG9zZW5cIiwgaXQgY2FyZSBpdCB3ZSBjYW4gdXNlIHNvbWUgY3NzIGFuZCBqcyB0byBvcHRpbWl6ZScpO1xuICAgIH07XG4gIH1cbn07XG5sb2coJ1Rlc3QgYXBwbGljYXRpb24gcmVhZHknKTtcblxuIiwidmFyIHsgbGFzdERlc2NyaXB0aW9uS2V5LCBsYXN0QWN0aW9uSW5mb0tleSB9ID0gcmVxdWlyZSgnLi9jb25zdGFudCcpO1xuY29uc3QgcGhvdG9FZGl0b3IgPSAoXG4gIGJhY2tncm91bmRJbWFnZSxcbiAgY2FudmFzLFxuICBsb2FkZWRJbWFnZSxcbiAgaW1hZ2VDb250YWluZXIsXG4gIHNpemVDb250cm9sbGVyV3JhcCxcbiAgc2l6ZUNvbnRyb2xsZXIsXG4gIHNpemVDb250cm9sUHJvZ3Jlc3MsXG4gIGxvYWRQcmV2aW91c0J1dHRvbixcbiAgZmlsZU5hbWVEb20sXG4gIGluaXRSZWFkZXJSZXN1bHQsXG4gIGZpbGVOYW1lLCkgPT4ge1xuICBjb25zdCBpbmNoVG9QeCA9IDk2O1xuICBjb25zdCB0YXJnZXRXaWR0aCA9IGluY2hUb1B4ICogMTU7IC8vIGluY2hlc1xuICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnN0IGNvbnRhaW5lcldpZHRoID0gNjAwO1xuICBjb25zdCBjb250YWluZXJIZWlnaHQgPSA2MDA7XG4gIGNvbnN0IGNhbnZhc1dpZHRoID0gNDUwO1xuICBjb25zdCBjYW52YXNIZWlnaHQgPSAzMDA7XG4gIGNvbnN0IGNvdmVydFJhdGUgPSB0YXJnZXRXaWR0aCAvIDQ1MDtcbiAgY29uc3QgY2FudmFzTGVmdFBhZGRpbmcgPSAoY29udGFpbmVyV2lkdGggLSA0NTApIC8gMjtcbiAgY29uc3QgY2FudmFzVG9wUGFkZGluZyA9IChjb250YWluZXJIZWlnaHQgLSAzMDApIC8gMjtcbiAgY29uc3QgaW1hZ2VDb250YWluZXJTdGFydFBvc2l0aW9uID0ge307XG4gIGNvbnN0IHNpemVDb250cm9sbGVyU3RhcnRQb3NpdGlvbiA9IHt9O1xuICBjb25zdCBtYXhTY2FsZVRpbWVzID0gNTtcbiAgY29uc3QgZGVzY3JpcHRpb24gPSB7XG4gICAgbGFzdERlc2NyaXB0aW9uOiBudWxsLFxuICAgIGxhc3RBY3Rpb25JbmZvOiBudWxsLFxuICB9O1xuICB0cnkge1xuICAgIGRlc2NyaXB0aW9uLmxhc3REZXNjcmlwdGlvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGxhc3REZXNjcmlwdGlvbktleSkgJiZcbiAgICAgIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0obGFzdERlc2NyaXB0aW9uS2V5KSk7XG4gICAgZGVzY3JpcHRpb24ubGFzdEFjdGlvbkluZm8gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShsYXN0QWN0aW9uSW5mb0tleSkgJiZcbiAgICAgIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0obGFzdEFjdGlvbkluZm9LZXkpKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGV4KTtcbiAgfVxuXG4gIGxldCByZWFkZXJSZXN1bHQgPSBpbml0UmVhZGVyUmVzdWx0O1xuICBsZXQgaW1hZ2UgPSBsb2FkZWRJbWFnZTtcbiAgbGV0IGltYWdlV2lkdGggPSBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gIGxldCBpbWFnZUhlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gIGxldCBpc0xhbmRzY2FwZSA9IGltYWdlV2lkdGggPiBpbWFnZUhlaWdodDtcbiAgbGV0IG1pblNjYWxlVGltZXMgPSAxO1xuICBsZXQgaW5pdFNpemVDb250cm9sUG9zaXRpb24gPSAxO1xuICBsZXQgc2l6ZUNvbnRyb2xTdGVwID0gKG1heFNjYWxlVGltZXMgKyBtaW5TY2FsZVRpbWVzIC0gMSkgLyAzMDA7XG4gIGxldCBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mbyA9IHt9O1xuICBsZXQgaXNTaXplQ29udHJvbGxlckRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBpc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgdmFyIHJldCA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBiYWNrZ3JvdW5kSW1hZ2Uuc3JjID0gaW1hZ2Uuc3JjO1xuICAgICAgdGhpcy51cGRhdGVGaWxlTmFtZSgpO1xuICAgICAgdGhpcy5pbml0QmFja2dyb3VuZEltYWdlU2l6ZUFuZFBvc2l0aW9uKCk7XG4gICAgICB0aGlzLmluaXRTaXplQ29udHJvbCgpO1xuICAgICAgaW1hZ2VDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHtcbiAgICAgICAgaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIGltYWdlQ29udGFpbmVyU3RhcnRQb3NpdGlvbi54ID0gZS5jbGllbnRYO1xuICAgICAgICBpbWFnZUNvbnRhaW5lclN0YXJ0UG9zaXRpb24ueSA9IGUuY2xpZW50WTtcbiAgICAgICAgaW1hZ2VDb250YWluZXJTdGFydFBvc2l0aW9uLmltYWdlWCA9IGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLng7XG4gICAgICAgIGltYWdlQ29udGFpbmVyU3RhcnRQb3NpdGlvbi5pbWFnZVkgPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby55O1xuICAgICAgfSk7XG4gICAgICBpbWFnZUNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHtcbiAgICAgICAgaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBpbWFnZUNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xuICAgICAgICBpZiAoIWlzRHJhZ2dpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gbW92ZSB0aGUgYmFja2dyb3VuZCBpbWFnZVxuICAgICAgICBjb25zdCBtb3ZlWCA9IGUuY2xpZW50WCAtIGltYWdlQ29udGFpbmVyU3RhcnRQb3NpdGlvbi54O1xuICAgICAgICBjb25zdCBtb3ZlWSA9IGUuY2xpZW50WSAtIGltYWdlQ29udGFpbmVyU3RhcnRQb3NpdGlvbi55O1xuICAgICAgICBjb25zdCBpbWFnZVggPSBpbWFnZUNvbnRhaW5lclN0YXJ0UG9zaXRpb24uaW1hZ2VYO1xuICAgICAgICBjb25zdCBpbWFnZVkgPSBpbWFnZUNvbnRhaW5lclN0YXJ0UG9zaXRpb24uaW1hZ2VZO1xuICAgICAgICBsZXQgZmluYWxYID0gaW1hZ2VYICsgbW92ZVg7XG4gICAgICAgIGxldCBmaW5hbFkgPSBpbWFnZVkgKyBtb3ZlWTtcbiAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2VTaXplQW5kUG9zaXRpb24oZmluYWxYLCBmaW5hbFksXG4gICAgICAgICAgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ud2lkdGgsIGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLmhlaWdodCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlRmlsZU5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgZmlsZU5hbWVEb20uaW5uZXJUZXh0ID0gZmlsZU5hbWUgPyBmaWxlTmFtZSA6ICdObyBGaWxlIENob3Nlbic7XG4gICAgfSxcblxuICAgIGluaXRTaXplQ29udHJvbDogZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnaW5pdFNpemVDb250cm9sJyk7XG4gICAgICBpZiAoY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ub3JnaW5hbEhlaWdodCAvIGNhbnZhc0hlaWdodCA+XG4gICAgICAgIGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLm9yZ2luYWxXaWR0aCAvIGNhbnZhc1dpZHRoKSB7XG4gICAgICAgIG1pblNjYWxlVGltZXMgPSAxIC8gKGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLm9yZ2luYWxXaWR0aCAvIGNhbnZhc1dpZHRoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1pblNjYWxlVGltZXMgPSAxIC8gKGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLm9yZ2luYWxIZWlnaHQgLyBjYW52YXNIZWlnaHQpO1xuICAgICAgfVxuICAgICAgc2l6ZUNvbnRyb2xTdGVwID0gKG1heFNjYWxlVGltZXMgKyBtaW5TY2FsZVRpbWVzKSAvIDMwMDtcbiAgICAgIGluaXRTaXplQ29udHJvbFBvc2l0aW9uID0gKCgxIC0gbWluU2NhbGVUaW1lcykgLyBzaXplQ29udHJvbFN0ZXApO1xuICAgICAgY29uc29sZS5sb2coc2l6ZUNvbnRyb2xTdGVwKTtcbiAgICAgIGNvbnNvbGUubG9nKGluaXRTaXplQ29udHJvbFBvc2l0aW9uKTtcbiAgICAgIHNpemVDb250cm9sbGVyLnN0eWxlLmxlZnQgPSBpbml0U2l6ZUNvbnRyb2xQb3NpdGlvbiArICdweCc7XG4gICAgICBzaXplQ29udHJvbFByb2dyZXNzLnN0eWxlLndpZHRoID0gKGluaXRTaXplQ29udHJvbFBvc2l0aW9uIC8gMzAwKSAqIDEwMCArICclJztcblxuICAgICAgc2l6ZUNvbnRyb2xsZXJXcmFwLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7XG4gICAgICAgIGlzU2l6ZUNvbnRyb2xsZXJEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHNpemVDb250cm9sbGVyU3RhcnRQb3NpdGlvbi5sZWZ0ID0gc2l6ZUNvbnRyb2xsZXIuc3R5bGUubGVmdCA/IHBhcnNlSW50KHNpemVDb250cm9sbGVyLnN0eWxlLmxlZnQpIDogMDtcbiAgICAgICAgc2l6ZUNvbnRyb2xsZXJTdGFydFBvc2l0aW9uLnggPSBlLmNsaWVudFg7XG4gICAgICAgIHNpemVDb250cm9sbGVyU3RhcnRQb3NpdGlvbi55ID0gZS5jbGllbnRZO1xuICAgICAgfSk7XG4gICAgICBzaXplQ29udHJvbGxlcldyYXAuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB7XG4gICAgICAgIGlzU2l6ZUNvbnRyb2xsZXJEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBzaXplQ29udHJvbGxlcldyYXAuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHtcbiAgICAgICAgaWYgKCFpc1NpemVDb250cm9sbGVyRHJhZ2dpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW92ZVggPSBlLmNsaWVudFggLSBzaXplQ29udHJvbGxlclN0YXJ0UG9zaXRpb24ueDtcbiAgICAgICAgbGV0IGZpbmFsWCA9IHNpemVDb250cm9sbGVyU3RhcnRQb3NpdGlvbi5sZWZ0ICsgbW92ZVg7XG4gICAgICAgIGlmIChmaW5hbFggPCAwKSB7XG4gICAgICAgICAgZmluYWxYID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmluYWxYID4gMzAwKSB7XG4gICAgICAgICAgZmluYWxYID0gMzAwO1xuICAgICAgICB9XG4gICAgICAgIHNpemVDb250cm9sbGVyLnN0eWxlLmxlZnQgPSBmaW5hbFggKyAncHgnO1xuICAgICAgICBzaXplQ29udHJvbFByb2dyZXNzLnN0eWxlLndpZHRoID0gKGZpbmFsWCAvIDMwMCkgKiAxMDAgKyAnJSc7XG4gICAgICAgIHRoaXMudXBkYXRlSW1hZ2VTaXplV2l0aENvbnRyb2woZmluYWxYKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGVJbWFnZVNpemVXaXRoQ29udHJvbDogZnVuY3Rpb24oc2l6ZUNvbnRyb2xYKSB7XG4gICAgICBsZXQgc2NhbGUgPSAxICsgKHNpemVDb250cm9sWCAtIGluaXRTaXplQ29udHJvbFBvc2l0aW9uKSAqIHNpemVDb250cm9sU3RlcDtcbiAgICAgIGlmIChzY2FsZSA8IG1pblNjYWxlVGltZXMpIHtcbiAgICAgICAgc2NhbGUgPSBtaW5TY2FsZVRpbWVzO1xuICAgICAgfVxuICAgICAgaWYgKHNjYWxlID4gbWF4U2NhbGVUaW1lcykge1xuICAgICAgICBzY2FsZSA9IG1heFNjYWxlVGltZXM7XG4gICAgICB9XG4gICAgICBsZXQgd2lkdGggPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsV2lkdGggKiBzY2FsZTtcbiAgICAgIGxldCBoZWlnaHQgPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsSGVpZ2h0ICogc2NhbGU7XG4gICAgICBpZiAod2lkdGggPCBjYW52YXNXaWR0aCkge1xuICAgICAgICB3aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICBoZWlnaHQgPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsSGVpZ2h0IC8gY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ub3JnaW5hbFdpZHRoICogd2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAoaGVpZ2h0IDwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIGhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgd2lkdGggPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsV2lkdGggLyBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsSGVpZ2h0ICogaGVpZ2h0O1xuICAgICAgfVxuICAgICAgY29uc3QgeE5lZWRNb3ZlID0gKHdpZHRoIC0gY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ud2lkdGgpIC8gMjtcbiAgICAgIGNvbnN0IHlOZWVkTW92ZSA9IChoZWlnaHQgLSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5oZWlnaHQpIC8gMjtcbiAgICAgIGNvbnN0IHggPSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby54IC0geE5lZWRNb3ZlO1xuICAgICAgY29uc3QgeSA9IGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLnkgLSB5TmVlZE1vdmU7XG4gICAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmRJbWFnZVNpemVBbmRQb3NpdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIH0sXG5cbiAgICBpbml0QmFja2dyb3VuZEltYWdlU2l6ZUFuZFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKGlzTGFuZHNjYXBlKTtcbiAgICAgIGlmIChpc0xhbmRzY2FwZSkge1xuICAgICAgICBjb25zdCB3aWR0aCA9IGltYWdlV2lkdGggLyBpbWFnZUhlaWdodCAqIGNvbnRhaW5lcldpZHRoO1xuICAgICAgICBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsV2lkdGggPSB3aWR0aDtcbiAgICAgICAgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ub3JnaW5hbEhlaWdodCA9IGNvbnRhaW5lckhlaWdodDtcbiAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2VTaXplQW5kUG9zaXRpb24oMCwgMCwgd2lkdGgsIGNvbnRhaW5lckhlaWdodCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWFnZUhlaWdodCAvIGltYWdlV2lkdGggKiBjb250YWluZXJIZWlnaHQ7XG4gICAgICAgIGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLm9yZ2luYWxXaWR0aCA9IGNvbnRhaW5lcldpZHRoO1xuICAgICAgICBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5vcmdpbmFsSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmRJbWFnZVNpemVBbmRQb3NpdGlvbigwLCAwLCBjb250YWluZXJXaWR0aCwgaGVpZ2h0KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHVwZGF0ZUJhY2tncm91bmRJbWFnZVNpemVBbmRQb3NpdGlvbjogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgLy9jb25zb2xlLmxvZygndXBkYXRlQmFja2dyb3VuZEltYWdlU2l6ZUFuZFBvc2l0aW9uOiB4PScgKyB4ICsgJywgeT0nICsgeSArXG4gICAgICAvLyAgJywgd2lkdGg9JyArIHdpZHRoICsgJywgaGVpZ2h0PScgKyBoZWlnaHQpO1xuICAgICAgY29uc3QgbWF4WCA9IGNhbnZhc0xlZnRQYWRkaW5nO1xuICAgICAgY29uc3QgbWF4WSA9IGNhbnZhc1RvcFBhZGRpbmc7XG4gICAgICAvLyBtaW5YICsgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ud2lkdGggPiBjYW52YXNMZWZ0UGFkZGluZyArIGNhbnZhc1dpZHRoO1xuICAgICAgY29uc3QgbWluWCA9IGNhbnZhc0xlZnRQYWRkaW5nICsgY2FudmFzV2lkdGggLVxuICAgICAgICBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby53aWR0aDtcbiAgICAgIGNvbnN0IG1pblkgPSBjYW52YXNUb3BQYWRkaW5nICsgY2FudmFzSGVpZ2h0IC1cbiAgICAgICAgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8uaGVpZ2h0O1xuICAgICAgbGV0IGxlZnQgPSB4O1xuICAgICAgbGV0IHRvcCA9IHk7XG4gICAgICBpZiAobGVmdCA+IG1heFgpIHtcbiAgICAgICAgbGVmdCA9IG1heFg7XG4gICAgICB9XG4gICAgICBpZiAodG9wID4gbWF4WSkge1xuICAgICAgICB0b3AgPSBtYXhZO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnQgPCBtaW5YKSB7XG4gICAgICAgIGxlZnQgPSBtaW5YO1xuICAgICAgfVxuICAgICAgaWYgKHRvcCA8IG1pblkpIHtcbiAgICAgICAgdG9wID0gbWluWTtcbiAgICAgIH1cbiAgICAgIGJhY2tncm91bmRJbWFnZS5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG4gICAgICBiYWNrZ3JvdW5kSW1hZ2Uuc3R5bGUudG9wID0gdG9wICsgJ3B4JztcbiAgICAgIGJhY2tncm91bmRJbWFnZS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgIGJhY2tncm91bmRJbWFnZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8gPSBPYmplY3QuYXNzaWduKGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLCB7XG4gICAgICAgIHg6IGxlZnQsXG4gICAgICAgIHk6IHRvcCxcbiAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy51cGRhdGVDYW52YXNEaXNwbGF5KCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNhbnZhc0Rpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgeCA9IGNhbnZhc0xlZnRQYWRkaW5nIC0gY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ueDtcbiAgICAgIGNvbnN0IHkgPSBjYW52YXNUb3BQYWRkaW5nIC0gY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ueTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3VwZGF0ZUNhbnZhc0Rpc3BsYXkgOiB4PScgKyB4ICsgJywgeT0nICsgeSArICcsIHdpZHRoPScgKyBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby53aWR0aCArXG4gICAgICAvLyAgJywgaGVpZ2h0PScgKyBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby5oZWlnaHQpO1xuICAgICAgLy9jb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgeCwgeSwgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ud2lkdGgsXG4gICAgICAvLyAgY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8uaGVpZ2h0KTtcblxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIC14LCAteSwgYmFja2dyb3VuZEltYWdlLndpZHRoLFxuICAgICAgICBiYWNrZ3JvdW5kSW1hZ2UuaGVpZ2h0KTtcbiAgICB9LFxuXG4gICAgc2V0Qm9keVNjcm9sbEVuYWJsZTogZnVuY3Rpb24oZW5hYmxlKSB7XG4gICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNvbnZlcnRCYWNrZ3JvdW5kSW1hZ2VJbmZvVG9JbmNoOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdpZHRoOiAoY3VycmVudEJhY2tncm91bmRJbWFnZUluZm8ud2lkdGggKiBjb3ZlcnRSYXRlIC8gaW5jaFRvUHgpLnRvRml4ZWQoMiksXG4gICAgICAgIGhlaWdodDogKGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLmhlaWdodCAqIGNvdmVydFJhdGUgLyBpbmNoVG9QeCkudG9GaXhlZCgyKSxcbiAgICAgICAgeDogKChjYW52YXNMZWZ0UGFkZGluZyAtIGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvLngpICogY292ZXJ0UmF0ZSAvIGluY2hUb1B4KS50b0ZpeGVkKDIpLFxuICAgICAgICB5OiAoKGNhbnZhc1RvcFBhZGRpbmcgLSBjdXJyZW50QmFja2dyb3VuZEltYWdlSW5mby55KSAqIGNvdmVydFJhdGUgLyBpbmNoVG9QeCkudG9GaXhlZCgyKSxcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbnZlcnRJbmNoVG9CYWNrZ3JvdW5kSW1hZ2VJbmZvOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3aWR0aDogd2lkdGggKiBpbmNoVG9QeCAvIGNvdmVydFJhdGUsXG4gICAgICAgIGhlaWdodDogaGVpZ2h0ICogaW5jaFRvUHggLyBjb3ZlcnRSYXRlLFxuICAgICAgICB4OiBjYW52YXNMZWZ0UGFkZGluZyAtIHggKiBpbmNoVG9QeCAvIGNvdmVydFJhdGUsXG4gICAgICAgIHk6IGNhbnZhc1RvcFBhZGRpbmcgLSB5ICogaW5jaFRvUHggLyBjb3ZlcnRSYXRlLFxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgc2hvd0Rlc2NyaXB0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKGN1cnJlbnRCYWNrZ3JvdW5kSW1hZ2VJbmZvKTtcbiAgICAgIGNvbnN0IGJhY2tncm91bmRJbWFnZUluZm9Ub0luY2ggPSB0aGlzLmNvbnZlcnRCYWNrZ3JvdW5kSW1hZ2VJbmZvVG9JbmNoKCk7XG4gICAgICBjb25zdCBsYXN0RGVzY3JpcHRpb24gPSB7XG4gICAgICAgICdjYW52YXMnOiB7XG4gICAgICAgICAgJ3dpZHRoJzogMTUsXG4gICAgICAgICAgJ2hlaWdodCc6IDEwLFxuICAgICAgICAgICdwaG90byc6IHtcbiAgICAgICAgICAgICdpZCc6IGZpbGVOYW1lLFxuICAgICAgICAgICAgJ3dpZHRoJzogYmFja2dyb3VuZEltYWdlSW5mb1RvSW5jaC53aWR0aCxcbiAgICAgICAgICAgICdoZWlnaHQnOiBiYWNrZ3JvdW5kSW1hZ2VJbmZvVG9JbmNoLmhlaWdodCxcbiAgICAgICAgICAgICd4JzogYmFja2dyb3VuZEltYWdlSW5mb1RvSW5jaC54LFxuICAgICAgICAgICAgJ3knOiBiYWNrZ3JvdW5kSW1hZ2VJbmZvVG9JbmNoLnksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCBsYXN0QWN0aW9uSW5mbyA9IHtcbiAgICAgICAgaW1hZ2VEYXRhOiByZWFkZXJSZXN1bHQsXG4gICAgICAgIGltYWdlTmFtZTogZmlsZU5hbWUsXG4gICAgICAgIHNpemVDb250cm9sbGVyTGVmdDogc2l6ZUNvbnRyb2xsZXIuc3R5bGUubGVmdCxcbiAgICAgICAgc2l6ZUNvbnRyb2xQcm9ncmVzc1dpZHRoOiBzaXplQ29udHJvbFByb2dyZXNzLnN0eWxlLndpZHRoLFxuICAgICAgfTtcblxuICAgICAgZGVzY3JpcHRpb24ubGFzdERlc2NyaXB0aW9uID0gbGFzdERlc2NyaXB0aW9uO1xuICAgICAgZGVzY3JpcHRpb24ubGFzdEFjdGlvbkluZm8gPSBsYXN0QWN0aW9uSW5mbztcbiAgICAgIGxvYWRQcmV2aW91c0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XG5cbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGxhc3REZXNjcmlwdGlvbktleSwgSlNPTi5zdHJpbmdpZnkobGFzdERlc2NyaXB0aW9uKSk7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShsYXN0QWN0aW9uSW5mb0tleSwgSlNPTi5zdHJpbmdpZnkobGFzdEFjdGlvbkluZm8pKTtcblxuICAgICAgYWxlcnQoSlNPTi5zdHJpbmdpZnkobGFzdERlc2NyaXB0aW9uKSk7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobGFzdERlc2NyaXB0aW9uKTtcbiAgICB9LFxuXG4gICAgcmVzdG9yZUxhc3REZXNjcmlwdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoZGVzY3JpcHRpb24ubGFzdERlc2NyaXB0aW9uICYmIGRlc2NyaXB0aW9uLmxhc3RBY3Rpb25JbmZvKSB7XG4gICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nLnNyYyA9IGRlc2NyaXB0aW9uLmxhc3RBY3Rpb25JbmZvLmltYWdlRGF0YTtcbiAgICAgICAgcmVhZGVyUmVzdWx0ID0gZGVzY3JpcHRpb24ubGFzdEFjdGlvbkluZm8uaW1hZ2VEYXRhO1xuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBncmFiIHNvbWUgZGF0YSBmcm9tIHRoZSBpbWFnZVxuICAgICAgICAgIGltYWdlID0gaW1nO1xuICAgICAgICAgIGZpbGVOYW1lID0gZGVzY3JpcHRpb24ubGFzdEFjdGlvbkluZm8uaW1hZ2VOYW1lIHx8ICcnO1xuICAgICAgICAgIGltYWdlV2lkdGggPSBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gICAgICAgICAgaW1hZ2VIZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgIGlzTGFuZHNjYXBlID0gaW1hZ2VXaWR0aCA+IGltYWdlSGVpZ2h0O1xuICAgICAgICAgIHRoYXQuc3RhcnQoKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkZXNjcmlwdGlvbik7XG4gICAgICAgICAgY29uc3QgcGhvdG8gPSBkZXNjcmlwdGlvbi5sYXN0RGVzY3JpcHRpb24uY2FudmFzLnBob3RvO1xuICAgICAgICAgIGNvbnN0IGJhY2tncm91bmRJbmZvSW5QeCA9IHRoYXQuY29udmVydEluY2hUb0JhY2tncm91bmRJbWFnZUluZm8ocGhvdG8ud2lkdGgsIHBob3RvLmhlaWdodCwgcGhvdG8ueCwgcGhvdG8ueSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYmFja2dyb3VuZEluZm9JblB4KTtcbiAgICAgICAgICB0aGF0LnVwZGF0ZUJhY2tncm91bmRJbWFnZVNpemVBbmRQb3NpdGlvbihiYWNrZ3JvdW5kSW5mb0luUHgueCwgYmFja2dyb3VuZEluZm9JblB4LnksXG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW5mb0luUHgud2lkdGgsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW5mb0luUHguaGVpZ2h0KTtcbiAgICAgICAgICBzaXplQ29udHJvbGxlci5zdHlsZS5sZWZ0ID0gZGVzY3JpcHRpb24ubGFzdEFjdGlvbkluZm8uc2l6ZUNvbnRyb2xsZXJMZWZ0O1xuICAgICAgICAgIHNpemVDb250cm9sUHJvZ3Jlc3Muc3R5bGUud2lkdGggPSBkZXNjcmlwdGlvbi5sYXN0QWN0aW9uSW5mby5zaXplQ29udHJvbFByb2dyZXNzV2lkdGg7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGhvdG9FZGl0b3I7Il19
