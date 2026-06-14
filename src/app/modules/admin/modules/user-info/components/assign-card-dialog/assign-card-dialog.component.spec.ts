import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssignCardDialogComponent } from './assign-card-dialog.component';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { EUserCardType } from '../../../../../../common/types/ICard';

describe('AssignCardDialogComponent', () => {
	let component: AssignCardDialogComponent;
	let fixture: ComponentFixture<AssignCardDialogComponent>;
	let usersService: jasmine.SpyObj<UsersService>;
	let dialogRef: jasmine.SpyObj<MatDialogRef<AssignCardDialogComponent>>;

	function setup(expirationDate: string | null) {
		usersService = jasmine.createSpyObj('UsersService', ['addUserCard']);
		usersService.addUserCard.and.resolveTo({ id: 1, uid: 123, description: '', type: EUserCardType.CARD });
		dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		TestBed.configureTestingModule({
			imports: [AssignCardDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: UsersService, useValue: usersService },
				{ provide: AlertService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } },
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: { userId: 5, expirationDate } },
			],
		});
		fixture = TestBed.createComponent(AssignCardDialogComponent);
		component = fixture.componentInstance;
	}

	it('forwards the inherited expiration to addUserCard', async () => {
		setup('2026-12-31T23:59:00');
		await (component as any).onCardLoaded(999);
		expect(usersService.addUserCard).toHaveBeenCalledWith(5, 999, '', EUserCardType.CARD, '2026-12-31T23:59:00');
		expect(dialogRef.close).toHaveBeenCalledWith(true);
	});

	it('passes null expiration when none inherited', async () => {
		setup(null);
		await (component as any).onCardLoaded(888);
		expect(usersService.addUserCard).toHaveBeenCalledWith(5, 888, '', EUserCardType.CARD, null);
	});
});
