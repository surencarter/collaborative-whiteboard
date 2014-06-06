var shapes = [], shape;
var dragging = false;
var startPoint = new Object;
var toolType, selected = null, highlight;
var width, height, polyPoints=[];
var composite='source-over', brushSize=10, lineWidth=1, txtLineWidth=1, text='', font='serif', image=new Image();
var red = 0, green = 0, blue = 0, alpha = 1, fill = false;
function getColor()  { return 'rgba('+red+','+green+','+blue+','+alpha+')'; }
function toColor(color)   { return 'rgba('+color[0]+','+color[1]+','+color[2]+','+color[3]+')'; }
var sendHttp=new XMLHttpRequest(), recieveHttp=new XMLHttpRequest(), lastUpdated;

function init()
{
   document.getElementById('brushBtn').addEventListener('click', function(){pickTool('brush')}, false);
   document.getElementById('lineBtn').addEventListener('click', function(){pickTool('line')}, false);
   document.getElementById('rectBtn').addEventListener('click', function(){pickTool('rectangle')}, false);
   document.getElementById('circleBtn').addEventListener('click', function(){pickTool('circle')}, false);
   document.getElementById('polyBtn').addEventListener('click', function(){pickTool('polygon')}, false);
   document.getElementById('textBtn').addEventListener('click', function(){pickTool('text')}, false);
   document.getElementById('imageBtn').addEventListener('click', function(){pickTool('image')}, false);
   document.getElementById('eraseBtn').addEventListener('click', function(){pickTool('eraser')}, false);
   document.getElementById('selectBtn').addEventListener('click', function(){pickTool('select')}, false);

   document.getElementById('colorInput').addEventListener('change', function(){setParam('color')}, false);
   document.getElementById('opacSlide').addEventListener('mouseup', function(){setParam('alpha')}, false);
   document.getElementById('fillCheck').addEventListener('click', function(){setParam('fill')}, false);
   document.getElementById('brushSlide').addEventListener('mouseup', function(){setParam('brushSize')}, false);
   document.getElementById('txtLnWidth').addEventListener('mouseup', function(){setParam('txtLineWidth')}, false);
   document.getElementById('lnWidthSlide').addEventListener('mouseup', function(){setParam('lineWidth')}, false);
   document.getElementById('textInput').addEventListener('click', function(){this.value=''}, false);
   document.getElementById('textInput').addEventListener('keyup', function(){setParam('text')}, false);
   document.getElementById('fontSel').addEventListener('change', function(){setParam('font')}, false);
   document.getElementById('fileUrlInput').addEventListener('click', function(){this.value=''}, false);
   document.getElementById('fileUrlInput').addEventListener('blur', function(){setParam('imagesrc')}, false);
   document.getElementById('compSel').addEventListener('change', function(){setParam('composite')}, false);

   var canvas = document.getElementById('canvas');
   canvas.addEventListener('mousedown', mouseDown, false);
   canvas.addEventListener('mousemove', draw, false);
   canvas.addEventListener('mouseup', mouseUp, false);

   jc.start('canvas', true);
   highlight = jc.rect(0, 0, 0, 0, 'rgba(0, 0, 0, 0.5)');

	recieveHttp.open('GET', 'server.php?what=getall', true);
   recieveHttp.onreadystatechange = function()
   {
      if(recieveHttp.readyState!=4 || recieveHttp.status!=200)
         return;

	   var shapesSer = recieveHttp.responseText.split('|');
	   for (var i=0; i<shapesSer.length-1; i++)
		  shapes.push(deserialize(shapesSer[i]));

      lastUpdated = shapesSer[shapesSer.length-1];
      recieveHttp.onreadystatechange = update;
      reqestUpdate();
   }
	recieveHttp.send(null);
}

function reqestUpdate()
{
   recieveHttp.open('GET','server.php?what=update&lastupdated='+lastUpdated ,true);
   recieveHttp.send(null);
}

function update()
{
   if(recieveHttp.readyState!=4 || recieveHttp.status!=200)
      return;

	var actions = recieveHttp.responseText.split('|'), action;
	for (var i=0; i<actions.length-1; i++)
	{
	   action = actions[i].split('#');
	   switch (action[0])
	   {
		  case 'new':
			 if (getShapeIndex(action[1]) == undefined)
				shapes.push(deserialize(action[2]));
			 break;
		  case 'delete':
			 var index = getShapeIndex(action[1]);
			 if (index != undefined)
			 {
				shapes[index].del();
				shapes.splice(index, 1);
			 }
			 break;
		  case 'modify':
			 var index = getShapeIndex(action[1]);
			 shapes[index].del();
			 shapes[index] = deserialize(action[2]);
	   }
	}
   lastUpdated = actions[actions.length-1];
   setTimeout('reqestUpdate()', 500);				// refresh rate
}

function setParam(param)
{
   var editing = (selected != null);

   switch (param)
   {
      case 'color':
         var color = document.getElementById('colorInput').value;
         red = parseInt(color.substring(0,2),16);
         green = parseInt(color.substring(2,4),16);
         blue = parseInt(color.substring(4,6),16);
         if (editing)
            selected.color('rgba('+red+','+green+','+blue+','+selected.color()[3]+')');
         break;
      case 'alpha':
         alpha = document.getElementById('opacSlide').value / 100;
         if (editing)
         {
            var color = selected.color();
            selected.color('rgba('+color[0]+','+color[1]+','+color[2]+','+alpha+')');
         }
         break;
      case 'fill':
         fill = document.getElementById('fillCheck').checked;
         if (editing)
            selected.animate({fill:fill});
         break;
      case 'brushSize':
         brushSize = document.getElementById('brushSlide').value;
         if (editing)
            selected.lineStyle({lineWidth:brushSize});
         break;
      case 'txtLineWidth':
         txtLineWidth = document.getElementById('txtLnWidth').value;
         if (editing)
            selected.lineStyle({lineWidth:txtLineWidth});
         break;
      case 'lineWidth':
         lineWidth = document.getElementById('lnWidthSlide').value;
         if (editing)
            selected.lineStyle({lineWidth:lineWidth});
         break;
      case 'text':
         text = document.getElementById('textInput').value;
         if (editing)
            selected.string(text);
         break;
      case 'font':
         font = document.getElementById('fontSel').value;
         if (editing)
            selected.font(selected.font().split(' ')[0]+' '+font);
         break;
      case 'imagesrc':
         var path = document.getElementById('fileUrlInput').value;
         var regex = new RegExp(/(\.jpg|\.gif|\.png)$/);
         if (path.match(regex))
         {
            image.src = path;
            if (editing)
               selected.animate({image:image});
         }
         break;
      case 'composite':
         composite = document.getElementById('compSel').value;
         if (editing)
            selected.composite(composite);
   }
   if (editing)
      modifyShape(selected);
}

function pickTool(tool)
{
   if (polyPoints.length != 0)         // close polygon
   {
      shape.addPoint(polyPoints[0][0], polyPoints[0][1]);
      polyPoints = [];
		mouseUp();
      document.getElementById('polyBtn').innerHTML = 'Polygon';
   }
   deselectShape();

   displayControls(tool);
   toolType = tool;
}

function displayControls(toolType)
{
   switch (toolType)
   {
		case 'brush':
	      document.getElementById('lnWidthFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'none';
         document.getElementById('textFld').style.display = 'none';
         document.getElementById('imageFld').style.display = 'none';
	      document.getElementById('brushFld').style.display = 'inline';
	      break;
      case 'line':
	      document.getElementById('brushFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'none';
         document.getElementById('textFld').style.display = 'none';
         document.getElementById('imageFld').style.display = 'none';
	      document.getElementById('lnWidthFld').style.display = 'inline';
         break;
	   case 'rectangle': case 'circle': case 'polygon':
         document.getElementById('textFld').style.display = 'none';
	      document.getElementById('brushFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'inline';
   	   document.getElementById('imageFld').style.display = 'none';
	      document.getElementById('lnWidthFld').style.display = 'inline';
	      break;
	   case 'text':
	      document.getElementById('brushFld').style.display = 'none';
	      document.getElementById('lnWidthFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'inline';
   	   document.getElementById('imageFld').style.display = 'none';
         document.getElementById('textFld').style.display = 'inline';
	      break;
      case 'image':
	      document.getElementById('brushFld').style.display = 'none';
	      document.getElementById('lnWidthFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'none';
         document.getElementById('textFld').style.display = 'none';
         document.getElementById('imageFld').style.display = 'inline';
         break;
      case 'eraser': case 'select':
	      document.getElementById('brushFld').style.display = 'none';
   	   document.getElementById('fillFld').style.display = 'none';
         document.getElementById('textFld').style.display = 'none';
	      document.getElementById('lnWidthFld').style.display = 'none';
	      document.getElementById('imageFld').style.display = 'none';
   }
}

function mouseDown(e)
{
   dragging = true;

   if (toolType=='eraser'||toolType=='select'||(toolType=='text' && text=='')||(toolType=='image'&&image.src==undefined))
      return;

   startPoint.x = e.offsetX;
   startPoint.y = e.offsetY;

   switch (toolType)
   {
      case 'brush':
      case 'line':
         shape = jc.line([[startPoint.x, startPoint.y], [startPoint.x+1, startPoint.y+1]], getColor(), false);
         break;
      case 'rectangle':
         shape = jc.rect(startPoint.x, startPoint.y, 0, 0, getColor(), fill);
         break;
      case 'circle':
         shape = jc.circle(startPoint.x, startPoint.y, 0, getColor(), fill);
         break;
      case 'polygon':
         polyPoints.push([startPoint.x, startPoint.y]);

         if (polyPoints.length == 1)         // start polygon
         {
            polyPoints.push([startPoint.x+1, startPoint.y+1], [startPoint.x, startPoint.y]);
            shape = jc.line(polyPoints, getColor(), fill);
            configShape(shape);
            document.getElementById('polyBtn').innerHTML = 'Close polygon';
         }
         else
            shape.points(polyPoints);
         break;
      case 'text':
         shape = jc.text(text, startPoint.x, startPoint.y, getColor(), fill);
         shape.font('16px ' + font);
         break;
      case 'image':
         shape = jc.image(image, startPoint.x, startPoint.y, 0, 0);
         shape.src = image.src;
   }

   if (toolType == 'brush')
      shape.lineStyle({lineWidth:brushSize});
   else if (toolType == 'text')
      shape.lineStyle({lineWidth:txtLineWidth});
   else if (toolType != 'image')
      shape.lineStyle({lineWidth:lineWidth});

   shape.composite(composite);

   if (toolType != 'polygon')
      configShape(shape);
}

function draw(e)
{
   if (!dragging || shape==null || toolType=='eraser' || toolType=='select')
      return;

   width = e.offsetX - startPoint.x;
   height = e.offsetY - startPoint.y;

   switch (toolType)
   {
      case 'brush':
         shape.addPoint(e.offsetX, e.offsetY);
         break;
      case 'line':
         shape.points([[startPoint.x, startPoint.y],[startPoint.x+1, startPoint.y+1], [e.offsetX, e.offsetY]]);
         break;
      case 'rectangle': case 'image':
         shape.animate({width:width, height:height});
         break;
      case 'circle':
         var radius = (Math.sqrt(width*width + height*height)) / 2;
         shape.animate({x:startPoint.x+(width/2), y:startPoint.y+(height/2), radius:radius});
         break;
      case 'polygon':
         polyPoints[polyPoints.length-1] = [e.offsetX, e.offsetY];
         shape.points(polyPoints);
         break;
      case 'text':
         shape.font(Math.max(width, height)/2 + 'px ' + font);
   }
}

function mouseUp()
{
   dragging = false;

	if (shape==null || toolType=='eraser' || toolType=='select' || polyPoints.length!=0)		// polygon being drawn
		return;

	var sendString = 'what=new&shapecode='+shape.code + '&shape='+serialize(shape);
	sendHttp.open('POST', 'server.php', true);
	sendHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	sendHttp.send(sendString);

   shapes.push(shape);
   shape = null;
}

function serialize(shape)
{
   var param = shape.toolType + ';';

   switch (shape.toolType)
   {
      case 'circle':
         var position = shape.position();
         param += position.x + ';';
         param += position.y + ';';
         param += shape.attr('radius') + ';';
         break;
      case 'image':
         param += shape.src.replace('/','?') + ';';
      case 'rectangle':
         var position = shape.position();
         param += position.x + ';';
         param += position.y + ';';
         param += shape.attr('width') + ';';
         param += shape.attr('height') + ';';
         break;
      case 'line': case 'brush': case 'polygon':
         param += shape.points() + ';';
         break;
      case 'text':
         param += shape.string() + ';';
         var position = shape.position();
         param += position.x + ';';
         param += position.y + ';';
         param += shape.font() + ';';
   }
   if (shape.toolType != 'image')
   {
      param += toColor(shape.color()) + ';';
      param += shape.attr('fill') + ';';
      param += shape.lineStyle('lineWidth') + ';';
   }
   param += shape.composite() + ';';
   param += shape.code;

   return param;
}

function deserialize(param)
{
   var shape;
   param = param.split(';');
   l = param.length;

   if (param[0] != 'image')
      param[l-4] = (param[l-4]=='true'||param[l-4]=='1') ? 1 : 0;   // cast 'fill' to bool

   switch(param[0])
   {
      case 'circle':
         shape = jc.circle(param[1], param[2], param[3], param[4], param[5]);
         break;
      case 'rectangle':
         shape = jc.rect(param[1], param[2], param[3], param[4], param[5], param[6]);
         break;
      case 'line': case 'brush': case 'polygon':
         var values = param[1].split(','), pointsArr=[];
         for (var i=0; i<values.length; i+=2)
            pointsArr.push([values[i],values[i+1]]);
         shape = jc.line(pointsArr, param[2], param[3]);
         break;
      case 'text':
         shape = jc.text(param[1], param[2], param[3], param[5], param[6]);
         shape.font(param[4]);
         break;
      case 'image':
         var image = new Image();
         image.src = param[1].replace('?','/');
         shape = jc.image(image, param[2], param[3], param[4], param[5]);
   }
   shape.toolType = param[0];
   if (param[0] != 'image')
      shape.lineStyle({lineWidth:param[l-3]});
   shape.composite(param[l-2]);
   shape.code = param[l-1];

   configShape(shape);

   return shape;
}

function configShape(shape)
{
   if (shape.code == undefined)
      shape.code = getRandomCode();
   if (shape.toolType == undefined)
      shape.toolType = toolType;
   if (shape.toolType != 'image')
   {
      shape.lineStyle({join:'round'});
      shape.lineStyle({cap:'round'});
   }

   shape.mouseover(function()
   {
      if (!dragging)
         return;
      if (toolType=='eraser')
         deleteShape(this);
      else if (toolType=='select' && this != selected)
         selectShape(this);
   });
   shape.mousedown(function()
   {
      if (toolType=='eraser')
         deleteShape(this);
      else if (toolType=='select' && this != selected)
         selectShape(this);
   });
}

function getRandomCode()
{
   var chars = '0123456789abcdefghiklmnopqrstuvwxyz'.split('');

   var code = '';
   for (var i = 0; i < 5; i++)
      code += chars[Math.floor(Math.random() * chars.length)];

   return code;
}

function getShapeIndex(code)
{
   for (var i=0; i<shapes.length; i++)
      if (shapes[i].code == code)
         return i;
}

function deleteShape(shape)
{
   var sendString = 'what=delete&shapecode='+shape.code;
   sendHttp.open('POST', 'server.php', true);
   sendHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   sendHttp.send(sendString);

   var index = getShapeIndex(shape.code);
   shape.del();
   shapes.splice(index, 1);
}

function selectShape(shape)
{
   deselectShape();
   selected = shape;

   shape.draggable({
      start: function()
         {  dragging=false;   highlight.visible(false);  },
      stop: function()
         {
            if (shape.instanceOf() == 'line')
            {
               var position = shape.position(), pointsArr = shape.points();
               var offX = position.x - pointsArr[0][0];
               var offY = position.y - pointsArr[0][1];
               for (var i=0; i<pointsArr.length; i++)
               {
                  pointsArr[i][0] += offX;
                  pointsArr[i][1] += offY;
               }
               shape.points(pointsArr);
            }
            var outline = shape.getRect();
            var l = shape.lineStyle('lineWidth') + 10;
            highlight.animate({x:outline.x-l/2, y:outline.y-l/2, width:outline.width+l, height:outline.height+l});
            highlight.visible(true);
            modifyShape(this);   }
      });

   var outline = shape.getRect();
   var l = shape.lineStyle('lineWidth') + 10;
   highlight.animate({x:outline.x-l/2, y:outline.y-l/2, width:outline.width+l, height:outline.height+l});
   highlight.visible(true);

   displayControls(shape.toolType);
}

function deselectShape()
{
   if (selected == null)
      return;

   highlight.visible(false);
   selected.draggable({disabled:true});
   selected = null;
}

function modifyShape(shape)
{alert(shape.points());alert(shape.position().x+'-'+shape.position().y);
   var sendString = 'what=modify&shapecode='+shape.code + '&shape='+serialize(shape);
   sendHttp.open('POST', 'server.php', true);
   sendHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   sendHttp.send(sendString);
}
