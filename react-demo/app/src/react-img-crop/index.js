import photoEditor from './photoEditor';
const { lastDescriptionKey, lastActionInfoKey } = require('./constant');

const reactImgCrop = (function() {
  let imageContainer, debugContainer, generateButton, loadPreviousButton, backgroundImage,
      canvas, sizeControllerWrap, sizeController, sizeControlProgress, fileNameDom, fileSelector, editor, onCrop;
  const log = (msg)=>{
    debugContainer.innerHTML += '<p>' + msg + '</p>';
  };
  return {
    init:(config)=>{
      imageContainer = config.imageContainer;
      debugContainer = config.debugContainer;
      generateButton = config.generateButton;
      loadPreviousButton = config.loadPreviousButton;
      backgroundImage = config.backgroundImage;
      canvas = config.canvas;
      sizeControllerWrap = config.sizeControllerWrap;
      sizeController = config.sizeController;
      sizeControlProgress = config.sizeControlProgress;
      fileNameDom = config.fileNameDom;
      fileSelector = config.fileSelector;
      onCrop = config.onCrop;
    },

    start: ()=>{
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
                //console.log(file);
                //console.log(reader);
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
        if(onCrop && typeof onCrop === 'function'){
          onCrop(editor.showDescription())
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
    }
  }
})();

export default reactImgCrop;