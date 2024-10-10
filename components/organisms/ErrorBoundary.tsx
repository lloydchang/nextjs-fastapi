// components/organisms/ErrorBoundary.tsx

'use client'; // Mark as Client Component

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  currentMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      currentMessage: ''
    };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true, currentMessage: '' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      this.startMessageRotation();
    }
  }

  componentWillUnmount() {
    this.stopMessageRotation();
  }

  startMessageRotation = () => {
    const funnyParagraphs = [
      "Uh-oh, looks like our code forgot to cross its t's and dot its i's. Someone call the Grammar Police!",
      "Well, this is awkward. Our code just blue-screened without a screen. Please stand by while we reboot its sense of humor.",
      "Oops! Something went wrong, probably because our code decided to test the 'Murphy's Law' theorem.",
      "Oh no! It seems like our code just took a nosedive into the 'What If Everything Breaks?' abyss.",
      "Yikes! The code stepped on a LEGO piece and refuses to function until it’s over the pain. Trust me, we’re negotiating.",
      "Whoa there! This code went on a quest for the Holy Semicolon and hasn’t returned. Send help.",
      "Oops, the app’s brain just had a hiccup. A few deep breaths and maybe some coffee should do the trick!",
      "Eek! It looks like the code encountered a mid-life crisis and now it’s questioning its life choices.",
      "Oh snap! It seems like our code just broke the fourth wall and decided to take up acting instead of programming.",
      "Well, this is embarrassing… Our code is currently on a timeout for trying to divide by zero.",
      "Oops! The app found itself in an existential dilemma. It’s currently meditating to find inner peace.",
      "Something’s gone fishy! Looks like the code is swimming in a sea of bugs. Hope it packed its life jacket!",
      "Yikes! The code tripped over a missing semicolon. We’ve called the ambulance and it’s on the way.",
      "Oops! This component decided it’s better to go on strike. We’re trying to convince it with chocolate and promises of no bugs.",
      "Ah, well, our code just rage-quit the game of 'Stay Error-Free'. We’ll be sending it back to tutorial mode.",
      "It appears the code decided to 'do its own research' on a random stack trace and got hopelessly lost.",
      "Uh-oh! The app’s wiring got tangled in a recursive loop of self-reflection. Time to untangle the philosophical knots.",
      "Oops! The app decided to take an impromptu vacation to Syntax Error Island. We’re looking for its return flight now.",
      "Well, well, well… Seems like our code tried to debug itself and got caught in an endless loop of procrastination.",
      "Oopsie-daisy! The app stubbed its toe on a missing dependency. We’ll find a band-aid and get it back to work.",
      "Hmm, seems like our code mistook 'undefined' for enlightenment. We’ll bring it back to reality soon.",
      "Oops! Our code got distracted watching cat videos. We’ve sent a stern message, but who can resist a good cat video?",
      "Oh no! The code encountered a Schrödinger’s bug: it exists and doesn’t exist at the same time. Reality might break if we try to fix it.",
      "Oops! The code spiraled into an identity crisis after discovering it was just a bunch of ones and zeros.",
      "Uh-oh! This code just got promoted to 'Abstract Artist' and its output is pure nonsense. Maybe it needs a break!",
      "Something smells off! The code might have accidentally used 'var' instead of 'let' and now it’s lost in a time warp.",
      "Oh dear… The app's circuit board seems to be having an emotional breakdown. We’re scheduling a therapy session."
    ];

    this.intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * funnyParagraphs.length);
      this.setState({ currentMessage: funnyParagraphs[randomIndex] });
    }, 3000);
  };

  stopMessageRotation = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '32px' }}>{this.state.currentMessage}</h1>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
