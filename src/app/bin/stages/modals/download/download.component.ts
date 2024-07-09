import { Component } from '@angular/core';
import { DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IpcService } from '../../../shared/services/electron/ipc.service';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [],
  templateUrl: './download.component.html',
  styleUrl: './download.component.css',
  providers: [DialogService]
})
export class DownloadComponent {

  protected STATEMENT: number = 0;
  protected STATE_TEXT: string = 'Descargando instalador...';
  protected data: any;
  protected isLive: boolean = false;
  protected isReadyToInstall: boolean = false;

  protected progressBarLength: number = 0;
  protected percent: number = 0;
  protected speed: string = '0';

  constructor(
    private ref: DynamicDialogConfig,
    private _ipc: IpcService
  ){
    this.data = this.ref.data;
  }

  protected download(): void{
    this.STATEMENT = 1;
    this.isLive = true;

    this._ipc.send('configuration:updates', { activity: 1 });
    this._ipc.on('configuration:updates:reply', (event, data) => {
      // console.log(data);
      if(data.isDownloading === true){
        this.progressBarLength = data.progress.percent;
        this.percent = data.progress.percent.toFixed(1);
        this.speed = (data.progress.bytesPerSecond / 1024).toFixed(2);
      }

      if (data.isDownloaded === true){
        this.STATE_TEXT = "Descarga completada."
        this.isLive = false;
        this.isReadyToInstall = true;
      }
    });
  }

  protected cancel(): void{
    this._ipc.send('common:close-app');
  }

  protected install(): void{
    this.STATEMENT = 2;
    this._ipc.send('configuration:updates', { activity: 2 });
  }
}
