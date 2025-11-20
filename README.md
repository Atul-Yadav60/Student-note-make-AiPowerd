# 📚 Student Notes Maker

An intelligent AI-powered study companion that transforms your study materials into comprehensive notes, interactive flashcards, and practice questions. Features built-in performance tracking, quiz management, and multi-user support.

![React](https://img.shields.io/badge/React-18.3.1-blue) ![Vite](https://img.shields.io/badge/Vite-5.3.1-purple) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Key Features

### 📖 Content Generation

- **Smart Document Processing**: Upload PDF, DOCX, or paste text directly
- **AI-Powered Summarization**: Prose-format notes (not bullet points)
- **Dynamic Generation**: 5-30 flashcards/questions based on content length
- **Formula & Constant Extraction**: Automatically identifies scientific formulas and constants

### 🎴 Interactive Learning

- **Flip Flashcards**: Click-to-flip cards for active recall
- **MCQ Practice**: Multiple choice questions with instant feedback
- **Scoring System**: +1 for correct, -1 for wrong answers
- **Answer Persistence**: Your answers save automatically and persist across sessions

### 📊 Performance Analytics

- **Dashboard Tracking**: Circular performance graphs showing your progress
- **Per-Note Performance**: Individual performance tracking for each note
- **Real-time Updates**: Stats update immediately as you answer questions
- **Smart Percentage Calculation**: Normalized scoring from 0% to 100%

### 🔄 Quiz Management

- **Reset Functionality**: Reset individual note quizzes to attempt again
- **Progress Persistence**: Quiz state saves automatically when you navigate away
- **Smart Navigation**: Back button returns to dashboard when viewing saved notes
- **Synchronized Deletion**: Deleting a note removes all associated quiz data

### 👥 Multi-User Support

- **User Profiles**: Create multiple user accounts (no authentication required)
- **Separate Progress**: Each user has isolated notes and quiz results
- **User Switching**: Easily switch between users from the dashboard
- **Local Storage**: All data stored locally for privacy

### 📥 Export & Management

- **PDF Export**: Download notes as formatted PDF documents
- **Note Management**: View, reset, or delete saved notes
- **Clickable Cards**: Click any note card to view its content

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Google Gemini API keys ([Get them here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API keys**

   Create `.env` file in the root directory:

   ```env
   VITE_GEMINI_API_KEY_1=your-first-api-key
   VITE_GEMINI_API_KEY_2=your-second-api-key
   VITE_GEMINI_API_KEY_3=your-third-api-key
   VITE_GEMINI_API_KEY_4=your-fourth-api-key
   ```

   **Note**: Add multiple keys for automatic rotation when rate limits are hit.

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📖 User Guide

### First Time Setup

1. **Create User Profile**
   - Enter your name and email
   - No authentication required - data stored locally
2. **Upload Study Material**
   - Drag & drop PDF/DOCX file, or
   - Paste text directly into the text area
3. **Set Preferences**

   - Enter title for your notes
   - Select subject (Math, Science, History, etc.)

4. **Generate**
   - Click "Generate Study Materials"
   - Wait for AI processing

### Using Generated Content

**Summary Tab**: Read comprehensive prose-format notes

**Flashcards Tab**:

- Click cards to flip between front and back
- Number of cards scales with content length (5-30)

**Practice Questions Tab**:

- Answer MCQ questions (single selection)
- Click "Check Answer" to see if you're correct
- Score: +1 for correct, -1 for wrong
- Your answers save automatically
- Click "Reset All Answers" to start fresh

### Dashboard Features

**Performance Overview**:

- Circular graph showing overall performance percentage
- Total marks, questions attempted, correct/incorrect counts
- Performance normalized: 0% (all wrong) to 100% (all correct)

**Saved Notes & Chapters**:

- All your notes displayed as clickable cards
- Each card shows:
  - Title, subject, date created
  - Number of sections, flashcards, questions
  - Performance graph (if quiz attempted)
  - Reset button (🔄) to clear quiz data
  - Delete button (🗑️) to remove note

**Actions**:

- Click note card to view/study
- Click reset (🔄) to clear quiz attempts for that note
- Click delete (🗑️) to remove note and all its data
- "Clear All Data" button to reset everything

### Navigation

- **From new note**: Back button goes to home page
- **From dashboard note**: Back button returns to dashboard
- Progress saves automatically when you navigate away

## 🛠️ Technical Details

### Architecture

```
Frontend: React 18.3.1 + Vite 5.3.1
AI: Google Gemini API (4-tier fallback system)
Storage: Browser localStorage (multi-user isolated)
PDF Processing: pdfjs-dist 3.11.174
DOCX Processing: mammoth 1.6.0
PDF Generation: jspdf 2.5.1
```

### Project Structure

```
src/
├── components/
│   ├── InputScreenModern.jsx    # File upload & text input
│   ├── LoadingScreen.jsx        # Processing animation
│   ├── OutputScreen.jsx         # Notes display with quiz
│   ├── Dashboard.jsx            # Performance tracking
│   └── UserManagement.jsx       # User profile management
├── services/
│   └── aiService.js            # AI integration with 4-tier fallback
├── utils/
│   ├── textProcessing.js       # PDF/DOCX extraction
│   ├── pdfGenerator.js         # PDF export functionality
│   └── storage.js              # Multi-user localStorage manager
└── App.jsx                     # Main orchestrator
```

### AI Processing Pipeline

1. **Text Extraction**: Extract from PDF/DOCX or use pasted text
2. **Content Analysis**: Determine word count for dynamic scaling
3. **Summary Generation**: Create prose-format comprehensive notes
4. **Formula Extraction**: Identify scientific formulas and constants
5. **Flashcard Creation**: 5-30 cards based on content length
6. **Question Generation**: 5-30 MCQ questions based on content length
7. **4-Tier Fallback**: Try gemini-1.5-flash-latest → gemini-1.5-flash → gemini-1.5-pro-latest → gemini-pro

### Storage Structure

```javascript
localStorage:
  - student_notes_users: Array of user profiles
  - student_notes_current_user: Currently active user ID
  - student_notes_user_{userId}:
      - notes: Array of saved notes
      - quizResults: Array of quiz attempt results
      - quizProgress: Object of saved quiz states per note
      - settings: User preferences
```

### Scoring System

```
MCQ Questions:
  - Correct answer: +1 point
  - Wrong answer: -1 point

Performance Calculation:
  - Raw Score Range: -questionsAttempted to +questionsAttempted
  - Percentage: ((score + questionsAttempted) / (2 * questionsAttempted)) × 100
  - Example: -3 score out of 15 questions = 40%
```

## 🎨 Customization

### Change AI Model

Edit `src/services/aiService.js`:

```javascript
const models = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];
```

### Adjust Generation Scale

Edit `src/services/aiService.js`:

```javascript
// Current scaling (words → items):
// <200 words: 5 items
// 200-500: 10 items
// 500-1000: 15 items
// 1000-2000: 20 items
// >2000: 30 items
```

### Modify Scoring

Edit `src/components/Dashboard.jsx`:

```javascript
// Change percentage calculation formula
const averageScore =
  ((totalScore + questionsAttempted) / (2 * questionsAttempted)) * 100;
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description     | Default  |
| ----------------------- | --------------- | -------- |
| `VITE_GEMINI_API_KEY_1` | Primary API key | Required |
| `VITE_GEMINI_API_KEY_2` | Backup key #1   | Optional |
| `VITE_GEMINI_API_KEY_3` | Backup key #2   | Optional |
| `VITE_GEMINI_API_KEY_4` | Backup key #3   | Optional |

### Build for Production

```bash
npm run build
```

Output in `dist/` directory. Deploy to any static host.

## 🐛 Troubleshooting

### API Key Issues

- Verify `.env` file exists in root directory
- Check at least `VITE_GEMINI_API_KEY_1` is set
- Restart dev server after changing `.env`
- Get keys from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Rate Limit Errors

- App automatically rotates between configured keys
- Add more keys (up to 4) for better performance
- Free tier: 60 requests/minute per key

### Performance Graph Shows 0%

- Check browser console for "Quiz Results" logs
- Verify quiz results are being saved (console logs)
- Try resetting the quiz and re-attempting
- Clear browser cache and reload

### PDF Extraction Fails

- Ensure PDF contains selectable text (not scanned images)
- For scanned PDFs, use OCR tools first
- Try converting to DOCX or paste text manually

### Data Not Persisting

- Check browser allows localStorage
- Don't use incognito/private mode
- Check browser storage isn't full
- Try different browser

## 📊 Features Comparison

| Feature                | Status |
| ---------------------- | ------ |
| PDF/DOCX Upload        | ✅     |
| Text Paste Input       | ✅     |
| Prose Format Notes     | ✅     |
| Dynamic Scaling (5-30) | ✅     |
| Formula Extraction     | ✅     |
| Interactive Flashcards | ✅     |
| MCQ Questions          | ✅     |
| Answer Persistence     | ✅     |
| Performance Graphs     | ✅     |
| Per-Note Tracking      | ✅     |
| Quiz Reset             | ✅     |
| Multi-User Support     | ✅     |
| PDF Export             | ✅     |
| Smart Navigation       | ✅     |
| Data Synchronization   | ✅     |

## 🚦 Development Status

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: November 2025

**Recent Updates**:

- ✅ Fixed performance graph calculation
- ✅ Added quiz reset functionality
- ✅ Implemented answer persistence
- ✅ Added smart back navigation
- ✅ Synchronized note/quiz deletion

## 📄 License

MIT License - Free to use and modify

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- React team for the excellent framework
- Vite for blazing fast development
- Mozilla PDF.js for PDF processing
- All contributors and users

## 📞 Support

Need help?

- Check troubleshooting section above
- Review [Gemini API Docs](https://ai.google.dev/docs)
- Check browser console for detailed logs

---

**Built with ❤️ for students worldwide**  
Happy studying! 🎓📚
