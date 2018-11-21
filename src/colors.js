import averageColor from 'average-color';

class Pallette {
  static start = [183, 122, 171];
  static end = [38, 3, 57];

  constructor() {
    this.current = Pallette.start;
  }

  getNextColor() {
    const next = averageColor(this.current, Pallette.end);
    this.current = next;
    return next
  }

  generateColorList(length) {
    let colorList = [Pallette.start];
    for (let i = 0; i < length - 1; i++) {
      colorList.push(this.getNextColor());
    }
    return colorList
  }

}

let colors = new Pallette().generateColorList(15);


export { colors };
