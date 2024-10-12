from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
import pandas as pd
import os
from functools import wraps


app = Flask(__name__)
CORS(app)  # Update port as needed

bcrypt = Bcrypt(app)

# Secret key for JWT encoding and decoding
app.config['SECRET_KEY'] = '0489bc47a7a9424323b18b03f8f8646a3d0b5b13cd257503d55c579b7db386e1'  # Replace with a strong secret key

# Path to the Excel file
EXCEL_FILE = 'aws_security_checklist.xlsx'

# Load data from Excel
df_controls = pd.read_excel(EXCEL_FILE, sheet_name='Controls')
df_apps = pd.read_excel(EXCEL_FILE, sheet_name='ApplicationName')

# Function to load or create user data sheet
def load_or_create_user_sheet():
    try:
        df_users = pd.read_excel(EXCEL_FILE, sheet_name='users')
    except ValueError:  # If the 'users' sheet doesn't exist
        df_users = pd.DataFrame(columns=['email', 'password'])  # Create new user sheet with these columns
    return df_users

def load_or_create_selections_sheet():
    try:
        df_selections = pd.read_excel(EXCEL_FILE, sheet_name='user_selections')
    except ValueError:  # If the 'user_selections' sheet doesn't exist
        df_selections = pd.DataFrame(columns=['email', 'app', 'type', 'control_area'])  # Create new selections sheet with these columns
    return df_selections

# Save the Excel file with updated data
def save_to_excel(writer, df, sheet_name):
    df.to_excel(writer, sheet_name=sheet_name, index=False)

# JWT token required decorator
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token is missing'}), 403

        try:
            # Decode the token using the secret key
            jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])  # Split to get the token
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403
        except Exception as e:
            print(f"Error decoding token: {e}")  # Log the error for debugging
            return jsonify({'error': 'Invalid token'}), 403

        return f(*args, **kwargs)

    return decorator


# API to sign up a new user
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not email or not password or not confirm_password:
        return jsonify({'error': 'Missing fields'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    # Load or create the user sheet
    df_users = load_or_create_user_sheet()

    # Check if the email is already in use
    if df_users['email'].str.lower().isin([email.lower()]).any():
        return jsonify({'error': 'Email is already registered'}), 400

    # Hash the password using Bcrypt
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Add the new user to the DataFrame
    new_user = pd.DataFrame([[email, hashed_password]], columns=['email', 'password'])
    df_users = pd.concat([df_users, new_user], ignore_index=True)

    # Save to the Excel file
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
        save_to_excel(writer, df_users, 'users')

    # Generate JWT token for the new user
    token = jwt.encode({'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, app.config['SECRET_KEY'])

    return jsonify({'message': 'User registered successfully', 'token': token}), 201

# API to log in an existing user
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    # Load the user sheet
    df_users = load_or_create_user_sheet()

    # Check if the user exists
    user = df_users.loc[df_users['email'].str.lower() == email.lower()]

    if user.empty:
        return jsonify({'error': 'Invalid email or password'}), 401

    # Verify password using Bcrypt
    if not bcrypt.check_password_hash(user.iloc[0]['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Generate JWT token
    token = jwt.encode({'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, app.config['SECRET_KEY'])

    return jsonify({'message': 'Login successful', 'token': token}), 200

@app.route('/api/validate-token', methods=['POST'])
@token_required
def validate_token():
    token = request.headers.get('Authorization')
    payload = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])
    return jsonify({'email': payload['email'], 'message': 'Token is valid'}), 200

# API to fetch levels based on type (from the controls sheet)
@app.route('/api/levels', methods=['GET'])
@token_required  # Protect this route with JWT
def get_levels():
    type_selected = request.args.get('type', '')
    levels = df_controls.loc[df_controls['Security Level'].str.lower() == type_selected.lower(), 'Level'].unique().tolist()
    return jsonify(levels)

# API to fetch control areas based on type (from the controls sheet)
@app.route('/api/control-areas', methods=['GET'])
@token_required  # Protect this route with JWT
def get_control_areas():
    type_selected = request.args.get('type', '')
    control_areas = df_controls.loc[df_controls['Security Level'].str.lower() == type_selected.lower(), 'Cloud Adoption Framework (CAF) capability'].unique().tolist()
    return jsonify(control_areas)

# API to fetch controls based on the control area (from the controls sheet)
@app.route('/api/controls', methods=['GET'])
@token_required  # Protect this route with JWT
def get_controls():
    type_selected = request.args.get('type', '')
    control_area = request.args.get('control_area', '')

    # Filter the data based on both the Security Level (type) and the control area
    controls_data = df_controls.loc[
        (df_controls['Security Level'].str.lower() == type_selected.lower()) &
        (df_controls['Cloud Adoption Framework (CAF) capability'] == control_area)
    ]

    # Drop any rows with NaN values in key columns
    controls_data = controls_data.dropna(subset=['Layer 2 Controls (Generic)', 'Controls', 'AWS-Sub-Controls'])

    layer2_controls = controls_data['Layer 2 Controls (Generic)'].tolist()
    aws_controls = controls_data['Controls'].tolist()
    aws_sub_controls = controls_data['AWS-Sub-Controls'].tolist()

    return jsonify({
        'layer2_controls': layer2_controls,
        'aws_controls': aws_controls,
        'aws_sub_controls': aws_sub_controls,
    })

# API to get all application names (from the ApplicationName sheet)
@app.route('/api/applications', methods=['GET'])
@token_required
def get_applications():
    app_names = df_apps['App Name'].tolist()
    return jsonify(app_names)

@app.route('/api/store-selections', methods=['POST'])
@token_required  # Protect this route with JWT
def store_selections():
    token = request.headers.get('Authorization')
    payload = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])
    
    email = payload['email']  # Extract email from the decoded token
    app_name = request.json.get('appName')
    selected_type = request.json.get('selectedType')
    selected_control_area = request.json.get('selectedControlArea')

    if app_name is None or selected_type is None or selected_control_area is None:
        return jsonify({'error': 'Missing fields'}), 400

    # Load or create the selections sheet
    df_selections = load_or_create_selections_sheet()

    existing_entry = df_selections[(df_selections['email'] == email) & (df_selections['app'] == app_name)]

    if not existing_entry.empty:
        # Update the existing entry
        df_selections.loc[existing_entry.index, 'type'] = selected_type
        df_selections.loc[existing_entry.index, 'control_area'] = selected_control_area
    else:
        # Create a new DataFrame for the new selection
        new_selection = pd.DataFrame([[email, app_name, selected_type, selected_control_area]], 
                                    columns=['email', 'app', 'type', 'control_area'])
        # Append new selection to the selections DataFrame
        df_selections = pd.concat([df_selections, new_selection], ignore_index=True)


    # Save to the Excel file
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
        save_to_excel(writer, df_selections, 'user_selections')  # Save to the new 'user_selections' sheet

    return jsonify({'message': 'Selections stored successfully'}), 201

@app.route('/api/get-selections', methods=['GET'])
@token_required  # Protect this route with JWT
def get_selections():
    try:
        token = request.headers.get('Authorization')
        payload = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])
        email = payload['email']  # Extract email from the decoded token

        # Load the selections sheet
        df_selections = load_or_create_selections_sheet()

        # Filter the DataFrame for the logged-in user
        user_selections = df_selections[df_selections['email'] == email]

        # Convert the DataFrame to a dictionary format for JSON response
        selections_list = user_selections.to_dict(orient='records')

        return jsonify({'selections': selections_list}), 200

    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': 'Internal Server Error'}), 500


if __name__ == '__main__':
    app.run(debug=True)
