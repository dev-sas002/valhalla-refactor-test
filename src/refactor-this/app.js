import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "./css/styles.css";

import NavBar from "./components/NavBar";
import AppRouter from "./router";

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <NavBar />
        <AppRouter />
      </BrowserRouter>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("main-view"));
