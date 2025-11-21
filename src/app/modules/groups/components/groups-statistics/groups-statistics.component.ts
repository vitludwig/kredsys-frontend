import { Component, computed, inject } from '@angular/core';
import { GroupsService } from "../../services/groups.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { catchError, of, switchMap } from "rxjs";
import { ChartData, ChartOptions, ChartType } from "chart.js";
import { NgChartsModule } from "ng2-charts";
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { CommonModule } from "@angular/common";
import { IGroupStatistics } from "../../types/IGroupStatistics";
import { CurrencyService } from "../../../admin/services/currency/currency.service";

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

  protected statistics = toSignal<IGroupStatistics | null>(
    this.currencyService.getDefaultCurrency$().pipe(
      switchMap(currency => {
        if (!currency || !currency.id) return of(null);
        return this.groupsService.getGroupStatistics(currency.id).pipe(
          catchError(err => {
            console.error('Failed to load group statistics', err);
            return of(null);
          })
        );
      })
    ),
    { initialValue: null }
  );

  protected chartType: ChartType = 'bar';
  protected chartPlugins = [DataLabelsPlugin];

  protected chartData = computed<ChartData<'bar'> | null>(() => {
    const stats = this.statistics();
    if (!stats || !stats.groupsStatistics) return null;

    const groups = stats.groupsStatistics;
    const labels = groups.map(item => item.group.name);

    // Collect all unique goods across all groups to form the stacks
    const allGoodsMap = new Map<number, string>();
    groups.forEach(g => {
      g.statistics.goods.forEach(good => {
        allGoodsMap.set(good.goodsId, good.goodsName);
      });
    });

    const datasets: ChartData<'bar'>['datasets'] = [];

    // For each unique Good, create a dataset
    allGoodsMap.forEach((goodsName, goodsId) => {
      const data = groups.map(g => {
        const goodStat = g.statistics.goods.find(x => x.goodsId === goodsId);
        return goodStat ? goodStat.sumPrice : 0;
      });

      // Colors: defined by group property "color"
      const backgroundColors = groups.map(g => g.group.color || '#cccccc');

      datasets.push({
        label: goodsName,
        data: data,
        backgroundColor: backgroundColors,
        stack: 'stack1',
        datalabels: {
          formatter: (value, ctx) => {
            if (!value) return '';
            return goodsName;
          }
        }
      });
    });

    return {
      labels: labels,
      datasets: datasets
    };
  });

  protected chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: 'white'
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: 'white'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        color: 'white',
        anchor: 'center',
        align: 'center',
        font: {
          weight: 'bold'
        },
        display: 'auto'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    }
  };
}
