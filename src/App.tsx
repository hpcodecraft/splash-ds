import JSZip from 'jszip';
import React, { DragEvent, useEffect, useState } from "react";
import { Image, Layer, Rect, Stage, Text } from "react-konva";

import { MetaSection } from './components/MetaSection'
import { SplashImage } from './components/SplashImage'

// import original3DsImage from "./assets/original-3ds.png";
import logoImage from "./assets/splash-ds-logo.png";
import new3DsImage from "./assets/new-3ds.png";

import './styles/App.css';
import './styles/smdh_creator.css';


import { convertImageToBin } from './utils/convertImageToBin';
import { downloadFile } from './utils/downloadFile';
import { loadImage } from './utils/loadImage';
import { rotateImage } from './utils/rotateImage';
import { SMDH } from './utils/SMDH'

// @ts-expect-error
window.Konva.pixelRatio = 1;

interface IIndexable {
  [key: string]: any;
}

// console.log(window.Konva.pixelRatio, window.devicePixelRatio);

const screenConfig: IIndexable = {
  top: {
    x: (680 - 400)/2,
    y: 96,
    width: 400,
    height: 240,
  },
  bottom: {
    x: (680 - 320)/2,
    y: 415,
    width: 320,
    height: 240,
  }
}

// const iconConfig = {
//     x: (680 - 48)/2,
//     y: 126,
//     width: 48,
//     height: 48,
// }

// const scaleImage = (image: CanvasImageSource) => {
//   const scaledCanvas = document.createElement('canvas');
//   scaledCanvas.width = image.width as number * 0.5;
//   scaledCanvas.height = image.height as number * 0.5;

//   scaledCanvas
//     ?.getContext('2d')
//     ?.drawImage(image, 0, 0, scaledCanvas.width, scaledCanvas.height);

//   return scaledCanvas;
// }

// const previewImage = (canvas: HTMLCanvasElement) => {
//   const imageUrl = canvas.toDataURL("image/png");
//   const image = document.createElement('img');
//   image.width = canvas.width;
//   image.src = imageUrl;

//   document.getElementById('preview')?.appendChild(image);
// }

const App = () => {
  const [splashImage, setSplashImage] = useState(undefined);
  const [splashDataTop, setSplashDataTop] = useState('');
  const [splashDataBottom, setSplashDataBottom] = useState('');
  const [dsImage, setDsImage] = useState(undefined);
  const [previewImage, setPreviewImage] = useState('');
  // const [iconImage, setIconImage] = useState('');
  const [smdhFile, setSmdhFile] = useState<Blob | undefined>(undefined);

  const [dsOpacity, setDsOpacity] = useState(0)
  const [keepRatio, setKeepRatio] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState('#228ae2');

  const [downloadRequested, setDownloadRequested] = useState(false);

  const smdh = new SMDH();

  const reset = () => {
    setSplashImage(undefined);
    setSplashDataTop('');
    setSplashDataBottom('');
    const preview = document.getElementById('preview') as HTMLElement;
    preview.innerHTML = '';
    setPreviewImage('');
    // setIconImage('');
    setDownloadRequested(false);
  }

  const handleCancel = (e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    handleCancel(e);

    if (e.dataTransfer.files.length >= 1) {
      const file = e.dataTransfer.files[0];
      const allowed = {
        "image/jpeg": true,
        "image/gif": true,
        "image/png": true,
      };

      if (file.type in allowed) {
        const reader = new window.FileReader();
        reader.onload = (() => {
          return function (event: any) {
            const dataUrl = event.target.result;
            loadImage(dataUrl).then((img: any) => {
              setSplashImage(img);
            });
          };
        })();

        reader.readAsDataURL(file);
      }
    }
  };

  // const generateIcon = () => {
  //   console.log('generateIcon');

  //   const srcCanvas = document.getElementsByClassName('konvajs-content')[0].querySelector('canvas');

  //   const config = { ...iconConfig };
  //   config.x *= 2
  //   config.y *= 2
  //   config.width *= 2
  //   config.height *= 2

  //   const imgData = srcCanvas?.getContext('2d')?.getImageData(...Object.values(config) as [number, number, number, number])

  //   const tempCanvas = document.createElement("canvas");
  //   const tempContext = tempCanvas.getContext("2d");

  //   tempCanvas.width = config.width;
  //   tempCanvas.height = config.height;

  //   if(imgData) {
  //     tempContext?.putImageData(imgData, 0, 0);
  //   }

  //   // previewImage(tempCanvas);

  //   const imgDataUrl = tempCanvas.toDataURL("image/png");
  //   const iconImage = document.createElement('img');

  //   iconImage.onload = () => {
  //     const scaledIcon = scaleImage(iconImage);
  //     document.getElementById('icon')?.appendChild(scaledIcon);
  //     setIconImage(scaledIcon.toDataURL("image/png"));
  //   }

  //   iconImage.src = imgDataUrl;
  // }

  const cropScreen = (screen: string, callBack: Function) => {
    const srcCanvas = document.getElementsByClassName('konvajs-content')[0].querySelector('canvas');

    const config = {...screenConfig[screen]};
    // config.x *= window.Konva.pixelRatio
    // config.y *= window.Konva.pixelRatio
    // config.width *= window.Konva.pixelRatio
    // config.height *= window.Konva.pixelRatio

    const imgData = srcCanvas?.getContext('2d')?.getImageData(...Object.values(config) as [number, number, number, number])

    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");

    tempCanvas.width = config.width;
    tempCanvas.height = config.height;

    if(imgData) {
      tempContext?.putImageData(imgData, 0, 0);
    }

    // previewImage(tempCanvas);

    const imgDataUrl = tempCanvas.toDataURL("image/png");

    const finalImage = document.createElement('img');

    const previewConfig = screen === 'top' ? {x: 0, y: 0} : {x: 40, y: 240};

    finalImage.onload = () => {
      // const scaledImage = scaleImage(finalImage);
      const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
      previewCanvas?.getContext('2d')?.drawImage(finalImage, previewConfig.x, previewConfig.y);
      const rotatedImage = rotateImage(finalImage);
      const data = convertImageToBin(rotatedImage);
      if(data) {
        callBack(data);
      }
    }

    finalImage.src = imgDataUrl;
  }

  const splishSplash = () => {
    const smdhBlob = smdh.save();
    console.log('splishSplash smdh', smdhBlob);
    setSmdhFile(smdhBlob);

    setDownloadRequested(true);
  }

  // console.log({ screenConfig, splashDataTop, splashDataBottom });
  // console.log({ top: screenConfig.top, bottom: screenConfig.bottom });
  // console.log({ splashDataTop, splashDataBottom, previewImage, iconImage });

  useEffect(() => {
    loadImage(new3DsImage).then((img: any) => {
      setDsImage(img);
    });
  }, []);

  useEffect(() => {
    if(downloadRequested) {
      cropScreen('top', setSplashDataTop);
      cropScreen('bottom', setSplashDataBottom);

      // generateIcon();
    }
  }, [downloadRequested]);

  useEffect(() => {
    if(splashDataTop && splashDataBottom) {
      const previewImage = document.createElement('img');

      // previewImage.onload = () => {
      //   console.log('preview image loaded!');
      //   document.getElementById('preview')?.appendChild(previewImage);
      // }

      const previewCanvas = document?.getElementById('preview-canvas') as HTMLCanvasElement;
      const previewDataUrl = previewCanvas?.toDataURL("image/png");

      // console.log({ previewCanvas, previewDataUrl });

      setPreviewImage(previewDataUrl);
      previewImage.src = previewDataUrl;
    }
  }, [splashDataTop, splashDataBottom]);

  useEffect(() => {
    const downloadZip = () => {
      const zip = new JSZip();
      zip.file('splash.bin', splashDataTop, { binary: true, createFolders: false });
      zip.file('splashbottom.bin', splashDataBottom, { binary: true, createFolders: false });
      zip.file('preview.png', previewImage.slice(22), { base64: true, createFolders: false });
      if(smdhFile) {
        zip.file('info.smdh', smdhFile, { binary: true, createFolders: false});
      }

      zip.generateAsync({ type: "blob" }).then((blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
          const base64data = reader.result;
          if(base64data) {
            downloadFile(base64data as string, 'splash.zip');
          }
        }
      });
    }

    if(previewImage) {
      downloadZip();
      setDownloadRequested(false);

      setSplashDataTop('');
      setSplashDataBottom('');
      setPreviewImage('');
      // setIconImage('');

      // downloadFile("data:application/octet-stream;base64," + splashDataTop, 'splash.bin');
      // downloadFile("data:application/octet-stream;base64," + splashDataBottom, 'splashbottom.bin');
    }
  }, [/* iconImage, */ previewImage, splashDataBottom, splashDataTop]);

  return (
    <div className="App">
      <img id="logo" alt="logo" src={logoImage} />
      <h3>Splash screen creator for Nintendo 3DS systems</h3>
      <div onDragOver={handleCancel} onDrop={handleDrop}>
        <div id="options">
          <div className="option">
            <span className="input-spacer">
              <input id="dsTransparency" type="range" min={0} max={1} step={0.1} onChange={(e) => setDsOpacity(+e.target.value)} value={dsOpacity} />
            </span>
            <label htmlFor="dsTransparency">3DS transparency (helps when resizing and rotating)</label>
          </div>
          <div className="option">
            <span className="input-spacer">
              <input type="checkbox" id="keepRatio" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
            </span>
            <label htmlFor="keepRatio">Keep splash image ratio when resizing</label>
          </div>
          <div className="option">
            <span className="input-spacer">
              <input type="color" id="bgColor" onChange={(e) => setBackgroundColor(e.target.value)} value={backgroundColor} />
            </span>
            <label htmlFor="keepRatio">Screen background color</label>
          </div>
        </div>
        {/* <Stage width={window.innerWidth} height={window.innerHeight}> */}
        <Stage width={680} height={743}>
          <Layer>
            <Rect {...screenConfig.top} fill={backgroundColor} />
            <Rect {...screenConfig.bottom} fill={backgroundColor} />
            {/* <Rect {...iconConfig} fill={'tomato'} /> */}
            {splashImage
              ? <SplashImage image={splashImage} keepRatio={keepRatio} showTransformer={!downloadRequested} />
              : <Text text="Drop an image here" fontSize={32} fontStyle="bold" x={190} y={196} fill="#005aa8" stroke="white" strokeWidth={1} />
            }
            {dsImage && <Image image={dsImage} listening={false} opacity={1 - dsOpacity} />}
          </Layer>
        </Stage>
        <MetaSection smdh={smdh} />
        {/* <div id="icon">
        </div> */}
        <button onClick={splishSplash} disabled={!splashImage}>download splash screen</button>
        <button onClick={reset}>reset</button>
      </div>
      <div id="preview">
        <canvas
          id="preview-canvas"
          width={screenConfig.top.width}
          height={screenConfig.top.height + screenConfig.bottom.height}
          style={{ display: 'none' }}
        ></canvas>
      </div>
    </div>
  );
};

export default App;
