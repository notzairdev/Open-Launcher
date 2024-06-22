import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Notyf } from 'notyf';
import { TooltipModule } from 'primeng/tooltip'
import { ProgressBarModule } from 'primeng/progressbar'
import { FileManager } from '../../../../shared/providers/styles.provider';

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [FormsModule, TooltipModule, ProgressBarModule],
  templateUrl: './init.component.html',
  styleUrl: './init.component.css'
})

export class InitComponent implements OnInit{

  protected minecraftManifest: any;
  
  protected currentButtonState: string = 'Leyendo datos...'
  protected isInstalledVersion: boolean = false;
  protected currentSubtext: string = ''

  protected CURRENT_FILES_DOWNLOAD: any[] = [];

  protected selectedVersion: any;
  protected isLiveAction: boolean = false;
  protected progressBar: boolean = false;
  protected progressBarLength: string = '0%';

  protected manifest: any;

  constructor(
    private _ipc: IpcService,
    private _loader: NgxUiLoaderService
  ){}

  private callNewManifest(): void{

    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
      dismissible: true,
    });

    this.isLiveAction = true;
    this._loader.start();

    this._ipc.send('minecraft:versions');
    this._ipc.once('minecraft:versions:reply', (event, data) => {
      if(data.error === true){
        notyf.error('Error al obtener las versiones de Minecraft. Reintentando...')
        this._loader.stop();
        setTimeout(() => {
          this.callNewManifest();
        }, 5000)
      };

      this._loader.stop();
      this.isLiveAction = false;
      this.minecraftManifest = data;

      this.selectedVersion = this.minecraftManifest[0].id;
      this.comprobateIsInstalledVersion();
    });
  }

  private readManifestVersions(): void{
    this._ipc.send('minecraft:manifest');
    this._ipc.once('minecraft:manifest:reply', (event, data) => {
      this.manifest = JSON.parse(data);
    });
  }

  comprobateIsInstalledVersion(): void{    
    if(this.manifest.versions.length == 0){
      this.currentButtonState = 'Instalar Minecraft';
      this.currentSubtext = 'Esperando instalación';
      this.isInstalledVersion = false;
      return;
    }

    for(let i = 0; i < this.manifest.versions.length; i++){
      if (this.manifest.versions[i].id == this.selectedVersion) {
        if (this.manifest.versions[i].currentState < 3) {
          this.currentButtonState = 'Instalar Minecraft';
          this.currentSubtext = 'Reanudar instalación de Minecraft';
          this.isInstalledVersion = false;
          return;
        }
        else{
          this.currentButtonState = 'Entrar a Minecraft';
          this.currentSubtext = 'Instancia instalada';
          this.isInstalledVersion = true;
          return;
        }
      }
      else {
        this.currentButtonState = 'Instalar Minecraft';
        this.currentSubtext = 'Esperando instalación';
        this.isInstalledVersion = false;
        return;
      }
    }
  }

  downloadOrRunMinecraftVersion(): void{

    const styleClass = new FileManager();

    let currentTick: number = 0;

    if(this.isInstalledVersion){
      this.isLiveAction = true;
      this.currentButtonState = "Ejecutando"
      this.currentSubtext = "Validando instalación..."

      const notyf = new Notyf({
        duration: 5000,
        position: {
          x: 'right',
          y: 'center',
        },
        dismissible: true,
      });

      this.updateCurrentRPC(['Jugando a Minecraft ' + this.selectedVersion, this.selectedVersion], 1);

      this._ipc.send('minecraft:run', {version: this.selectedVersion});
      this._ipc.on('minecraft:run:progress', (event, data) => {
        if(data.code === 'LAUNCHER_STARTING'){
          this.currentSubtext = 'Cargando OpenLauncher Assets...';
        }
        else if (data.code === 'LAUNCHER_JVM_START'){
          this.currentSubtext = 'Iniciando Minecraft...';
        }
        else if (data.code === 'LAUNCHER_FAILED_AUTH'){
          this.currentButtonState = 'Error al iniciar';
          this.currentSubtext = 'Token de inicio inválido';
          this.isLiveAction = false;
          notyf.error('Error: ' + data.type + '. Reinicie el launcher o intente nuevamente.')
        }

        // console.log(data)

        if(data.chunk){
          if (data.chunk.includes('Stopping!')) {
            this.currentButtonState = 'Entrar a Minecraft';
            this.currentSubtext = 'Instancia instalada';
            this.isLiveAction = false;
          }
        }

      });
    }
    else{
      this.isLiveAction = true;
      this.currentButtonState = "Descargando"
      this.currentSubtext = "Preparando instalación..."

      const notyf = new Notyf({
        duration: 5000,
        position: {
          x: 'right',
          y: 'center',
        },
        dismissible: true,
      });

      this._ipc.send('minecraft:install', {version: this.selectedVersion});
      this._ipc.on('minecraft:install:progress', (event, data) => {
        if (data.code === 'LAUNCHER_STARTING'){
          this.progressBar = true;
          currentTick = data.tick;
          if(currentTick != 0){
            this.currentSubtext = 'Verificando integridad...';
          }
          else{
            this.currentSubtext = 'Obteniendo manifest...';
          }
        }
        else if (data.code === 'LAUNCHER_DOWNLOADING'){
          styleClass.createListFiles(data.file)

          this.CURRENT_FILES_DOWNLOAD = styleClass.getCurrentFiles();

          if(currentTick == 0){
            this.currentSubtext = 'Descargando Minecraft Assets...';
          }
          else if (currentTick == 1){
            this.currentSubtext = 'Descargando Minecraft Libs...';
          }
          else {
            this.currentSubtext = 'Descargando OpenLauncher Assets...';
          }
          this.progressBarLength = ((data.totalfiles - data.remaining) / data.totalfiles) * 100 + '%';
        }
        else if (data.code === 'LAUNCHER_FINISHED'){
          this.readManifestVersions();
          if(data.tick){
            if (data.tick === 3) {
              this.currentButtonState = 'Ejecutando...'
              this.currentSubtext = 'Iniciando JVM...';
              this.progressBar = false;
            }
          }
        }
        else{
          this.currentButtonState = 'Error al instalar';
          this.currentSubtext = 'Archivo erroneo: ' + data.file;
          notyf.error('Error: ' + data.type + '. Reinicie el launcher o intente nuevamente.')
          
        }
      })
      this._ipc.once('minecraft:install:reply', (event, data) => {
        if(data.success = true){
          this.progressBar = false;
          this.progressBarLength = '0%';
        }
      });
    }
  }

  private updateCurrentRPC(args: string[], option: number): void{
    this._ipc.send('discord:change', { status: args, option: option});
    this._ipc.once('discord:change:reply', (event, data) => {
      if(data.success === false){
        const notyf = new Notyf({
          duration: 9000,
          position: {
            x: 'right',
            y: 'center',
          }
        });

        notyf.error('La presencia en Discord no se ha podido actualizar.');
      }
    });
  }

  ngOnInit(): void {
    this.callNewManifest();

    this.readManifestVersions();

    // this.updateCurrentRPC(['Esperando en el menu...'], 0)
  }
}
