# 🐷 LiczyGrosz

**LiczyGrosz** (Polish for "Penny Counter") is a modern, feature-rich expense tracking mobile application built with React Native and Expo. Track your income and expenses with style, gain insights into your spending habits, and manage your finances across multiple currencies.

## ✨ Features

### 💰 Transaction Management
- **Quick Entry**: Add income and expenses with an intuitive interface
- **Smart Categories**: Pre-configured categories with custom icons and colors
- **Flexible Notes**: Add detailed descriptions to your transactions
- **Edit & Delete**: Full control over your transaction history

### 📊 Statistics & Insights
- **Monthly Expense Trends**: Visualize your spending patterns over the last 6 months
- **Savings Suggestions**: Get real-time calculations of potential savings based on current month's income vs expenses
- **Interactive Charts**: Beautiful line charts powered by react-native-chart-kit

### 💱 Multi-Currency Support
- **Three Major Currencies**: USD ($), EUR (€), and PLN (zł)
- **Per-Transaction Currency**: Set different currencies for individual transactions
- **Default Currency**: Configure your preferred currency in profile settings
- **Smart Currency Detection**: Automatically suggests currency based on your locale

### 🔁 Recurring Transactions
- **Automated Tracking**: Set up weekly or monthly recurring income/expenses
- **Auto-Processing**: Recurring transactions are automatically added when due
- **Easy Management**: View and edit all recurring items in one place

### 🌍 Internationalization
- **Bilingual Support**: Full Polish and English translations
- **Locale-Aware**: Date formatting and currency symbols adapt to your language
- **Easy Switching**: Change language anytime from profile settings

### 🎨 Premium Design
- **Dark Mode Support**: Seamless light and dark theme switching
- **Modern UI**: Clean, colorful interface with smooth animations
- **Custom Branding**: Unique LiczyGrosz piggy bank icon
- **Responsive Layout**: Optimized for various screen sizes

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/piotrptak/liczygrosz.git
   cd liczygrosz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## 📱 Usage

### First Time Setup
1. Launch the app and you'll see the login screen
2. Sign in using Google, Facebook, or Instagram (mock authentication for demo)
3. You'll be taken to the Dashboard

### Adding Transactions
1. Tap the **"Dodaj"** (Add) tab at the bottom
2. Select transaction type: **Wydatek** (Expense) or **Przychód** (Income)
3. Enter the amount using the keypad
4. Choose a category
5. Add a note (mandatory)
6. Select currency if different from default
7. Tap **"Zapisz"** (Save)

### Viewing Statistics
1. Navigate to the **"Wykresy"** (Stats) tab
2. View your monthly expense trend chart
3. Check your savings suggestion based on current month's activity

### Managing Categories
1. Go to **"Profil"** (Profile) tab
2. Tap **"Kategorie"** (Categories)
3. Add, edit, or delete custom categories

### Setting Up Recurring Transactions
1. From Profile, tap **"Cykliczne"** (Recurring)
2. Add new recurring items with frequency (weekly/monthly)
3. The app automatically processes them when due

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Database**: SQLite (expo-sqlite)
- **Navigation**: Expo Router
- **Charts**: react-native-chart-kit
- **Internationalization**: i18n-js
- **Date Handling**: date-fns
- **Icons**: Expo Vector Icons (Ionicons)

## 📂 Project Structure

```
expense-tracker/
├── app/                      # App screens and routes
│   ├── (tabs)/              # Tab navigation screens
│   ├── categories/          # Category management
│   ├── recurring/           # Recurring transactions
│   └── login.tsx            # Authentication screen
├── components/
│   ├── feature/             # Feature components (forms, lists)
│   └── ui/                  # Reusable UI components
├── context/                 # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   └── LocalizationContext.tsx  # i18n and currency
├── db/                      # Database setup and migrations
├── locales/                 # Translation files (en, pl)
├── utils/                   # Utility functions
└── assets/                  # Images and fonts
```

## 🎯 Key Features Explained

### Savings Calculation Algorithm
The savings suggestion uses a simple but effective formula:
```
Potential Savings = Total Income (Current Month) - Total Expenses (Current Month)
```
- Calculates from the 1st of the current month to today
- Updates in real-time as you add transactions
- Displays positive savings or shows $0.00 if expenses exceed income

### Currency Management
- **Global Default**: Set in LocalizationContext based on device locale
- **User Override**: Change default currency in Profile settings
- **Transaction-Specific**: Each transaction can have its own currency
- **Persistence**: Currency preferences are saved locally

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Piotr Ptak**
- GitHub: [@piotrptak](https://github.com/piotrptak)

## 🙏 Acknowledgments

- Built with ❤️ using React Native and Expo
- Icons from Expo Vector Icons
- Charts powered by react-native-chart-kit

---

**LiczyGrosz** - Track every penny, save every złoty! 🐷💰
