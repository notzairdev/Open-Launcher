import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { FileManager } from '../../../../shared/providers/styles.provider';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Notyf } from 'notyf';
import { TooltipModule } from 'primeng/tooltip'
import { ProgressBarModule } from 'primeng/progressbar'
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DataService } from '../../../../shared/services/managers/data.service';
import { OptionsComponent } from '../../../modals/options/options.component';
import { LoggerService } from '../../../../shared/services/managers/logger.service';
import { SessionConfig } from '../../../../shared/providers/user.provider';
import { BetaComponent } from '../../../modals/beta/beta.component';

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [FormsModule, DynamicDialogModule, TooltipModule, ProgressBarModule, OverlayPanelModule],
  templateUrl: './init.component.html',
  styleUrl: './init.component.css',
  providers: [DialogService]
})

export class InitComponent implements OnInit{

  private ref: DynamicDialogRef | undefined;
  private ref2: DynamicDialogRef | undefined;

  protected minecraftManifest: any;
  protected saved: any;
  
  protected currentButtonState: string = 'Leyendo datos...'
  protected isInstalledVersion: boolean = false;
  protected currentSubtext: string = ''

  protected CURRENT_FILES_DOWNLOAD: any[] = [];

  protected selectedVersion: any;
  protected isLiveAction: boolean = false;
  protected progressBar: boolean = false;
  protected progressBarLength: string = '0%';

  protected config: SessionConfig | null = null;
  protected manifest: any;

  constructor(
    private _ipc: IpcService,
    private _loader: NgxUiLoaderService,
    private _data: DataService,
    private _dialog: DialogService,
    private _logger: LoggerService
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

    this._logger.log({ date: new Date(), severity: 'info', message: 'Reading Minecraft versions. Sending minecraft:versions event, waiting for reply to launchermeta.mojang.com' })
    
    this._ipc.send('minecraft:versions');
    this._ipc.once('minecraft:versions:reply', (event, data) => {
      if(data.error === true){
        this._logger.log({ date: new Date(), severity: 'error', message: 'Error reading Minecraft versions. Retrying...' })
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

      this._logger.log({ date: new Date(), severity: 'info', message: 'launchermeta.mojang.com is returned correct json.' })

      this.comprobateIsInstalledVersion();
    });
  }

  private readManifestVersions(): void{
    this._logger.log({ date: new Date(), severity: 'info', message: 'Reading manifest.json. Sending minecraft:manifest event, waiting for reply' })
    
    this._ipc.send('minecraft:manifest');
    this._ipc.once('minecraft:manifest:reply', (event, data) => {
      this.manifest = JSON.parse(data);
    });
  }

  comprobateIsInstalledVersion(): void{    

    this._logger.log({ date: new Date(), severity: 'info', message: 'Version changed: ' + this.selectedVersion })

    if(this.manifest.versions.length == 0){
      this.currentButtonState = 'Instalar Minecraft';
      this.currentSubtext = 'Esperando instalación';
      this.isInstalledVersion = false;
      return;
    }

    for(let i = 0; i < this.manifest.versions.length; i++){
      if (this.manifest.versions[i].id == this.selectedVersion) {
        if (this.manifest.versions[i].currentState < 4) {
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

  private addNewVersion(): Promise<void>{
    return new Promise((resolve, reject) => {
      this._logger.log({ date: new Date(), severity: 'info', message: 'Adding new version to manifest.json. Sending minecraft:new event, waiting for reply.' })

      this._ipc.send('minecraft:new', { version: this.selectedVersion });
      this._ipc.once('minecraft:new:reply', (event, data) => {
        if(data.success === true){
          this._logger.log({ date: new Date(), severity: 'info', message: 'Version added to manifest.json. Version: ' + this.selectedVersion })
          
          setTimeout(() => {
            resolve();
          }, 2000)
        }
        else{
          this._logger.log({ date: new Date(), severity: 'error', message: 'Error adding version to manifest.json. Version: ' + this.selectedVersion })
          
          reject();
        }
      });
    })
  }

  async downloadOrRunMinecraftVersion(): Promise<void>{
    let currentTick: number = 0;

    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
      dismissible: true,
    });

    this.isLiveAction = true;

    if(!this.isInstalledVersion){
      this.currentButtonState = "Descargando"
      this.currentSubtext = "Preparando instalación..."
      
      this._logger.log({ date: new Date(), severity: 'info', message: 'Trying download a Minecraft version: ' + this.selectedVersion })

      try{
        await this.addNewVersion();

        this._ipc.send('minecraft:install', {version: this.selectedVersion});
        this._ipc.on('minecraft:install:progress', (event, data) => {
          if (data.code === 'LAUNCHER_STARTING'){
            currentTick = data.payloads;

            this.progressBar = true;

            this._logger.log({ date: new Date(), severity: 'info', message: 'Starting installation step.' })

            if(currentTick != 1){
              this.currentSubtext = 'Verificando integridad...';
            }
            else{
              this.currentSubtext = 'Obteniendo manifest...';
            }
          }
          else if (data.code === 'LAUNCHER_DOWNLOADING'){
            this._logger.log({ date: new Date(), severity: 'info', message: 'Downloading file: ' + data.file + ' ('+ data.index + ' of ' + data.totalfiles + ')'})

            if(currentTick === 0){
              this.currentSubtext = 'Descargando Minecraft Assets...';
            }
            else if (currentTick === 1){
              this.currentSubtext = 'Descargando Minecraft Libs...';
            }
            else{
              this.currentSubtext = 'Descargando Open Launcher JVM...';
            }
            
            this.progressBarLength = ((data.totalfiles - data.remaining) / data.totalfiles) * 100 + '%';
          }
          else if (data.code === 'LAUNCHER_FINISHED'){
            this.readManifestVersions();
            this._logger.log({ date: new Date(), severity: 'info', message: 'Installation finished. Reading manifest versions.' })
            if(data.tick){
              if (data.tick === 4) {
                this.currentButtonState = 'Finalizando...'
                this.currentSubtext = 'Últimos retoques...';
                this.progressBar = false;

                setTimeout(() => {
                  this.currentButtonState = 'Entrar a Minecraft';
                  this.currentSubtext = 'Instancia instalada';
                  this.isInstalledVersion = true;
                  this.isLiveAction = false;
                }, 1250)
              }
            }
          }
          else{
            this.currentButtonState = 'Error al instalar';
            this.currentSubtext = 'Archivo erroneo: ' + data.file;
            this.isLiveAction = false;

            this._logger.log({ date: new Date(), severity: 'error', message: 'Error installing Minecraft version: ' + data.file })
            notyf.error('Error: ' + data.type + '. Reinicie el launcher o intente nuevamente.')
            
          }
        })

      }
      catch{
        notyf.error('Error al añadir la versión a la lista de instalaciones. Intente nuevamente.')
        return;
      }
    }
    else{
      let date: Date | null = new Date();
      this.currentButtonState = "Ejecutando"
      this.currentSubtext = "Validando instalación..."

      this._logger.log({ date: new Date(), severity: 'info', message: 'Running Minecraft version: ' + this.selectedVersion })

      // this.updateCurrentRPC(['Jugando a Minecraft ' + this.selectedVersion, this.selectedVersion], 1);
      this._ipc.send('minecraft:run', {version: this.selectedVersion});

      this._ipc.on('minecraft:run:progress', (event, data) => {
        if(data.code === 'LAUNCHER_STARTING'){
          // console.log(data)
          this.currentSubtext = 'Cargando Open Launcher JVM...';
          this._logger.log({ date: new Date(), severity: 'warn', message: 'Loading Open-Launcher JVM...' })
        }
        else if (data.code === 'LAUNCHER_JVM_START'){
          this.currentSubtext = 'Iniciando Minecraft...';
          this._logger.log({ date: new Date(), severity: 'warn', message: 'Starting JVM with Minecraft...' })
          this.openConfiguration(true);
        }
        else if (data.code === 'LAUNCHER_FAILED_AUTH'){
          this.currentButtonState = 'Error al iniciar';
          this.currentSubtext = 'Token de inicio inválido';
          this.isLiveAction = false;
          this._logger.log({ date: new Date(), severity: 'error', message: 'Invalid start token.' })
          notyf.error('Error: ' + data.type + '. Reinicie el launcher o intente nuevamente.')
        }

        // console.log(data)

        if(data.chunk){
          this._logger.log({ date: new Date(), severity: 'info', message: 'Chunk JVM: ' + data.chunk })
          if (data.chunk.includes('Stopping!')) {
            this._ipc.send('minecraft:time', { date: date, version: this.selectedVersion })

            date = null;

            this._ipc.once('minecraft:time:reply', (event, data) => {
              if(data.success === true){
                this._logger.log({ date: new Date(), severity: 'info', message: 'Time saved.' })
              }
              else{
                this._logger.log({ date: new Date(), severity: 'error', message: 'Error save time played.' })
              }
            })

            this.currentButtonState = 'Entrar a Minecraft';
            this.currentSubtext = 'Instancia instalada';
            this.isLiveAction = false;
          }
        }

      });
    }
  }

  private updateCurrentRPC(args: string[], option: number): void{
    this._ipc.send('discord:change', { status: args, option: option});
    this._logger.log({ date: new Date(), severity: 'info', message: 'Updating Discord RPC. Sending discord:change event, waiting reply...' })
    this._ipc.once('discord:change:reply', (event, data) => {
      if(data.success === false){
        const notyf = new Notyf({
          duration: 9000,
          position: {
            x: 'right',
            y: 'center',
          }
        });

        this._logger.log({ date: new Date(), severity: 'error', message: 'Error updating Discord RPC.' })

        notyf.error('La presencia en Discord no se ha podido actualizar.');
      }
    });
  }

  private readDataService(): void{

    this._logger.log({ date: new Date(), severity: 'info', message: 'Reading data service. Use DataService.' })

    this._data.getFormData().subscribe((data) => {
      this.saved = data;
    });
  }

  protected openConfiguration(isDebug?: boolean): void{
    let activity = 0;

    if(this.isLiveAction === true){
      activity = 1;
    }

    if(isDebug == true){
      activity = 2;
    }
    
    this.ref = this._dialog.open(OptionsComponent, {
      header: 'Configuración',
      width: '50%',
      height: '70%',
      data: {
        activity: activity,
      }
    });
  }

  private readConfigurationService(): Promise<void>{
    return new Promise((resolve, reject) => {
      this._data.getSessionConfig().subscribe((data) => {
        this.config = data;
        resolve();
      })
    })
  }

  private openBetaDialog(): void{
    this.ref2 = this._dialog.open(BetaComponent,{
      header: 'Anuncio de desarrollo BETA',
      width: '50%',
      height: '75%'
    })
  }

  async ngOnInit(): Promise<void> {
    this.readDataService();
    
    await this.readConfigurationService();

    if(this.config?.isOnlineSession === true){
      this.callNewManifest();

      this.readManifestVersions();
    }
    else{

    }

    this.openBetaDialog()
    // this.updateCurrentRPC(['Esperando en el menu...'], 0)
  }
}
