import {Component, inject, ViewChild} from '@angular/core';
import {GroupsService} from "../../services/groups.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, of, switchMap, timer} from "rxjs";
import {ChartData, ChartOptions} from "chart.js";
import {BaseChartDirective, NgChartsModule} from "ng2-charts";
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import {CommonModule} from "@angular/common";
import {IGroupStatistics, IGroupStatisticsItem} from "../../types/IGroupStatistics";
import {CurrencyService} from "../../../admin/services/currency/currency.service";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {Utils} from "../../../../common/utils/Utils";


@Component({
  selector: 'app-groups-statistics',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule
  ],
  templateUrl: './groups-statistics.component.html',
  styleUrl: './groups-statistics.component.scss'
})
export class GroupsStatisticsComponent {
  private groupsService = inject(GroupsService);
  private currencyService = inject(CurrencyService);
  private alertService = inject(AlertService);

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
    this.statistics$.pipe(
      takeUntilDestroyed()
    ).subscribe((stats) => {
      this.updateChartData(stats);
    });
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

    this.chartData.labels = groups.map(item => item.group.name);
    this.chartData.datasets = this.getDatasetsData(groups);

    this.chart?.update();
  }

  private getDatasetsData(groups: IGroupStatisticsItem[]): ChartData<'bar'>['datasets'] {
    const newDatasets: ChartData<'bar'>['datasets'] = [];
    const grandTotal = groups.reduce((total, g) => {
      return total + g.statistics.goods.reduce((sum, item) => sum + item.sumPrice, 0);
    }, 0);

    const data = groups.map(g => {
      const groupTotal = g.statistics.goods.reduce((sum, item) => sum + item.sumPrice, 0);
      return grandTotal > 0 ? (groupTotal / grandTotal) * 100 : 0;
    });

    const backgroundColors = groups.map(g => g.group.color || '#cccccc');

    // Check if dataset already exists (we only have one main dataset now)
    const existingDataset = this.chartData.datasets[0];

    if (existingDataset) {
      existingDataset.data = data;
      existingDataset.backgroundColor = backgroundColors;
      newDatasets.push(existingDataset);
    } else {
      newDatasets.push({
        label: 'Celkem',
        data: data,
        backgroundColor: backgroundColors,
        datalabels: {
          formatter: (value, ctx) => {
            if (!value) {
              return '';
            }
            return Math.round(value as number) + '%';
          }
        }
      });
    }

    return newDatasets;
  }
}
