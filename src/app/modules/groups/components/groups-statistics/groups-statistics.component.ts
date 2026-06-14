import {Component, DestroyRef, ElementRef, inject, signal, ViewChild} from '@angular/core';
import {GroupsService} from "../../services/groups.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, of, switchMap, timer} from "rxjs";
import {ChartData, ChartOptions} from "chart.js";
import {BaseChartDirective} from "ng2-charts";
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";

import {IGroupStatistics, IGroupStatisticsItem} from "../../types/IGroupStatistics";
import {CurrencyService} from "../../../admin/services/currency/currency.service";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {Utils} from "../../../../common/utils/Utils";


@Component({
	selector: 'app-groups-statistics',
	imports: [
		BaseChartDirective,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
	],
	templateUrl: './groups-statistics.component.html',
	styleUrl: './groups-statistics.component.scss'
})
export class GroupsStatisticsComponent {
	private groupsService = inject(GroupsService);
	private currencyService = inject(CurrencyService);
	private alertService = inject(AlertService);
	private destroyRef = inject(DestroyRef);

	// Absolute per-group totals from the previous poll (group id → total); null until first poll.
	private previousTotals: Record<number, number> | null = null;
	private glowRafId: number | null = null;
	private bannerTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// User-supplied confetti images (postapo theme: masks/guns/backpacks). Drop PNGs as
	// assets/images/confetti/confetti-1.png … confetti-8.png — missing files are skipped.
	private static readonly CONFETTI_IMAGE_PATHS = Array.from(
		{ length: 8 },
		(_, i) => `assets/images/confetti/confetti-${i + 1}.png`,
	);
	private confettiImages: HTMLImageElement[] = [];

	// Big celebratory banner shown below the chart when a group earns points.
	protected banner = signal<{ text: string; color: string } | null>(null);

	// Celebration on/off (persisted) — lets the bar staff calm the TV down.
	private static readonly ANIMATIONS_PREF_KEY = 'groupsStatistics.animationsEnabled';
	protected animationsEnabled = signal<boolean>(localStorage.getItem(GroupsStatisticsComponent.ANIMATIONS_PREF_KEY) !== 'off');

	@ViewChild('confettiLayer') private confettiLayer?: ElementRef<HTMLElement>;

	protected statistics$ = this.currencyService.getDefaultCurrency$().pipe(
		switchMap(currency => {
			if (!currency || !currency.id) {
				return of(null);
			}
			const currencyId = currency.id;
			return timer(0, 10000).pipe(
				switchMap(() => this.groupsService.getGroupStatistics(currencyId).pipe(
					catchError(err => {
						console.error('Failed to load group statistics', err);
						return of(null);
					})
				))
			);
		})
	);

	protected chartPlugins = [DataLabelsPlugin];

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  protected chartData: ChartData<'bar'> = {
  	labels: [],
  	datasets: []
  };

  protected chartOptions: ChartOptions<'bar'> = {
  	responsive: true,
  	maintainAspectRatio: false,
  	scales: {
  		x: {
  			stacked: true,
  			ticks: {
  				color: 'white',
  				font: {
  					size: 16
  				}
  			},
  		},
  		y: {
  			stacked: true,
  			beginAtZero: true,
  			// max: 100,
  			ticks: {
  				color: 'white',
  				callback: (value) => value + '%'
  			}
  		}
  	},
  	plugins: {
  		legend: {
  			display: false
  		},
  		datalabels: {
  			color: (context) => {
  				const dataset = context.dataset;
  				const backgroundColor = dataset.backgroundColor;
  				if (Array.isArray(backgroundColor)) {
  					const color = backgroundColor[context.dataIndex] as string;
  					return Utils.getContrastColor(color);
  				}
  				return 'white';
  			},
  			anchor: 'center',
  			align: 'center',
  			display: 'auto',
  			formatter: (value, ctx) => {
  				if (!value) return '';
  				return Math.round(value) + '%';
  			}
  		},
  		tooltip: {
  			callbacks: {
  				label: (context) => {
  					const label = context.dataset.label || '';
  					const value = context.raw as number;
  					return `${label}: ${value.toFixed(1)}%`;
  				}
  			}
  		}
  	}
  };

  constructor() {
  	this.preloadConfettiImages();

  	this.destroyRef.onDestroy(() => {
  		if (this.glowRafId !== null) {
  			cancelAnimationFrame(this.glowRafId);
  		}
  		if (this.bannerTimeoutId !== null) {
  			clearTimeout(this.bannerTimeoutId);
  		}
  	});

  	this.statistics$.pipe(
  		takeUntilDestroyed()
  	).subscribe((stats) => {
  		this.updateChartData(stats);
  	});
  }

  // Only images that actually load become confetti — missing files are silently skipped.
  private preloadConfettiImages(): void {
  	for (const path of GroupsStatisticsComponent.CONFETTI_IMAGE_PATHS) {
  		const img = new Image();
  		img.onload = () => this.confettiImages.push(img);
  		img.src = path;
  	}
  }

  private updateChartData(stats: IGroupStatistics | null) {
  	if (!stats || !stats.groupsStatistics) {
  		this.chartData.labels = [];
  		this.chartData.datasets = [];
  		this.chart?.update();
  		this.alertService.error('Chyba při načítání statistik');

  		return;
  	}

  	const groups = stats.groupsStatistics;
  	const totals = this.computeGroupTotals(groups);
  	const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  	const data = totals.map(t => grandTotal > 0 ? (t.total / grandTotal) * 100 : 0);
  	const backgroundColors = groups.map(g => g.group.color || '#cccccc');

  	this.chartData.labels = groups.map(item => item.group.name);
  	this.chartData.datasets = this.buildDatasets(data, backgroundColors);

  	// Diff against the previous poll — points are cumulative, so a group whose
  	// absolute total grew just earned points. Skip the very first poll.
  	const gainedIndices: number[] = [];
  	const gainedNames: string[] = [];
  	if (this.previousTotals) {
  		totals.forEach((t, index) => {
  			if (t.total > (this.previousTotals![t.id] ?? t.total)) {
  				gainedIndices.push(index);
  				gainedNames.push(groups[index].group.name);
  			}
  		});
  	}
  	this.previousTotals = Object.fromEntries(totals.map(t => [t.id, t.total]));

  	this.chart?.update();

  	if (gainedIndices.length) {
  		this.celebrate(gainedIndices, gainedNames, backgroundColors);
  	}
  }

  // The toggle gates ONLY the confetti — turning it off just removes any falling pieces.
  protected toggleAnimations(): void {
  	const enabled = !this.animationsEnabled();
  	this.animationsEnabled.set(enabled);
  	localStorage.setItem(GroupsStatisticsComponent.ANIMATIONS_PREF_KEY, enabled ? 'on' : 'off');
  	if (!enabled) {
  		this.confettiLayer?.nativeElement.replaceChildren();
  	}
  }

  // Glowing column + image confetti + a big banner + an info toast.
  private celebrate(indices: number[], names: string[], colors: string[]): void {
  	const text = names.length === 1
  		? `Skupina ${names[0]} získala body!`
  		: `Skupiny ${names.join(', ')} získaly body!`;

  	// Glow and banner always fire; only the confetti respects the toggle.
  	this.pulseGlow(indices);
  	if (this.animationsEnabled()) {
  		this.spawnConfetti();
  	}
  	this.showBanner(text, colors[indices[0]] ?? '#ffd700');
  }

  private showBanner(text: string, color: string): void {
  	if (this.bannerTimeoutId !== null) {
  		clearTimeout(this.bannerTimeoutId);
  	}
  	this.banner.set({ text, color });
  	this.bannerTimeoutId = setTimeout(() => {
  		this.banner.set(null);
  		this.bannerTimeoutId = null;
  	}, 6000);
  }

  private computeGroupTotals(groups: IGroupStatisticsItem[]): { id: number; total: number }[] {
  	return groups.map(g => ({
  		id: g.group.id,
  		total: g.statistics.goods.reduce((sum, item) => sum + item.sumPrice, 0),
  	}));
  }

  private buildDatasets(data: number[], backgroundColors: string[]): ChartData<'bar'>['datasets'] {
  	const existingDataset = this.chartData.datasets[0];

  	if (existingDataset) {
  		existingDataset.data = data;
  		existingDataset.backgroundColor = backgroundColors;
  		return [existingDataset];
  	}

  	return [{
  		label: 'Celkem',
  		data: data,
  		backgroundColor: backgroundColors,
  		datalabels: {
  			formatter: (value) => value ? Math.round(value as number) + '%' : ''
  		}
  	}];
  }

  // Make the given bars glow: pulse their colour base → bright white → base a few
  // times over ~2.5 s (driven manually so only the gained bars animate).
  private pulseGlow(indices: number[]) {
  	const dataset = this.chartData.datasets[0];
  	if (!dataset || !this.chart) {
  		return;
  	}
  	if (this.glowRafId !== null) {
  		cancelAnimationFrame(this.glowRafId);
  	}

  	const colors = dataset.backgroundColor as string[];
  	const base = [...colors];
  	const GLOW_COLOR = '#ffffff';
  	const DURATION = 2500;
  	const PULSES = 3;
  	const start = performance.now();

  	const step = (now: number) => {
  		const progress = Math.min(1, (now - start) / DURATION);
  		// 0 → peaks → 0; abs(sin) gives PULSES bright flashes that end back on base.
  		const intensity = Math.abs(Math.sin(progress * Math.PI * PULSES));
  		for (const i of indices) {
  			colors[i] = this.lerpHexColor(base[i], GLOW_COLOR, intensity);
  		}
  		this.chart?.update('none');

  		if (progress < 1) {
  			this.glowRafId = requestAnimationFrame(step);
  		} else {
  			for (const i of indices) {
  				colors[i] = base[i];
  			}
  			this.chart?.update('none');
  			this.glowRafId = null;
  		}
  	};

  	this.glowRafId = requestAnimationFrame(step);
  }

  // Rain user-supplied confetti images across the whole screen.
  private spawnConfetti(): void {
  	const layer = this.confettiLayer?.nativeElement;
  	if (!layer || !this.confettiImages.length) {
  		return;
  	}

  	const PIECES = 55;
  	const width = window.innerWidth;
  	for (let i = 0; i < PIECES; i++) {
  		this.spawnConfettiPiece(layer, Math.random() * width);
  	}
  }

  private spawnConfettiPiece(layer: HTMLElement, x: number): void {
  	const src = this.confettiImages[Math.floor(Math.random() * this.confettiImages.length)].src;
  	const size = 40 + Math.random() * 48; // 40–88 px — clearly visible on a TV

  	const startY = -size - Math.random() * 240; // staggered above the top edge
  	const img = document.createElement('img');
  	img.src = src;
  	img.className = 'gs-confetti-piece';
  	img.style.width = `${size}px`;
  	img.style.left = `${x - size / 2}px`;
  	img.style.top = `${startY}px`;
  	layer.appendChild(img);

  	const driftX = (Math.random() - 0.5) * 320;
  	const fallY = window.innerHeight - startY + size; // fall fully past the bottom
  	const rot = (Math.random() - 0.5) * 1080;
  	const duration = 2600 + Math.random() * 2200; // slower fall reads better on screen

  	const anim = img.animate(
  		[
  			{ transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0 },
  			{ transform: `translate(${driftX}px, ${fallY}px) rotate(${rot}deg)`, opacity: 1, offset: 0.85 },
  			{ transform: `translate(${driftX}px, ${fallY}px) rotate(${rot}deg)`, opacity: 0, offset: 1 },
  		],
  		{ duration, easing: 'linear' },
  	);
  	anim.onfinish = () => img.remove();
  }

  // Linear interpolation between two #rrggbb colours; falls back to `to` if either is not parseable.
  private lerpHexColor(from: string, to: string, t: number): string {
  	const parse = (hex: string): [number, number, number] | null => {
  		if (!hex || !hex.startsWith('#') || hex.length !== 7) {
  			return null;
  		}
  		return [
  			parseInt(hex.substring(1, 3), 16),
  			parseInt(hex.substring(3, 5), 16),
  			parseInt(hex.substring(5, 7), 16),
  		];
  	};

  	const a = parse(from);
  	const b = parse(to);
  	if (!a || !b) {
  		return to;
  	}

  	const r = Math.round(a[0] + (b[0] - a[0]) * t);
  	const g = Math.round(a[1] + (b[1] - a[1]) * t);
  	const blue = Math.round(a[2] + (b[2] - a[2]) * t);
  	return `rgb(${r}, ${g}, ${blue})`;
  }
}
