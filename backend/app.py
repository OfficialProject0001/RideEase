import sqlite3
import razorpay
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import uuid

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ⚠️ APNI RAZORPAY KEYS YAHAN DAALEIN ⚠️
RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE'
RAZORPAY_KEY_SECRET = 'YOUR_SECRET_HERE'
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

active_rides = {} # Memory for live sync
ride_history = [] # Temporary history for demo

def init_db():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return "RideEase Master Server is LIVE Boss! 🚀"

# --- LOGIN & ADMIN AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')

    # Hardcoded Admin System
    if phone == 'Rohit01' and password == 'Rohit2580@':
         return jsonify({"isNew": False, "user": {"phone": "Rohit01", "name": "Super Admin", "city": "HQ", "role": "admin"}})

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
    c.execute("SELECT * FROM users WHERE phone=?", (data['phone'],))
    if c.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Number Exists!"}), 400

    c.execute("INSERT INTO users (phone, name, city, role) VALUES (?, ?, ?, ?)", 
              (data['phone'], data['name'], data['city'], data['role']))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# --- RAZORPAY GATEWAY ---
@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.json
    amount = int(data.get('amount', 100)) * 100
    try:
        order = rzp_client.order.create({"amount": amount, "currency": "INR", "receipt": str(uuid.uuid4()), "payment_capture": 1})
        return jsonify(order)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- LIVE REALTIME SYSTEM (SOCKETS) ---
@socketio.on('request_ride')
def handle_ride_request(data):
    ride_id = str(uuid.uuid4())
    data['id'] = ride_id
    data['status'] = 'searching'
    active_rides[ride_id] = data
    emit('incoming_ride', data, broadcast=True)
    emit('admin_update', {"type": "new_ride", "rides": len(active_rides)}, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(data):
    ride_id = data['id']
    if ride_id in active_rides:
        active_rides[ride_id]['status'] = 'accepted'
        active_rides[ride_id]['captain'] = data['captainName']
        # Broadcast to specific customer that ride is accepted
        emit('ride_accepted_by_captain', active_rides[ride_id], broadcast=True)

@socketio.on('finish_ride')
def handle_finish_ride(data):
    ride_id = data['id']
    if ride_id in active_rides:
        active_rides[ride_id]['status'] = 'payment_pending'
        # Signal Customer to show Payment Options
        emit('ride_completed_pay_now', active_rides[ride_id], broadcast=True)

@socketio.on('payment_done')
def handle_payment(data):
    ride_id = data['id']
    if ride_id in active_rides:
        ride_history.append(active_rides[ride_id])
        del active_rides[ride_id]
        emit('trip_fully_complete', data, broadcast=True)
        emit('admin_update', {"type": "complete_ride", "rides": len(active_rides), "completed": len(ride_history)}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
