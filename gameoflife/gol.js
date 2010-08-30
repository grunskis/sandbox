/*
 * Conway's Game of Life
 *
 * Rules of the game:
 *
 *   1. Any live cell with fewer than two live neighbours dies, as if
 *   caused by under-population.
 *
 *   2. Any live cell with more than three live neighbours dies, as if
 *   by overcrowding.
 *
 *   3. Any live cell with two or three live neighbours lives on to
 *   the next generation.
 *
 *   4. Any dead cell with exactly three live neighbours becomes a live
 *   cell, as if by reproduction.
 * 
 */

var GameOfLife = (function () {

  var Color = {
    BACKGROUND: '#fff', GRID: '#eee', CELL: '#000'
  };

  var CellState = {
    DEAD: 0, ALIVE: 1
  };

  var Board = function (board, params) {
    var cells = null;

    var cols = null;
    var rows = null;

    var tick = 0;

    (function () {
      rows = Math.ceil(params.rows);
      cols = Math.ceil(params.cols);

      cells = new Array(rows);
      for (var row = 0; row <= rows; row++) {
        cells[row] = new Array(cols);
      }

      if (board != null) {
        for (row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var count = board.neighbours(row, col);

            if (count < 2) {
              die(row, col); // under-population
            } else if (count > 3) {
              die(row, col); // overcrowding
            } else {
              if (board.livingCell(row, col)) {
                spawn(row, col);
              } else {
                if (count == 3) {
                  spawn(row, col); // reproduction
                }
              }
            }
          }
        }

        tick = board.tick + 1;
      }
    }());

    function neighbours(row, col) {
      var count = 0;

      if (row > 0 && livingCell(row-1, col)) {
        count++;
      }
      if (row > 0 && col < cols && livingCell(row-1, col+1)) {
        count++;
      }
      if (col < cols && livingCell(row, col+1)) {
        count++;
      }
      if (row < rows && col < cols && livingCell(row+1, col+1)) {
        count++;
      }
      if (row < rows && livingCell(row+1, col)) {
        count++;
      }
      if (row < rows && col > 0 && livingCell(row+1, col-1)) {
        count++;
      }
      if (col > 0 && livingCell(row, col-1)) {
        count++;
      }
      if (row > 0 && col > 0 && livingCell(row-1, col-1)) {
        count++;
      }

      return count;
    };

    function livingCell(row, col) {
      return cells[row][col] == CellState.ALIVE;
    };

    function spawn(row, col) {
      cells[row][col] = CellState.ALIVE;
    };

    function die(row, col) {
      cells[row][col] = CellState.DEAD;
    };

    function calcRow(e) {
      return Math.ceil(e.layerY / params.blocksize)-1;
    };

    function calcCol(e) {
      return Math.ceil(e.layerX / params.blocksize)-1;
    };

    function toggleCell(e) {
      var col = calcCol(e);
      var row = calcRow(e);

      var state = livingCell(row, col);

      if (state) {
        die(row, col);
      } else {
        spawn(row, col);
      }

      return state ? CellState.DEAD : CellState.ALIVE;
    };

    function setCells(e, state) {
      var col = calcCol(e);
      var row = calcRow(e);

      if (cells[row][col] != state) {
        cells[row][col] = state;

        return true;
      }

      return false;
    };

    return {
      'rows': rows,
      'cols': cols,
      'tick': tick,
      'neighbours': neighbours,
      'livingCell': livingCell,
      'toggleCell': toggleCell,
      'setCells': setCells
    };
  };
  
  var Screen = function(params) {
    var canvas = null;
    var ctx = null;
    
    var width;
    var height;

    (function () {
      canvas = params.canvas;
      
      ctx = canvas.getContext('2d');

      width = canvas.width;
      height = canvas.height;

      reset();
      if (params.drawGrid) {
        drawGridLines();
      }
    }());

    function drawGridLines() {
      ctx.strokeStyle = Color.GRID;
      
      for (var x = params.blocksize+0.5; x <= width; x += params.blocksize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (var y = params.blocksize+0.5; y <= height; y += params.blocksize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.strokeRect(0, 0, width-0.5, height-0.5);

      ctx.stroke();
    };

    function reset() {
      ctx.fillStyle = Color.BACKGROUND;
      ctx.fillRect(0, 0, width, height); 
    };

    function redraw(board) {
      reset();
      if (params.drawGrid) {
        drawGridLines();
      }
      draw(board);
    };

    function draw(board) {
      ctx.fillStyle = Color.CELL;

      var blocksize = params.blocksize - 0.5;

      for (var row = 0; row <= board.rows; row++) {
        var y = row * params.blocksize + 0.5;
        
        for (var col = 0; col <= board.cols; col++) {
          if (board.livingCell(row, col)) {
            var x = col * params.blocksize + 0.5;
            
            ctx.fillRect(x, y, blocksize, blocksize);
          }
        }
      }
    };

    return {
      'width': width,
      'height': height,
      'redraw': redraw,
      'canvas': canvas
    };
  };

  var params = null;

  var screen = null;
  var board = null;

  var before, tick;
  var interval = null;

  var cellState = null;

  function init(canvas, defaults) {
    params = defaults;
    params.canvas = canvas;
    
    screen = new Screen(params);

    params.cols = screen.width / params.blocksize;
    params.rows = screen.height / params.blocksize;

    start = new Date().getTime();
    tick = 0;

    board = new Board(null, params);

    canvas.addEventListener('mousedown', mousedown, true);
    canvas.addEventListener('mousemove', mousemove, true);
    canvas.addEventListener('mouseup', mouseup, true);

    el('tick').textContent = "0"; // DEBUG
  };

  function mousedown(e) {
    cellState = board.toggleCell(e);

    screen.redraw(board);
  };
  
  function mouseup() {
    cellState = null;
  };

  function mousemove(e) {
    if (cellState != null) {
      if (board.setCells(e, cellState)) {
        screen.redraw(board);
      }
    }
  };

  function millis() {
    return (new Date().getTime()) - start;
  };

  function step() {
    var now = millis();
    
    if (now - before > params.delay) {
      before = now;

      return true;
    }

    return false;
  };

  function el(id) {
    return document.getElementById(id);
  }

  function loop() {
    if (step()) {
      screen.redraw(board);
      
      tick++;
    } else {
      if (tick > board.tick) {
        board = new Board(board, params);
      }
    }

    el('tick').textContent = tick; // DEBUG
  };

  function start() {
    tick++;
    
    before = millis();
    
    interval = setInterval(loop, 20);

    params.canvas.removeEventListener('mousedown', mousedown, true);
    params.canvas.removeEventListener('mousemove', mousemove, true);
    params.canvas.removeEventListener('mouseup', mouseup, true);
  };

  function stop() {
    clearInterval(interval);
  };

  return {
    'init': init,
    'start': start,
    'stop': stop
  };
}());
