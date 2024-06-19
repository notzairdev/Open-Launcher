import { Component, OnInit } from '@angular/core';
import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Notyf } from 'notyf';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{ 

  protected spinnerBtn: boolean = false;

  constructor(
    private _ipc: IpcService,
    private _loader: NgxUiLoaderService
  ){}

  createNewMicrosoftToken(): void {
    this.spinnerBtn = true;
    this._loader.start();
    
    this._ipc.send('auth:microsoft', { new: true })

    this._ipc.on('auth:microsoft:reply', (event, arg) => {
      this._loader.stop();
      this.spinnerBtn = false;

      if(arg.authData[0].isCancelled == true){
        const notyf = new Notyf({
          duration: 5000,
          position: {
            x: 'right',
            y: 'bottom',
          },
          dismissible: true,
        });

        notyf.error('Tiempo de espera superado. Prueba nuevamente.')
      }

      console.log(arg)
    })
  }

  ngOnInit(): void {

  }
}
