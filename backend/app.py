import sqlite3
import razorpay
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import uuid
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Socket initialization allow full broadcast
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

    # USERS TABLE (OLD)
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')

    # RIDES TABLE (NEW)
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

# ==============================
# HEALTH CHECK ROUTE (NEW)
# ==============================

@app.route("/")
def home():
    return "RideEase Backend Running ✅"

# ==============================
# 1️⃣ LOGIN API (UNCHANGED)
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
# 2️⃣ REGISTER API (UNCHANGED)
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
# 3️⃣ RAZORPAY API (IMPROVED)
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
# 4️⃣ SAVE RIDE AFTER PAYMENT (NEW)
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
               "",
               data.get("pickup"),
               data.get("drop"),
               data.get("amount"),
               "requested",
               datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "ride_id": ride_id})

# ==============================
# 5️⃣ RIDE HISTORY API (NEW)
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
# 6️⃣ ADMIN STATS API (NEW)
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
# 7️⃣ SOCKET REAL-TIME (UNCHANGED + DB UPDATE)
# ==============================

active_rides = []

@socketio.on('request_ride')
def handle_ride_request(ride_data):
    ride_data['id'] = str(uuid.uuid4())
    active_rides.append(ride_data)

    emit('incoming_ride', ride_data, broadcast=True)
    emit('admin_update', {"type": "new_ride", "count": len(active_rides)}, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(accept_data):
    emit('ride_confirmed', accept_data, broadcast=True)

@socketio.on('complete_ride')
def complete_ride(data):
    emit('admin_update', {"type": "complete_ride"}, broadcast=True)

# ==============================
# RUN SERVER (RENDER READY)
# ==============================

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
