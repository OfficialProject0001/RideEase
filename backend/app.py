import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
# Real-time WebSocket engine on!
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def home():
    return jsonify({"status": "RideEase V2 Backend Running", "real_time": "Active"})

# API jab koi user map se ride book karega
@app.route('/api/book-ride', methods=['POST'])
def book_ride():
    data = request.json
    # Asli production me yahan MySQL me data save hoga
    print("New Ride Request:", data)
    
    # MAGIC: Jaise hi ride aaye, sabhi Captains ko real-time popup bhej do!
    socketio.emit('incoming_ride', data)
    return jsonify({"success": True, "message": "Searching for Captains..."})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Flask ki jagah ab SocketIO server run karega
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
