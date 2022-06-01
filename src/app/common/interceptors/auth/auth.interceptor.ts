import { Injectable } from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor() {}

	public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<any>> {
		const apiToken = localStorage.getItem('apiToken');
		let headers;

		if(apiToken) {
			headers = request.headers.set('Authorization', apiToken);
		}

		request = request.clone({headers});

		return next.handle(request);
	}
}
