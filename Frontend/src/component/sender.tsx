import React, { useEffect, useRef } from "react";

function sender() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
    const [socket, setSocket] = React.useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setSocket(socket);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));

    };
    socket.onerror = (error) => {
      console.log("WebSocket error:", error);
    };
    return () => {
      socket.close();
    };
   
  }, []);
  const handleclick = async() => {
    if (!socket) return;
    //create an instance of RTCpeerconnection
    const pc = new RTCPeerConnection();
    console.log("pc", pc);

    //on negotiation needed
    pc.onnegotiationneeded = async () => {


    // create an offer 
    const offer = await pc.createOffer();
    console.log("offer", offer);

    //setting the offer as local description
    await pc.setLocalDescription(offer);
    console.log("pc", pc);

    // sending the offer to the signalling server
    socket?.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }));//basically the handler for the backend code 
  };

    //setting the ice candidate
    pc.onicecandidate = (event) => {
      console.log("icecandidate event", event);
      if (event.candidate) {
        socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
      }
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Add tracks to the peer connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    

    //listening for the answer from the receiver
    socket.onmessage = (event) => {
        console.log("message", event.data);
        const message = JSON.parse(event.data);
        if (message.type === "createAnswer") {
            pc.setRemoteDescription(message.sdp);
        } else if (message.type === "iceCandidate") {
            pc.addIceCandidate(message.candidate);
        }
    };
  }
  return (<>
  <div>

  <div>sender</div>
  <video ref={localVideoRef} autoPlay style={{ width: "100%", height: "auto" }} />
      <button onClick={handleclick}>Send Video</button>
  </div>
  </>);
}

export default sender;
