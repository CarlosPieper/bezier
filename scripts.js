const canvas = document.getElementById('main-canvas');
let context = canvas.getContext('2d');
let isDragging = false;
let points = [{ x: 10, y: 400 }, { x: 890, y: 400 }, { x: 110, y: 50 }, { x: 790, y: 50 }];
let currentlyDraggedPoint = null;
const intervals = 10;
let segments = 6;
const positionsTable = document.getElementById("positions-table");
const trapeziodalSpan = document.getElementById("trapeziodal");
const simpson1Span = document.getElementById("simpson1");
const simpson2Span = document.getElementById("simpson2");
let calculationPoints = [];

canvas.style.cursor = 'default';

canvas.addEventListener('mousedown', function (e) {
    for (let i = 0; i < points.length; i++) {
        let point = points[i];
        let distance = Math.sqrt(Math.pow(e.clientX - point.x, 2) + Math.pow(e.clientY - point.y, 2));
        if (distance <= 10) {
            isDragging = true;
            currentlyDraggedPoint = point;
            canvas.style.cursor = 'pointer';
            break;
        }
    }
});

canvas.addEventListener('mousemove', function (e) {
    if (isDragging && currentlyDraggedPoint) {
        currentlyDraggedPoint.x = e.clientX - canvas.getBoundingClientRect().left;
        currentlyDraggedPoint.y = e.clientY - canvas.getBoundingClientRect().top;
        canvas.style.cursor = 'pointer';
        return;
    }
    let pointerOverPoint = false;
    for (let i = 0; i < points.length; i++) {
        let point = points[i];
        let distance = Math.sqrt(Math.pow(e.clientX - point.x, 2) + Math.pow(e.clientY - point.y, 2));
        if (distance <= 10) {
            pointerOverPoint = true;
            canvas.style.cursor = 'pointer';
            break;
        }
    }

    if (!pointerOverPoint) {
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseup', function () {
    isDragging = false;
});

function loop() {
    segments = document.getElementById("samples").value;

    positionsTable.innerHTML = '';
    trapeziodalSpan.innerHTML = '';
    simpson1Span.innerHTML = '';
    simpson2Span.innerHTML = '';

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawCartesianPlane();
    drawBezierCurve();
    drawInteractiblePoints();
    drawDashedLines();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function drawCartesianPlane() {
    const period = canvas.width / intervals;
    context.lineWidth = 1;
    context.strokeStyle = "Gainsboro";
    context.font = 'bold 16px arial';
    context.fillStyle = "black";

    for (let i = intervals - 1; i > 0; --i) {
        const point = period * i;
        context.beginPath();
        context.moveTo(point, 0);
        context.lineTo(point, canvas.height);
        context.stroke();
        context.fillText(i.toString(), point, canvas.height);

        context.beginPath();
        context.moveTo(0, point);
        context.lineTo(canvas.width, point);
        context.stroke();
        context.fillText((intervals - i).toString(), 0, point);
    }
}

function drawBezierCurve() {
    let firstPoint = points[0].x < points[1].x ? points[0] : points[1];
    let lastPoint = firstPoint.x == points[0].x ? points[1] : points[0];

    let controlPointsAreValid =
        !(points[2].x < firstPoint.x || points[2].x > lastPoint.x) &&
        !(points[3].x < firstPoint.x || points[3].x > lastPoint.x);

    context.strokeStyle = controlPointsAreValid ? 'black' : 'red';
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    context.bezierCurveTo(points[2].x, points[2].y, points[3].x, points[3].y, points[1].x, points[1].y);
    context.stroke();

    if (!controlPointsAreValid) {
        return;
    }

    context.lineWidth = 1;
    let currentPoint = { x: points[0].x, y: getYforX(points[0].x) }
    let segmentSize = Math.abs(points[1].x - points[0].x) / segments;
    calculationPoints = [currentPoint];
    for (let i = 1; i <= segments; i++) {
        let x = i * segmentSize + points[0].x;
        let y = getYforX(x);

        drawPoint({ x: currentPoint.x, y: canvas.height }, 4, "green");
        drawLine(currentPoint, { x: currentPoint.x, y: canvas.height }, "green");
        addPointToPositionsTable(currentPoint);
        drawLine(currentPoint, { x, y }, "green");
        drawPoint(currentPoint, 4, "green");
        currentPoint = { x, y };
        calculationPoints.push(currentPoint);
    }
    drawPoint(currentPoint, 4, "green");
    drawPoint({ x: currentPoint.x, y: canvas.height }, 4, "green");
    addPointToPositionsTable(currentPoint);
    drawLine(currentPoint, { x: currentPoint.x, y: canvas.height }, "green");

    showTrapeziodalFormula(convertScreenSizeToCartesianSize(segmentSize));
    showFirstSimpsonRuleFormula(convertScreenSizeToCartesianSize(segmentSize));
    showSecondSimpsonRuleFormula(convertScreenSizeToCartesianSize(segmentSize));
}

function drawInteractiblePoints() {
    for (let i = 0; i < 2; i++) {
        let point = points[i];
        drawPoint(point, 5, "red");
    }

    for (let i = 2; i < 4; i++) {
        let point = points[i];
        drawPoint(point, 5, "blue");
    }
}

function drawDashedLines() {
    drawDashedLine(points[2], points[0]);
    drawDashedLine(points[3], points[1]);
}

function drawPoint(point, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(point.x, point.y, size, 0, 2 * Math.PI);
    context.fill();
}

function drawLine(fromPoint, toPoint, color) {
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
}

function drawDashedLine(startPoint, endPoint) {
    context.setLineDash([5, 5]);

    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.stroke();

    context.setLineDash([]);
}

function addPointToPositionsTable(point) {
    const p = document.createElement("p");
    p.classList.add("point-position");

    point = convertScreenCoordenatesToCartesianCoordenates(point);

    p.textContent = `${point.x.toFixed(4)} | ${point.y.toFixed(4)}`;

    positionsTable.appendChild(p)
}

function getYforX(x) {
    const accuracy = 0.000001;
    let t = 0.5;

    for (let i = 0; i < 100; i++) {
        const ptX = (
            Math.pow(1 - t, 3) * points[0].x +
            3 * Math.pow(1 - t, 2) * t * points[2].x +
            3 * (1 - t) * Math.pow(t, 2) * points[3].x +
            Math.pow(t, 3) * points[1].x
        );

        if (Math.abs(ptX - x) < accuracy) {
            const ptY = (
                Math.pow(1 - t, 3) * points[0].y +
                3 * Math.pow(1 - t, 2) * t * points[2].y +
                3 * (1 - t) * Math.pow(t, 2) * points[3].y +
                Math.pow(t, 3) * points[1].y
            );
            return ptY;
        }

        const derivative = (
            -3 * Math.pow(1 - t, 2) * points[0].x +
            3 * (Math.pow(1 - t, 2) - 2 * (1 - t) * t) * points[2].x +
            3 * ((1 - t) * 2 * t - Math.pow(t, 2)) * points[3].x +
            3 * Math.pow(t, 2) * points[1].x
        );

        t -= (ptX - x) / derivative;
    }

    return null;
}

function convertScreenCoordenatesToCartesianCoordenates(point) {
    return {
        x: point.x / 90,
        y: (900 - point.y) / 90
    }
}

function convertScreenSizeToCartesianSize(number) {
    return number / 90;
}

function getPointHeight(point) {
    let height = 900 - point.y;
    return convertScreenSizeToCartesianSize(height).toFixed(4);
}

function calculateTrapeziodalArea(h) {
    let firstPart = parseFloat(h) / 2;
    let area = parseFloat(getPointHeight(calculationPoints[0]));
    for (let i = 1; i < calculationPoints.length - 1; i++) {
        let height = getPointHeight(calculationPoints[i]);
        area += 2 * parseFloat(height);
    }
    area += parseFloat(getPointHeight(calculationPoints[calculationPoints.length - 1]));
    area *= firstPart;
    return area;
}

function showTrapeziodalFormula(h) {
    h = parseFloat(h.toFixed(4));

    let formula = `<sup>${h}</sup>/<sub>2</sub> *
    <span>
    [${getPointHeight(calculationPoints[0])} + 2 * (`;
    for (let i = 1; i < calculationPoints.length - 1; i++) {
        let height = getPointHeight(calculationPoints[i]);
        formula += `${height} ${(i < calculationPoints.length - 2 ? '+' : '')} `;
    }
    let last = getPointHeight(calculationPoints[calculationPoints.length - 1]);
    formula += `) + ${last}] </span>`;
    formula += ` = ${calculateTrapeziodalArea(h).toFixed(4)} u.a.`

    trapeziodalSpan.innerHTML = formula;
}

function calculateFirstSimpsonRuleArea(h) {
    let firstPart = parseFloat(h) / 3;
    let area = parseFloat(getPointHeight(calculationPoints[0]));
    for (let i = 2; i < calculationPoints.length - 1; i += 2) {
        let height = getPointHeight(calculationPoints[i]);
        area += 2 * parseFloat(height);
    }
    for (let i = 1; i < calculationPoints.length - 1; i += 2) {
        let height = getPointHeight(calculationPoints[i]);
        area += 4 * parseFloat(height);
    }
    area += parseFloat(getPointHeight(calculationPoints[calculationPoints.length - 1]));
    area *= firstPart;
    return area;
}

function showFirstSimpsonRuleFormula(h) {
    h = parseFloat(h.toFixed(4));

    let formula = `<sup>${h}</sup>/<sub>3</sub> *
    <span>
    [${getPointHeight(calculationPoints[0])} + `;
    for (let i = 1; i < calculationPoints.length - 1; i++) {
        let height = getPointHeight(calculationPoints[i]);
        if (i % 2 == 0)
            formula += ` 2*${height} +`;
        else
            formula += ` 4*${height} +`;
    }
    let last = getPointHeight(calculationPoints[calculationPoints.length - 1]);
    formula += ` ${last}] </span>`;
    formula += ` = ${calculateFirstSimpsonRuleArea(h).toFixed(4)} u.a.`

    simpson1Span.innerHTML = formula;
}

function calculateSecondSimpsonRuleArea(h) {
    let firstPart = 3 * parseFloat(h) / 8;
    let area = parseFloat(getPointHeight(calculationPoints[0]));
    for (let i = 1; i < calculationPoints.length - 1; i++) {
        let height = getPointHeight(calculationPoints[i]);
        if (i % 3 == 0)
            area += 2 * height;
        else
            area += 3 * height;
    }
    area += parseFloat(getPointHeight(calculationPoints[calculationPoints.length - 1]));
    area *= firstPart;
    return area;
}

function showSecondSimpsonRuleFormula(h) {
    h = parseFloat(h.toFixed(4));

    let formula = `<sup>3*${h}</sup>/<sub>8</sub> *
    <span>
    [${getPointHeight(calculationPoints[0])} + `;
    for (let i = 1; i < calculationPoints.length - 1; i++) {
        let height = getPointHeight(calculationPoints[i]);
        if (i % 3 == 0)
            formula += ` 2*${height} +`;
        else
            formula += ` 3*${height} +`;
    }
    let last = getPointHeight(calculationPoints[calculationPoints.length - 1]);
    formula += ` ${last}] </span>`;
    formula += ` = ${calculateSecondSimpsonRuleArea(h).toFixed(4)} u.a.`

    simpson2Span.innerHTML = formula;
}