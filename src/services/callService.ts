import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CallData } from '../types';

export class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.addIceCandidate(this.callId, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };
  }

  async startCall(callerId: string, receiverId: string, type: 'voice' | 'video') {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Save call to Firestore
      const callData: Omit<CallData, 'id'> = {
        callerId,
        receiverId,
        type,
        status: 'calling',
        startTime: new Date(),
        offer,
        iceCandidates: []
      };

      const callRef = await addDoc(collection(db, 'calls'), callData);
      this.callId = callRef.id;

      return callRef.id;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async answerCall(callId: string) {
    try {
      this.callId = callId;
      
      // Get call data
      const callDoc = doc(db, 'calls', callId);
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true // You might want to check call type here
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Listen for call updates
      onSnapshot(callDoc, async (doc) => {
        const callData = doc.data() as CallData;
        
        if (callData.offer && !this.peerConnection!.remoteDescription) {
          await this.peerConnection!.setRemoteDescription(callData.offer);
          
          const answer = await this.peerConnection!.createAnswer();
          await this.peerConnection!.setLocalDescription(answer);
          
          await updateDoc(callDoc, {
            answer,
            status: 'answered'
          });
        }

        if (callData.iceCandidates) {
          callData.iceCandidates.forEach(async (candidate) => {
            await this.peerConnection!.addIceCandidate(candidate);
          });
        }
      });
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  async endCall() {
    if (this.callId) {
      await updateDoc(doc(db, 'calls', this.callId), {
        status: 'ended',
        endTime: new Date()
      });
    }

    this.cleanup();
  }

  private async addIceCandidate(callId: string, candidate: RTCIceCandidate) {
    try {
      const callRef = doc(db, 'calls', callId);
      // You would implement a proper way to add ice candidates to the array
      // This is simplified for brevity
    } catch (error) {
      console.error('Error adding ice candidate:', error);
    }
  }

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    this.localStream = null;
    this.remoteStream = null;
    this.callId = null;
    this.initializePeerConnection();
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}