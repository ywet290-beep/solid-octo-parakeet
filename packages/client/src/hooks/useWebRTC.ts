import { useRef, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseWebRTCProps {
  socket: Socket | null;
  userId: string;
}

export const useWebRTC = ({ socket, userId }: UseWebRTCProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('call-made', (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerName(data.name);
        setCallerSignal(data.signal);
      });

      socket.on('call-answered', (data) => {
        setCallAccepted(true);
        if (connectionRef.current) {
          connectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        }
      });

      socket.on('ice-candidate', (data) => {
        if (connectionRef.current) {
          connectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('call-ended', () => {
        setCallEnded(true);
        setCallAccepted(false);
        setReceivingCall(false);
        setIsCalling(false);
        if (connectionRef.current) {
          connectionRef.current.close();
          connectionRef.current = null;
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('call-made');
        socket.off('call-answered');
        socket.off('ice-candidate');
        socket.off('call-ended');
      }
    };
  }, [socket]);

  const getMediaStream = async (type: 'voice' | 'video') => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw err;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: caller || userId, // For outgoing calls, caller is the target
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (userVideo.current) {
        userVideo.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    connectionRef.current = peerConnection;
    return peerConnection;
  };

  const callUser = async (idToCall: string, type: 'voice' | 'video') => {
    setIsCalling(true);
    setCallType(type);
    const mediaStream = await getMediaStream(type);
    const peerConnection = createPeerConnection(mediaStream);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-user', {
          userToCall: idToCall,
          signalData: offer,
          from: userId,
          name: 'User' // Should get from context
        });
      }
    } catch (err) {
      console.error('Error creating call:', err);
    }
  };

  const answerCall = async (type: 'voice' | 'video') => {
    setCallAccepted(true);
    setCallType(type);
    const mediaStream = await getMediaStream(type);
    const peerConnection = createPeerConnection(mediaStream);

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(callerSignal));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socket) {
        socket.emit('answer-call', {
          to: caller,
          signalData: answer
        });
      }
    } catch (err) {
      console.error('Error answering call:', err);
    }
  };

  const leaveCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    setReceivingCall(false);
    setIsCalling(false);

    if (socket) {
      socket.emit('end-call', { to: caller });
    }

    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return {
    stream,
    receivingCall,
    caller,
    callerName,
    callerSignal,
    callAccepted,
    callEnded,
    isCalling,
    callType,
    myVideo,
    userVideo,
    callUser,
    answerCall,
    leaveCall
  };
};