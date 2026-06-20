import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PartialStornoDialogComponent } from './partial-storno-dialog.component';
import { ITransactionRecord } from '../../../transactions/services/transaction/types/ITransaction';

function record(p: Partial<ITransactionRecord>): ITransactionRecord {
	return {
		creatorId: 1, text: '', id: 1, type: 'Create', transactionId: 1,
		goodsId: 10, goodsName: 'Beer', modifyLogId: 0, created: new Date(0),
		amountSum: 100, amountItem: 50, multiplier: 2, ...p,
	};
}

describe('PartialStornoDialogComponent', () => {
	let dialogRef: jasmine.SpyObj<MatDialogRef<PartialStornoDialogComponent>>;

	function setup(records: ITransactionRecord[]): PartialStornoDialogComponent {
		dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		TestBed.configureTestingModule({
			imports: [PartialStornoDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: { records } },
			],
		});
		return TestBed.createComponent(PartialStornoDialogComponent).componentInstance;
	}

	it('single line: no stepper, the whole line is pre-selected for storno', () => {
		const c = setup([record({ goodsId: 10, multiplier: 3 })]);
		expect((c as any).multipleLines).toBeFalse();
		expect((c as any).lines[0].stornoQty).toBe(3);
		expect((c as any).totalStornoQty).toBe(3);
	});

	it('multiple lines: steppers shown, each starts at 0', () => {
		const c = setup([record({ goodsId: 10, multiplier: 2 }), record({ goodsId: 11, multiplier: 1 })]);
		expect((c as any).multipleLines).toBeTrue();
		expect((c as any).lines.map((l: { stornoQty: number }) => l.stornoQty)).toEqual([0, 0]);
		expect((c as any).totalStornoQty).toBe(0);
	});

	it('confirm keeps the not-cancelled portion (multi-line)', () => {
		const c = setup([record({ goodsId: 10, multiplier: 3 }), record({ goodsId: 11, multiplier: 2 })]);
		(c as any).inc((c as any).lines[0]); // cancel 1 of line 0
		(c as any).confirm();
		expect(dialogRef.close).toHaveBeenCalledWith({ keep: [
			{ goodsId: 10, multiplier: 2, creatorId: 1 },
			{ goodsId: 11, multiplier: 2, creatorId: 1 },
		]});
	});

	it('confirm for a single line cancels it entirely (keep empty)', () => {
		const c = setup([record({ goodsId: 10, multiplier: 3 })]);
		(c as any).confirm();
		expect(dialogRef.close).toHaveBeenCalledWith({ keep: [] });
	});
});
