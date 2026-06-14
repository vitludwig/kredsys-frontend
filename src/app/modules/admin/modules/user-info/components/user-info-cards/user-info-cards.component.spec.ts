import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { UserInfoCardsComponent } from './user-info-cards.component';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ICard, EUserCardType } from '../../../../../../common/types/ICard';
import { IUser } from '../../../../../../common/types/IUser';

describe('UserInfoCardsComponent', () => {
	let component: UserInfoCardsComponent;
	let fixture: ComponentFixture<UserInfoCardsComponent>;
	let usersService: jasmine.SpyObj<UsersService>;
	let alertService: jasmine.SpyObj<AlertService>;
	let dialog: jasmine.SpyObj<MatDialog>;

	const user: IUser = { id: 5, name: 'X', email: 'x@x.cz', memberId: 1, roles: [], blocked: false };

	function card(p: Partial<ICard>): ICard {
		return { id: 1, uid: 1234, description: '', type: EUserCardType.CARD, blocked: false, expirationDate: null, ...p };
	}

	function setup(cards: ICard[]) {
		usersService = jasmine.createSpyObj('UsersService', ['deleteUserCard', 'blockUserCard', 'unblockUserCard', 'setUserCardExpiration']);
		usersService.deleteUserCard.and.resolveTo();
		usersService.blockUserCard.and.resolveTo();
		usersService.unblockUserCard.and.resolveTo();
		usersService.setUserCardExpiration.and.resolveTo(card({}));
		alertService = jasmine.createSpyObj('AlertService', ['success', 'error']);
		dialog = jasmine.createSpyObj('MatDialog', ['open']);
		TestBed.configureTestingModule({
			imports: [UserInfoCardsComponent, NoopAnimationsModule],
			providers: [
				{ provide: UsersService, useValue: usersService },
				{ provide: AlertService, useValue: alertService },
				{ provide: MatDialog, useValue: dialog },
			],
		});
		fixture = TestBed.createComponent(UserInfoCardsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('user', user);
		fixture.componentRef.setInput('cards', cards);
		fixture.detectChanges();
	}

	function dialogReturns(value: unknown) {
		dialog.open.and.returnValue({ afterClosed: () => of(value) } as MatDialogRef<unknown>);
	}

	it('canAddCard is false when an active card has expiration', () => {
		setup([card({ blocked: false, expirationDate: '2026-12-31T23:59:00' })]);
		expect(component.canAddCard).toBe(false);
	});

	it('canAddCard is true when the only expiring card is blocked', () => {
		setup([card({ blocked: true, expirationDate: '2026-12-31T23:59:00' })]);
		expect(component.canAddCard).toBe(true);
	});

	it('canAddCard is true when cards have no expiration', () => {
		setup([card({ blocked: false, expirationDate: null })]);
		expect(component.canAddCard).toBe(true);
	});

	it('inheritedExpiration picks the highest-id blocked card with expiration', () => {
		setup([
			card({ id: 1, blocked: true, expirationDate: '2025-01-01T00:00:00' }),
			card({ id: 3, blocked: true, expirationDate: '2026-12-31T23:59:00' }),
			card({ id: 2, blocked: true, expirationDate: '2024-01-01T00:00:00' }),
		]);
		expect(component.inheritedExpiration).toBe('2026-12-31T23:59:00');
	});

	it('inheritedExpiration is null when no blocked card carries expiration', () => {
		setup([card({ id: 1, blocked: false, expirationDate: '2026-12-31T23:59:00' })]);
		expect(component.inheritedExpiration).toBeNull();
	});

	it('isExpired is true for a past date', () => {
		setup([]);
		expect(component.isExpired(card({ expirationDate: '2000-01-01T00:00:00' }))).toBe(true);
		expect(component.isExpired(card({ expirationDate: null }))).toBe(false);
	});

	it('blocks a card after confirmation', async () => {
		setup([card({ id: 9, blocked: false })]);
		dialogReturns(true);
		const refreshSpy = spyOn(component.refresh, 'emit');
		await component.onBlockCard(card({ id: 9 }));
		expect(usersService.blockUserCard).toHaveBeenCalledWith(9);
		expect(refreshSpy).toHaveBeenCalled();
		expect(alertService.success).toHaveBeenCalledWith('Čip zablokován');
	});

	it('does not block when confirmation is cancelled', async () => {
		setup([card({ id: 9 })]);
		dialogReturns(false);
		await component.onBlockCard(card({ id: 9 }));
		expect(usersService.blockUserCard).not.toHaveBeenCalled();
	});

	it('unblocks a card', async () => {
		setup([card({ id: 9, blocked: true })]);
		const refreshSpy = spyOn(component.refresh, 'emit');
		await component.onUnblockCard(card({ id: 9 }));
		expect(usersService.unblockUserCard).toHaveBeenCalledWith(9);
		expect(refreshSpy).toHaveBeenCalled();
	});

	it('edits expiration when dialog returns a value', async () => {
		const c = card({ id: 9, expirationDate: null });
		setup([c]);
		dialogReturns('2027-01-01T12:00:00');
		const refreshSpy = spyOn(component.refresh, 'emit');
		await component.onEditExpiration(c);
		expect(usersService.setUserCardExpiration).toHaveBeenCalledWith(c, '2027-01-01T12:00:00');
		expect(refreshSpy).toHaveBeenCalled();
		expect(alertService.success).toHaveBeenCalledWith('Expirace uložena');
	});

	it('clears expiration when dialog returns null', async () => {
		const c = card({ id: 9, expirationDate: '2027-01-01T12:00:00' });
		setup([c]);
		dialogReturns(null);
		await component.onEditExpiration(c);
		expect(usersService.setUserCardExpiration).toHaveBeenCalledWith(c, null);
	});

	it('does nothing when expiration dialog is cancelled', async () => {
		const c = card({ id: 9 });
		setup([c]);
		dialogReturns(undefined);
		await component.onEditExpiration(c);
		expect(usersService.setUserCardExpiration).not.toHaveBeenCalled();
	});

	it('shows a specific error when delete fails with 400', async () => {
		const c = card({ id: 9 });
		setup([c]);
		dialogReturns(true);
		usersService.deleteUserCard.and.rejectWith(new HttpErrorResponse({ status: 400 }));
		await component.onDeleteCard(c);
		expect(alertService.error).toHaveBeenCalledWith('Čip nelze smazat — je použit v transakcích');
	});

	it('deletes a card after confirmation and reports success', async () => {
		const c = card({ id: 9 });
		setup([c]);
		dialogReturns(true);
		const refreshSpy = spyOn(component.refresh, 'emit');
		await component.onDeleteCard(c);
		expect(usersService.deleteUserCard).toHaveBeenCalledWith(9);
		expect(alertService.success).toHaveBeenCalledWith('Čip smazán');
		expect(refreshSpy).toHaveBeenCalled();
	});
});
