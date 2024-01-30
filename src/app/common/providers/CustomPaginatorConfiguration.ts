import {MatPaginatorIntl} from '@angular/material/paginator';

export function CustomPaginatorConfiguration() {
	const customPaginatorIntl = new MatPaginatorIntl();

	customPaginatorIntl.itemsPerPageLabel = 'Položek na stránku';

	return customPaginatorIntl;
}
