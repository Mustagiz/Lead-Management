# Lead Management Web Application

A comprehensive React-based Lead Management System with role-based access control for Employees, QA, and Admin users.

## 🎯 Features

### Employee Panel
- **Lead Upload**: Single and bulk CSV upload capabilities
- **Personal Dashboard**: View only your own leads (10 per page)
- **Lead Tracking**: Monitor lead status (Pending, Qualified, Disqualified)
- **Statistics**: Real-time stats showing total, qualified, and disqualified leads

### QA Panel
- **Lead Auditing**: Review and qualify/disqualify leads
- **Bulk Operations**: Audit multiple leads simultaneously
- **Advanced Filtering**: Filter by date range, campaign code, and agent
- **Download Reports**: Export filtered leads to CSV
- **Clock In/Out**: Time tracking for QA sessions
- **Audit Statistics**: Track total audits, qualified, and disqualified leads

### Admin Panel
- **Complete Oversight**: View all leads and user activities
- **User Management**: Create, edit, delete users (Employee and QA)
- **Password Reset**: Reset user passwords
- **Interactive Dashboard**: Key metrics and analytics
- **Lead Management**: Modify leads and their qualification status
- **Comprehensive Filtering**: Advanced search and filter options

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the application files**

2. **Install dependencies**
```bash
npm install react react-dom lucide-react
```

3. **Run the application**
```bash
# For development
npm start

# For production build
npm run build
```

### Using the Application

1. **Access the login page** at `http://localhost:3000`

2. **Default Credentials**:
   - **Admin**: `admin` / `admin123`
   - **Employee**: `employee1` / `emp123`
   - **QA**: `qa1` / `qa123`

3. **First Steps**:
   - Login with appropriate credentials
   - Employees can upload leads
   - QA can audit uploaded leads
   - Admin can manage everything

## 📋 CSV Upload Format

For bulk lead upload, use the following CSV format:

```csv
Company Name,Salutation,First Name,Last Name,Email,Domain,Job Title,Department,Job Level,Phone No
Acme Corp,Mr.,John,Doe,john.doe@acme.com,acme.com,CEO,Executive,C-Suite,+1-555-0100
TechStart Inc,Ms.,Jane,Smith,jane.smith@techstart.com,techstart.com,CTO,IT,C-Suite,+1-555-0101
```

### Field Specifications

| Field | Type | Required | Options/Format |
|-------|------|----------|----------------|
| Company Name | Text | Yes | Any text |
| Salutation | Dropdown | Yes | Mr., Mrs., Miss, Ms., Dr. |
| First Name | Text | Yes | Any text |
| Last Name | Text | No | Any text |
| Email | Email | Yes | Valid email format |
| Domain | Text | No | Any text |
| Job Title | Text | No | Any text |
| Department | Dropdown | Yes | HR, Finance, Marketing, Sales, IT, Operations, R&D, Customer Service, Legal, Supply Chain, Logistics, Administration, QA/QC, Engineering, Security, PMO, Corporate Strategy, PR, Facilities Management, Data Analytics |
| Job Level | Dropdown | Yes | Entry-level, Junior, Mid-level, Senior, Principal, Executive, C-Suite |
| Phone No | Text | No | Include country code (e.g., +1-555-0100) |

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18+
- **State Management**: React Context API
- **Icons**: Lucide React
- **Styling**: Tailwind CSS (via CDN)
- **Storage**: LocalStorage (Demo - Replace with backend in production)

### Component Structure
```
App
├── AuthProvider (Authentication Context)
├── LoginPage
└── MainLayout
    ├── EmployeeDashboard
    │   └── UploadLeadModal
    ├── QADashboard
    └── AdminDashboard
        └── UserModal
```

### Data Schema

**User Object**
```javascript
{
  id: number,
  username: string,
  password: string,
  role: 'admin' | 'employee' | 'qa',
  name: string
}
```

**Lead Object**
```javascript
{
  id: number,
  date: string,
  raName: string,
  employeeId: number,
  status: 'pending' | 'qualified' | 'disqualified',
  companyName: string,
  salutation: string,
  firstName: string,
  lastName: string,
  email: string,
  domain: string,
  jobTitle: string,
  department: string,
  jobLevel: string,
  phoneNo: string,
  // ... additional fields
}
```

## 🔒 Security Features

- Password-protected authentication
- Role-based access control
- Session management
- Password masking with toggle visibility
- Secure logout functionality

## 🎨 Design Features

- Modern gradient-based UI
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Interactive hover states
- Loading states and feedback
- Professional color schemes
- Accessible form controls

## 📊 Key Functionalities

### Employee Features
✓ Upload single lead with form validation
✓ Bulk CSV upload
✓ View personal leads only
✓ Pagination (10 leads per page)
✓ Real-time status updates from QA
✓ Dashboard statistics

### QA Features
✓ Clock in/out tracking
✓ Filter leads by date range and agent
✓ Single lead qualification
✓ Bulk audit operations
✓ CSV export functionality
✓ Audit history tracking
✓ Performance metrics

### Admin Features
✓ Complete system overview
✓ Create/Edit/Delete users
✓ Password reset capability
✓ View all leads with filters
✓ Modify lead statuses
✓ User activity monitoring
✓ System-wide analytics

## 🔧 Customization

### Changing Colors
Edit the gradient classes in the components:
```javascript
// Primary gradient
from-indigo-600 to-purple-600

// Status colors
bg-green-100 text-green-800 // Qualified
bg-red-100 text-red-800      // Disqualified
bg-yellow-100 text-yellow-800 // Pending
```

### Adding New Departments/Industries
Update the arrays in `UploadLeadModal`:
```javascript
const departments = ['HR', 'Finance', /* add more */];
const industries = ['Technology', 'Healthcare', /* add more */];
```

## 📝 Production Considerations

### Replace LocalStorage with Backend
```javascript
// Current (Demo)
const data = getStoredData();
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// Production (Example)
const response = await fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
});
```

### Recommended Backend Stack
- **Node.js + Express** for REST API
- **MongoDB** or **PostgreSQL** for database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express-validator** for input validation

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_JWT_SECRET=your-secret-key
```

## 🐛 Troubleshooting

**Issue**: Leads not showing after upload
- **Solution**: Check browser console for errors, ensure LocalStorage is enabled

**Issue**: CSV upload not working
- **Solution**: Verify CSV format matches the template, check for special characters

**Issue**: Can't login
- **Solution**: Clear browser cache and LocalStorage, use default credentials

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the CSV format specifications
3. Verify user roles and permissions

## 📄 License

This application is provided as-is for demonstration and development purposes.

## 🚀 Future Enhancements

- [ ] Email notifications for lead status changes
- [ ] Advanced analytics and reporting
- [ ] Export to multiple formats (PDF, Excel)
- [ ] Lead assignment automation
- [ ] Integration with CRM systems
- [ ] Real-time collaboration features
- [ ] Mobile app version
- [ ] Two-factor authentication
- [ ] Audit trail and logging
- [ ] Custom field configurations

---

**Version**: 1.0.0  
**Last Updated**: February 2026
