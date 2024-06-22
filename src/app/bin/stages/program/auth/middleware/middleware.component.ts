import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Notyf } from 'notyf';

import { IpcService } from '../../../../shared/services/electron/ipc.service';

@Component({
  selector: 'app-middleware',
  standalone: true,
  imports: [],
  templateUrl: './middleware.component.html',
  styleUrl: './middleware.component.css'
})
export class MiddlewareComponent implements OnInit{
  protected currentStatus: string = "";
  
  constructor(
    private _rt: Router,
    private _ipc: IpcService
  ){}

  private checkElectronIntegrity(): void{
    
    const notyf = new Notyf({
      duration: 0,
      position: {
        x: 'right',
        y: 'center',
      }
    });

    this._ipc.send('configuration:verify');
    this._ipc.on('configuration:reply', (event, data) => {
      this.currentStatus = "Leyendo configuración..."
      // console.log(data)
      if(data){
        if(data.account.active == true){
          this.currentStatus = "Iniciando..."
          setTimeout(() => {
            this._rt.navigate(['/init']);
          }, 2500)
        }
        else{
          this.currentStatus = "Redirigiendo a la página de autenticación..."
          setTimeout(()=> {
            this._rt.navigate(['/auth']);
          }, 2500)
        }
      } else {
        notyf.error("Error al leer la configuración del launcher. Elimine la cache del launcher.")
      }
    });
  }

  private createNewRPCConnection(): void{
    this._ipc.send('discord:init');
    this._ipc.once('discord:init:reply', (event, data) => {
      if (data.success === false){
        const notyf = new Notyf({
          duration: 9000,
          position: {
            x: 'right',
            y: 'center',
          }
        });

        notyf.error('Error al iniciar la conexión con Discord.');
      }
    });
  }

  ngOnInit(): void {
    this.checkElectronIntegrity();

    // this.createNewRPCConnection();
  }

}
