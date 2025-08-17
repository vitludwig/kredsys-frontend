import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from "rxjs";
import {IAppConfig} from "./types/IAppConfig";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly http = inject(HttpClient);

  private appConfig?: IAppConfig;

  public async loadAppConfig() {
    try {
      const data = await firstValueFrom(this.http.get<IAppConfig>('/assets/config.json'));
      this.appConfig = {...environment, ...data};
    } catch(e) {
      console.error("Unable to load app config file");
      this.appConfig = environment;
    }
  }

  get config(): IAppConfig {
    if (!this.appConfig) {
      throw new Error('Configuration has not been loaded!');
    }
    return this.appConfig;
  }
}
