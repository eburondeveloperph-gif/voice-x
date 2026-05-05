/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { VideoRecorder } from '../../../lib/video-recorder';
import { ScreenRecorder } from '../../../lib/screen-recorder';
import { useSettings, useTools, useLogStore } from '@/lib/state';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
  onVideoActive?: (active: boolean) => void;
};

function ControlTray({ children, onVideoActive }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [videoRecorder] = useState(() => new VideoRecorder());
  const [screenRecorder] = useState(() => new ScreenRecorder());
  const [muted, setMuted] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect } = useLiveAPIContext();

  useEffect(() => {
    // FIX: Cannot find name 'connectButton'. Did you mean 'connectButtonRef'?
    if (!connected && connectButtonRef.current) {
      // FIX: Cannot find name 'connectButton'. Did you mean 'connectButtonRef'?
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    onVideoActive?.(videoActive || screenActive);
  }, [videoActive, screenActive, onVideoActive]);

  useEffect(() => {
    if (!connected) {
      setMuted(false);
      setVideoActive(false);
      setScreenActive(false);
      videoRecorder.stop();
      screenRecorder.stop();
    }
  }, [connected, videoRecorder, screenRecorder]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    const onVideoData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'image/jpeg',
          data: base64,
        },
      ]);
    };
    if (connected && videoActive && videoRecorder) {
      videoRecorder.on('data', onVideoData);
      videoRecorder.start().then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } else {
      videoRecorder.stop();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      videoRecorder.off('data', onVideoData);
    };
  }, [connected, client, videoActive, videoRecorder]);

  useEffect(() => {
    const onScreenData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'image/jpeg',
          data: base64,
        },
      ]);
    };
    if (connected && screenActive && screenRecorder) {
      screenRecorder.on('data', onScreenData);
      screenRecorder.on('stop', () => setScreenActive(false));
      screenRecorder.start().then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } else {
      screenRecorder.stop();
      // If video is active, we don't want to clear srcObject as video effect might be setting it
      if (!videoActive && videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      screenRecorder.off('data', onScreenData);
    };
  }, [connected, client, screenActive, screenRecorder, videoActive]);

  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    } else {
      connect();
    }
  };

  const handleVideoClick = () => {
    if (connected) {
      if (!videoActive) {
        setScreenActive(false);
      }
      setVideoActive(!videoActive);
    } else {
      setVideoActive(true);
      setScreenActive(false);
      connect();
    }
  };

  const handleScreenClick = () => {
    if (connected) {
      if (!screenActive) {
        setVideoActive(false);
      }
      setScreenActive(!screenActive);
    } else {
      setScreenActive(true);
      setVideoActive(false);
      connect();
    }
  };

  const handleToggleCamera = () => {
    setToggling(true);
    videoRecorder.toggleCamera().then(stream => {
      setFacingMode(videoRecorder.getFacingMode());
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTimeout(() => setToggling(false), 500);
    });
  };

  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect and start microphone';

  const connectButtonTitle = connected ? 'Stop streaming' : 'Start streaming';

  return (
    <section className="control-tray">
      {(videoActive || screenActive) && connected && (
        <>
          <div className="video-preview-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn('video-preview', {
                mirrored: videoActive && facingMode === 'user',
              })}
            />
          </div>
          <div className={cn('video-active-overlay', { toggling })} />
        </>
      )}
      <nav className={cn('actions-nav')}>
        <button
          ref={connectButtonRef}
          className={cn('action-button connect-toggle', { connected })}
          onClick={connected ? disconnect : connect}
          title={connectButtonTitle}
        >
          <span className="material-symbols-outlined filled">
            {connected ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          className={cn('action-button mic-button', { disabled: !connected })}
          onClick={handleMicClick}
          title={micButtonTitle}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        <button
          className={cn('action-button video-button')}
          onClick={handleVideoClick}
          aria-label={videoActive ? 'Stop Camera' : 'Start Camera'}
          title={videoActive ? 'Stop Camera' : 'Start Camera'}
        >
          {videoActive ? (
            <span className="material-symbols-outlined filled">videocam</span>
          ) : (
            <span className="material-symbols-outlined filled">videocam_off</span>
          )}
        </button>
        <button
          className={cn('action-button screen-button')}
          onClick={handleScreenClick}
          aria-label={screenActive ? 'Stop Screen Share' : 'Start Screen Share'}
          title={screenActive ? 'Stop Screen Share' : 'Start Screen Share'}
        >
          {screenActive ? (
            <span className="material-symbols-outlined filled">stop_screen_share</span>
          ) : (
            <span className="material-symbols-outlined filled">present_to_all</span>
          )}
        </button>
        {videoActive && connected && (
          <button
            className={cn('action-button cameraswitch-button')}
            onClick={handleToggleCamera}
            aria-label="Toggle Camera"
            title="Toggle front/back camera"
          >
            <span className="material-symbols-outlined filled">cameraswitch</span>
          </button>
        )}
        <button
          className={cn('action-button refresh-button')}
          onClick={useLogStore.getState().clearTurns}
          aria-label="Reset Chat"
          title="Reset session logs"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
        {connected && <span className="text-indicator mx-2 ml-4">Streaming</span>}
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);