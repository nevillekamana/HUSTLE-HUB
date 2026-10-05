//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Component } from 'react';
import { MESSAGES } from '@/api/client';
import ErrorBanner from '@/components/ErrorBanner';

//-----------------------------------------------------\\
//                    ERROR BOUNDARY
//-----------------------------------------------------\\

//a page that throws while drawing shows the generic sentence and a try again
//button instead of an empty screen, the header above it keeps working
//the error itself is never put on screen, it could carry details a person
//should not see, react already reports it in the console while developing
//react only offers this as a class, there is no hook for it
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
    this.retry = () => this.setState({ failed: false });
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <>
        <title>Something went wrong · HustleHub+</title>
        <h1 tabIndex={-1} className="sr-only">
          Something went wrong
        </h1>
        <ErrorBanner message={MESSAGES.generic} onRetry={this.retry} />
      </>
    );
  }
}

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default ErrorBoundary;
