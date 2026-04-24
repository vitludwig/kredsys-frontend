import { HttpInterceptorFn } from '@angular/common/http';
import jwt_decode, {JwtPayload} from 'jwt-decode';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
	const apiToken = localStorage.getItem('apiToken');
	if(!apiToken) {
		return next(request);
	}

	// TODO: find out why injecting AuthService is giving circular DI error and then get decoded payload from there
	const apiTokenPayload = jwt_decode<JwtPayload>(apiToken);
	let headers;

	if(apiTokenPayload) {
		// token expired, delete info and routing guard then redirects user to login page
		const expirate = apiTokenPayload.exp ?? -1;
		const now = Math.round(new Date().getTime() / 1000);
		if(expirate <= now) {
			localStorage.removeItem('userId');
			localStorage.removeItem('apiToken');
		} else {
			headers = request.headers.set('Authorization', apiToken);
		}
	}

	request = request.clone({headers});
	return next(request);
}
