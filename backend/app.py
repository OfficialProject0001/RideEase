import sqlite3
import razorpay
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import uuid

app = Flask(__name__)
CORS(app)
# Socket initialization allow full broadcast
socketio = SocketIO(app, cors_allowed_origins="*")

# ⚠️ APNI RAZORPAY KEYS YAHAN DAALEIN ⚠️
RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE'
RAZORPAY_KEY_SECRET = 'YOUR_SECRET_HERE'
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def init_db():
    conn = sqlite3.connect('rideease.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (phone TEXT PRIMARY KEY, name TEXT, city TEXT, role TEXT)''')
    # Save the admin by default
    c.execute("INSERT OR IGNORE INTO users (phone, name, city, role) VALUES ('Rohit01', 'Admin', 'HQ', 'admin')")
    conn.commit()
    conn.close()

init_db()

# --- 1. LOGIN API ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password') # for Admin

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

# --- 2. REGISTER API ---
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

# --- 3. RAZORPAY API ---
@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.json
    amount = int(data.get('amount', 100)) * 100
    order_data = {"amount": amount, "currency": "INR", "receipt": str(uuid.uuid4()), "payment_capture": 1}
    try:
        order = rzp_client.order.create(data=order_data)
        return jsonify(order)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 4. SOCKET REAL-TIME (Broadcasting for sync) ---
active_rides = []

@socketio.on('request_ride')
def handle_ride_request(ride_data):
    # Appends new requested ride and sends an immediate alert to ALL Captains connected
    ride_data['id'] = str(uuid.uuid4())
    active_rides.append(ride_data)
    emit('incoming_ride', ride_data, broadcast=True)
    # Ping admin panel about new ride creation
    emit('admin_update', {"type": "new_ride", "count": len(active_rides)}, broadcast=True)

@socketio.on('accept_ride')
def handle_ride_accept(accept_data):
    # Send event to correct rider that his particular ride has been picked up
    emit('ride_confirmed', accept_data, broadcast=True)
    
@socketio.on('complete_ride')
def complete_ride(data):
    # Alert admin panel it completed
     emit('admin_update', {"type": "complete_ride"}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
