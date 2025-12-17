from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)  # Allow your HTML/JS to make requests to this API

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)