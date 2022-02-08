import React from "react";

import StatusPanel from "./StatusPanel";

/**
 * Last line of defence: a render-time throw anywhere below this point used to
 * unmount the whole app and leave a blank white page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in the photo gallery:", error);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="page">
        <StatusPanel
          tone="error"
          title="Something went wrong"
          action={{ label: "Try again", onClick: this.handleReset }}
        >
          The gallery could not be displayed.
        </StatusPanel>
      </main>
    );
  }
}

export default ErrorBoundary;
