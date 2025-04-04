function main() {
  var canvas = document.getElementById('cnv1');
  if (!canvas) {
    console. log('Failed to retrieve the ‹canvas > element');
    return false;
  }
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var v1 = new Vector3([2.25, 2.25]);
  drawVector(v1, 'red');
}

function drawVector(v, color) {
  var canvas = document.getElementById('cnv1');
  var ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(canvas.width/2, canvas.height/2);
  ctx.lineTo(canvas.width/2 + 20 * v.elements[0], canvas.height/2 - 20 * v.elements[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('cnv1');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let v1x = document.getElementById('v1x').value;
  let v1y = document.getElementById('v1y').value;

  let v2x = document.getElementById('v2x').value;
  let v2y = document.getElementById('v2y').value;

  let v1 = new Vector3([v1x, v1y]);
  let v2 = new Vector3([v2x, v2y]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('cnv1');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let v1x = document.getElementById('v1x').value;
  let v1y = document.getElementById('v1y').value;

  let v2x = document.getElementById('v2x').value;
  let v2y = document.getElementById('v2y').value;

  let v1 = new Vector3([v1x, v1y]);
  let v2 = new Vector3([v2x, v2y]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');

  let scalar = document.getElementById('scalar').value;
  let operation = document.getElementById('operation').value;

  let v3 = new Vector3();
  let v4 = new Vector3();

  v3.set(v1);
  v4.set(v2);

  if (operation === 'add') {
    v3.add(v4);
    drawVector(v3, 'green');
  } else if (operation === 'sub') {
    v3.sub(v4);
    drawVector(v3, 'green');
  } else if (operation === 'mul') {
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'div') {
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (operation === 'mag') {
    console.log("Magnitude v1: " + v3.magnitude());
    console.log("Magnitude v2: " + v4.magnitude());
  } else if (operation === 'nor') {
    v3.normalize();
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  }

}