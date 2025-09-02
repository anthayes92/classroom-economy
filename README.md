# Classroom Economy

A simple web-based classroom economy management system built with HTML, CSS, and JavaScript. This application allows students to manage their virtual currency and teachers to oversee the entire classroom economy.

## Features

### Student Features
- View current balance and transaction history
- Submit transaction requests (purchases, payment requests)
- Filter and search transaction history
- Real-time balance updates

### Admin/Teacher Features
- Overview dashboard with system statistics
- User management (view all students, add/deduct currency)
- Transaction approval system
- Bulk transaction operations
- Create transactions for individual students or all students
- Advanced filtering and sorting

## Getting Started

### Prerequisites
- A modern web browser
- Python 3 (for running local server) or any other local server

### Running the Application

1. Clone or download this repository
2. Navigate to the project directory
3. Start a local server:

   **Using Python:**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Using Node.js (if you have it installed):**
   ```bash
   npx http-server -p 8000
   ```

4. Open your web browser and go to `http://localhost:8000`

### Demo Accounts

The application comes with demo accounts for testing:

**Student Account:**
- Username: `student`
- Password: `demo123`
- Account Type: Student

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Account Type: Teacher/Admin

You can also create new student accounts by entering any username and password and selecting "Student" as the account type.

## File Structure

```
classroom-economy/
├── index.html          # Landing page with login
├── dashboard.html      # Student dashboard
├── admin.html         # Admin panel
├── package.json       # Project configuration
├── styles/
│   └── main.css       # All styling
├── js/
│   ├── auth.js        # Authentication management
│   ├── main.js        # Landing page functionality
│   ├── dashboard.js   # Student dashboard functionality
│   └── admin.js       # Admin panel functionality
└── README.md          # This file
```

## How to Use

### For Students
1. Log in with your credentials
2. View your current balance on the dashboard
3. Submit transaction requests using the form
4. View your transaction history with filtering options
5. Wait for admin approval for pending transactions

### For Teachers/Admins
1. Log in with admin credentials
2. Use the navigation tabs to access different features:
   - **Overview**: View system statistics
   - **Users**: Manage all student accounts
   - **Transactions**: View all system transactions
   - **Pending Approval**: Approve or reject student requests
   - **New Transaction**: Create transactions for students

## Data Storage

This application uses browser localStorage for data persistence. Data is stored locally in the browser and will persist between sessions. To reset all data, clear your browser's localStorage for this domain.

## Customization

### Adding New Transaction Types
Edit the transaction type options in the HTML forms and update the JavaScript validation logic.

### Styling Changes
Modify `styles/main.css` to customize the appearance. The CSS uses CSS Grid and Flexbox for responsive layouts.

### Currency Settings
Update the currency symbol and formatting in the JavaScript files by modifying the display functions.

## Browser Compatibility

This application works in all modern browsers including:
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Security Note

This is a demonstration application intended for educational use. In a production environment, you would need:
- Proper backend authentication
- Database storage
- Input validation and sanitization
- HTTPS encryption
- Session management

## License

This project is open source and available under the MIT License.
