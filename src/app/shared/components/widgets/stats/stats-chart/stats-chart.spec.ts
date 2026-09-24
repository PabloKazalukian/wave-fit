import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHighcharts } from 'highcharts-angular';
import type { Options } from 'highcharts';
import { StatsChart } from './stats-chart';

describe('StatsChart (TEST-010)', () => {
    let fixture: ComponentFixture<StatsChart>;

    const options: Options = {
        chart: { type: 'bar' },
        series: [{ type: 'bar', data: [1, 2, 3] }],
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatsChart],
            providers: [provideHighcharts()],
        }).compileComponents();

        fixture = TestBed.createComponent(StatsChart);
    });

    it('renders nothing when options are null', () => {
        fixture.componentRef.setInput('options', null);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('highcharts-chart')).toBeNull();
    });

    it('renders the highcharts component with the mapped options', () => {
        fixture.componentRef.setInput('options', options);
        fixture.detectChanges();

        const chartHost = fixture.nativeElement.querySelector('highcharts-chart');
        expect(chartHost).not.toBeNull();
    });
});
