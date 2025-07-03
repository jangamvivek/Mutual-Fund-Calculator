import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface CalculationResult {
  totalInvestment: number;
  maturityAmount: number;
  totalGains: number;
  monthlyData?: any[];
}
@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  calculatorForm: FormGroup;
  selectedType: string = 'sip';
  result: CalculationResult | null = null;
  showMonthlyBreakdown: boolean = false;

  calculatorTypes = [
    { label: 'SIP Calculator', value: 'sip' },
    { label: 'Lump Sum Calculator', value: 'lumpsum' }
  ];

  constructor(private fb: FormBuilder) {
    this.calculatorForm = this.fb.group({
      sipAmount: [5000, [Validators.required, Validators.min(100)]],
      lumpSumAmount: [100000, [Validators.required, Validators.min(1000)]],
      years: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      annualReturn: [12, [Validators.required, Validators.min(1), Validators.max(30)]],
      stepUpRate: [0, [Validators.min(0), Validators.max(20)]]
    });
  }

  ngOnInit() {
    this.updateValidators();
  }

  setCalculatorType(type: string) {
    this.selectedType = type;
    this.updateValidators();
    this.result = null;
    this.showMonthlyBreakdown = false;
  }

  updateValidators() {
    const sipAmountControl = this.calculatorForm.get('sipAmount');
    const lumpSumAmountControl = this.calculatorForm.get('lumpSumAmount');

    if (this.selectedType === 'sip') {
      sipAmountControl?.setValidators([Validators.required, Validators.min(100)]);
      lumpSumAmountControl?.clearValidators();
    } else {
      lumpSumAmountControl?.setValidators([Validators.required, Validators.min(1000)]);
      sipAmountControl?.clearValidators();
    }

    sipAmountControl?.updateValueAndValidity();
    lumpSumAmountControl?.updateValueAndValidity();
  }

  calculate() {
    if (this.calculatorForm.valid) {
      const formValues = this.calculatorForm.value;
      
      if (this.selectedType === 'sip') {
        this.result = this.calculateSIP(
          formValues.sipAmount,
          formValues.years,
          formValues.annualReturn,
          formValues.stepUpRate || 0
        );
      } else {
        this.result = this.calculateLumpSum(
          formValues.lumpSumAmount,
          formValues.years,
          formValues.annualReturn
        );
      }
    }
  }

  calculateSIP(monthlyInvestment: number, years: number, annualReturn: number, stepUpRate: number): CalculationResult {
    const months = years * 12;
    const monthlyRate = annualReturn / 100 / 12;
    let totalInvestment = 0;
    let maturityAmount = 0;
    let currentSIP = monthlyInvestment;

    for (let month = 1; month <= months; month++) {
      // Apply step-up annually
      if (month > 1 && (month - 1) % 12 === 0 && stepUpRate > 0) {
        currentSIP = currentSIP * (1 + stepUpRate / 100);
      }

      totalInvestment += currentSIP;
      const remainingMonths = months - month + 1;
      maturityAmount += currentSIP * Math.pow(1 + monthlyRate, remainingMonths - 1);
    }

    return {
      totalInvestment: Math.round(totalInvestment),
      maturityAmount: Math.round(maturityAmount),
      totalGains: Math.round(maturityAmount - totalInvestment)
    };
  }

  calculateLumpSum(principal: number, years: number, annualReturn: number): CalculationResult {
    const maturityAmount = principal * Math.pow(1 + annualReturn / 100, years);
    
    return {
      totalInvestment: principal,
      maturityAmount: Math.round(maturityAmount),
      totalGains: Math.round(maturityAmount - principal)
    };
  }

  getInvestmentPercentage(): number {
    if (!this.result) return 0;
    return (this.result.totalInvestment / this.result.maturityAmount) * 100;
  }

  getGainsPercentage(): number {
    if (!this.result) return 0;
    return (this.result.totalGains / this.result.maturityAmount) * 100;
  }

  toggleMonthlyBreakdown() {
    this.showMonthlyBreakdown = !this.showMonthlyBreakdown;
  }

  getMonthlyBreakdownSample(): any[] {
    if (!this.result || this.selectedType !== 'sip') return [];
    
    const formValues = this.calculatorForm.value;
    const months = formValues.years * 12;
    const monthlyRate = formValues.annualReturn / 100 / 12;
    const stepUpRate = formValues.stepUpRate || 0;
    
    let breakdown = [];
    let totalInvested = 0;
    let currentSIP = formValues.sipAmount;
    let currentValue = 0;

    // Show every 12th month (yearly) for better readability
    for (let month = 1; month <= months; month++) {
      if (month > 1 && (month - 1) % 12 === 0 && stepUpRate > 0) {
        currentSIP = currentSIP * (1 + stepUpRate / 100);
      }

      totalInvested += currentSIP;
      currentValue = (currentValue + currentSIP) * (1 + monthlyRate);

      if (month % 12 === 0 || month === months) {
        breakdown.push({
          month: `Year ${Math.ceil(month / 12)}`,
          sipAmount: Math.round(currentSIP),
          totalInvested: Math.round(totalInvested),
          currentValue: Math.round(currentValue)
        });
      }
    }

    return breakdown;
  }
}
