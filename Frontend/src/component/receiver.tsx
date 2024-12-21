import React, { useEffect, useRef } from "react";

function Receiver() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    let pc: RTCPeerConnection | null = null;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "createOffer") {
        pc = new RTCPeerConnection();

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
              })
            );
          }
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        // Set remote description and create an answer
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send the answer back to the sender
        socket.send(
          JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
        );
      } else if (message.type === "iceCandidate" && pc) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate)).catch(
          (error) => console.error("Error adding ICE candidate:", error)
        );
      }
    };

    return () => {
      socket.close();
      if (pc) pc.close();
    };
  }, []);

  return (
    <div>
      <h2>Receiver</h2>
      <video
        ref={videoRef}
        autoPlay
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}

export default Receiver;
