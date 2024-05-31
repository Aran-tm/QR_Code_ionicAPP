import { Component } from '@angular/core';

import html2canvas from 'html2canvas';

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

}
