# DoGood - Volunteer Opportunities Platform

A production-ready React web application that connects high school students in the Dallas-Fort Worth area with volunteer opportunities. Built with modern web technologies and designed for scalability and user experience.

## 🚀 Features

### For Students
- **Browse Opportunities**: View and filter volunteer opportunities by category, hours needed, and location
- **Save Opportunities**: Bookmark interesting opportunities for later
- **Register & Track**: Sign up for opportunities and track your service hours progress
- **Progress Dashboard**: Monitor your progress toward service hours goals
- **Mobile Responsive**: Access the platform from any device

### For Organizations
- **Post Opportunities**: Create and manage volunteer opportunities
- **Verification System**: Build trust with verified organization badges
- **Dashboard Management**: Edit, delete, and monitor your posted opportunities
- **Student Engagement**: Connect with motivated high school students

### Core Features
- **Authentication System**: Secure user registration and login for both students and organizations
- **Role-Based Access**: Different interfaces and permissions for students vs. organizations
- **Real-time Updates**: Live data from Supabase database
- **Modern UI/UX**: Clean, intuitive design with Tailwind CSS and shadcn/ui components
- **Google Maps Integration**: Location services and directions (ready for API key)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Maps**: Google Maps API
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account
- Google Maps API key (optional for full functionality)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to the project directory
cd dogood

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Supabase Database Setup

#### Create Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('student', 'organization')) NOT NULL,
  organization_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  service_hours_goal INTEGER DEFAULT 100,
  total_hours_logged INTEGER DEFAULT 0,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organization_id UUID REFERENCES profiles(id) NOT NULL,
  cause_category TEXT CHECK (cause_category IN ('STEM', 'Environment', 'Health', 'Education', 'Other')) NOT NULL,
  hours_needed INTEGER NOT NULL,
  max_volunteers INTEGER NOT NULL,
  current_volunteers INTEGER DEFAULT 0,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved opportunities table
CREATE TABLE saved_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Volunteer registrations table
CREATE TABLE volunteer_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'completed', 'cancelled')),
  hours_completed INTEGER DEFAULT 0,
  UNIQUE(user_id, opportunity_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active opportunities" ON opportunities
  FOR SELECT USING (status = 'active');

CREATE POLICY "Organizations can manage their opportunities" ON opportunities
  FOR ALL USING (organization_id = auth.uid());

CREATE POLICY "Users can view their saved opportunities" ON saved_opportunities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their saved opportunities" ON saved_opportunities
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their registrations" ON volunteer_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their registrations" ON volunteer_registrations
  FOR ALL USING (user_id = auth.uid());

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Enable Email Auth

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable "Enable email confirmations" if desired
3. Configure any additional auth settings

### 4. Google Maps Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Maps JavaScript API and Places API
4. Create credentials (API key)
5. Add the API key to your `.env` file

### 5. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── Header.tsx      # Main navigation header
├── contexts/            # React contexts for state management
│   ├── AuthContext.tsx # User authentication state
│   └── SupabaseContext.tsx # Database connection
├── pages/              # Main application pages
│   ├── Opportunities.tsx      # Browse opportunities
│   ├── OpportunityDetail.tsx  # Individual opportunity view
│   ├── MyOpportunities.tsx    # User's saved/registered opportunities
│   ├── ForOrganizations.tsx   # Organization dashboard
│   └── Profile.tsx            # User profile management
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## 🎨 Customization

### Colors and Theme

The app uses a custom color palette defined in `tailwind.config.js`:

- **Primary**: Green (`#10B981`) - Main brand color
- **Secondary**: Blue (`#3B82F6`) - Secondary actions
- **Accent**: Amber (`#F59E0B`) - Highlights and warnings

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable component classes in `src/index.css`
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app is compatible with any static hosting platform:
- Netlify
- AWS S3 + CloudFront
- Firebase Hosting
- GitHub Pages

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Supabase Auth with email/password
- **Role-based Access**: Different permissions for students vs. organizations
- **Input Validation**: Form validation and sanitization
- **Protected Routes**: Authentication-required pages

## 📱 Mobile Responsiveness

The app is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables
   - Check Supabase project status
   - Ensure RLS policies are properly configured

2. **Google Maps Not Loading**
   - Verify API key is correct
   - Check API quotas and billing
   - Ensure required APIs are enabled

3. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review [Tailwind CSS docs](https://tailwindcss.com/docs)
- Open an issue in the project repository

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Lucide](https://lucide.dev/) for the beautiful icons
- [React](https://reactjs.org/) for the amazing frontend framework

---

**Built with ❤️ for the Dallas-Fort Worth community**
