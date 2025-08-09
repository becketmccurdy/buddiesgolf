import React from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';

interface OnboardingTourProps {
  show: boolean;
  onEnd: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ show, onEnd }) => {
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
      // Save completion state to localStorage
      localStorage.setItem('hasSeenTour', 'true');
      // Call the onEnd callback to hide the tour
      onEnd();
    }
  };

  if (!show) return null;

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      run={show}
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