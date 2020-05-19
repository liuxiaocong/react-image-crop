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

