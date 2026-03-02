import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# MySQL Connection setup
def get_db():
    return mysql.connector.connect(host="localhost", user="root", password="", database="rideease_db")

@app.route('/api/book-ride', methods=['POST'])
def book_ride():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO rides (pickup, drop_loc, fare) VALUES (%s, %s, %s)", 
                       (data['pickup'], data['drop'], data['fare']))
        conn.commit()
        return jsonify({"success": True, "message": "Ride Saved!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
