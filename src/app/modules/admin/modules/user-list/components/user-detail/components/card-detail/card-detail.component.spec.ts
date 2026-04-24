import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CardDetailComponent} from './card-detail.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../../../../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {clearAllCaches} from '../../../../../../../../common/decorators/cache';

describe('CardDetailComponent', () => {
	let component: CardDetailComponent;
	let fixture: ComponentFixture<CardDetailComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, MatSnackBarModule, MatDialogModule, FormsModule],
			declarations: [CardDetailComponent],
			providers: [{provide: AuthService, useValue: {isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false}}, 
				{provide: MatDialogRef, useValue: {}},
				{provide: MAT_DIALOG_DATA, useValue: {uid: 0, description: '', type: 'Card'}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(CardDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
