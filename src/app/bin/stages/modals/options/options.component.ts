import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IpcService } from '../../../shared/services/electron/ipc.service';
import { DataService } from '../../../shared/services/managers/data.service';
import { instancesInfo } from '../../../shared/providers/user.provider';
import { LoggerItem } from '../../../shared/providers/logger.provider';
import { LoggerService } from '../../../shared/services/managers/logger.service';
import { Notyf } from 'notyf';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [InputNumberModule, FormsModule, ScrollPanelModule, SelectButtonModule, TooltipModule, ButtonModule, DatePipe],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css',
  providers: [DialogService]
})
export class OptionsComponent implements OnInit{

  protected options: any[] = [{label: 'Si', value: true}, {label: 'No', value: false}]

  protected CURRENT_TAB: number = 0;

  protected ROUTE_INSTANCES: string = "";
  protected ROUTE_CACHE: string = "";

  protected INSTANCES: instancesInfo[] = [];

  protected NAME: string = "";
  protected UUID: string = "";

  protected loginfo: LoggerItem[] = [];
  protected isLiveActions: boolean = false;

  protected RAM_ASSIGN: number = 2048;
  protected HIDE_LAUNCH: boolean = true;

  constructor(
    private _ipc: IpcService,
    private _data: DataService,
    private _logger: LoggerService,
    private ref: DynamicDialogConfig,
    private loader: NgxUiLoaderService
  ) {
    if(this.ref.data.activity === 1){
      this.isLiveActions = true;
    }
    else if(this.ref.data.activity === 2){
      this.CURRENT_TAB = 4;
    }
  }

  protected openWindow(route: string): void{
    this._ipc.send("common:openWindow", { url: route })
  }

  protected convertToTimePlayed(time: Date | null): string {
    if (time == null) {
      return "0 horas jugadas"
    }
    else{
      let hours = Math.floor(new Date(time).getTime() / 1000 / 60 / 60);
      return hours + " horas jugadas";
    }
  }

  ngOnInit(): void {
    this._data.getFormData().subscribe((data) => {
      this.NAME = data?.username || "";
      this.UUID = data?.uuid || "";
    })

    this._data.getSessionConfig().subscribe((data) => {
      // console.log(data)
      this.ROUTE_CACHE = data?.launcherInfo?.cache || "";
      this.ROUTE_INSTANCES = data?.launcherInfo?.instances || "";

      this.INSTANCES = data?.instancesInfo || [];

      this.RAM_ASSIGN = data?.launchInfo?.ram || 4096;
      this.HIDE_LAUNCH = data?.launchInfo?.hide || true;
    })   
    
    this._logger.getLoggerData().subscribe((data) => {
      this.loginfo = data?.items || [];
    })
  }

  deleteSession(): void{
    this.loader.start();
    this.isLiveActions = true;
    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
    });

    this._ipc.send("auth:delete")
    this._ipc.once("auth:delete:reply", (event, args) => {
      if (args.success === true){
        notyf.success("Se elimino la sesión activa. Reiniciando launcher...")

        setTimeout(() => {
          this._ipc.send("common:restart")
        }, 2000)
      }
    })
  }
}
