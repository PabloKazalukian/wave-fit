import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BtnComponent } from '../../shared/components/ui/btn/btn';

@Component({
    selector: 'app-user',
    imports: [CommonModule, FormsModule, BtnComponent],
    standalone: true,
    templateUrl: './user.html',
    styleUrl: './user.css',
})
export class User {
    currentDate: Date = new Date(2025, 9, 2); // October 02, 2025 (meses 0-indexed)
    consumedCalories: number = 0; // Mock, de service
    waterAmount: number = 0; // Mock
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
        this.loadDayData(); // Mock load from service
    }

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.loadDayData(); // Mock
    }

    loadDayData() {
        // Aquí llamarías a service mock para calorías, macros, agua, meals por fecha
        // Por ahora, reset a vacíos o ejemplos
        this.consumedCalories = 0;
        this.waterAmount = 0;
        this.macros = { proteins: 0, fats: 0, carbs: 0 };
        this.meals = { desayuno: [], almuerzo: [], merienda: [], cena: [] };
        this.pieChartData = [this.consumedCalories, 1800 - this.consumedCalories];
    }

    addMeal(mealType: string) {
        // Por ahora, console log o nada, ya que no implementar dialogo
        console.log(`Abrir dialogo para agregar plato a ${mealType}`);
        // En futuro: Abrir modal con platos user o crear nuevo
    }

    logout() {
        // Implementar logout
    }
}
