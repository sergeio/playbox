import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactDOM from 'react-dom';
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
      splitMode: 4,
      allMode: false,
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
      this.setState({
        splitOrientation: 'v',
        clickMode: 'split',
        splitMode: 2,
      });
    } else if (e.key === 'h') {
      this.setState({
        splitOrientation: 'h',
        clickMode: 'split',
        splitMode: 2,
      });
    } else if (e.key === 'n' || e.key === 'N') {
      const direction = e.key === 'n' ? 1 : -1
      const len = colors.length;
      this.setState({
        colorIndex: (this.state.colorIndex + direction + len) % len,
        clickMode: 'color',
      });
    } else if (e.key === 'm') {
      const newMode = this.state.clickMode !== 'split' ? 'split' : 'color';
      this.setState({clickMode: newMode});
    } else if (e.key === 's') {
      this.setState({clickMode: 'split'});
    } else if (e.key === 'c') {
      this.setState({clickMode: 'color'});
    } else if (e.key === '2') {
      this.setState({clickMode: 'split', splitMode: 2});
    } else if (e.key === '4') {
      this.setState({clickMode: 'split', splitMode: 4});
    } else if (e.key === 'a') {
      this.setState({allMode: !this.state.allMode});
    } else if (e.key === 'u') {
      this.undo();
    } else if (e.key === ' ') {
      e.preventDefault();
      this.setState({outlineBoxes: !this.state.outlineBoxes});
    }
  }

  componentDidMount() {
    // Focus the App so we are properly intercepting key events
    ReactDOM.findDOMNode(this).focus();
  }

  render() {
    return (
      <div
        className="App"
        tabIndex="0"
        onKeyDown={this.handleKeypress}
      >
        <SVG ref={this.svg} {...this.state} />
        <Info {...this.state} />
      </div>
    );
  }
}


class Info extends Component {
  static propTypes = {
    splitMode: PropTypes.number.isRequired,
    splitOrientation: PropTypes.string.isRequired,
    clickMode: PropTypes.string.isRequired,
    colorIndex: PropTypes.number.isRequired,
    outlineBoxes: PropTypes.bool.isRequired,
    allMode: PropTypes.bool.isRequired,
  };

  render() {
    return <div className="info">
      <p>{this.props.colorIndex}</p>
      <p>{this.props.splitOrientation}</p>
      <p>{this.props.clickMode}</p>
      <p>{this.props.splitMode}</p>
      <p>{this.props.allMode ? "all" : ""}</p>
    </div>
  }

}


/**
 * Render a link to allow saving the SVG to disk
 */
class SaveLink extends Component {
  static propTypes = {
    svg: PropTypes.element.isRequired,
  };

  render() {
    const svgHTML = ReactDOMServer.renderToStaticMarkup(this.props.svg);
    // b64 encoding the SVG source because otherwise it was getting truncated
    const svgHTMLb64 = btoa(svgHTML);
    const href = `data:image/svg+xml;base64,${svgHTMLb64}`;
    return <a className="save" href={href} download="image.svg">save</a>
  }
}


class SVG extends Component {
  static propTypes = {
    splitOrientation: PropTypes.string.isRequired,
    colorIndex: PropTypes.number.isRequired,
    outlineBoxes: PropTypes.bool.isRequired,
    clickMode: PropTypes.string.isRequired,
    splitMode: PropTypes.number.isRequired,
    allMode: PropTypes.bool.isRequired,
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
        fill: "#BBB",
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
    const [r, g, b] = colors[this.props.colorIndex];
    return `rgb(${r}, ${g}, ${b})`;
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

  splitThisBox(toSplit, splitOrientation) {
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
    if (splitOrientation === 'v') {
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
    return [boxOne, boxTwo];
  }

  /**
   * Splits the box that `index` points to, returns new this.state.boxes
   */
  splitOneBox(box, boxes) {
    let newBoxes = this.splitThisBox(box, this.props.splitOrientation);

    if (this.props.splitMode === 4) {
      const [boxOne, boxTwo] = newBoxes;
      const tempOrientation = this.props.splitOrientation === 'v' ? 'h' : 'v';
      newBoxes = [
        ...this.splitThisBox(boxOne, tempOrientation),
        ...this.splitThisBox(boxTwo, tempOrientation),
      ];
    }
    // let updatedBoxes = [...boxes, ...newBoxes];
    let updatedBoxes = [...boxes]
    const index = updatedBoxes.indexOf(box);
    updatedBoxes[index] = newBoxes;
    updatedBoxes = updatedBoxes.flat();
    return updatedBoxes;
  }

  splitBox(index) {
    if (!this.props.allMode) {
      const updatedBoxes = this.splitOneBox(
      this.state.boxes[index], this.state.boxes);
      this.setState({boxes: updatedBoxes});
    } else {
      const targetColor = this.state.boxes[index].fill;
      const matchingBoxes = this.state.boxes.map((box) => {
        if (box.fill === targetColor) {
          return box;
        } else {
          return -1;
        }
      }).filter((box) => box !== -1);
      let updatedBoxes = this.state.boxes;
      for (const box of matchingBoxes) {
        updatedBoxes = this.splitOneBox(box, updatedBoxes);
      }
      this.setState({boxes: updatedBoxes});
    }
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
    const svgComponent = <svg
      version="1.1"
      baseProfile="full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {boxComponents}
    </svg>

    return <div className="svg-container">
      {svgComponent}
      <div>
      <SaveLink svg={svgComponent} />
    </div>
    </div>

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
