import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IDepositItem } from '../../../../common/types/IDepositItem';
import { ConfigService } from '../../../../common/services/config/config.service';

interface ISettingReadDto {
  id: number;
  value: string | null;
}

// Stored under the legacy `charge_items` key (kept to avoid losing existing config),
// but repurposed: these are deposit items (vratná záloha), not charge presets.
const DEPOSIT_ITEMS_KEY = 'charge_items';
const DEPOSIT_ITEMS_DESCRIPTION = 'Zálohované věci';

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

	async getDepositItems(): Promise<IDepositItem[]> {
		try {
			const dto = await firstValueFrom(
				this.http.get<ISettingReadDto>(`${this.baseUrl}${DEPOSIT_ITEMS_KEY}`)
			);
			this.settingId = dto.id;
			if (!dto.value) return [];
			let parsed: unknown;
			try {
				parsed = JSON.parse(dto.value);
			} catch {
				console.error(`${DEPOSIT_ITEMS_KEY} setting contains invalid JSON`);
				return [];
			}
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(item): item is IDepositItem =>
					typeof item === 'object' &&
          item !== null &&
          typeof (item as IDepositItem).label === 'string' &&
          typeof (item as IDepositItem).amount === 'number'
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

	async saveDepositItems(items: IDepositItem[]): Promise<void> {
		const value = JSON.stringify(items);

		// Resolve current existence state when unknown
		if (this.settingId === null) {
			try {
				const dto = await firstValueFrom(
					this.http.get<ISettingReadDto>(`${this.baseUrl}${DEPOSIT_ITEMS_KEY}`)
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
				key: DEPOSIT_ITEMS_KEY,
				value,
				description: DEPOSIT_ITEMS_DESCRIPTION,
				isPublic: true,
			})
		);
		this.settingId = created.id;
	}
}
