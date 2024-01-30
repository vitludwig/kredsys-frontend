import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ICard} from '../../../../common/types/ICard';
import {environment} from '../../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';

@Injectable({
  providedIn: 'root'
})
export class CardsService {
  private http: HttpClient = inject(HttpClient);

  public async getCards(page: number = 0, pageSize: number= 15, blocked: boolean = false): Promise<IPaginatedResponse<ICard>> {
    const filter = `blocked=${blocked}`;
    const params = {
      page,
      pageSize,
      filter,
    };

    return firstValueFrom(this.http.get<IPaginatedResponse<ICard>>(`${environment.apiUrl}cards`, {params}));
  }
}
