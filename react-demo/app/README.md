### Simple image crop base on react
##### Config all take by user
* imageContainer
* debugContainer
* generateButton
* loadPreviousButton
* backgroundImage
* canvas
* sizeControllerWrap
* sizeController
* sizeControlProgress
* fileNameDom
* fileSelector
* editor
* onCrop
```
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

        //download
        var link = document.createElement('a');
        link.download = 'name';
        link.href = img;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    };
    reactImgCrop.init(config);
    reactImgCrop.start();
```

<img src="https://raw.githubusercontent.com/liuxiaocong/react-image-crop/master/react-demo/app/screenshot/1.jpeg" width="90%">

##### What's next? Optimize sizeController, give more custom action to user