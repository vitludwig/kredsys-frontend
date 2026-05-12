import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { ConfigService } from '../../../../common/services/config/config.service';

interface ISettingReadDto {
  id: number;
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

  private get settingsUrl(): string {
    return this.configService.config.apiUrl + 'settings';
  }

  // null = unknown, 0 = doesn't exist, >0 = exists with this DB id
  private settingId: number | null = null;

  async getChargeItems(): Promise<IChargeItem[]> {
    try {
      const dto = await firstValueFrom(
        this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`)
      );
      this.settingId = dto.id;
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
        this.settingId = 0;
      } else {
        console.error(e);
      }
      return [];
    }
  }

  async saveChargeItems(items: IChargeItem[]): Promise<void> {
    const value = JSON.stringify(items);

    // Resolve current existence state when unknown
    if (this.settingId === null) {
      try {
        const dto = await firstValueFrom(
          this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`)
        );
        this.settingId = dto.id;
      } catch (e) {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.settingId = 0;
        } else {
          throw e;
        }
      }
    }

    // DELETE existing before re-creating — workaround for backend PUT being broken
    // for dynamically created settings (no registered ISettingConfig)
    if (this.settingId > 0) {
      try {
        await firstValueFrom(
          this.http.delete(this.settingsUrl, { params: { id: this.settingId } })
        );
      } catch (e) {
        if (!(e instanceof HttpErrorResponse && e.status === 404)) {
          throw e;
        }
        // Already gone externally — proceed to POST
      }
      this.settingId = 0;
    }

    const created = await firstValueFrom(
      this.http.post<ISettingReadDto>(this.settingsUrl, {
        key: 'charge_items',
        value,
        description: CHARGE_ITEMS_DESCRIPTION,
        isPublic: true,
      })
    );
    this.settingId = created.id;
  }
}
