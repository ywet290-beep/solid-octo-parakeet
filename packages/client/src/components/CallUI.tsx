import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

interface CallUIProps {
  socket: any;
  userId: string;
  onClose: () => void;
}

const CallUI: React.FC<CallUIProps> = ({ socket, userId, onClose }) => {
  const {
    stream,
    receivingCall,
    caller,
    callerName,
    callAccepted,
    callEnded,
    isCalling,
    callType,
    myVideo,
    userVideo,
    callUser,
    answerCall,
    leaveCall
  } = useWebRTC({ socket, userId });

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    if (callEnded) {
      onClose();
    }
  }, [callEnded, onClose]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = muted;
      });
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoOff;
      });
      setVideoOff(!videoOff);
    }
  };

  const handleCallUser = () => {
    if (selectedUser) {
      callUser(selectedUser, callType);
    }
  };

  const handleAnswerCall = () => {
    answerCall(callType);
  };

  if (!receivingCall && !callAccepted && !isCalling) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-96">
          <h3 className="text-lg font-semibold mb-4">Start a Call</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID to call</label>
            <input
              type="text"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter user ID"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value as 'voice' | 'video')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="voice">Voice Call</option>
              <option value="video">Video Call</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCallUser}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (receivingCall && !callAccepted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-96 text-center">
          <h3 className="text-lg font-semibold mb-4">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
          <p className="text-gray-600 mb-6">From: {callerName}</p>
          <div className="flex space-x-2">
            <button
              onClick={handleAnswerCall}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              Answer
            </button>
            <button
              onClick={leaveCall}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center justify-center"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {callType === 'video' ? (
          <>
            {/* Remote Video */}
            <video
              ref={userVideo}
              autoPlay
              className="w-full h-full object-cover"
            />
            {/* Local Video (Picture-in-Picture) */}
            <video
              ref={myVideo}
              autoPlay
              muted
              className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Phone className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">Voice Call in Progress</p>
              <p className="text-gray-400">With {callerName || 'User'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${muted ? 'bg-red-500' : 'bg-gray-600'} hover:bg-opacity-80`}
        >
          {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${videoOff ? 'bg-red-500' : 'bg-gray-600'} hover:bg-opacity-80`}
          >
            {videoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>
        )}

        <button
          onClick={leaveCall}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallUI;