import { Injectable } from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
} from '@angular/common/http';
import {Observable} from 'rxjs';
import jwt_decode from 'jwt-decode';
import {Router} from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	protected apiTokenPayload: any;

	constructor(
		protected router: Router,
	) {}

	public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<any>> {
		const apiToken = localStorage.getItem('apiToken');

		let headers;

		if(apiToken) {
			if(!this.apiTokenPayload) {
				this.apiTokenPayload = jwt_decode(apiToken);
			}

			// token expired, delete info and show login page
			const expirate = this.apiTokenPayload.exp;
			const now = Math.round(new Date().getTime() / 1000);
			if(expirate <= now) {
				localStorage.removeItem('userId');
				localStorage.removeItem('apiToken');
			}
			headers = request.headers.set('Authorization', apiToken);
		}

		request = request.clone({headers});
		return next.handle(request);
	}
}
