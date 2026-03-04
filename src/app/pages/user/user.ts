import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-user',
    imports: [CommonModule, FormsModule],
    standalone: true,
    templateUrl: './user.html',
    styleUrl: './user.css',
})
export class User {
    currentDate: Date = new Date(2025, 9, 2); // October 02, 2025 (meses 0-indexed)
    consumedCalories = 0; // Mock, de service
    waterAmount = 0; // Mock
    macros = { proteins: 0, fats: 0, carbs: 0 }; // Mock
    meals = {
        desayuno: [], // Array de {name: string, calories: number}
        almuerzo: [],
        merienda: [],
        cena: [],
    };

    // Datos para pie chart (mock: consumidas vs restantes)
    pieChartLabels: string[] = ['Consumidas', 'Restantes'];
    pieChartData: number[] = [this.consumedCalories, 1800 - this.consumedCalories];
    pieChartOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
    };

    previousDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
    }

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
}
