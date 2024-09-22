import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Notyf } from 'notyf';

import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { DataService } from '../../../../shared/services/managers/data.service';

import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DownloadComponent } from '../../../modals/download/download.component';
import { instancesInfo, launcherInfo, launchInfo, SessionConfig } from '../../../../shared/providers/user.provider';
import { LoggerService } from '../../../../shared/services/managers/logger.service';

@Component({
  selector: 'app-middleware',
  standalone: true,
  imports: [DynamicDialogModule],
  templateUrl: './middleware.component.html',
  styleUrl: './middleware.component.css',
  providers: [DialogService]
})
export class MiddlewareComponent implements OnInit{
  protected currentStatus: string = "";
  protected IS_ALIVE: boolean = true;
  private ref: DynamicDialogRef | undefined;

  protected optionsPacket_A: launcherInfo | null = null;
  protected optionsPacket_B: launchInfo | null = null;
  protected optionsPacket_C: instancesInfo[] = [];
  protected optionsDiscord: boolean = false;

  constructor(
    private _rt: Router,
    private _ipc: IpcService,
    private _data: DataService,
    public dialogService: DialogService,
    private _logger: LoggerService
  ){}

  private checkElectronIntegrity(): Promise<void>{
    return new Promise((resolve) => {
      const notyf = new Notyf({
        duration: 0,
        position: {
          x: 'right',
          y: 'center',
        }
      });

      this._logger.log({ date: new Date(), severity: 'info', message: 'Checking electron integrity. Sending configuration:verify event, waiting for reply.'})

      this._ipc.send('configuration:verify');
      this._ipc.on('configuration:reply', (event, args) => {
        this.currentStatus = "Leyendo configuración..."

        const data = args.data;
        const versions = args.versions;

        if (data) {
          this.optionsPacket_A = {
            instances: data.launcher.instances,
            cache: data.launcher.downloadsDir
          }
          
          if(versions.versions) {
            if (versions.versions.length > 0) {
              for (let i = 0; i < versions.versions.length; i++) {
                const packet: instancesInfo = {
                  name: versions.versions[i].id,
                  directory: versions.versions[i].directory,
                  timePlayed: versions.versions[i].timePlayed
                }

                this.optionsPacket_C.push(packet)
              }
            }
          }
          
          if (data.account.active == true) {
            this.currentStatus = "Iniciando..."

            if (data.account.data.mcToken) {
              this._data.setFormData({
                uuid: data.account.data.profile.id,
                username: data.account.data.profile.name,
              })
            }
            else {
              this._data.setFormData({
                uuid: null,
                username: data.account.data.openlauncher.username,
              })
            }

            this._data.setSessionConfig({
              isDiscordAvailable: this.optionsDiscord,
              isOnlineSession: this.IS_ALIVE,
              launcherInfo: this.optionsPacket_A,
              launchInfo: this.optionsPacket_B,
              instancesInfo: this.optionsPacket_C,
              lastPlayed: versions.lastplayed
            })

            this._logger.log({ date: new Date(), severity: 'info', message: 'Launcher has been loaded successfully. Redirecting to init stage. All data has been setted in DataService.'})

            setTimeout(() => {
              this._rt.navigate(['/init']);
              resolve()
            }, 5000)
          }
          else {
            this.currentStatus = "Redirigiendo a la página de autenticación..."
            this._logger.log({ date: new Date(), severity: 'info', message: 'Account is not active. Redirecting to auth stage.'})
            setTimeout(() => {
              this._rt.navigate(['/auth']);
              resolve()
            }, 5000)
          }
        } else {
          notyf.error("Error al leer la configuración del launcher. Elimine la cache del launcher.")
        }
      });
    })
  }

  private isOnline(): Promise<void>{
    return new Promise((resolve) => {
      this.currentStatus = "Conectando a servicios online..."

      this._ipc.send('configuration:online');

      this._logger.log({
        date: new Date(),
        severity: 'info',
        message: 'Checking online services connecting to random server...'
      })

      this._ipc.once('configuration:online:reply', (event, args) => {
        if (args.result != true) {
          this.IS_ALIVE = false;
          this.currentStatus = "No hay conexión a internet, saltando actividades online..."
          this._logger.log({ date: new Date(), severity: 'warn', message: 'Attempt to connect to online services failed. Passing to offline mode. IS_ALIVE = false'})

          resolve();
        }
        else {
          this.IS_ALIVE = true;

          this._logger.log({ date: new Date(), severity: 'info', message: 'Online services are available. IS_ALIVE = true'})
          
          setTimeout(() => {
            resolve()
          }, 2500)
        }
      })
    })
  }

  private createNewRPCConnection(): Promise<void>{
    return new Promise((resolve) => {

      this.currentStatus = "Conectando con Discord..."
      this._logger.log({ date: new Date(), severity: 'info', message: 'Creating new RPC connection with Discord. Sending discord:init event, waiting for reply.'})

      this._ipc.send('discord:init');
      this._ipc.once('discord:init:reply', (event, data) => {
        if (data.success === false) {
          this.currentStatus = "Conexión fallida con Discord..."

          this.optionsDiscord = false;
          
          this._logger.log({ date: new Date(), severity: 'error', message: 'Error creating new RPC connection with Discord. Setting optionsDiscord to false.'})
          resolve()
        }
        else{
          this.optionsDiscord = true;

          this._logger.log({ date: new Date(), severity: 'info', message: 'RPC connection with Discord has been created successfully. Setting optionsDiscord to true.'})
          resolve()
        }
      });
    })
  }

  private readLaunchConfiguration(): Promise<void>{
    this.currentStatus = "Leyendo configuración de launcher..."
    
    return new Promise((resolve, reject) => {
      this._ipc.send('configuration:launch');
      
      this._logger.log({ date: new Date(), severity: 'info', message: 'Reading launch.json.'})

      this._ipc.once('configuration:launch:reply', (event, args) => {
        if (args.success === true) {
          const stringfly = JSON.parse(args.data);

          this.optionsPacket_B = {
            ram: stringfly.options.ram,
            hide: stringfly.options.hide
          }

          this._logger.log({ date: new Date(), severity: 'info', message: 'Launch.json has been read successfully. Setting optionsPacket_B with data.'})
          
          resolve();
        }
        else {
          this._logger.log({ date: new Date(), severity: 'warn', message: 'Error reading launch.json. Rejecting promise in readLaunchConfiguration method.'})
          reject();
        }
      })
    })
  }

  private openDownloadDialog(data: any): void{
    this.ref = this.dialogService.open(DownloadComponent, {
      header: 'Actualización disponible',
      closeOnEscape: false,
      closable: false,
      width: '40%',
      data: data
    });

    this.ref.onClose.subscribe((data) => {
      if(data == true){
        this.currentStatus = "Descargando actualización..."
        this._ipc.send('configuration:updates', {activity: 1});
      }
    });
  }

  private checkUpdates(): Promise<void>{
    return new Promise((resolve) => {
      this.currentStatus = "Comprobando actualizaciones..."
      this._logger.log({ date: new Date(), severity: 'info', message: 'Checking for updates with electron-updater. Sending configuration:updates event, waiting for reply'})
      
      this._ipc.send('configuration:updates', {activity: 0});
      this._ipc.once('configuration:updates:reply', (event, args) => {

        if (args.error === true){
          this.currentStatus = "Error al comprobar actualizaciones..."
          this._logger.log({ date: new Date(), severity: 'warn', message: 'Error checking for updates. Resolve with null the promise in checkUpdates method. Maybe is the last version?'})
          resolve();
        }

        if (args.isAvailable === true){
          // console.log(args)
          this._logger.log({ date: new Date(), severity: 'info', message: 'Update is available. Opening download dialog.'})
          this.openDownloadDialog(args.data);
        }
        else{
          this._logger.log({ date: new Date(), severity: 'info', message: 'No updates available. Resolve the promise in checkUpdates method.'})
          resolve();
        }
      })
    })
  }

  async verifyFristRun(): Promise<boolean>{
    return new Promise((resolve) => {
      this.currentStatus = "Verificando integridad de los directorios..."
      this._logger.log({ date: new Date(), severity: 'info', message: 'Checking if is the first run of the launcher.'})

      this._ipc.send('configuration:new');
      this._ipc.once('configuration:new:reply', (event, args) => {
        resolve(args.result)
      })
    })
  }

  async verifyIntegrityDirectory(): Promise<void>{
    return new Promise((resolve, reject) => {
      this.currentStatus = "Verificando integridad de los directorios..."
      this._logger.log({ date: new Date(), severity: 'info', message: 'Checking integrity of all directories.'})

      this._ipc.send('configuration:directory');
      this._ipc.once('configuration:directory:reply', async (event, args) => {
        if (args.success === true){
          resolve();
        }
        else{
          try{
            await this.createFolders();
          }
          catch{
            reject();
          }
        }
      })
    })
  }

  async createFolders(): Promise<void>{
    return new Promise((resolve, reject) => {
      this.currentStatus = "Creando directorios..."
      this._logger.log({ date: new Date(), severity: 'info', message: 'Creating all folders and .json.' })

      this._ipc.send('configuration:create');
      this._ipc.once('configuration:create:reply', (event, args) => {
        if (args.success === true) {
          this.currentStatus = "Primer inicio preparado. Reiniciando..."

          setTimeout(() => {
            this._ipc.send('common:restart');
            resolve();
          }, 2500)
        }
        else{
          this._logger.log({ date: new Date(), severity: 'error', message: 'Error creating folders and .json. Rejecting promise in createFolders method.'})
          reject();
        }
      })
    })
  }

  async ngOnInit(): Promise<void> {
    try{
      const isRunned = await this.verifyFristRun();

      if(isRunned == true){
        await this.verifyIntegrityDirectory()
      }
      else{
        await this.createFolders();
      }
      
      await this.readLaunchConfiguration();
      await this.isOnline();

      if (this.IS_ALIVE != true) {
        await this.checkElectronIntegrity();
      }
      else {
        await this.checkUpdates();
        await this.createNewRPCConnection();
        await this.checkElectronIntegrity();
      }

    }
    catch(e){
      console.error(e)
      this.currentStatus = "El launcher no ha cargado correctamente debido a errores de instalación. Reinicie la aplicación o reinstale nuevamente."
    }

  }

}
