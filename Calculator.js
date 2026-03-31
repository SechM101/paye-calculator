// Tax calculation constants for 2025/2026
// #region agent log
fetch('http://127.0.0.1:7351/ingest/211819ec-9055-48cc-a43e-77c875dee4fc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9e63b1'},body:JSON.stringify({sessionId:'9e63b1',location:'Calculator.js:boot',message:'calculator script loaded',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
// #endregion
const TAX_THRESHOLD = 74040.00;
const TAX_CREDIT = 11640.00;
const RATE_LOWER = 0.20;
const RATE_UPPER = 0.30;
const NON_RESIDENT_RATE = 0.25;

// Calculate tax from gross income
function calculateTaxFromGross(grossIncome, isResident) {
    if (isResident) {
        let taxLiability;
        if (grossIncome <= TAX_THRESHOLD) {
            taxLiability = grossIncome * RATE_LOWER;
        } else {
            taxLiability = (TAX_THRESHOLD * RATE_LOWER) + 
                          ((grossIncome - TAX_THRESHOLD) * RATE_UPPER);
        }
        
        const taxPayable = Math.max(0, taxLiability - TAX_CREDIT);
        return taxPayable;
    } else {
        return grossIncome * NON_RESIDENT_RATE;
    }
}

// Calculate gross from net using iterative method
function calculateGrossFromNet(netSalary, isResident) {
    let grossSalary = netSalary;
    
    for (let i = 0; i < 100; i++) {
        const tax = calculateTaxFromGross(grossSalary, isResident);
        const calculatedNet = grossSalary - tax;
        
        if (Math.abs(calculatedNet - netSalary) < 0.01) {
            // #region agent log
            fetch('http://127.0.0.1:7351/ingest/211819ec-9055-48cc-a43e-77c875dee4fc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9e63b1'},body:JSON.stringify({sessionId:'9e63b1',location:'Calculator.js:calculateGrossFromNet',message:'net-to-gross converged',data:{isResident,iterations:i+1,netSalary,grossSalary,tax,absNetDiff:Math.abs(calculatedNet-netSalary)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            return {
                gross: grossSalary,
                tax: tax
            };
        }
        
        const difference = netSalary - calculatedNet;
        grossSalary += difference;
        
        if (grossSalary < 0) {
            grossSalary = netSalary;
        }
    }
    
    const finalTax = calculateTaxFromGross(grossSalary, isResident);
    const finalNet = grossSalary - finalTax;
    // #region agent log
    fetch('http://127.0.0.1:7351/ingest/211819ec-9055-48cc-a43e-77c875dee4fc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9e63b1'},body:JSON.stringify({sessionId:'9e63b1',location:'Calculator.js:calculateGrossFromNet',message:'net-to-gross max iterations',data:{isResident,iterations:100,netSalary,grossSalary,tax:finalTax,absNetDiff:Math.abs(finalNet-netSalary)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return {
        gross: grossSalary,
        tax: finalTax
    };
}

// Format currency
function formatCurrency(amount) {
    return 'M' + amount.toLocaleString('en-LS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Generate tax breakdown text
function generateBreakdown(annualGross, isResident) {
    let html = '<strong>Detailed Tax Calculation:</strong><br><br>';
    
    if (isResident) {
        html += `<div class="breakdown-item">Annual tax threshold: ${formatCurrency(TAX_THRESHOLD)}</div>`;
        html += `<div class="breakdown-item">Annual tax credit: ${formatCurrency(TAX_CREDIT)}</div><br>`;
        
        if (annualGross <= TAX_THRESHOLD) {
            const taxLiability = annualGross * RATE_LOWER;
            html += `<div class="breakdown-item">Annual gross income (${formatCurrency(annualGross)}) @ 20% = ${formatCurrency(taxLiability)}</div>`;
        } else {
            const lowerBracket = TAX_THRESHOLD * RATE_LOWER;
            const upperBracket = (annualGross - TAX_THRESHOLD) * RATE_UPPER;
            const totalLiability = lowerBracket + upperBracket;
            
            html += `<div class="breakdown-item">First ${formatCurrency(TAX_THRESHOLD)} @ 20% = ${formatCurrency(lowerBracket)}</div>`;
            html += `<div class="breakdown-item">Excess ${formatCurrency(annualGross - TAX_THRESHOLD)} @ 30% = ${formatCurrency(upperBracket)}</div>`;
            html += `<div class="breakdown-item">Total tax liability: ${formatCurrency(totalLiability)}</div>`;
        }
        
        html += `<br><div class="breakdown-item">Less tax credit: ${formatCurrency(TAX_CREDIT)}</div>`;
        
        const taxLiability = annualGross <= TAX_THRESHOLD 
            ? annualGross * RATE_LOWER 
            : (TAX_THRESHOLD * RATE_LOWER) + ((annualGross - TAX_THRESHOLD) * RATE_UPPER);
        const rawTax = taxLiability - TAX_CREDIT;
        
        html += `<div class="breakdown-item">Tax payable: ${formatCurrency(Math.max(0, rawTax))}</div>`;
        
        if (rawTax < 0) {
            html += `<br><div class="breakdown-item"><em>Negative result adjusted to zero (non-refundable credit)</em></div>`;
        }
    } else {
        html += `<div class="breakdown-item">Non-resident rate of 25% on ${formatCurrency(annualGross)} = ${formatCurrency(annualGross * NON_RESIDENT_RATE)}</div>`;
    }
    
    return html;
}

// Handle form submission
document.getElementById('taxForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const netSalaryInput = parseFloat(document.getElementById('netSalary').value);
    const period = document.querySelector('input[name="period"]:checked').value;
    const residency = document.querySelector('input[name="residency"]:checked').value;
    const isResident = residency === 'resident';
    
    if (netSalaryInput <= 0 || isNaN(netSalaryInput)) {
        alert('Please enter a valid net salary amount.');
        return;
    }
    
    // Calculate annual net salary
    const annualNet = period === 'monthly' ? netSalaryInput * 12 : netSalaryInput;
    const monthlyNet = annualNet / 12;
    
    // Calculate gross and tax
    const result = calculateGrossFromNet(annualNet, isResident);
    const annualGross = result.gross;
    const annualTax = result.tax;
    const monthlyGross = annualGross / 12;
    const monthlyTax = annualTax / 12;
    
    // Calculate effective tax rate
    const effectiveRate = annualGross > 0 ? (annualTax / annualGross) * 100 : 0;
    
    // Update results
    document.getElementById('annualNet').textContent = formatCurrency(annualNet);
    document.getElementById('annualGross').textContent = formatCurrency(annualGross);
    document.getElementById('annualTax').textContent = formatCurrency(annualTax);
    document.getElementById('monthlyNet').textContent = formatCurrency(monthlyNet);
    document.getElementById('monthlyGross').textContent = formatCurrency(monthlyGross);
    document.getElementById('monthlyTax').textContent = formatCurrency(monthlyTax);
    document.getElementById('effectiveRate').textContent = effectiveRate.toFixed(2) + '%';
    
    // Generate breakdown
    document.getElementById('taxBreakdown').innerHTML = generateBreakdown(annualGross, isResident);
    
    // Verification
    const verificationNet = annualGross - annualTax;
    // #region agent log
    fetch('http://127.0.0.1:7351/ingest/211819ec-9055-48cc-a43e-77c875dee4fc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9e63b1'},body:JSON.stringify({sessionId:'9e63b1',location:'Calculator.js:submit',message:'verification vs target net',data:{isResident,period,annualNet,annualGross,annualTax,verificationNet,verificationDelta:Math.abs(verificationNet-annualNet)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    fetch('http://127.0.0.1:7351/ingest/211819ec-9055-48cc-a43e-77c875dee4fc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9e63b1'},body:JSON.stringify({sessionId:'9e63b1',location:'Calculator.js:submit',message:'monthly tax annualization',data:{annualTax,monthlyTax,delta12:Math.abs(monthlyTax*12-annualTax)},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    document.getElementById('verification').textContent = 
        `✓ Verification: ${formatCurrency(annualGross)} - ${formatCurrency(annualTax)} = ${formatCurrency(verificationNet)}`;
    
    // Show results
    document.getElementById('results').classList.add('show');
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});