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
  fileName) => {
  const inchToPx = 96;
  const targetWidth = inchToPx * 15; // inches
  const context = canvas.getContext('2d');
  const containerStyle = getComputedStyle(imageContainer, null);
  const containerWidth = parseInt(containerStyle.width);
  const containerHeight = parseInt(containerStyle.height);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const covertRate = targetWidth / canvasWidth;
  const canvasLeftPadding = (containerWidth - canvasWidth) / 2;
  const canvasTopPadding = (containerHeight - canvasHeight) / 2;
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
  let sizeControlStep = (maxScaleTimes + minScaleTimes - 1) / canvasHeight;
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
      if (!sizeController) {
        return;
      }
      if (currentBackgroundImageInfo.orginalHeight / canvasHeight >
        currentBackgroundImageInfo.orginalWidth / canvasWidth) {
        minScaleTimes = 1 / (currentBackgroundImageInfo.orginalWidth / canvasWidth);
      } else {
        minScaleTimes = 1 / (currentBackgroundImageInfo.orginalHeight / canvasHeight);
      }
      sizeControlStep = (maxScaleTimes + minScaleTimes) / canvasHeight;
      initSizeControlPosition = ((1 - minScaleTimes) / sizeControlStep);
      //console.log(sizeControlStep);
      //console.log(initSizeControlPosition);
      sizeController.style.left = initSizeControlPosition + 'px';
      sizeControlProgress.style.width = (initSizeControlPosition / canvasHeight) * 100 + '%';

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
        if (finalX > canvasHeight) {
          finalX = canvasHeight;
        }
        sizeController.style.left = finalX + 'px';
        sizeControlProgress.style.width = (finalX / canvasHeight) * 100 + '%';
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
      //console.log(isLandscape);
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
      //console.log(currentBackgroundImageInfo);
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
      };
      if (sizeController) {
        lastActionInfo.sizeControllerLeft = sizeController.style.left;
        lastActionInfo.sizeControlProgressWidth = sizeControlProgress.style.width;
      }

      description.lastDescription = lastDescription;
      description.lastActionInfo = lastActionInfo;
      loadPreviousButton.style.display = 'inline-block';

      localStorage.setItem(lastDescriptionKey, JSON.stringify(lastDescription));
      localStorage.setItem(lastActionInfoKey, JSON.stringify(lastActionInfo));

      //alert(JSON.stringify(lastDescription));
      return lastDescription;
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
          //console.log(description);
          const photo = description.lastDescription.canvas.photo;
          const backgroundInfoInPx = that.convertInchToBackgroundImageInfo(photo.width, photo.height, photo.x, photo.y);
          //console.log(backgroundInfoInPx);
          that.updateBackgroundImageSizeAndPosition(backgroundInfoInPx.x, backgroundInfoInPx.y,
            backgroundInfoInPx.width,
            backgroundInfoInPx.height);
          if (sizeController) {
            sizeController.style.left = description.lastActionInfo.sizeControllerLeft;
            sizeControlProgress.style.width = description.lastActionInfo.sizeControlProgressWidth;
          }
        };
      }
    },
    updatePercent: function(percent = 1) {
      let scale = percent;
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
  };
  return ret;
};

export default photoEditor;