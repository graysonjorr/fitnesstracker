from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="fitness_tracker",
        user="postgres",
        password="Badger2022!"  # Replace with your PostgreSQL password
    )
    return conn

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!'})

# Search foods endpoint
@app.route('/api/foods/search', methods=['GET'])
def search_foods():
    query = request.args.get('q', '')
    
    if len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Search for foods matching the query
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

# Log a food entry
@app.route('/api/food_logs', methods=['POST'])
def log_food():
    data = request.json
    user_id = data.get('user_id')
    food_id = data.get('food_id')
    grams = data.get('grams')
    meal_type = data.get('meal_type')
    log_date = data.get('log_date')
    
    if not all([user_id, food_id, grams, log_date]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO food_logs (user_id, food_id, grams, meal_type, log_date)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (user_id, food_id, grams, meal_type, log_date))
    
    log_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'id': log_id, 'message': 'Food logged successfully'}), 201

# Get food logs for a specific date
@app.route('/api/food_logs', methods=['GET'])
def get_food_logs():
    user_id = request.args.get('user_id')
    log_date = request.args.get('date')
    
    if not user_id or not log_date:
        return jsonify({'error': 'user_id and date are required'}), 400
    
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
    """, (user_id, log_date))
    
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(logs)

if __name__ == '__main__':
    app.run(debug=True, port=5000)