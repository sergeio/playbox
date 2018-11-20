import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './App.css';

import { colors } from './colors.js';


class App extends Component {
  constructor(props) {
    super(props);
    this.handleKeypress = this.handleKeypress.bind(this);
    this.svg = React.createRef();
    this.state = {
      splitOrientation: 'h',
      colorIndex: 0,
      outlineBoxes: true,
      clickMode: 'split',
    };
  }

  undo() {
    // This is a sign that box data should be stored higher up, on this
    // component rather than on the SVG Component.  But this is for fun, and
    // I'm learning.
    this.svg.current.undo();
  }

  handleKeypress(e) {
    if (e.key === 'v') {
      this.setState({splitOrientation: 'v'});
    } else if (e.key === 'h') {
      this.setState({splitOrientation: 'h'});
    } else if (e.key === 'n') {
      this.setState({colorIndex: (this.state.colorIndex + 1) % colors.length});
    } else if (e.key === 'm') {
      const newMode = this.state.clickMode !== 'split' ? 'split' : 'color';
      this.setState({clickMode: newMode});
    } else if (e.key === 's') {
      this.setState({clickMode: 'split'});
    } else if (e.key === 'c') {
      this.setState({clickMode: 'color'});
    } else if (e.key === 'u') {
      this.undo();
    } else if (e.key === ' ') {
      e.preventDefault();
      this.setState({outlineBoxes: !this.state.outlineBoxes});
    }
  }

  render() {
    return (
      <div
        className="App"
        tabIndex="0"
        onKeyDown={this.handleKeypress}
      >
        <SVG ref={this.svg} {...this.state}/>
        <Info {...this.state}/>
      </div>
    );
  }
}


class Info extends Component {
  static propTypes = {
    colorIndex: PropTypes.number.isRequired,
    splitOrientation: PropTypes.string.isRequired,
    outlineBoxes: PropTypes.bool.isRequired,
    clickMode: PropTypes.string.isRequired,
  };

  render() {
    return <div className="info">
      <p>{this.props.colorIndex}</p>
      <p>{this.props.splitOrientation}</p>
      <p>{this.props.outlineBoxes ? "t" : "f"}</p>
      <p>{this.props.clickMode}</p>
    </div>
  }

}


class SVG extends Component {
  static propTypes = {
    splitOrientation: PropTypes.string.isRequired,
    colorIndex: PropTypes.number.isRequired,
    outlineBoxes: PropTypes.bool.isRequired,
    clickMode: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      undoIndex: 0,
      boxes: [{
        x: 1,
        y: 1,
        width: 512,
        height: 512,
        stroke: this.props.outlineBoxes ? "white" : "none",
        strokeWidth: ".3px",
        fill: "blue",
      }]};
  }

  setState(newState, undoing) {
    // Intercept updates to `boxes` to save a copy for `undo`
    // `undoing` signals that we aren't adding a new state. We're reverting
    if (!('boxes' in newState) || undoing) {
      return super.setState(newState);
    }
    const oldBoxesList = [
      ...[this.state.boxes],
      ...this.state.oldBoxesList || [],
    ].slice(0, 20);
    const newerState = {
      ...newState,
      ...{oldBoxesList: oldBoxesList, undoIndex: 0}};
    return super.setState(newerState);
  }

  componentWillReceiveProps(newProps) {
    // This is likely not how you're meant to do things in React. Feels hacky
    // We need this because otherwise we won't try to render when
    // props.outlineBoxes changes
    const intendedStroke = newProps.outlineBoxes ? "white" : "none";
    if (this.state.boxes[0].stroke === intendedStroke) return
    this.setState({boxes: this.state.boxes.map((box) => {
      return {...box, ...{stroke: intendedStroke}}
    })});
  }

  undo() {
    if ('oldBoxesList' in this.state) {
      const previousBoxes = this.state.oldBoxesList[this.state.undoIndex];
      if (!previousBoxes) {
        // We're probably trying to undo before the beginning of time
        return
      }
      this.setState({
        boxes: previousBoxes,
        undoIndex: this.state.undoIndex + 1,
      }, true);
    }
  }

  getCurrentColor() {
    return colors[this.props.colorIndex];
  }

  handleBoxClick(index) {
    if (this.props.clickMode === 'split') {
      return this.splitBox(index);
    } else {
      return this.colorBox(index);
    }
  }

  colorBox(index) {
    const toColor = {
      ...this.state.boxes[index],
      ...{fill: this.getCurrentColor()}};
    let updatedBoxes = [...this.state.boxes];
    updatedBoxes.splice(index, 1, toColor);
    this.setState({boxes: updatedBoxes});
  }

  splitBox(index) {
    const toSplit = this.state.boxes[index];
    let boxOne = {
      stroke: toSplit.stroke,
      strokeWidth: toSplit.strokeWidth,
      fill: toSplit.fill,
      x: toSplit.x,
      y: toSplit.y,
    };
    let boxTwo = {
      stroke: toSplit.stroke,
      strokeWidth: toSplit.strokeWidth,
      fill: toSplit.fill,
    };
    if (this.props.splitOrientation === 'v') {
      boxOne = {
        ...boxOne,
        width: toSplit.width / 2,
        height: toSplit.height,
      };
      boxTwo = {
        ...boxTwo,
        x: toSplit.x + boxOne.width,
        y: toSplit.y,
        width: toSplit.width / 2,
        height: toSplit.height,
      };
    } else {
      boxOne = {
        ...boxOne,
        width: toSplit.width,
        height: toSplit.height / 2,
      };
      boxTwo = {
        ...boxTwo,
        x: toSplit.x,
        y: toSplit.y + boxOne.height,
        width: toSplit.width,
        height: toSplit.height / 2,
      };
    }

    let updatedBoxes = [...this.state.boxes, ...[boxOne, boxTwo]];
    updatedBoxes.splice(index, 1);
    this.setState({boxes: updatedBoxes});

  }

  boxOnclick(index) {
    function onClick() {
      this.handleBoxClick(index);
    }
    return onClick.bind(this);
  }

  render() {
    const boxComponents = this.state.boxes.map((box, index) => {
      const boxProps = {...box, ...{onClick: this.boxOnclick(index)}}
      return <Box
        key={`${box.x}x${box.y}`}
        {...boxProps}
      />
    });

    return <svg
      version="1.1"
      baseProfile="full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {boxComponents}
    </svg>
  }
}


class Box extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.string.isRequired,
    fill: PropTypes.string.isRequired,
  };

  render() {
    return <rect
      onClick={this.props.onClick}
      x={this.props.x}
      y={this.props.y}
      width={this.props.width}
      height={this.props.height}
      strokeWidth={this.props.strokeWidth}
      stroke={this.props.stroke}
      fill={this.props.fill}
    />
  }
}

export default App;
