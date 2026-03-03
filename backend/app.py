import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
# Real-time WebSocket On!
socketio = SocketIO(app, cors_allowed_origins="*")

# --- DATABASE SETUP (Server ki memory) ---
def init_db():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    # Table banayenge agar pehle se nahi hai
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')
    conn.commit()
    conn.close()

init_db()

# --- 1. REAL LOGIN SYSTEM API ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE phone=?", (phone,))
    user = c.fetchone()
    
    if user:
        # Purana user mil gaya
        conn.close()
        return jsonify({"isNew": False, "user": {"phone": user[0], "name": user[1], "city": user[2], "role": user[3]}})
    else:
        # Naya user hai
        conn.close()
        return jsonify({"isNew": True, "message": "Please provide name and city"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("INSERT INTO users (phone, name, city, role) VALUES (?, ?, ?, ?)", 
              (data['phone'], data['name'], data['city'], data['role']))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "User saved to server!"})


# --- 2. REAL-TIME RIDE BOOKING (SOCKETS) ---
@socketio.on('request_ride')
def handle_ride_request(ride_data):
    print("New Ride Requested:", ride_data)
    # Customer ne request bheji, server ne saare Captains ko 'broadcast' kar di
    emit('incoming_ride', ride_data, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(accept_data):
    print("Ride Accepted by:", accept_data['captainName'])
    # Captain ne accept ki, server ne wapas Customer ko bata diya
    emit('ride_confirmed', accept_data, broadcast=True)

if __name__ == '__main__':
    print("🚀 Real RideEase Server Running with DB & Sockets!")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
