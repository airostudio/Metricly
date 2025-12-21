# SkillAssess Pro - Technical Skills Assessment Platform

A comprehensive technical skills assessment platform that employers can use to gauge the real-world skills of developers, programmers, and support personnel through gradually harder coding challenges with advanced anti-cheating measures.

## 🌟 Features

### For Employers
- **Custom Test Creation**: Create tailored assessments with multiple difficulty levels
- **Real-time Monitoring**: Track candidate progress in real-time
- **Comprehensive Analytics**: Detailed performance reports and analytics
- **Candidate Management**: Invite and manage candidates easily
- **Question Bank**: Pre-built questions for JavaScript, Python, Java, and more
- **Flexible Configuration**: Customize time limits, difficulty progression, and proctoring settings

### For Candidates
- **Code Editor**: Built-in code editor with syntax highlighting
- **Auto-grading**: Instant feedback with automated test cases
- **Progress Tracking**: Visual progress indicators
- **Multiple Languages**: Support for JavaScript, Python, Java, C++, SQL

### Advanced Security Features
- **AI Detection**: Advanced pattern analysis to detect AI-generated code
  - Typing pattern analysis
  - Code pattern recognition
  - Suspicion scoring system
- **Anti-Cheat Measures**:
  - Copy/paste blocking
  - Tab switching detection
  - Developer tools detection
  - Screen monitoring
- **Timing Metrics**:
  - Question timers
  - First keypress tracking
  - Total assessment time
- **Violation Tracking**: Automatic termination after multiple violations

## 📋 Tech Stack

**Backend:**
- Node.js / Express.js
- MongoDB / Mongoose
- Socket.IO (real-time monitoring)
- JWT authentication
- Natural (NLP for AI detection)

**Frontend:**
- Vanilla JavaScript
- CSS3 with modern features
- Socket.IO client
- Responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/skillassess-pro.git
cd skillassess-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure your settings:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/skillassess
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5500
```

4. **Start MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Seed the database with sample data**
```bash
node database/seed.js
```

This will create:
- A demo employer account (demo@skillassess.com / password123)
- 3 sample tests with 10+ coding questions

6. **Start the server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

7. **Access the application**
- Candidate Assessment: `http://localhost:3000/`
- Employer Dashboard: `http://localhost:3000/employer/dashboard.html`
- API Health Check: `http://localhost:3000/api/health`

## 📖 Usage Guide

### For Employers

1. **Login**
   - Go to `/employer/dashboard.html`
   - Use demo credentials: `demo@skillassess.com` / `password123`

2. **Create a Test**
   - Click "Create New Test"
   - Add title, description, and configure settings
   - Select questions from the question bank
   - Set time limits and security options
   - Publish the test

3. **Invite Candidates**
   - Select a test
   - Click "Invite"
   - Enter candidate email and details
   - System generates a unique access code
   - Candidate receives invitation with:
     - Assessment ID
     - Access code
     - Expiration date

4. **Monitor Assessments**
   - View real-time progress
   - See security violations
   - Track completion status

5. **Review Results**
   - View detailed performance reports
   - See code submissions
   - Check AI detection scores
   - Download reports

### For Candidates

1. **Access the Assessment**
   - Go to the main URL (`http://localhost:3000`)
   - Enter your email, access code, and assessment ID
   - Give required consents

2. **Take the Assessment**
   - Read each question carefully
   - Write code in the editor
   - Submit to run tests
   - View test results
   - Move to next question

3. **Security Guidelines**
   - Do not switch tabs or windows
   - Do not copy/paste code
   - Do not use external tools
   - Write code yourself
   - Stay focused on the assessment

## 🔒 Security Features Explained

### AI Detection System

The platform uses multiple techniques to detect AI-generated code:

1. **Typing Pattern Analysis**
   - Monitors keystroke intervals
   - Detects unnatural typing rhythms
   - Flags suspiciously consistent patterns

2. **Code Pattern Recognition**
   - Checks for AI-specific comments
   - Detects excessive documentation
   - Identifies boilerplate patterns
   - Analyzes code complexity

3. **Scoring System**
   - 0-30: Low suspicion
   - 31-70: Moderate suspicion
   - 71-100: High suspicion (flagged)

### Violation System

- **Tab switching**: +1 violation per switch
- **Copy attempts**: +1 violation per attempt
- **Paste attempts**: +1 violation per attempt
- **AI detection**: +1 violation when score > 70
- **Auto-termination**: After 10 violations

## 📊 API Documentation

### Authentication Endpoints

```
POST /api/auth/employer/register
POST /api/auth/employer/login
POST /api/auth/candidate/access
GET  /api/auth/me
```

### Test Management

```
GET    /api/tests
POST   /api/tests
GET    /api/tests/:id
PUT    /api/tests/:id
DELETE /api/tests/:id
POST   /api/tests/:id/invite
GET    /api/tests/:id/results
```

### Assessment Endpoints

```
POST /api/assessments/:id/start
POST /api/assessments/:id/submit-answer
POST /api/assessments/:id/skip-question
POST /api/assessments/:id/security-violation
POST /api/assessments/:id/complete
GET  /api/assessments/:id
```

### Analytics Endpoints

```
GET /api/analytics/dashboard
GET /api/analytics/test/:testId
GET /api/analytics/assessment/:assessmentId
```

## 🧪 Testing

Run automated tests:
```bash
npm test
```

## 🚢 Deployment

### Option 1: Traditional Hosting

1. Set up a production MongoDB instance
2. Configure environment variables
3. Build and deploy:
```bash
NODE_ENV=production npm start
```

### Option 2: Docker

```bash
docker build -t skillassess-pro .
docker run -p 3000:3000 --env-file .env skillassess-pro
```

### Option 3: Cloud Platforms

- **Heroku**: Use the provided `Procfile`
- **AWS**: Deploy using Elastic Beanstalk or EC2
- **DigitalOcean**: Use App Platform or Droplets

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by platforms like HackerRank and LeetCode
- Built with modern web technologies
- Designed for real-world hiring scenarios

## 📞 Support

For support, email support@skillassess.com or create an issue on GitHub.

## 🗺️ Roadmap

- [ ] Video proctoring with face detection
- [ ] More programming languages (Python, Java, C++)
- [ ] Code execution sandbox for all languages
- [ ] Mobile app for assessments
- [ ] Integration with ATS systems
- [ ] White-labeling options
- [ ] Advanced analytics with ML insights
- [ ] Peer programming challenges
- [ ] Live coding interviews

## ⚖️ Important Notes

### Fair Use
This platform is designed for legitimate hiring and assessment purposes. Users should:
- Ensure candidates are informed about monitoring
- Obtain proper consent for data collection
- Comply with local privacy laws (GDPR, CCPA, etc.)
- Use AI detection as an indicator, not absolute proof

### Privacy Compliance
- Candidates must consent to monitoring
- Data should be stored securely
- Implement data retention policies
- Allow candidates to request data deletion

---

Made with ❤️ for better technical hiring
