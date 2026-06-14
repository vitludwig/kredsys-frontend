import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { IsIncludedPipe } from '../../../../../../common/pipes/is-included/is-included.pipe';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
	let component: FilterPanelComponent;
	let fixture: ComponentFixture<FilterPanelComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ FilterPanelComponent ],
			imports: [ CommonModule, MatIconModule, MatButtonModule, IsIncludedPipe ],
		})
			.compileComponents();

		fixture = TestBed.createComponent(FilterPanelComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
