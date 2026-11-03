import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ShieldCheck, X, Upload } from 'lucide-react';
import { createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';
// Import the Wrapper type directly
import { BackgroundProcessor, supportsBackgroundProcessors, type BackgroundProcessorWrapper } from '@livekit/track-processors';
import './PreSessionLobby.css';

interface LobbyProps {
  onJoin: () => void;
  onCancel: () => void;
}

export const PreSessionLobby = ({ onJoin, onCancel }: LobbyProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Use BackgroundProcessorWrapper instead of ProcessorType
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [processor, setProcessor] = useState<BackgroundProcessorWrapper | null>(null);

  // 1. Initialize LiveKit Track and Processor
  useEffect(() => {
    let track: LocalVideoTrack | null = null;

    const startMedia = async () => {
      try {
        track = await createLocalVideoTrack({ facingMode: 'user' });
        setVideoTrack(track);
        
        if (videoRef.current) {
          track.attach(videoRef.current);
        }

        if (supportsBackgroundProcessors()) {
          const p = BackgroundProcessor({ mode: 'disabled' });
          await track.setProcessor(p);
          setProcessor(p);
        }
      } catch (err) {
        console.error("Failed to start video", err);
      }
    };

    startMedia();

    return () => {
      if (track) track.stop();
    };
  }, []);

  // 2. Toggles
  const toggleVideo = () => {
    if (videoTrack) {
      if (isVideoOn) {
        videoTrack.mute();
      } else {
        videoTrack.unmute();
      }
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = async () => {
    setIsMicOn(!isMicOn);
  };

  // 3. Apply the Background Effect
  const setEffect = async (effect: 'none' | 'blur' | 'image', imageUrl?: string) => {
    if (!processor) {
      alert("Background processor not supported in this browser.");
      return;
    }

    try {
      if (effect === 'none') {
        await processor.switchTo({ mode: 'disabled' });
      } else if (effect === 'blur') {
        await processor.switchTo({ mode: 'background-blur', blurRadius: 10 });
      } else if (effect === 'image' && imageUrl) {
        await processor.switchTo({ mode: 'virtual-background', imagePath: imageUrl });
      }
    } catch (err) {
      console.error("Error applying effect", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCustomImage(imageUrl);
      setEffect('image', imageUrl);
    }
  };

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <h1 style={{ color: '#382c77', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>SignConnect</h1>
      </header>

      <main className="lobby-main">
        <div className="lobby-video-section">
          <div className="lobby-video-wrapper">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ display: isVideoOn ? 'block' : 'none' }}
            />
            {!isVideoOn && <div style={{ color: 'white', position: 'absolute', display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Camera is off</div>}
            
            <div className="lobby-controls">
              <button onClick={toggleAudio} className={`control-btn ${!isMicOn ? 'off' : ''}`}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={toggleVideo} className={`control-btn ${!isVideoOn ? 'off' : ''}`}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button className="control-btn" onClick={() => setIsSettingsOpen(true)}>
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="lobby-sidebar">
          <h1>Ready to connect?</h1>
          <p className="lobby-subtitle">You're about to join a session with</p>

          <div className="lobby-profile">
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ddd' }} />
            <div>
              <h3>Micheal</h3>
              <p>Hard of hearing</p>
              <span className="badge-verified"><ShieldCheck size={14}/> Verified Interpreter</span>
            </div>
          </div>

          <button className="btn-join" onClick={onJoin}>Join Session</button>
          <button className="btn-cancel" onClick={onCancel}><X size={16} /> Cancel</button>
        </div>
      </main>

      {isSettingsOpen && (
        <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Video Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="close-btn"><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <h3>Background Effects</h3>
              
              <div className="effect-options">
                <button className="effect-btn" onClick={() => setEffect('none')}>
                  None
                </button>
                <button className="effect-btn" onClick={() => setEffect('blur')}>
                  Blur Background
                </button>
                
                <div style={{ marginTop: '16px' }}>
                  <input type="file" id="bg-upload" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <label htmlFor="bg-upload" style={{ display: 'flex', padding: '12px', border: '2px dashed #ddd8ec', borderRadius: '8px', cursor: 'pointer', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Upload size={18} /> {customImage ? 'Image ready' : 'Upload Custom Image'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
