import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Notyf } from 'notyf';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OfflineComponent } from '../../../modals/offline/offline.component';
import { LoggerService } from '../../../../shared/services/managers/logger.service';
import { TooltipModule } from 'primeng/tooltip';
import { SessionConfig } from '../../../../shared/providers/user.provider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [DynamicDialogModule, TooltipModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [DialogService]
})
export class LoginComponent implements OnInit{ 
  private ref: DynamicDialogRef | undefined;
  protected spinnerBtn: boolean = false;
  protected spinnerBtn2: boolean = false;
  protected isActiveAction: boolean = true;
  protected configuration: SessionConfig | null = null;

  constructor(
    private _ipc: IpcService,
    private _loader: NgxUiLoaderService,
    private _rt: Router,
    public dialogService: DialogService,
    private _logger: LoggerService,
  ){}

  createNewMicrosoftToken(): void {
    this.spinnerBtn = true;
    this.isActiveAction = true;
    this._loader.start();
    
    this._logger.log({ date: new Date(), severity: 'info', message: 'Trying to create a new Microsoft token.'})

    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
      dismissible: true,
    });

    if(this.isActiveAction){
      this._ipc.send('auth:microsoft', { new: true })

      this._ipc.on('auth:microsoft:reply', (event, arg) => {
        // console.log(arg)
        this._loader.stop();
        this.spinnerBtn = false;

        if (arg.isCancelled == true) {
          this.spinnerBtn = false;
          this.isActiveAction = !this.isActiveAction;
          this._logger.log({ date: new Date(), severity: 'error', message: 'The user cancelled the operation.' })
          
          notyf.error('Operación cancelada por el usuario o debido a un error. Intenta nuevamente.')
          return;
        }
        else {
          notyf.success('Bienvenido ' + arg.authData[0].account.profile.name + '! Reiniciando la aplicación para aplicar cuenta...')

          setTimeout(() => {
            this._ipc.send('common:restart')
          }, 2000)
        }

        // console.log(arg)
      })
    }
    else{
      notyf.error('No es posible tener 2 operaciones activas al mismo tiempo.')
    }
  }

  protected offlineAccount(): void{

    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
      dismissible: true,
    });

    this.ref = this.dialogService.open(OfflineComponent, {
      header: 'Jugar sin conexión',
      closeOnEscape: false,
      width: '40%'
    });

    this.ref.onClose.subscribe((data) => {
      if (data.success == true) {
        notyf.success('Bienvenido ' + data.name + '! Reiniciando la aplicación para aplicar cuenta...')

        setTimeout(() => {
          this._ipc.send('common:restart')
        }, 2000)
      }
      else {
        notyf.error('Operación cancelada por el usuario o debido a un error. Intenta nuevamente.')
        this.isActiveAction = false;
      }
    });
  }

  ngOnInit(): void {

  }
}
