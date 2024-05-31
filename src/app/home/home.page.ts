import { Component, inject, OnInit } from '@angular/core';

import html2canvas from 'html2canvas';

// esto es para guardar imagenes en moviles, compartirlas
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// esto para compartir
import { Share } from '@capacitor/share';

// esto es de ionic para mostrar un modal de cargando
import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  ToastController,
} from '@ionic/angular';

// scanear codigo QR
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';

// seleccionar imagen de galeria
import { FilePicker } from '@capawesome/capacitor-file-picker';

// copiar imagenes al portapapeles
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  ngOnInit() {
    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }

  loadingController = inject(LoadingController);
  platform = inject(Platform); // para detectar las plataformas web, ios o android
  modalCtrl = inject(ModalController); // modal

  // esto es para establecer donde iniciar el segment
  segment = 'scan';
  scanResult = '';
  qrText = '';

  constructor(
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

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

  async readBarCodeFromImage() {
    const { files } = await FilePicker.pickImages();

    // seleccionar imagen en 0
    const path = files[0]?.path;

    if (!path) return;

    // devuelve el resultado del scaneo
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage({
      path: path,
      formats: [],
    });

    this.scanResult = barcodes[0].displayValue;
  }

  // esto es para iniciar el scanning
  async startScan() {
    const modal = await this.modalCtrl.create({
      component: BarcodeScanningModalComponent, // componente que va a abrir como modal
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back, // selecciona la camara parte trasera
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      this.scanResult = data?.barcode?.displayValue;
    }
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
      spinner: 'crescent',
    });
    await loading.present();

    // guarda la imagen en el dispositivo
    await Filesystem.writeFile({
      path: path, // path va a ser el nombre con el que se va a guardar
      data: base64, // imagen que se va a leer
      directory: Directory.Cache, // directorio donde se va a almacenar
    })
      .then(async (res) => {
        let uri = res.uri;

        // esto es para compartir la imagen en la uri
        await Share.share({
          url: uri,
        });

        // borrar la imagen del cache para no desgastar el espacio
        await Filesystem.deleteFile({
          path: path,
          directory: Directory.Cache,
        });
      })
      .finally(() => {
        // este bloque se ejecuta cuando se finaliza el resto

        loading.dismiss();
      });
  }

  // copia el scanneo
  writeToClipboard = async () => {
    await Clipboard.write({
      string: this.scanResult,
    });

    // mensaje despues de copiar al portapapeles
    const toast = await this.toastController.create({
      message: 'Copied to clipboard',
      duration: 1000,
      color: 'tertiary',
      icon: 'clipboard-outline',
      position: 'middle',
    });
    toast.present();
  };

  // abre en el navegador esa url
  openCapacitorSite = async () => {
    const alert = await this.alertController.create({
      header: 'Confirm!',
      mode: 'ios',
      message: 'Do you want to open this link in the browser ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Okay',
          handler: async () => {
            let url = this.scanResult;

            // si el resultado del scaneo no incluye https
            if (!['https://'].includes(this.scanResult)) {
              url = 'https://' + this.scanResult;
            }

            await Browser.open({ url });
          },
        },
      ],
    });

    await alert.present();
  };

  // cheque si es una url
  isURL() {
    let regex = /\.(com|net|io|me|crypto|ai)\b/i;
    return regex.test(this.scanResult);
  }
}
