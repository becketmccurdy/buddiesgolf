import React from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';

const OnboardingTour: React.FC = () => {
  const steps: Step[] = [
    {
      target: '.dashboard-header',
      content: 'Welcome to your dashboard! Here you can see an overview of your stats.',
    },
    {
      target: '.score-input',
      content: 'Use this section to input your scores after each game.',
    },
    {
      target: '.filter-options',
      content: 'Filter your games and stats using these options.',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    if ((status === 'finished' || status === 'skipped') && action !== 'reset') {
      // Save completion state to localStorage or backend
      localStorage.setItem('onboardingCompleted', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 1000,
        },
      }}
    />
  );
};

export default OnboardingTour;