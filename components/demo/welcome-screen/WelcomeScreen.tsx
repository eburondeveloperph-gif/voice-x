/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';
import { useTools, Template } from '../../../lib/state';

const welcomeContent: Record<Template, { title: string; description: string; prompts: string[] }> = {
  'customer-support': {
    title: 'Customer Support',
    description: 'Ask for order status or returns.',
    prompts: [
      "I'd like to return an item.",
      "What's the status of my order?",
    ],
  },
  'personal-assistant': {
    title: 'Executive Assistant',
    description: 'Manage your schedule, documents, and communications directly.',
    prompts: [
      'Beatrice, draft an employment contract.',
      'Check my schedule for tomorrow.',
      'Search my Google Drive for recent invoices.',
    ],
  },
  'navigation-system': {
    title: 'Navigation System',
    description: 'Find routes and places.',
    prompts: [
      'Find a route to the nearest coffee shop.',
      "What's the traffic like?",
    ],
  },
};

const WelcomeScreen: React.FC = () => {
  const { template, setTemplate } = useTools();
  const { title, description, prompts } = welcomeContent[template];
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="title-container">
          <span className="welcome-icon">mic</span>
          <div className="title-selector">
            <select value={template} onChange={(e) => setTemplate(e.target.value as Template)} aria-label="Select a template">
              <option value="customer-support">Customer Support</option>
              <option value="personal-assistant">Personal Assistant</option>
              <option value="navigation-system">Navigation System</option>
            </select>
            <span className="icon">arrow_drop_down</span>
          </div>
        </div>
        <p>{description}</p>
        <div className="example-prompts">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt">{prompt}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
