# Markan Cafe - Reservations Management System

## Project Overview
A comprehensive reservation management dashboard for Markan Cafe's administrative panel. This system allows cafe staff to efficiently manage customer reservations, track booking statuses, and maintain organized scheduling.

## Purpose
To streamline the reservation process for Markan Cafe, providing staff with an intuitive interface to handle booking requests, monitor table availability, and maintain customer relationships.

## Key Features

### 1. Dashboard Statistics
- **Real-time counters** showing total reservations by status
- **Interactive stat cards** that double as status filters
- Visual representation of:
  - Pending reservations
  - Confirmed bookings
  - Completed visits
  - Cancelled reservations

### 2. Dual View Options
- **List View**: Traditional table format with sortable columns
- **Calendar View**: Monthly calendar showing reservations by date

### 3. Reservation Management
- **Create** new reservations with customer details
- **Read**/view complete reservation information
- **Update** reservation status and details
- **Delete** or cancel reservations
- **Print** reservation confirmations

### 4. Advanced Filtering
- **Status-based filtering** (click stat cards or use dropdown)
- **Date-based filtering** (calendar picker)
- **Search functionality** (search by customer name)
- **Combined filters** for precise results

### 5. Data Organization
- **Pagination** for handling large datasets
- **Sortable columns** in list view
- **Timeline tracking** for reservation history
- **Customer details** storage (name, email, phone)

## Technical Implementation

### Data Structure
Each reservation contains:
- **Reservation ID** (unique identifier)
- **Customer Information** (name, email, phone)
- **Booking Details** (date, time, guests, duration)
- **Status** (pending, confirmed, completed, cancelled)
- **Special Requests** (custom notes)
- **Timestamps** (created, updated)

### Core Functions

#### Reservation Operations
- `loadReservations()` - Initializes and displays reservations
- `saveReservation()` - Creates/updates reservation records
- `deleteReservation()` - Removes reservation from system
- `viewReservationDetails()` - Shows complete reservation info

#### Filtering Functions
- `filterByStatus(status)` - Filters by pending/confirmed/etc.
- `filterByDate(date)` - Shows reservations for specific date
- `searchReservations(term)` - Searches customer names
- `clearFilters()` - Resets all filters

#### UI Functions
- `toggleView(view)` - Switches between list/calendar views
- `updateStats()` - Refreshes statistics counters
- `renderTable()` - Displays reservations in table format
- `renderCalendar()` - Shows monthly calendar view

### Event Handlers
- Click handlers for stat card filtering
- Modal open/close controls
- Form submission handling
- Search input debouncing

## User Interface Components

### 1. Sidebar Navigation
- Links to all admin sections
- Active state highlighting
- Logout functionality

### 2. Top Header
- Search bar with icon
- Notification bell with counter
- Admin profile display

### 3. Main Content Area
- Statistics cards (4)
- View toggle buttons
- Filter controls
- Data table/calendar
- Pagination controls

### 4. Modal Windows
- **Add Reservation Modal** - Form for new bookings
- **Details Modal** - Complete reservation information
- **Confirmation Dialogs** - Delete/cancel confirmations

## Workflow Examples

### Adding a New Reservation
1. Staff clicks "Add Reservation" button
2. Modal form appears with all fields
3. Staff enters customer details:
   - Name, email, phone
   - Date, time, guests
   - Duration, special requests
4. System validates input
5. New reservation added to list
6. Statistics update automatically

### Filtering Reservations
1. Staff clicks "Pending" stat card
2. Table updates to show only pending reservations
3. Filter badge shows active filter
4. Staff can combine with date filter
5. Click "Clear Filters" to reset

### Viewing Details
1. Staff clicks eye icon on any row
2. Details modal opens with:
   - Customer information
   - Reservation details
   - Special requests
   - Timeline history
   - Status update buttons
3. Staff can print or update status

## Data Management

### Sample Data
The system initializes with 5 sample reservations:
- **2 Pending**: Upcoming bookings
- **1 Confirmed**: Verified booking
- **1 Completed**: Past visit
- **1 Cancelled**: Cancelled booking

### Data Persistence
- Currently uses in-memory storage
- Can be connected to backend API
- Local storage option available

## Error Handling

### Common Scenarios
- **Empty Fields**: Validation prevents submission
- **Invalid Dates**: Date picker restricts selection
- **No Results**: Friendly "No reservations found" message
- **Network Errors**: Graceful degradation

## Browser Compatibility
- Chrome (v90+)
- Firefox (v88+)
- Safari (v14+)
- Edge (v90+)

## Performance Features
- Debounced search input
- Efficient DOM updates
- Pagination for large datasets
- Optimized re-rendering

## Security Considerations
- Input sanitization
- XSS prevention
- Role-based access (admin only)
- Secure form handling

## Future Enhancements
- [ ] API integration for real data
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Table management
- [ ] Waitlist feature
- [ ] SMS reminders
- [ ] Analytics dashboard
- [ ] Multi-language support

## Troubleshooting Guide

### Common Issues

#### Modals Not Opening
- Check JavaScript console for errors
- Verify function name spellings
- Ensure modal elements exist in DOM

#### Filters Not Working
- Check if data exists in selected category
- Verify filter functions are properly bound
- Check console for filter logic errors

#### Table Not Updating
- Verify refreshTable() is called
- Check filtered data array
- Ensure DOM elements are correctly targeted

## Development Notes

### File Dependencies
- Font Awesome 6.4.0 (icons)
- Google Fonts (Playfair Display, Poppins)
- Custom CSS files (admin.css, reservations.css)

### Key Functions Reference
```javascript
// Main functions
loadReservations()        // Initial load
saveReservation()         // Create/update
deleteReservation(id)     // Remove
filterByStatus(status)    // Filter
searchReservations(term)  // Search
toggleView(view)          // Switch view
updateStats()             // Update counters