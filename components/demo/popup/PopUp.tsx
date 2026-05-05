/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay z-[10000]">
      <div className="popup-content">
        <h2>Virtual Employee Persona (VEP)</h2>
        <p>A native audio and reasoning-powered executive assistant.</p>
        <p>Before you begin:</p>
        <ol>
          <li><span className="icon">login</span>Sign in with Google to grant access to your Mail, Calendar, and Drive.</li>
          <li><span className="icon">tune</span>Change the assistant's persona in the Settings menu (top right).</li>
          <li><span className="icon">play_circle</span>Press Play to start talking to your assistant.</li>
        </ol>
        <button onClick={onClose} className="rounded bg-sky-500 hover:bg-sky-400">Start Talking</button>
      </div>
    </div>
  );
};

export default PopUp;
