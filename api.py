from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
from functools import wraps
import jwt
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'  # Change this!

# Simple CORS - allow all origins for now
CORS(app)

# INVITATION CODE
INVITATION_CODE = "FitnessApp2026"

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="fitness_tracker",
        user="postgres",
        password="Badger2022!"
    )
    return conn

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# ============ AUTHENTICATION ENDPOINTS ============

# Register new user
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    invitation_code = data.get('invitation_code')
    
    # Validate all fields present
    if not all([username, email, password, invitation_code]):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Check invitation code
    if invitation_code != INVITATION_CODE:
        return jsonify({'error': 'Invalid invitation code'}), 403
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Hash the password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert new user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (username, email, password_hash))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user_id': user_id,
            'username': username
        }), 201
        
    except psycopg2.IntegrityError as e:
        conn.rollback()
        cursor.close()
        conn.close()
        
        if 'username' in str(e):
            return jsonify({'error': 'Username already exists'}), 409
        elif 'email' in str(e):
            return jsonify({'error': 'Email already exists'}), 409
        else:
            return jsonify({'error': 'Registration failed'}), 500

# Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Find user by username
    cursor.execute("""
        SELECT id, username, email, password_hash
        FROM users
        WHERE username = %s
    """, (username,))
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Generate token
    token = jwt.encode({
        'user_id': user['id'],
        'username': user['username'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user_id': user['id'],
        'username': user['username']
    }), 200

# Check if token is valid
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'authenticated': False}), 200
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return jsonify({
            'authenticated': True,
            'user_id': data['user_id'],
            'username': data['username']
        }), 200
    except:
        return jsonify({'authenticated': False}), 200

# ============ EXISTING ENDPOINTS (Updated with token auth) ============

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!'})

# Search foods endpoint - requires token
@app.route('/api/foods/search', methods=['GET'])
@token_required
def search_foods(current_user_id):
    query = request.args.get('q', '')
    
    if len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT id, fdc_id, description, 
               calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
               serving_size, serving_unit
        FROM foods
        WHERE description ILIKE %s
        LIMIT 10
    """, (f'%{query}%',))
    
    foods = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(foods)

# Log a food entry - requires token
@app.route('/api/food_logs', methods=['POST'])
@token_required
def log_food(current_user_id):
    data = request.json
    food_id = data.get('food_id')
    grams = data.get('grams')
    meal_type = data.get('meal_type')
    log_date = data.get('log_date')
    
    if not all([food_id, grams, log_date]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO food_logs (user_id, food_id, grams, meal_type, log_date)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (current_user_id, food_id, grams, meal_type, log_date))
    
    log_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'id': log_id, 'message': 'Food logged successfully'}), 201

# Get food logs - requires token
@app.route('/api/food_logs', methods=['GET'])
@token_required
def get_food_logs(current_user_id):
    log_date = request.args.get('date')
    
    if not log_date:
        return jsonify({'error': 'date is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT fl.id, fl.grams, fl.meal_type, fl.log_date,
               f.description, f.calories_per_100g, f.protein_per_100g,
               f.carbs_per_100g, f.fat_per_100g
        FROM food_logs fl
        JOIN foods f ON fl.food_id = f.id
        WHERE fl.user_id = %s AND fl.log_date = %s
        ORDER BY fl.meal_type, fl.id
    """, (current_user_id, log_date))
    
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(logs)

# Delete food log - requires token
@app.route('/api/food_logs/<int:log_id>', methods=['DELETE'])
@token_required
def delete_food_log(current_user_id, log_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Make sure the log belongs to the current user
    cursor.execute("""
        DELETE FROM food_logs
        WHERE id = %s AND user_id = %s
        RETURNING id
    """, (log_id, current_user_id))
    
    deleted = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Food log deleted'}), 200
    else:
        return jsonify({'error': 'Food log not found or unauthorized'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)