# Carbon Black OAN Prediction Tool

A Next.js web application for predicting and analyzing Oil Absorption Number (OAN) values in carbon black production. This tool provides real-time predictions, statistical analysis, and data visualization for process control and quality management.

## Features

### 🎯 Core Functionality
- **Real-time OAN Prediction**: Advanced regression analysis for accurate OAN predictions
- **Process Control Monitoring**: Track LSL/USL compliance and process capability indices (Cpk, Cpu, Cpl)
- **Interactive Data Visualization**: Dynamic charts showing actual vs predicted values with specification limits
- **Historical Data Management**: Complete entry history with delete functionality
- **Statistical Analysis**: Automatic calculation of means, standard deviations, and regression coefficients

### 📊 Analytics & Reporting
- **Sequential Calculation System**: Automatic mean updates with each new entry
- **Process Capability Analysis**: Real-time Cpk calculations for quality control
- **Trend Analysis**: Visual representation of process performance over time
- **Grade-based Presets**: Predefined settings for different carbon black grades

### 🔐 User Management
- Simple username-based authentication
- User-specific data isolation
- Automatic user creation on first login
- Session management with localStorage

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Custom UI library with Radix UI primitives
- **Styling**: Tailwind CSS with custom animations
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js with fallback table view
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd carbon-black
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**
Run the SQL scripts in order to set up your database:
```sql
-- Use one of these scripts based on your needs:
-- scripts/create-tables.sql (basic setup)
-- scripts/create-tables-fixed.sql (with RLS)
-- scripts/create-tables-final.sql (production ready)
```

5. **Start the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
carbon-black/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Main dashboard page
│   ├── login/                   # Authentication page
│   ├── globals.css             # Global styles and animations
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (redirects)
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── AnalysisChart.tsx       # Interactive data visualization
│   ├── CalculationPanel.tsx    # Statistical calculations display
│   ├── DataEntryForm.tsx       # Data input form with validation
│   ├── HistoryTable.tsx        # Historical data management
│   └── LoadingSpinner.tsx      # Loading state component
├── lib/                        # Utility functions and configurations
├── scripts/                    # Database setup scripts
└── public/                     # Static assets
```

## Database Schema

### Tables
- **users**: User management and authentication
- **oan_entries**: Main data entries with OAN measurements
- **running_sums**: Optimized storage for statistical calculations

### Key Fields
- **OAN Values**: Actual and predicted oil absorption numbers
- **Process Parameters**: K2CO3 flow, oil flow rates
- **Quality Limits**: LSL, USL, target values
- **Timestamps**: Full audit trail

## Usage

### 1. Login
- Navigate to the login page
- Enter your username (accounts are created automatically)
- System verifies database connection before allowing access

### 2. Data Entry
- Select carbon black grade from presets
- Enter OAN measurement and process parameters
- System automatically calculates predictions and statistics
- View real-time updates in the calculation panel

### 3. Analysis
- **Charts Tab**: Interactive visualization of trends and predictions
- **History Tab**: Review and manage historical entries
- **Calculations Panel**: Real-time statistical analysis

### 4. Process Control
- Monitor Cpk values for process capability
- Track specification limit compliance
- Identify trends and outliers

## Key Components

### AnalysisChart
- Dynamic Chart.js integration with SSR safety
- Fallback table view for server-side rendering
- Interactive tooltips and legends
- Responsive design

### DataEntryForm
- Grade-based preset system
- Real-time validation
- Automatic calculations on submission
- Error handling and user feedback

### CalculationPanel
- Sequential mean calculations
- Regression analysis (B0, B1, B2 coefficients)
- Process capability indices
- Standard deviation tracking

## Development

### Adding New Grades
Update the `GRADE_PRESETS` in your Supabase configuration:
```typescript
export const GRADE_PRESETS = {
  "NEW_GRADE": {
    lsl: 120,
    usl: 140,
    target_oan: 130
  }
}
```

### Custom Styling
- Modify `app/globals.css` for global styles
- Use Tailwind utilities for component styling
- Custom animations are defined in the globals file

### Database Modifications
- Update SQL scripts in the `scripts/` directory
- Test changes with the development database first
- Consider migration scripts for production updates

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Set up your production environment variables
3. Deploy to your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the GitHub issues
- Review the database connection status
- Verify environment variables
- Test with sample data

## Roadmap

- [ ] Advanced filtering and search
- [ ] Export functionality (CSV, PDF)
- [ ] Multi-user role management
- [ ] Mobile app development
- [ ] Integration with laboratory systems
- [ ] Advanced statistical models
