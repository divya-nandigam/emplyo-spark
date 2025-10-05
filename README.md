# Employee Management System (EMS)

A comprehensive full-stack web application for managing employees, attendance, courses, and AI-powered interviews.

## Features

### Admin Features
- Employee management (add, edit, delete, view)
- Attendance overview and tracking
- AI-powered candidate interviews with automated evaluation
- Interview history and analytics
- Department-based organization

### Employee Features  
- Personal profile management
- Daily attendance check-in/check-out
- Attendance history tracking
- Course enrollment and training
- Quiz assessments with instant feedback
- Progress tracking

### Courses & Training
- 8 department-specific courses
- Interactive quiz assessments
- Automatic grading and feedback
- Progress tracking and completion certificates
- Course enrollment management

### AI Interview System
- Automated question generation
- Candidate response evaluation  
- Overall score calculation
- AI recommendations for hiring decisions

## Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Cloud-based backend services
- **Database**: PostgreSQL with Row-Level Security
- **Authentication**: Secure JWT-based auth
- **Mobile**: Capacitor for iOS/Android support

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utility functions
├── public/             # Static assets
└── supabase/          # Database migrations & functions
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/divya-nandigam/emplyo-spark
cd emplyo-spark
```

2. Install dependencies
```bash
npm install
```

3. Run development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Mobile App Setup

This project is configured with Capacitor for native mobile deployment.

### iOS/Android Setup

1. Export to GitHub and clone to your local machine

2. Install dependencies
```bash
npm install
```

3. Add platforms
```bash
npx cap add ios
npx cap add android
```

4. Build the project
```bash
npm run build
```

5. Sync with native platforms
```bash
npx cap sync
```

6. Run on device/emulator
```bash
npx cap run android
# or
npx cap run ios
```

**Note**: iOS development requires macOS with Xcode installed. Android requires Android Studio.

## Departments

The system supports the following departments:
- Engineering
- Human Resources
- Marketing
- Sales  
- Finance
- Operations
- Customer Support
- Product Management

## Security

- Row-Level Security (RLS) on all database tables
- Secure authentication with auto-confirm email
- Role-based access control (Admin/Employee)
- Protected API endpoints

## Deployment

The application can be deployed to Vercel or any platform supporting Node.js/React apps.

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
