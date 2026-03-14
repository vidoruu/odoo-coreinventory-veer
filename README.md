To start the Atlas Inventory System, you need to run both the backend and the frontend servers in separate terminals.

1. Start the Backend
Navigate to the backend directory and run:

powershell
cd backend
npm install  # If you haven't installed dependencies yet
npm run dev
NOTE

If the database is empty, you can seed it with the default admin/employee accounts by running: npm run seed

2. Start the Frontend
Open a new terminal, navigate to the frontend directory, and run:

powershell
cd frontend
npm install  # If you haven't installed dependencies yet
npm run dev
Once both are running:

The Backend API will be at http://localhost:5000
The Atlas Web App will be at http://localhost:5173
Default Credentials:

Admin: admin / Admin@123
Employee: employee / Employee@123
