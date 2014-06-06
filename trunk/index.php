<html>
<head>
   <title>Collaborative Whiteboard</title>
   <script type="text/javascript">

   var wbname;
   function rename()
   {
      if (wbname == undefined)
         return;
      document.getElementById('operations').style.display = 'none';
      document.getElementById('renameFld').style.display = 'block';
      document.getElementById('renameInput').value = wbname.split('.')[0];
   }
   function newwb()
   {
      document.getElementById('operations').style.display = 'none';
      document.getElementById('newwbFld').style.display = 'block';
   }
   function cancel()
   {
      document.getElementById('renameFld').style.display = 'none';
      document.getElementById('newwbFld').style.display = 'none';
      document.getElementById('operations').style.display = 'block';
   }
   </script>
<head>
<body>
<h2>Available whiteboards:</h2>
<form action="manageWhiteboards.php" method="get">
   <?php

   $wbfiles = scandir('whiteboards');

   foreach ($wbfiles as $wbfile)
      if (substr($wbfile, -3) == '.wb')
         echo '<input type="radio" name="wbfile" value="'.$wbfile.'" onclick="wbname=this.value">'.substr($wbfile, 0, -3).'</input><br/>';

   ?>
   <div id="operations">
      <input type="submit" name="operation" value="Load"/>
      <input type="submit" name="operation" value="Clone"/>
      <input type="button" onclick="rename()" value="Rename"/>
      <input type="submit" name="operation" value="Delete"/>
      <input type="button" onclick="newwb()" value="New"/>
   </div>
   <div id="renameFld" style="display:none;">
      New name: <input id="renameInput" type="text" name="newname"/>
      <input type="submit" name="operation" value="Rename"/>
      <input type="button" onclick="cancel()" value="Cancel"/>
   </div>
   <div id="newwbFld" style="display:none;">
      Name: <input type="text" name="name" value="NewWhiteboard" onclick="this.value=''"/>
      <input type="submit" name="operation" value="New"/>
      <input type="button" onclick="cancel()" value="Cancel"/>
   </div>
</form>
</body>
</html>
