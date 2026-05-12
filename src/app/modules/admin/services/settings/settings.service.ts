import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { ConfigService } from '../../../../common/services/config/config.service';

interface ISettingReadDto {
  value: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  private get baseUrl(): string {
    return this.configService.config.apiUrl + 'settings/';
  }

  private settingExists: boolean | null = null;

  async getChargeItems(): Promise<IChargeItem[]> {
    try {
      const dto = await firstValueFrom(
        this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`)
      );
      this.settingExists = true;
      if (!dto.value) return [];
      return JSON.parse(dto.value) as IChargeItem[];
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.settingExists = false;
      }
      return [];
    }
  }

  async saveChargeItems(items: IChargeItem[]): Promise<void> {
    const value = JSON.stringify(items);

    if (this.settingExists === true) {
      await firstValueFrom(
        this.http.put(`${this.baseUrl}charge_items`, { value })
      );
      return;
    }

    if (this.settingExists === false) {
      await firstValueFrom(
        this.http.post(this.configService.config.apiUrl + 'settings', {
          key: 'charge_items',
          value,
          description: 'Dynamické položky při nabíjení kreditu',
          isPublic: true,
        })
      );
      this.settingExists = true;
      return;
    }

    // settingExists is null — check and then create or update in a single observable chain
    await firstValueFrom(
      this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`).pipe(
        switchMap(() => {
          this.settingExists = true;
          return this.http.put(`${this.baseUrl}charge_items`, { value });
        }),
        catchError((e: unknown) => {
          if (e instanceof HttpErrorResponse && e.status === 404) {
            this.settingExists = false;
            return this.http.post(this.configService.config.apiUrl + 'settings', {
              key: 'charge_items',
              value,
              description: 'Dynamické položky při nabíjení kreditu',
              isPublic: true,
            });
          }
          throw e;
        })
      )
    );
    this.settingExists = true;
  }
}
