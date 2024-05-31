import { Component, inject } from '@angular/core';

import html2canvas from 'html2canvas';

// esto es para guardar imagenes en moviles, compartirlas
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LoadingController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  loadingController = inject(LoadingController);
  platform = inject(Platform);    // para detectar las plataformas web, ios o android

  // esto es para establecer donde iniciar el segment
  segment = 'generate';
  qrText = '';

  constructor() { }

  // capturar el elemento html, convertirlo a canva y luego convertirlo a imagen
  captureScreen() {

    const element = document.getElementById('qrImage') as HTMLElement;

    html2canvas(element).then((canvas: HTMLCanvasElement) => {

      this.downloadImage(canvas);

      // esto es para saber si es dispositivos moviles
      if (this.platform.is('capacitor')) this.shareImage(canvas);

      // esto es para la web
      else this.downloadImage(canvas);
    });
  }

  // for web
  downloadImage(canvas: HTMLCanvasElement) {

    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'qr.png';
    link.click();
  }

  // proceso asincrono Pueden tardar mientras se ejecutan
  // share image for mobile
  async shareImage(canvas: HTMLCanvasElement) {

    let base64 = canvas.toDataURL();
    let path = 'qr.png';

    // loading de IONIC que demora 2 seg
    const loading = await this.loadingController.create({
      message: 'Hellooo',
      duration: 2000,
      spinner: 'crescent'
    });
    await loading.present();

    // guarda la imagen en el dispositivo
    await Filesystem.writeFile({
      path: path,       // path va a ser el nombre con el que se va a guardar
      data: base64,      // imagen que se va a leer
      directory: Directory.Cache,     // directorio donde se va a almacenar
    }).then(async (res) => {

      let uri = res.uri;

      // esto es para compartir la imagen en la uri
      await Share.share({
        url: uri,
      });

      // borrar la imagen del cache para no desgastar el espacio
      await Filesystem.deleteFile({
        path: path,
        directory: Directory.Cache,
      })
    }).finally(() => {    // este bloque se ejecuta cuando se finaliza el resto

      loading.dismiss();
    })

  }

}
