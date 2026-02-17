# Lead Management System - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Employee Guide](#employee-guide)
3. [QA Guide](#qa-guide)
4. [Admin Guide](#admin-guide)
5. [FAQ](#faq)

---

## Getting Started

### Accessing the System

1. Open your web browser and navigate to the application URL
2. You will see the login page
3. Enter your username and password
4. Click "Login" to access your dashboard

### First-Time Registration

1. Click "Don't have an account? Register" on the login page
2. Fill in the registration form:
   - Full Name
   - Username
   - Password
3. Click "Register"
4. You will be created as an Employee user by default
5. Login with your new credentials

### Demo Credentials

For testing purposes, use these credentials:
- **Admin**: `admin` / `admin123`
- **Employee**: `employee1` / `emp123`
- **QA**: `qa1` / `qa123`

---

## Employee Guide

### Understanding Your Dashboard

When you log in as an employee, you'll see:

1. **Statistics Cards**
   - Total Leads: All leads you've uploaded
   - Qualified: Leads approved by QA
   - Disqualified: Leads rejected by QA
   - Pending: Leads awaiting QA review

2. **Upload Leads Button**: Top right corner
3. **Leads Table**: Shows your leads with pagination (10 per page)

### Uploading a Single Lead

1. Click the "Upload Leads" button
2. Select "Single Lead" tab
3. Fill in the required fields:
   - **Company Name** (required)
   - **Salutation** (Mr., Mrs., Miss, Ms., Dr.)
   - **First Name** (required)
   - **Last Name**
   - **Email** (required, must be valid)
   - **Domain**
   - **Job Title**
   - **Department** (select from dropdown)
   - **Job Level** (select from dropdown)
   - **Phone Number** (include country code)
   - **City, State**
   - **Country** (select from dropdown)
   - **Industry Type** (select from dropdown)

4. Click "Upload Lead"
5. The lead will appear in your table with "Pending" status

### Bulk Upload via CSV

1. Click the "Upload Leads" button
2. Select "Bulk Upload (CSV)" tab
3. Click "Choose File" and select your CSV file
4. Ensure your CSV follows this format:

```csv
Company Name,Salutation,First Name,Last Name,Email,Domain,Job Title,Department,Job Level,Phone No
Acme Corp,Mr.,John,Doe,john.doe@acme.com,acme.com,CEO,Executive,C-Suite,+1-555-0100
```

5. Click "Upload CSV"
6. All leads from the file will be imported

### Viewing Your Leads

- **Navigation**: Use "Previous" and "Next" buttons to browse pages
- **Status Colors**:
  - 🟡 Yellow = Pending (awaiting QA review)
  - 🟢 Green = Qualified (approved by QA)
  - 🔴 Red = Disqualified (rejected by QA)

### Best Practices

✅ **Do:**
- Verify email addresses before upload
- Include country codes in phone numbers
- Use the sample CSV template
- Double-check company names for accuracy
- Keep information up to date

❌ **Don't:**
- Upload duplicate leads
- Use invalid email formats
- Leave required fields empty
- Upload without verifying data quality

---

## QA Guide

### Understanding Your Dashboard

As a QA user, you have access to:

1. **Statistics Cards**
   - Total Audited: All leads you've reviewed
   - Qualified: Leads you've approved
   - Disqualified: Leads you've rejected
   - Clock In/Out Status

2. **Filters Section**: Search and filter leads
3. **Leads Table**: All system leads with audit actions

### Clock In/Out

⚠️ **Important**: You must clock in before auditing leads!

1. Locate the "Status" card (top right)
2. Click "Clock In" to start your session
3. The button will turn red showing "Clock Out"
4. When done, click "Clock Out" to end your session

### Filtering Leads

Use filters to find specific leads:

1. **Start Date**: Filter leads from this date onwards
2. **End Date**: Filter leads up to this date
3. **Agent Name**: Search by employee name
4. Click "Apply" to filter
5. Click the download icon to export results to CSV

### Auditing Individual Leads

1. Find the lead you want to audit
2. In the "Actions" column, you'll see two buttons:
   - ✓ Green checkmark = Qualify
   - ✗ Red X = Disqualify
3. Click the appropriate action
4. The lead status will update immediately
5. The employee will see the updated status

### Bulk Auditing

1. Select multiple leads using checkboxes in the first column
2. Use the checkbox in the header to select all visible leads
3. A blue banner will appear showing selected count
4. Choose either:
   - "Qualify All" to approve all selected leads
   - "Disqualify All" to reject all selected leads
5. Confirm the action

### Downloading Reports

1. Apply desired filters (date range, agent)
2. Click the download button (next to Apply)
3. A CSV file will be downloaded with:
   - Date, RA Name, Company, Contact, Email, Job Title, Status

### QA Best Practices

✅ **Do:**
- Clock in before starting work
- Review lead information thoroughly
- Use filters to organize your workflow
- Download reports regularly for record-keeping
- Audit systematically to maintain quality

❌ **Don't:**
- Audit while clocked out
- Rush through reviews
- Approve invalid email addresses
- Ignore duplicate entries

---

## Admin Guide

### Understanding Your Dashboard

The admin panel has three main tabs:

1. **Overview**: System-wide statistics and metrics
2. **All Leads**: Complete lead database
3. **Manage Users**: User administration

### Overview Tab

View key metrics:
- **Total Leads**: All leads in the system
- **Qualified/Disqualified**: Lead status breakdown
- **User Statistics**: Employee and QA counts
- **Conversion Rates**: Qualification percentages

### Managing Leads

1. Click the "All Leads" tab
2. View all leads from all employees
3. See real-time status updates
4. Use this for:
   - System-wide reporting
   - Quality monitoring
   - Data verification

### User Management

#### Adding a New User

1. Click "Manage Users" tab
2. Click "Add User" button
3. Fill in the form:
   - Full Name
   - Username (must be unique)
   - Password
   - Role (Employee, QA, or Admin)
4. Click "Add User"

#### Editing a User

1. Find the user in the table
2. Click the edit icon (pencil)
3. Modify the details
4. Click "Update User"

#### Resetting Passwords

1. Find the user in the table
2. Click the refresh icon
3. Enter the new password
4. Confirm the action

#### Deleting Users

1. Find the user in the table
2. Click the trash icon
3. Confirm deletion
4. **Note**: Cannot delete admin users

### Admin Best Practices

✅ **Do:**
- Regularly review user accounts
- Monitor lead quality metrics
- Set strong passwords for new users
- Keep track of system activity
- Back up data regularly (in production)

❌ **Don't:**
- Share admin credentials
- Delete users with active leads without backup
- Create duplicate usernames
- Use weak passwords

---

## FAQ

### General Questions

**Q: I forgot my password. What should I do?**
A: Contact your administrator to reset your password.

**Q: Can I change my username?**
A: Contact your administrator to modify your account details.

**Q: How often should I upload leads?**
A: Upload leads as you acquire them. Daily uploads are recommended.

### Employee Questions

**Q: Why can't I see other employees' leads?**
A: For privacy and organization, employees can only see their own leads.

**Q: What does "Pending" status mean?**
A: The lead is awaiting review by the QA team.

**Q: Can I edit a lead after uploading?**
A: Currently, only admins can edit leads. Upload carefully.

**Q: What if I upload a duplicate?**
A: The system will accept it. Be careful to check before uploading.

**Q: What's the maximum file size for CSV uploads?**
A: There's no hard limit, but keep files under 1000 leads for best performance.

### QA Questions

**Q: What if I accidentally qualify/disqualify a lead?**
A: Click the opposite action to reverse it, or contact an admin.

**Q: Can I see who uploaded each lead?**
A: Yes, the "Agent" column shows the employee name.

**Q: What happens if I forget to clock out?**
A: Clock in/out is for tracking only. No automatic logout occurs.

**Q: Can I filter by multiple criteria?**
A: Yes, use all three filters together (date range + agent).

### Admin Questions

**Q: Can I restore deleted users?**
A: No, deletion is permanent. Be careful when deleting.

**Q: How do I promote an employee to QA?**
A: Edit the user and change their role to "QA".

**Q: Can I see audit history?**
A: Yes, this data is tracked in the system (check the auditLog in storage).

**Q: What if two users have the same username?**
A: The system prevents duplicate usernames during creation.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus search field | `/` |
| Navigate table | Arrow keys |
| Select checkbox | Space |
| Submit form | Enter |

---

## Support

For technical issues or questions:
1. Check this user guide
2. Review the README documentation
3. Contact your system administrator
4. Check browser console for error messages

---

## Security Tips

🔒 **Keep Your Account Secure:**
- Use strong, unique passwords
- Don't share credentials
- Log out when finished
- Report suspicious activity
- Keep your browser updated

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Application Version**: 1.0.0
