
# Flask Backend

This is the backend part of the project built using Flask. Follow the instructions below to set up and run the backend locally.

## Prerequisites

Make sure you have the following installed:
- Python 3.x
- pip (Python package installer)

## Setup Instructions

1. **Navigate to the Backend Folder**

   If you're not already in the `backend` directory:
   ```bash
   cd backend
   ```

2. **(Optional) Create a Virtual Environment**

   It's recommended to create a virtual environment to keep dependencies isolated.

   On macOS/Linux:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

   On Windows:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Dependencies**

   Once inside the `backend` directory, install the required Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**

   After installing the dependencies, run the Flask application:
   ```bash
   python app.py
   ```

5. **Access the Application**

   Once the Flask app is running, open a web browser and go to:
   ```
   http://127.0.0.1:5000/
   ```

## Notes

- The `venv/` folder is not included in the shared files as it contains the virtual environment. You can recreate it using the instructions above.
- The `data.xlsx` file should be in the same directory as `app.py` for the application to function correctly.
