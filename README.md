# paye-calculator

A web-based calculator for computing gross salary and tax from net salary based on Lesotho's 2025/2026 tax year rates.

## Features

- Calculate gross salary from net salary (reverse calculation)
- Support for both annual and monthly salary inputs
- Resident and non-resident tax calculations
- Detailed tax breakdown
- Mobile responsive design
- No server required - runs entirely in the browser

## Tax Rates (2025/2026)

### Residents
- 20% on first M74,040.00
- 30% on excess above M74,040.00
- Annual tax credit: M11,640.00 (M970/month)

### Non-Residents
- Flat rate of 25%
- No tax credit

## Usage

Simply open `index.html` in your web browser or visit the deployed site.

## Deployment

This app can be deployed for free on:
- Netlify
- Vercel  
- GitHub Pages

## Updating Tax Rates

To update tax rates for future years, edit the constants in `calculator.js`:
```javascript
const TAX_THRESHOLD = 74040.00;  // Update this
const TAX_CREDIT = 11640.00;     // Update this
```

## License

MIT License - Free to use for personal and commercial purposes
