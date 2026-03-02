import React, { useEffect } from 'react';

function SOSVideoCall() {
  useEffect(() => {
    const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: 'RideEase_Emergency_Support_Rohit02',
      width: '100%', height: 600,
      parentNode: document.getElementById('jitsi-container')
    });
    return () => api.dispose();
  }, []);

  return (
    <div className="p-4"><h2 className="text-danger text-center fw-bold mb-4">RideEase Live Support</h2>
      <div id="jitsi-container" className="border border-danger rounded"></div>
    </div>
  );
}
export default SOSVideoCall;
