var viewport = document.body
var canvas = document.getElementById('canvas')
var context = canvas.getContext('2d')
var canvasHeight = canvas.height = viewport.offsetHeight
var canvasWidth = canvas.width = viewport.offsetWidth

// settings
var fontSize = 13
var fontFamily = 'monospace'
var byteBlock = fontSize/1.66640
var lineHeight = fontSize
var tabSize = 2

/**
 * buffer
 *
 * gap buffer
 *
 * [1, 2, 3, _, 5] init
 *           
 * [1, 2, 3, 4, 5] inset
 *
 * [1, 2, 3, _, _] remove
 *
 * [1, 2, _, 3, 5] move
 *
 * [1, 2, 3, _, _, _, _, _, 5] alloc larger(2N) buffer
 * 
 * @param {number} size
 */
function Buffer (size) {
  this.lead = 0
  this.tail = 0

  // entire buffer
  this.buff = Array(this.size = size|0)

  // selection coordinates
  this.maps = Array(0)

  // visible coordinates
  this.view = [0, 0]

  // dimensions
  this.width = 0
  this.height = 0
}

Buffer.prototype = {
	move: move,
	jump: jump,
	insert: insert,
  remove: remove,
	fill: fill,
	expand: expand,
  select: select,
  copy: copy,
  save: save,
  render: render
}

/**
 * move
 * 
 * @param {number}
 * @return {void}
 */
function move (distance) {
	var caret = distance < 0 ? ~distance+1 : distance|0

  while (caret-- > 0)
  	distance > 0 ? 
      (this.tail > 0 ? this.buff[this.lead++] = this.buff[this.size-this.tail++] : caret = 0) :
      (this.lead > 0 ? this.buff[this.size-(this.tail++)-1] = this.buff[(this.lead--)-1] : caret = 0)
}

/**
 * jump
 * 
 * @param {number}
 * @return {void}
 */
function jump (location) {
	this.move(location|0-this.lead)
}

/**
 * insert
 * 
 * @param {string} string
 * @return {void}
 */
function insert (string) {
	if (string.length > 0)
		for (var i = 0; i < string.length; i++)
			this.fill(string.charAt(i))
	else
		this.fill(string)
}

/**
 * remove
 * 
 * @param {number} distance
 * @return {void}
 */
 function remove (distance) {
  var caret = distance < 0 ? ~distance+1 : distance|0

  while (caret-- > 0)
    distance < 0 ? 
      (this.lead > 0 ? this.lead-- : caret = 0) :
      (this.tail > 0 ? this.tail-- : caret = 0)
 }

/**
 * fill
 * 
 * @param {string} char
 * @return {void}
 */
function fill (char) {
	if (this.lead + this.tail === this.size)
		this.expand()

	this.buff[this.lead++] = char
}

/**
 * expand
 * 
 * @return {void}
 */
function expand () {
  this.buff = this.buff.slice(0, this.lead).concat(Array(this.size*=2), this.buff.slice(this.tail))
}

/**
 * select
 * 
 * @return {void}
 */
function select (x1, y1, x2, y2) {

}

/**
 * copy
 * 
 * @return {string}
 */
function copy () {

}

/**
 * save
 * 
 * @return {string}
 */
function save () {
  return this.buff.join('')
}

/**
 * render
 * 
 * @param {number} xAxis
 * @param {number} yAxix
 * @return {void}
 *
 * @todo only render the parts that are visible
 *
 * 1. we could get to the visible area by calculating the delta
 *    coming from opposite ends(line by line) till we reach the middle –> x <–
 *    such that x <= visible viewport height at this paint we just paint the remaing lines
 *
 *    possible optimization could be added to start from the closest anchors from both sides
 *    if possible.
 *
 *    this assumes handling scrolling as well.
 *
 * 2. for the most part the same as 1. but instead of just grow the canvas as needed
 *    let the native runtime handle scroll, and only update the parts of visible viewport like 1.
 */
function render (xAxis, yAxis) {
  var byte = ''
  var buff = this.buff
  var lead = this.lead
  var tail = this.tail
  var length = buff.length
  var size = lead

  var line = lineHeight
  var space = byteBlock
  var tab = tabSize
  var x = xAxis|0
  var y = yAxis|0+fontSize

  var i = 0
  var offset = 0
  var code = 0
  var gap = 0

  var cols = canvasWidth
  var rows = canvasHeight
  
  var width = 0
  var height = lineHeight

  // setup
  if (cols*rows > 0)
    context.clearRect(0, 0, cols, rows)

  context.font = fontSize+'px '+fontFamily

  // visitor
  while (true) {
    // x-axis breadth
    if (x > width)
      width = x

    // eof
    if (i === size) {
      if (tail === 0 || gap++ > 0)
        break
      else
        i = (size = length)-tail
    }

    // syntax highlighting in this case becomes much cheaper than an array of strings data-structure
    // 1. numbers, operators etc are universal so we can archive that at no cost
    // 2. lazily peak operator keywards to archive syntax highlighting on others
    // 3. use some binary state to track when inside comments and strings 
    switch (code = (byte = buff[i++]).charCodeAt(offset = 0)) {
      // carriage
      case 13:
        continue
      // newline
      case 10:
        // y-axis height
        height = y += line
        x = 0
        continue
      // tab
      case 9:
        offset = tab*space
        break
      // operators
      case 45:
        // set default fill `context.fillStyle` 
    }

    context.fillText(byte, x, y)
    x += offset+space
  }

  this.width = width|0
  this.height = height|0

   console.log(this.width, this.height)
}

(function demo(){
  var string = 'hello world'
  var heap = new Buffer(string.length)

  heap.insert(string)
  heap.render(0, 0)

  setTimeout(() => {
    heap.move(-2)
    heap.insert('.')
    heap.render(0, 0)

    setTimeout(()=> {
      // -5 will remove the last 5 characters, 5 will remove next 5 characters
      heap.remove(5)
      heap.render(0, 0)
    }, 200)
  }, 200)
})()
