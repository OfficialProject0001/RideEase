import sqlite3
import razorpay
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ⚠️ APNI RAZORPAY KEYS YAHAN DAALEIN ⚠️
RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE'
RAZORPAY_KEY_SECRET = 'YOUR_SECRET_HERE'
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')
    conn.commit()
    conn.close()

init_db()

# --- 1. LOGIN & REGISTRATION API ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE phone=?", (phone,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({"isNew": False, "user": {"phone": user[0], "name": user[1], "city": user[2], "role": user[3]}})
    return jsonify({"isNew": True, "message": "New user"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("INSERT INTO users (phone, name, city, role) VALUES (?, ?, ?, ?)", 
              (data['phone'], data['name'], data['city'], data['role']))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# --- 2. RAZORPAY ORDER API ---
@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.json
    amount = int(data.get('amount', 100)) * 100 # Convert to paise
    
    order_data = {
        "amount": amount,
        "currency": "INR",
        "receipt": "ride_receipt",
        "payment_capture": 1
    }
    order = rzp_client.order.create(data=order_data)
    return jsonify(order)

# --- 3. REAL-TIME SOCKETS ---
@socketio.on('request_ride')
def handle_ride_request(ride_data):
    print("New Ride Requested:", ride_data)
    emit('incoming_ride', ride_data, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(accept_data):
    print("Ride Accepted by:", accept_data['captainName'])
    emit('ride_confirmed', accept_data, broadcast=True)

if __name__ == '__main__':
    print("🚀 RideEase Server with Razorpay & DB Running!")
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
