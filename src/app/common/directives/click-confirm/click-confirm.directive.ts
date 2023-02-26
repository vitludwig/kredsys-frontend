import {Directive, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TClickConfirmPreset} from './types/TClickConfirmPreset';
import {ConfirmDialogComponent} from '../../components/confirm-dialog/confirm-dialog.component';

@Directive({
	selector: '[clickConfirm]',
	standalone: true
})
export class ClickConfirmDirective implements OnInit {
	@Input()
	public confirmTitle: string;

	@Input()
	public confirmText: string;

	@Input()
	public confirmPreset?: TClickConfirmPreset;

	@Output()
	public clickConfirm: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

	private presets: Record<TClickConfirmPreset, { title: string, text?: string }> = {
		'remove': {
			title: 'Odstranit',
			text: 'Opravdu chceš odstranit tuto položku?',
		}
	}

	constructor(
		private dialog: MatDialog,
	) {
	}

	public ngOnInit(): void {
		if(this.confirmPreset) {
			this.confirmTitle = this.presets[this.confirmPreset].title;
			this.confirmText = this.presets[this.confirmPreset].text ?? '';
		}
	}

	@HostListener('click', ['$event'])
	public onClick($event: MouseEvent): void {
		const dialogRef = this.dialog.open<ConfirmDialogComponent, { title: string, text?: string }>(ConfirmDialogComponent, {
			width: '280px',
			autoFocus: 'dialog',
			data: {
				title: this.confirmTitle,
				text: this.confirmText
			}
		});

		dialogRef.afterClosed().subscribe(async (result: boolean) => {
			if(result) {
				this.clickConfirm.emit($event);
			}
			console.log(result);
		});
	}
}
