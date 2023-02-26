import {InitService} from './init/init.service';

export function appInitializerFactory(initService: InitService): () => Promise<any> {
	return () => initService.init();
}
