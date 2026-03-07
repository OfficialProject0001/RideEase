# =========================================================
# RIDEEASE - FULL PYTHON FLASK BACKEND (LIVE PAYMENT)
# =========================================================

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import sqlite3
import random
import os
import razorpay

app = Flask(__name__)
app.config['SECRET_KEY'] = 'vip_rideease_secret!'

# CORS open for Render deployment
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# 💰 BOSS KI ASLI LIVE RAZORPAY KEYS 💰
# ==========================================
RAZORPAY_KEY_ID = 'rzp_live_SOMYlrgNhCBKBC'
RAZORPAY_KEY_SECRET = 'ITWlO80s9IrX07C7cFEoSFG3'
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

active_rides = {}

def get_db_connection():
    conn = sqlite3.connect('rideease.db')
    conn.row_factory = sqlite3.Row
    return conn

# Database Tables Setup
with get_db_connection() as conn:
    conn.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT UNIQUE, 
        name TEXT, city TEXT, role TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS rides (
        id INTEGER PRIMARY KEY AUTOINCREMENT, rider_phone TEXT, 
        captain_name TEXT, pickup TEXT, dropoff TEXT, amount INTEGER, 
        status TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

# ---------------- REST APIs ----------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    try:
        with get_db_connection() as conn:
            conn.execute('INSERT INTO users (phone, name, city, role) VALUES (?, ?, ?, ?)',
                         (data.get('phone'), data.get('name'), data.get('city'), data.get('role')))
            conn.commit()
        return jsonify({'message': 'User registered successfully!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'User already exists'}), 409

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    # 👑 BOSS KA NAYA ADMIN LOGIN 👑
    if data.get('password'):
        if data['phone'] == 'Rohit01' and data['password'] == 'Rohit2580@':
            return jsonify({'isNew': False, 'user': {'phone': 'Rohit01', 'role': 'admin', 'name': 'Boss Rohit'}})
        return jsonify({'error': 'Invalid credentials'}), 401

    # User/Captain Check
    with get_db_connection() as conn:
        user = conn.execute('SELECT * FROM users WHERE phone = ?', (data['phone'],)).fetchone()
        if user:
            return jsonify({'isNew': False, 'user': dict(user)})
        return jsonify({'isNew': True})

@app.route('/api/save-ride', methods=['POST'])
def save_ride():
    data = request.json
    with get_db_connection() as conn:
        conn.execute('INSERT INTO rides (rider_phone, captain_name, pickup, dropoff, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
                     (data.get('rider'), data.get('captain'), data.get('pickup'), data.get('drop'), data.get('amount'), data.get('status')))
        conn.commit()
    return jsonify({'message': 'Ride Saved'})

@app.route('/api/rides/<identifier>', methods=['GET'])
def get_ride_history(identifier):
    with get_db_connection() as conn:
        rides = conn.execute('SELECT * FROM rides WHERE rider_phone = ? OR captain_name = ? ORDER BY id DESC', (identifier, identifier)).fetchall()
        formatted_rides = [[r['id'], r['captain_name'], r['rider_phone'], r['pickup'], r['dropoff'], r['amount'], r['status'], r['created_at']] for r in rides]
        return jsonify(formatted_rides)

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    with get_db_connection() as conn:
        users_count = conn.execute("SELECT COUNT(*) as total_users FROM users WHERE role != 'admin'").fetchone()['total_users']
        rides_data = conn.execute("SELECT COUNT(*) as total_rides, SUM(amount) as revenue FROM rides WHERE status LIKE 'Completed%'").fetchone()
        total_rides = rides_data['total_rides'] or 0
        total_revenue = rides_data['revenue'] or 0
        commission = round(total_revenue * 0.10, 2)
        return jsonify({'total_users': users_count, 'total_rides': total_rides, 'commission': commission})

@app.route('/api/create-razorpay-order', methods=['POST'])
def create_order():
    data = request.json
    amount_in_paise = int(data.get('amount', 0) * 100)
    try:
        order = razorpay_client.order.create({"amount": amount_in_paise, "currency": "INR", "payment_capture": "1"})
        return jsonify(order)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ---------------- WebSockets (Socket.io) ----------------

@socketio.on('connect')
def handle_connect():
    print("🔌 Client connected")

@socketio.on('request_ride')
def handle_request_ride(data):
    otp = str(random.randint(1000, 9999))
    full_ride = {**data, 'id': request.sid, 'otp': otp, 'status': 'pending'}
    active_rides[request.sid] = full_ride
    
    emit('incoming_ride', full_ride, broadcast=True)
    emit('admin_update', {'type': 'new_ride', 'count': len(active_rides)}, broadcast=True)

@socketio.on('accept_ride')
def handle_accept_ride(data):
    ride_id = data.get('id')
    if ride_id in active_rides and active_rides[ride_id]['status'] == 'pending':
        active_rides[ride_id]['status'] = 'accepted'
        active_rides[ride_id]['captain'] = data.get('captainName')
        active_rides[ride_id]['captainPhone'] = data.get('captainPhone')
        emit('ride_accepted_by_captain', active_rides[ride_id], broadcast=True)

@socketio.on('update_location')
def handle_update_location(data):
    emit('captain_location_update', data, broadcast=True)

@socketio.on('verify_otp')
def handle_verify_otp(data):
    ride_id = data.get('id')
    ride = active_rides.get(ride_id)
    if ride and ride['otp'] == str(data.get('otp')):
        ride['status'] = 'in_progress'
        emit('ride_started', ride, broadcast=True)
    else:
        emit('otp_failed', {'error': 'Invalid OTP'})

@socketio.on('finish_ride')
def handle_finish_ride(data):
    ride_id = data.get('id')
    if ride_id in active_rides:
        active_rides[ride_id]['status'] = 'payment_pending'
        emit('ride_completed_pay_now', active_rides[ride_id], broadcast=True)

@socketio.on('payment_done')
def handle_payment_done(data):
    ride_id = data.get('id')
    if ride_id in active_rides:
        del active_rides[ride_id] 
        emit('trip_fully_complete', data, broadcast=True)
        emit('admin_update', {'type': 'complete_ride', 'count': len(active_rides)}, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)
