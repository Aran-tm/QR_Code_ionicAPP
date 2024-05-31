import { Component } from '@angular/core';

import html2canvas from 'html2canvas';

// esto es para guardar imagenes en moviles, compartirlas
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  // esto es para establecer donde iniciar el segment
  segment = 'generate';
  qrText = '';

  constructor() { }

  // capturar el elemento html, convertirlo a canva y luego convertirlo a imagen
  captureScreen() {

    const element = document.getElementById('qrImage') as HTMLElement;

    html2canvas(element).then((canvas: HTMLCanvasElement) => {

      this.downloadImage(canvas);
    });
  }

  // for web
  downloadImage(canvas: HTMLCanvasElement) {

    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'qr.png';
    link.click();
  }

  // share image for mobile
  async shareImage(canvas: HTMLCanvasElement) {

    let base64 = canvas.toDataURL();
    let path = 'qr.png';

    // guarda la imagen en el dispositivo
    await Filesystem.writeFile({
      path: path,       // path va a ser el nombre con el que se va a guardar
      data: base64,      // imagen que se va a leer
      directory: Directory.Cache,     // directorio donde se va a almacenar
    }).then(async (res) => {

      let uri = res.uri;

      await Share.share({
        title: 'See cool stuff',
        text: 'Really awesome thing you need to see right meow',
        url: 'http://ionicframework.com/',
        dialogTitle: 'Share with buddies',
      });
    })

  }

}
