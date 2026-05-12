import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, switchMap } from 'rxjs';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { ConfigService } from '../../../../common/services/config/config.service';

interface ISettingReadDto {
  value: string | null;
}

const CHARGE_ITEMS_DESCRIPTION = 'Dynamické položky při nabíjení kreditu';

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
      let parsed: unknown;
      try {
        parsed = JSON.parse(dto.value);
      } catch {
        console.error('charge_items setting contains invalid JSON');
        return [];
      }
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is IChargeItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as IChargeItem).label === 'string' &&
          typeof (item as IChargeItem).amount === 'number'
      );
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.settingExists = false;
      } else {
        console.error(e);
      }
      return [];
    }
  }

  async saveChargeItems(items: IChargeItem[]): Promise<void> {
    const value = JSON.stringify(items);

    if (this.settingExists === true) {
      try {
        await firstValueFrom(
          this.http.put(`${this.baseUrl}charge_items`, { value })
        );
      } catch (e) {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          // Setting was deleted externally — reset so next call re-detects
          this.settingExists = null;
        }
        throw e;
      }
      return;
    }

    if (this.settingExists === false) {
      await firstValueFrom(
        this.http.post(this.configService.config.apiUrl + 'settings', {
          key: 'charge_items',
          value,
          description: CHARGE_ITEMS_DESCRIPTION,
          isPublic: true,
        })
      );
      this.settingExists = true;
      return;
    }

    // null: chain GET→PUT or GET→POST in one observable
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
              description: CHARGE_ITEMS_DESCRIPTION,
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
