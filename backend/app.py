import sqlite3
import razorpay
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import uuid
import os
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Socket initialization
socketio = SocketIO(app, cors_allowed_origins="*")

# ==============================
# RAZORPAY CONFIG
# ==============================
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_YOUR_KEY_HERE")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "YOUR_SECRET_HERE")
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ==============================
# DATABASE INIT
# ==============================
def init_db():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()

    # USERS TABLE
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')

    # RIDES TABLE
    c.execute('''CREATE TABLE IF NOT EXISTS rides
                 (id TEXT PRIMARY KEY,
                  rider TEXT,
                  captain TEXT,
                  pickup TEXT,
                  drop_location TEXT,
                  amount INTEGER,
                  status TEXT,
                  created_at TEXT)''')

    # Admin Default
    c.execute("INSERT OR IGNORE INTO users (phone, name, city, role) VALUES ('Rohit01', 'Admin', 'HQ', 'admin')")

    conn.commit()
    conn.close()

init_db()

@app.route("/")
def home():
    return "RideEase Backend Running with OTP System & Database ✅"

# ==============================
# 1️⃣ LOGIN API
# ==============================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')

    if phone == 'Rohit01' and password == 'Rohit2580@':
        return jsonify({"isNew": False, "user": {"phone": "Rohit01", "name": "Admin", "city": "HQ", "role": "admin"}})

    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE phone=?", (phone,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({"isNew": False, "user": {"phone": user[0], "name": user[1], "city": user[2], "role": user[3]}})
    return jsonify({"isNew": True, "message": "New user"})

# ==============================
# 2️⃣ REGISTER API
# ==============================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE phone=?", (data['phone'],))
    if c.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Exists!"}), 400

    c.execute("INSERT INTO users (phone, name, city, role) VALUES (?, ?, ?, ?)", 
              (data['phone'], data['name'], data['city'], data['role']))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# ==============================
# 3️⃣ RAZORPAY API
# ==============================
@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.json
    amount = int(data.get('amount', 100)) * 100

    order_data = {
        "amount": amount,
        "currency": "INR",
        "receipt": str(uuid.uuid4()),
        "payment_capture": 1
    }

    try:
        order = rzp_client.order.create(data=order_data)
        return jsonify(order)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================
# 4️⃣ SAVE RIDE AFTER PAYMENT
# ==============================
@app.route('/api/save-ride', methods=['POST'])
def save_ride():
    data = request.json
    ride_id = str(uuid.uuid4())
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()

    c.execute('''INSERT INTO rides 
                 (id, rider, captain, pickup, drop_location, amount, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (ride_id,
               data.get("rider"),
               data.get("captain", ""),
               data.get("pickup"),
               data.get("drop"),
               data.get("amount"),
               data.get("status", "requested"),
               datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "ride_id": ride_id})

# ==============================
# 5️⃣ RIDE HISTORY API
# ==============================
@app.route('/api/rides/<phone>', methods=['GET'])
def get_rides(phone):
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("SELECT * FROM rides WHERE rider=?", (phone,))
    rides = c.fetchall()
    conn.close()
    return jsonify(rides)

# ==============================
# 6️⃣ ADMIN STATS API
# ==============================
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM rides")
    total_rides = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM users")
    total_users = c.fetchone()[0]
    conn.close()

    return jsonify({
        "total_rides": total_rides,
        "total_users": total_users
    })

# ==============================
# 7️⃣ SOCKET REAL-TIME (WITH OTP)
# ==============================
active_rides = {}

@socketio.on('request_ride')
def handle_ride_request(ride_data):
    ride_id = str(uuid.uuid4())
    otp = str(random.randint(1000, 9999)) # 4-digit OTP Generate hua
    
    ride_data['id'] = ride_id
    ride_data['otp'] = otp
    ride_data['status'] = 'searching'
    
    active_rides[ride_id] = ride_data

    emit('incoming_ride', ride_data, broadcast=True)
    emit('admin_update', {"type": "new_ride", "count": len(active_rides)}, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(data):
    ride_id = data['id']
    if ride_id in active_rides:
        active_rides[ride_id]['status'] = 'accepted'
        active_rides[ride_id]['captain'] = data['captainName']
        emit('ride_accepted_by_captain', active_rides[ride_id], broadcast=True)

@socketio.on('verify_otp')
def handle_verify_otp(data):
    ride_id = data.get('id')
    submitted_otp = data.get('otp')
    if ride_id in active_rides and active_rides[ride_id]['otp'] == submitted_otp:
        active_rides[ride_id]['status'] = 'in_progress'
        emit('ride_started', active_rides[ride_id], broadcast=True)
    else:
        emit('otp_failed', {"message": "Invalid OTP"}, broadcast=True)

@socketio.on('finish_ride')
def handle_finish_ride(data):
    ride_id = data['id']
    if ride_id in active_rides:
        active_rides[ride_id]['status'] = 'payment_pending'
        emit('ride_completed_pay_now', active_rides[ride_id], broadcast=True)

@socketio.on('payment_done')
def handle_payment(data):
    ride_id = data['id']
    if ride_id in active_rides:
        del active_rides[ride_id]
        emit('trip_fully_complete', data, broadcast=True)
        emit('admin_update', {"type": "complete_ride"}, broadcast=True)

# ==============================
# RUN SERVER
# ==============================
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)), allow_unsafe_werkzeug=True)
